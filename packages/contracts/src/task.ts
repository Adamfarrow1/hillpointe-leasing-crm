import { z } from 'zod';
import { ProspectStatusSchema } from './prospect.js';

export const TaskStateSchema = z.enum(['open', 'done']);
export const TaskPrioritySchema = z.enum(['high', 'medium', 'low']);

/** Raw task fields — mirrors the Prisma Task model */
export const TaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    dueDate: z.string(), // ISO date string YYYY-MM-DD
    prospectId: z.string(),
    assignee: z.string().nullable(),
    state: TaskStateSchema,
    priority: TaskPrioritySchema,
    createdAt: z.string(),
    updatedAt: z.string(),
});

/** Prospect subset included in task API responses */
export const TaskProspectSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    status: ProspectStatusSchema,
});

/** Task as returned by GET /api/tasks — includes nested prospect info */
export const TaskWithProspectSchema = TaskSchema.extend({
    prospect: TaskProspectSchema,
});

export const CreateTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    dueDate: z.string().min(1, 'Due date is required'),
    prospectId: z.string().nullable().default(null),
    assignee: z.string().nullable().default(null),
    priority: TaskPrioritySchema.default('medium'),
});

export const UpdateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    dueDate: z.string().optional(),
    assignee: z.string().nullable().optional(),
    state: TaskStateSchema.optional(),
    priority: TaskPrioritySchema.optional(),
});

export const TaskQuerySchema = z.object({
    state: TaskStateSchema.optional(),
    prospectId: z.string().optional(),
});

export type TaskState = z.infer<typeof TaskStateSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type Task = z.infer<typeof TaskSchema>;
export type TaskProspect = z.infer<typeof TaskProspectSchema>;
export type TaskWithProspect = z.infer<typeof TaskWithProspectSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskQuery = z.infer<typeof TaskQuerySchema>;
