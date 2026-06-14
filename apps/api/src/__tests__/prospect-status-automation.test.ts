/**
 * Prospect status automation tests.
 *
 * These tests exercise the rule engine end-to-end against a real SQLite
 * database. Each test seeds only what it needs and cleans up after itself
 * so tests are fully independent and repeatable.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { executeRule } from '../services/status-rules/index.js';

// Use the same DATABASE_URL from the environment (set in vitest.config.ts to a test DB)
const prisma = new PrismaClient();

// ─── helpers ────────────────────────────────────────────────────────────────

async function createProspect(overrides: Partial<{
    name: string;
    email: string;
    phone: string;
    status: string;
    assignedUnitId: string | null;
}> = {}) {
    return prisma.prospect.create({
        data: {
            name: overrides.name ?? 'Test Prospect',
            email: overrides.email ?? `test-${Date.now()}@example.com`,
            phone: overrides.phone ?? '555-0000',
            status: overrides.status ?? 'new',
            assignedUnitId: overrides.assignedUnitId ?? null,
        },
    });
}

async function createUnit(unitNumber: string, status = 'available') {
    return prisma.unit.create({ data: { unitNumber, status } });
}

async function cleanupProspect(id: string) {
    // Cascade deletes tasks and activity events too
    await prisma.prospect.delete({ where: { id } }).catch(() => null);
}

async function cleanupUnit(id: string) {
    await prisma.unit.delete({ where: { id } }).catch(() => null);
}

// ─── contacted rule ──────────────────────────────────────────────────────────

describe('contacted rule', () => {
    let prospectId: string;

    afterEach(async () => {
        await cleanupProspect(prospectId);
    });

    it('creates a tour availability task due +2 days and logs activity', async () => {
        const prospect = await createProspect({ status: 'new', name: 'Jane Smith' });
        prospectId = prospect.id;

        const today = new Date().toISOString().slice(0, 10);
        const expectedDue = (() => {
            const d = new Date();
            d.setDate(d.getDate() + 2);
            return d.toISOString().slice(0, 10);
        })();

        const ruleResult = await prisma.$transaction((tx) =>
            executeRule({ tx, prospect, newStatus: 'contacted' }),
        );

        // One task created
        expect(ruleResult.createdTasks).toHaveLength(1);
        const task = ruleResult.createdTasks[0];
        expect(task.title).toBe('Send tour availability to Jane Smith');
        expect(task.dueDate).toBe(expectedDue);

        // One activity event created
        expect(ruleResult.activityEvents).toHaveLength(1);
        expect(ruleResult.activityEvents[0].summary).toContain('Jane Smith');
        expect(ruleResult.activityEvents[0].summary).toContain('contacted');

        // Task actually persisted in DB
        const dbTask = await prisma.task.findUnique({ where: { id: task.id } });
        expect(dbTask).not.toBeNull();
        expect(dbTask!.state).toBe('open');
        expect(dbTask!.priority).toBe('high');
        expect(dbTask!.dueDate).toBe(expectedDue);

        // Activity event actually persisted
        const dbEvent = await prisma.activityEvent.findUnique({
            where: { id: ruleResult.activityEvents[0].id },
        });
        expect(dbEvent).not.toBeNull();
        expect(dbEvent!.type).toBe('status_changed');

        void today; // suppress unused warning
    });

    it('returns zero closed tasks', async () => {
        const prospect = await createProspect({ status: 'new' });
        prospectId = prospect.id;

        const ruleResult = await prisma.$transaction((tx) =>
            executeRule({ tx, prospect, newStatus: 'contacted' }),
        );

        expect(ruleResult.closedTasksCount).toBe(0);
    });
});

// ─── leased rule ─────────────────────────────────────────────────────────────

describe('leased rule', () => {
    let prospectId: string;
    let unitId: string;

    afterEach(async () => {
        await cleanupProspect(prospectId);
        await cleanupUnit(unitId);
    });

    it('marks assigned unit as leased, closes open tasks, and logs activity', async () => {
        const unit = await createUnit(`TEST-${Date.now()}`, 'available');
        unitId = unit.id;

        const prospect = await createProspect({
            status: 'application',
            assignedUnitId: unit.id,
        });
        prospectId = prospect.id;

        // Pre-create two open tasks for this prospect
        await prisma.task.createMany({
            data: [
                { title: 'Review application', dueDate: '2026-06-15', prospectId: prospect.id, state: 'open', priority: 'medium' },
                { title: 'Follow up call', dueDate: '2026-06-16', prospectId: prospect.id, state: 'open', priority: 'low' },
            ],
        });

        const ruleResult = await prisma.$transaction((tx) =>
            executeRule({ tx, prospect, newStatus: 'leased' }),
        );

        // Both open tasks should have been auto-closed
        expect(ruleResult.closedTasksCount).toBe(2);

        const remainingOpen = await prisma.task.count({
            where: { prospectId: prospect.id, state: 'open' },
        });
        expect(remainingOpen).toBe(0);

        const allDone = await prisma.task.count({
            where: { prospectId: prospect.id, state: 'done' },
        });
        expect(allDone).toBe(2);

        // Unit should now be marked leased
        const dbUnit = await prisma.unit.findUnique({ where: { id: unit.id } });
        expect(dbUnit!.status).toBe('leased');

        // Activity event created
        expect(ruleResult.activityEvents).toHaveLength(1);
        expect(ruleResult.activityEvents[0].summary).toContain('signed lease');

        const dbEvent = await prisma.activityEvent.findUnique({
            where: { id: ruleResult.activityEvents[0].id },
        });
        expect(dbEvent!.type).toBe('unit_leased');
    });

    it('still creates activity and closes tasks when no unit is assigned', async () => {
        // Need a dummy unit id for cleanup guard — use a placeholder
        unitId = 'none';

        const prospect = await createProspect({ status: 'application', assignedUnitId: null });
        prospectId = prospect.id;

        await prisma.task.create({
            data: { title: 'Open task', dueDate: '2026-06-15', prospectId: prospect.id, state: 'open', priority: 'medium' },
        });

        const ruleResult = await prisma.$transaction((tx) =>
            executeRule({ tx, prospect, newStatus: 'leased' }),
        );

        expect(ruleResult.closedTasksCount).toBe(1);
        expect(ruleResult.activityEvents).toHaveLength(1);
        // No unit note in summary when no unit assigned
        expect(ruleResult.activityEvents[0].summary).not.toContain('Unit');
    });
});

// ─── lost rule ───────────────────────────────────────────────────────────────

describe('lost rule', () => {
    let prospectId: string;

    afterEach(async () => {
        await cleanupProspect(prospectId);
    });

    it('closes all open tasks and logs activity', async () => {
        const prospect = await createProspect({ status: 'contacted' });
        prospectId = prospect.id;

        await prisma.task.createMany({
            data: [
                { title: 'Task A', dueDate: '2026-06-15', prospectId: prospect.id, state: 'open', priority: 'high' },
                { title: 'Task B', dueDate: '2026-06-16', prospectId: prospect.id, state: 'done', priority: 'low' },
            ],
        });

        const ruleResult = await prisma.$transaction((tx) =>
            executeRule({ tx, prospect, newStatus: 'lost' }),
        );

        // Only the 1 open task should be closed (not the already-done one)
        expect(ruleResult.closedTasksCount).toBe(1);
        expect(ruleResult.activityEvents).toHaveLength(1);
        expect(ruleResult.activityEvents[0].summary).toContain('lost');
    });
});
