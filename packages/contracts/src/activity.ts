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

export type ActivityEventType = z.infer<typeof ActivityEventTypeSchema>;
export type ActivityEvent = z.infer<typeof ActivityEventSchema>;
