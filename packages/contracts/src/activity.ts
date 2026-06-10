import { z } from 'zod';

export const ActivityEventTypeSchema = z.enum([
    'status_changed',
    'task_created',
    'task_completed',
    'tour_scheduled',
    'tour_completed',
    'unit_leased',
]);

export const ActivityEventSchema = z.object({
    id: z.string(),
    type: ActivityEventTypeSchema,
    timestamp: z.string(),
    prospectId: z.string().nullable(),
    unitId: z.string().nullable(),
    summary: z.string(),
    createdAt: z.string(),
});

/** Activity event as returned by GET /api/activity-events — includes optional nested relations */
export const ActivityEventWithRelationsSchema = z.object({
    id: z.string(),
    type: z.string(), // loose — DB can hold any string
    timestamp: z.string(),
    prospectId: z.string().nullable(),
    unitId: z.string().nullable(),
    summary: z.string(),
    createdAt: z.string(),
    prospect: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        status: z.string(),
    }).nullable(),
    unit: z.object({
        id: z.string(),
        unitNumber: z.string(),
        status: z.string(),
    }).nullable(),
});

export const ActivityQuerySchema = z.object({
    prospectId: z.string().optional(),
    unitId: z.string().optional(),
    type: z.string().optional(),
});

export type ActivityEventType = z.infer<typeof ActivityEventTypeSchema>;
export type ActivityEvent = z.infer<typeof ActivityEventSchema>;
export type ActivityEventWithRelations = z.infer<typeof ActivityEventWithRelationsSchema>;
export type ActivityQuery = z.infer<typeof ActivityQuerySchema>;

