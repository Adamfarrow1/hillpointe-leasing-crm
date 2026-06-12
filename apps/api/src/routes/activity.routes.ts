import { Router } from 'express';
import { ActivityQuerySchema } from '@crm/contracts';
import { prisma } from '../lib/prisma.js';

export const activityRouter = Router();

const PROSPECT_SELECT = {
    id: true,
    name: true,
    email: true,
    status: true,
} as const;

type ProspectRow = {
    id: string;
    name: string;
    email: string;
    status: string;
};

type UnitRow = {
    id: string;
    unitNumber: string;
    status: string;
};

type ActivityRow = {
    id: string;
    type: string;
    timestamp: Date;
    prospectId: string | null;
    unitId: string | null;
    summary: string;
    createdAt: Date;
    prospect: ProspectRow | null;
};

function toResponse(row: ActivityRow, unit: UnitRow | null) {
    return {
        id: row.id,
        type: row.type,
        timestamp: row.timestamp.toISOString(),
        prospectId: row.prospectId,
        unitId: row.unitId,
        summary: row.summary,
        createdAt: row.createdAt.toISOString(),
        prospect: row.prospect
            ? { id: row.prospect.id, name: row.prospect.name, email: row.prospect.email, status: row.prospect.status }
            : null,
        unit: unit
            ? { id: unit.id, unitNumber: unit.unitNumber, status: unit.status }
            : null,
    };
}

async function batchFetchUnits(events: ActivityRow[]): Promise<Map<string, UnitRow>> {
    const ids = [...new Set(
        events.map((e) => e.unitId).filter((id): id is string => id !== null),
    )];
    if (ids.length === 0) return new Map();
    const rows = await prisma.unit.findMany({ where: { id: { in: ids } } });
    return new Map(rows.map((u) => [u.id, u]));
}

// GET /api/activity-events?prospectId=&unitId=&type=
activityRouter.get('/', async (req, res) => {
    const parsed = ActivityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
    }
    const { prospectId, unitId, type } = parsed.data;

    const events = await prisma.activityEvent.findMany({
        where: {
            ...(prospectId !== undefined ? { prospectId } : {}),
            ...(unitId !== undefined ? { unitId } : {}),
            ...(type !== undefined ? { type } : {}),
        },
        include: { prospect: { select: PROSPECT_SELECT } },
        orderBy: { timestamp: 'desc' },
    });

    const unitMap = await batchFetchUnits(events);
    res.json(events.map((e) => toResponse(e, e.unitId ? (unitMap.get(e.unitId) ?? null) : null)));
});
