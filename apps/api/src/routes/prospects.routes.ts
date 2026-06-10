import { Router } from 'express';
import { CreateProspectSchema, UpdateProspectSchema, StatusTransitionSchema } from '@crm/contracts';
import { prisma } from '../lib/prisma.js';
import { executeRule } from '../services/status-rules/index.js';

export const prospectsRouter = Router();

// GET /api/prospects?status=new
prospectsRouter.get('/', async (req, res) => {
    const { status } = req.query;

    const where = status
        ? { status: String(status) }
        : undefined;

    const prospects = await prisma.prospect.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });
    res.json(prospects);
});

// GET /api/prospects/:id
prospectsRouter.get('/:id', async (req, res) => {
    const prospect = await prisma.prospect.findUnique({
        where: { id: req.params.id },
    });
    if (!prospect) {
        res.status(404).json({ error: 'Prospect not found' });
        return;
    }
    res.json(prospect);
});

// POST /api/prospects
prospectsRouter.post('/', async (req, res) => {
    const result = CreateProspectSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Validation failed', issues: result.error.issues });
        return;
    }

    try {
        const prospect = await prisma.prospect.create({ data: result.data });
        res.status(201).json(prospect);
    } catch (err: unknown) {
        if (isPrismaUniqueConstraintError(err)) {
            res.status(409).json({ error: `A prospect with email "${result.data.email}" already exists` });
            return;
        }
        throw err;
    }
});

// PATCH /api/prospects/:id
prospectsRouter.patch('/:id', async (req, res) => {
    const result = UpdateProspectSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Validation failed', issues: result.error.issues });
        return;
    }

    try {
        const prospect = await prisma.prospect.update({
            where: { id: req.params.id },
            data: result.data,
        });
        res.json(prospect);
    } catch (err: unknown) {
        if (isPrismaNotFoundError(err)) {
            res.status(404).json({ error: 'Prospect not found' });
            return;
        }
        if (isPrismaUniqueConstraintError(err)) {
            res.status(409).json({ error: `A prospect with that email already exists` });
            return;
        }
        throw err;
    }
});

// PATCH /api/prospects/:id/status  — transactional status transition with automation
prospectsRouter.patch('/:id/status', async (req, res) => {
    const result = StatusTransitionSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Validation failed', issues: result.error.issues });
        return;
    }

    const { status: newStatus } = result.data;

    try {
        const { prospect, ruleResult } = await prisma.$transaction(async (tx) => {
            const current = await tx.prospect.findUnique({ where: { id: req.params.id } });
            if (!current) {
                throw Object.assign(new Error('Prospect not found'), { code: 'P2025' });
            }

            const updated = await tx.prospect.update({
                where: { id: req.params.id },
                data: { status: newStatus },
            });

            const ruleResult = await executeRule({ tx, prospect: current, newStatus });

            return { prospect: updated, ruleResult };
        });

        res.json({
            prospect,
            createdTasks: ruleResult.createdTasks,
            closedTasksCount: ruleResult.closedTasksCount,
            activityEvents: ruleResult.activityEvents,
        });
    } catch (err: unknown) {
        if (isPrismaNotFoundError(err) || (err instanceof Error && err.message === 'Prospect not found')) {
            res.status(404).json({ error: 'Prospect not found' });
            return;
        }
        throw err;
    }
});

// DELETE /api/prospects/:id
prospectsRouter.delete('/:id', async (req, res) => {
    try {
        await prisma.prospect.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: unknown) {
        if (isPrismaNotFoundError(err)) {
            res.status(404).json({ error: 'Prospect not found' });
            return;
        }
        throw err;
    }
});

function isPrismaUniqueConstraintError(err: unknown): boolean {
    return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: unknown }).code === 'P2002'
    );
}

function isPrismaNotFoundError(err: unknown): boolean {
    return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: unknown }).code === 'P2025'
    );
}
