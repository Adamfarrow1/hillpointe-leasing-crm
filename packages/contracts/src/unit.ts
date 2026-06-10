import { z } from 'zod';

export const UnitStatusSchema = z.enum(['available', 'held', 'leased']);

export const UnitSchema = z.object({
    id: z.string(),
    unitNumber: z.string(),
    status: UnitStatusSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const CreateUnitSchema = z.object({
    unitNumber: z.string().min(1),
    status: UnitStatusSchema.optional(),
});

export const UpdateUnitSchema = z.object({
    unitNumber: z.string().min(1).optional(),
    status: UnitStatusSchema.optional(),
});

export type UnitStatus = z.infer<typeof UnitStatusSchema>;
export type Unit = z.infer<typeof UnitSchema>;
export type CreateUnitInput = z.infer<typeof CreateUnitSchema>;
export type UpdateUnitInput = z.infer<typeof UpdateUnitSchema>;
