import { Router } from 'express';
import { CreateUnitSchema, UpdateUnitSchema } from '@crm/contracts';
import { prisma } from '../lib/prisma.js';

export const unitsRouter = Router();

// GET /api/units
unitsRouter.get('/', async (_req, res) => {
    const units = await prisma.unit.findMany({
        orderBy: { unitNumber: 'asc' },
    });
    res.json(units);
});

// GET /api/units/:id
unitsRouter.get('/:id', async (req, res) => {
    const unit = await prisma.unit.findUnique({
        where: { id: req.params.id },
    });
    if (!unit) {
        res.status(404).json({ error: 'Unit not found' });
        return;
    }
    res.json(unit);
});

// POST /api/units
unitsRouter.post('/', async (req, res) => {
    const result = CreateUnitSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Validation failed', issues: result.error.issues });
        return;
    }

    try {
        const unit = await prisma.unit.create({
            data: result.data,
        });
        res.status(201).json(unit);
    } catch (err: unknown) {
        if (isPrismaUniqueConstraintError(err)) {
            res.status(409).json({ error: `Unit number "${result.data.unitNumber}" already exists` });
            return;
        }
        throw err;
    }
});

// PATCH /api/units/:id
unitsRouter.patch('/:id', async (req, res) => {
    const result = UpdateUnitSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Validation failed', issues: result.error.issues });
        return;
    }

    try {
        const unit = await prisma.unit.update({
            where: { id: req.params.id },
            data: result.data,
        });
        res.json(unit);
    } catch (err: unknown) {
        if (isPrismaNotFoundError(err)) {
            res.status(404).json({ error: 'Unit not found' });
            return;
        }
        if (isPrismaUniqueConstraintError(err)) {
            res.status(409).json({ error: `Unit number "${result.data.unitNumber}" already exists` });
            return;
        }
        throw err;
    }
});

// DELETE /api/units/:id
unitsRouter.delete('/:id', async (req, res) => {
    try {
        await prisma.unit.delete({
            where: { id: req.params.id },
        });
        res.json({ success: true });
    } catch (err: unknown) {
        if (isPrismaNotFoundError(err)) {
            res.status(404).json({ error: 'Unit not found' });
            return;
        }
        throw err;
    }
});

// Prisma error helpers — avoids importing internal Prisma types
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
