import { z } from 'zod';

export const TaskStateSchema = z.enum(['open', 'done']);
export const TaskPrioritySchema = z.enum(['high', 'medium', 'low']);

export const TaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    dueDate: z.string(), // ISO date string YYYY-MM-DD
    prospectId: z.string().nullable(),
    prospectName: z.string(),
    assignee: z.string().nullable(),
    state: TaskStateSchema,
    priority: TaskPrioritySchema,
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const CreateTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    dueDate: z.string().min(1, 'Due date is required'),
    prospectId: z.string().nullable().default(null),
    prospectName: z.string().default(''),
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

export type TaskState = z.infer<typeof TaskStateSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type Task = z.infer<typeof TaskSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
