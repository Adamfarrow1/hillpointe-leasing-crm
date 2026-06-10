import { Router } from 'express';
import { TaskQuerySchema, UpdateTaskSchema } from '@crm/contracts';
import { prisma } from '../lib/prisma.js';

export const tasksRouter = Router();

/** Prospect fields to include in every task response */
const PROSPECT_SELECT = {
    id: true,
    name: true,
    email: true,
    phone: true,
    status: true,
} as const;

/** Map a Prisma task row (with joined prospect) to the API response shape */
function toResponse(task: {
    id: string;
    title: string;
    dueDate: string;
    prospectId: string;
    assignee: string | null;
    state: string;
    priority: string;
    createdAt: Date;
    updatedAt: Date;
    prospect: {
        id: string;
        name: string;
        email: string;
        phone: string;
        status: string;
    };
}) {
    return {
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        prospectId: task.prospectId,
        assignee: task.assignee,
        state: task.state,
        priority: task.priority,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        prospect: {
            id: task.prospect.id,
            name: task.prospect.name,
            email: task.prospect.email,
            phone: task.prospect.phone,
            status: task.prospect.status,
        },
    };
}

// GET /api/tasks?state=open|done&prospectId=<id>
tasksRouter.get('/', async (req, res) => {
    const parsed = TaskQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
    }
    const { state, prospectId } = parsed.data;

    const tasks = await prisma.task.findMany({
        where: {
            ...(state !== undefined ? { state } : {}),
            ...(prospectId !== undefined ? { prospectId } : {}),
        },
        include: { prospect: { select: PROSPECT_SELECT } },
        orderBy: [
            { state: 'asc' },      // open (alphabetically first) before done
            { dueDate: 'asc' },
            { createdAt: 'desc' },
        ],
    });

    res.json(tasks.map(toResponse));
});

// PATCH /api/tasks/:id/complete
tasksRouter.patch('/:id/complete', async (req, res) => {
    try {
        const task = await prisma.task.update({
            where: { id: req.params.id },
            data: { state: 'done' },
            include: { prospect: { select: PROSPECT_SELECT } },
        });
        res.json(toResponse(task));
    } catch (err: unknown) {
        if (isPrismaNotFoundError(err)) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        throw err;
    }
});

// PATCH /api/tasks/:id/reopen
tasksRouter.patch('/:id/reopen', async (req, res) => {
    try {
        const task = await prisma.task.update({
            where: { id: req.params.id },
            data: { state: 'open' },
            include: { prospect: { select: PROSPECT_SELECT } },
        });
        res.json(toResponse(task));
    } catch (err: unknown) {
        if (isPrismaNotFoundError(err)) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        throw err;
    }
});

function isPrismaNotFoundError(err: unknown): boolean {
    return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: unknown }).code === 'P2025'
    );
}

// PATCH /api/tasks/:id — edit title, dueDate, assignee, priority, state
tasksRouter.patch('/:id', async (req, res) => {
    const parsed = UpdateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
        return;
    }
    try {
        const task = await prisma.task.update({
            where: { id: req.params.id },
            data: parsed.data,
            include: { prospect: { select: PROSPECT_SELECT } },
        });
        res.json(toResponse(task));
    } catch (err: unknown) {
        if (isPrismaNotFoundError(err)) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        throw err;
    }
});

// DELETE /api/tasks/:id
tasksRouter.delete('/:id', async (req, res) => {
    try {
        await prisma.task.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (err: unknown) {
        if (isPrismaNotFoundError(err)) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        throw err;
    }
});

