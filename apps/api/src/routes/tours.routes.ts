import { Router } from 'express';
import { CreateTourSchema, UpdateTourSchema, RecordTourOutcomeSchema } from '@crm/contracts';
import { prisma } from '../lib/prisma.js';
import { executeRule } from '../services/status-rules/index.js';

export const toursRouter = Router();

// ─── shared types ──────────────────────────────────────────────────────────────

const PROSPECT_SELECT = { id: true, name: true, email: true, status: true } as const;

type ProspectRow = { id: string; name: string; email: string; status: string };
type UnitRow = { id: string; unitNumber: string; status: string };
type TourRow = {
    id: string;
    prospectId: string;
    unitId: string | null;
    scheduledAt: Date;
    outcome: string | null;
    agentName: string | null;
    createdAt: Date;
    updatedAt: Date;
    prospect: ProspectRow;
};

function toResponse(tour: TourRow, unit: UnitRow | null) {
    return {
        id: tour.id,
        prospectId: tour.prospectId,
        unitId: tour.unitId,
        scheduledAt: tour.scheduledAt.toISOString(),
        outcome: tour.outcome,
        agentName: tour.agentName,
        createdAt: tour.createdAt.toISOString(),
        updatedAt: tour.updatedAt.toISOString(),
        prospect: {
            id: tour.prospect.id,
            name: tour.prospect.name,
            email: tour.prospect.email,
            status: tour.prospect.status,
        },
        unit,
    };
}

async function fetchUnit(unitId: string | null): Promise<UnitRow | null> {
    if (!unitId) return null;
    const u = await prisma.unit.findUnique({ where: { id: unitId } });
    return u ? { id: u.id, unitNumber: u.unitNumber, status: u.status } : null;
}

async function batchFetchUnits(unitIds: (string | null)[]): Promise<Map<string, UnitRow>> {
    const ids = [...new Set(unitIds.filter((id): id is string => id !== null))];
    if (ids.length === 0) return new Map();
    const rows = await prisma.unit.findMany({ where: { id: { in: ids } } });
    return new Map(rows.map((u) => [u.id, { id: u.id, unitNumber: u.unitNumber, status: u.status }]));
}

/**
 * Returns true if the unit already has a scheduled (outcome = null) tour
 * within ±60 minutes of the requested time (excluding a specific tour ID).
 */
async function isDoubleBooked(
    unitId: string,
    scheduledAt: Date,
    excludeTourId?: string,
): Promise<boolean> {
    const windowMs = 60 * 60 * 1000;
    const from = new Date(scheduledAt.getTime() - windowMs);
    const to = new Date(scheduledAt.getTime() + windowMs);
    const existing = await prisma.tour.findFirst({
        where: {
            unitId,
            outcome: null,
            scheduledAt: { gte: from, lte: to },
            ...(excludeTourId ? { id: { not: excludeTourId } } : {}),
        },
    });
    return existing !== null;
}

/** Prospect statuses from which scheduling a tour auto-advances to tour_scheduled */
const AUTO_ADVANCE_STATUSES = new Set(['new', 'contacted']);

/** Prospect statuses from which recording a completed tour can advance to toured */
const CAN_ADVANCE_TO_TOURED = new Set(['new', 'contacted', 'tour_scheduled']);

// ─── GET /api/tours ────────────────────────────────────────────────────────────

toursRouter.get('/', async (_req, res) => {
    const tours = await prisma.tour.findMany({
        include: { prospect: { select: PROSPECT_SELECT } },
        orderBy: { scheduledAt: 'asc' },
    });
    const unitMap = await batchFetchUnits(tours.map((t) => t.unitId));
    res.json(tours.map((t) => toResponse(t, t.unitId ? (unitMap.get(t.unitId) ?? null) : null)));
});

// ─── POST /api/tours ───────────────────────────────────────────────────────────

toursRouter.post('/', async (req, res) => {
    const parsed = CreateTourSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
        return;
    }
    const { prospectId, unitId, scheduledAt: scheduledAtStr, agentName } = parsed.data;

    const scheduledAt = new Date(scheduledAtStr);
    if (isNaN(scheduledAt.getTime())) {
        res.status(400).json({ error: 'Invalid scheduledAt: not a valid date' });
        return;
    }

    const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
    if (!prospect) {
        res.status(404).json({ error: 'Prospect not found' });
        return;
    }

    if (await isDoubleBooked(unitId, scheduledAt)) {
        res.status(409).json({ error: 'This unit already has a tour scheduled at that time.' });
        return;
    }

    const shouldAdvance = AUTO_ADVANCE_STATUSES.has(prospect.status);

    const { tour, ruleResult } = await prisma.$transaction(async (tx) => {
        const tour = await tx.tour.create({
            data: { prospectId, unitId, scheduledAt, agentName: agentName ?? null },
            include: { prospect: { select: PROSPECT_SELECT } },
        });

        let ruleResult: {
            createdTasks: { id: string; title: string; dueDate: string }[];
            closedTasksCount: number;
            activityEvents: { id: string; summary: string }[];
        } = { createdTasks: [], closedTasksCount: 0, activityEvents: [] };

        if (shouldAdvance) {
            await tx.prospect.update({ where: { id: prospectId }, data: { status: 'tour_scheduled' } });
            ruleResult = await executeRule({ tx, prospect, newStatus: 'tour_scheduled' });
        } else {
            await tx.activityEvent.create({
                data: { type: 'tour_scheduled', prospectId, summary: `Tour scheduled for ${prospect.name}` },
            });
        }

        return { tour, ruleResult };
    });

    const unit = await fetchUnit(unitId);
    res.status(201).json({ tour: toResponse(tour, unit), ruleResult });
});

// ─── PATCH /api/tours/:id — reschedule / change unit ─────────────────────────

toursRouter.patch('/:id', async (req, res) => {
    const parsed = UpdateTourSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
        return;
    }

    const existing = await prisma.tour.findUnique({ where: { id: req.params.id } });
    if (!existing) {
        res.status(404).json({ error: 'Tour not found' });
        return;
    }

    const { scheduledAt: scheduledAtStr, unitId, agentName } = parsed.data;
    const newScheduledAt = scheduledAtStr ? new Date(scheduledAtStr) : existing.scheduledAt;
    const newUnitId = unitId ?? existing.unitId;

    if (scheduledAtStr && isNaN(newScheduledAt.getTime())) {
        res.status(400).json({ error: 'Invalid scheduledAt: not a valid date' });
        return;
    }

    // Only double-booking check if we're changing time or unit
    if (newUnitId && (scheduledAtStr ?? unitId)) {
        if (await isDoubleBooked(newUnitId, newScheduledAt, req.params.id)) {
            res.status(409).json({ error: 'This unit already has a tour scheduled at that time.' });
            return;
        }
    }

    const prospect = await prisma.prospect.findUnique({ where: { id: existing.prospectId } });

    const updated = await prisma.$transaction(async (tx) => {
        const updateData: { scheduledAt?: Date; unitId?: string; agentName?: string } = {};
        if (scheduledAtStr) updateData.scheduledAt = newScheduledAt;
        if (unitId) updateData.unitId = unitId;
        if (agentName !== undefined) updateData.agentName = agentName;

        const tour = await tx.tour.update({
            where: { id: req.params.id },
            data: updateData,
            include: { prospect: { select: PROSPECT_SELECT } },
        });

        await tx.activityEvent.create({
            data: {
                type: 'tour_rescheduled',
                prospectId: existing.prospectId,
                summary: `Tour rescheduled for ${prospect?.name ?? 'prospect'}`,
            },
        });

        return tour;
    });

    const unit = await fetchUnit(updated.unitId);
    res.json(toResponse(updated, unit));
});

// ─── PATCH /api/tours/:id/outcome ─────────────────────────────────────────────

toursRouter.patch('/:id/outcome', async (req, res) => {
    const parsed = RecordTourOutcomeSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
        return;
    }
    const { outcome } = parsed.data;

    const existing = await prisma.tour.findUnique({ where: { id: req.params.id } });
    if (!existing) {
        res.status(404).json({ error: 'Tour not found' });
        return;
    }

    const prospect = await prisma.prospect.findUnique({ where: { id: existing.prospectId } });
    if (!prospect) {
        res.status(404).json({ error: 'Prospect not found' });
        return;
    }

    // completed → advance prospect to toured + fire automation
    if (outcome === 'completed' && CAN_ADVANCE_TO_TOURED.has(prospect.status)) {
        const { tour, ruleResult } = await prisma.$transaction(async (tx) => {
            const tour = await tx.tour.update({
                where: { id: req.params.id },
                data: { outcome },
                include: { prospect: { select: PROSPECT_SELECT } },
            });

            await tx.prospect.update({ where: { id: prospect.id }, data: { status: 'toured' } });
            const ruleResult = await executeRule({ tx, prospect, newStatus: 'toured' });

            // Close any open "Confirm tour" tasks — no longer needed once tour is done
            await tx.task.updateMany({
                where: {
                    prospectId: prospect.id,
                    state: 'open',
                    title: { startsWith: 'Confirm tour' },
                },
                data: { state: 'done' },
            });

            return { tour, ruleResult };
        });

        const unit = await fetchUnit(tour.unitId);
        res.json({ tour: toResponse(tour, unit), ruleResult });
        return;
    }

    // completed (already toured+) OR no_show OR cancelled — just log activity
    const activityType =
        outcome === 'completed' ? 'tour_completed' :
            outcome === 'no_show' ? 'tour_no_show' :
                'tour_cancelled';

    const summary =
        outcome === 'completed' ? `${prospect.name} completed their tour.` :
            outcome === 'no_show' ? `${prospect.name} did not show for their tour.` :
                `Tour cancelled for ${prospect.name}.`;

    const tour = await prisma.$transaction(async (tx) => {
        const t = await tx.tour.update({
            where: { id: req.params.id },
            data: { outcome },
            include: { prospect: { select: PROSPECT_SELECT } },
        });
        await tx.activityEvent.create({
            data: { type: activityType, prospectId: prospect.id, summary },
        });

        // When a tour is cancelled or no-show, auto-close any open
        // "Confirm tour" tasks that were created by the tour_scheduled automation.
        if (outcome === 'cancelled' || outcome === 'no_show') {
            await tx.task.updateMany({
                where: {
                    prospectId: prospect.id,
                    state: 'open',
                    title: { startsWith: 'Confirm tour' },
                },
                data: { state: 'done' },
            });
        }

        return t;
    });

    const unit = await fetchUnit(tour.unitId);
    res.json({ tour: toResponse(tour, unit), ruleResult: null });
});
