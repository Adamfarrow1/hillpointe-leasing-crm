import { z } from 'zod';

export const TourOutcomeSchema = z.enum(['completed', 'no_show', 'cancelled']).nullable();

export const TourSchema = z.object({
    id: z.string(),
    prospectId: z.string(),
    prospectName: z.string(),
    unitId: z.string(),
    unitName: z.string(),
    scheduledAt: z.string(),
    outcome: TourOutcomeSchema,
    agentName: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const CreateTourSchema = z.object({
    prospectId: z.string().min(1),
    unitId: z.string().min(1),
    scheduledAt: z.string().min(1),
    agentName: z.string().min(1),
});

export const UpdateTourSchema = z.object({
    scheduledAt: z.string().min(1).optional(),
    outcome: TourOutcomeSchema.optional(),
    agentName: z.string().min(1).optional(),
});

export type TourOutcome = z.infer<typeof TourOutcomeSchema>;
export type Tour = z.infer<typeof TourSchema>;
export type CreateTourInput = z.infer<typeof CreateTourSchema>;
export type UpdateTourInput = z.infer<typeof UpdateTourSchema>;
