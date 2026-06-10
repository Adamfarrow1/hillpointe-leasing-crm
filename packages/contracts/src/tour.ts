import { z } from 'zod';

/** Outcome values that can be recorded (null = not yet recorded / still scheduled) */
export const TourOutcomeSchema = z.enum(['completed', 'no_show', 'cancelled']).nullable();

/** Raw tour fields — mirrors the Prisma Tour model */
export const TourSchema = z.object({
    id: z.string(),
    prospectId: z.string(),
    unitId: z.string().nullable(),
    scheduledAt: z.string(),
    outcome: TourOutcomeSchema,
    agentName: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

/** Prospect subset embedded in tour API responses */
export const TourProspectSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    status: z.string(),
});

/** Unit subset embedded in tour API responses */
export const TourUnitSchema = z.object({
    id: z.string(),
    unitNumber: z.string(),
    status: z.string(),
}).nullable();

/** Tour as returned by the API — includes nested prospect and unit */
export const TourWithRelationsSchema = TourSchema.extend({
    prospect: TourProspectSchema,
    unit: TourUnitSchema,
});

export const CreateTourSchema = z.object({
    prospectId: z.string().min(1, 'Prospect is required'),
    unitId: z.string().min(1, 'Unit is required'),
    scheduledAt: z.string().min(1, 'Scheduled time is required'),
    agentName: z.string().optional(),
});

export const UpdateTourSchema = z.object({
    scheduledAt: z.string().min(1).optional(),
    unitId: z.string().min(1).optional(),
    agentName: z.string().optional(),
});

export const RecordTourOutcomeSchema = z.object({
    outcome: z.enum(['completed', 'no_show', 'cancelled']),
});

export type TourOutcome = z.infer<typeof TourOutcomeSchema>;
export type Tour = z.infer<typeof TourSchema>;
export type TourWithRelations = z.infer<typeof TourWithRelationsSchema>;
export type CreateTourInput = z.infer<typeof CreateTourSchema>;
export type UpdateTourInput = z.infer<typeof UpdateTourSchema>;
export type RecordTourOutcomeInput = z.infer<typeof RecordTourOutcomeSchema>;

