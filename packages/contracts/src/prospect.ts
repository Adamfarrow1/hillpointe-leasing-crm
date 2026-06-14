import { z } from 'zod';

export const ProspectStatusSchema = z.enum([
    'new',
    'contacted',
    'tour_scheduled',
    'toured',
    'application',
    'leased',
    'lost',
]);

const AssignedUnitSchema = z.object({
    id: z.string(),
    unitNumber: z.string(),
    status: z.string(),
});

export const ProspectSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    status: ProspectStatusSchema,
    assignedUnitId: z.string().nullable(),
    assignedUnit: AssignedUnitSchema.nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const CreateProspectSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(1, 'Phone is required'),
    status: ProspectStatusSchema.default('new'),
    assignedUnitId: z.string().nullable().default(null),
});

export const UpdateProspectSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(1).optional(),
    status: ProspectStatusSchema.optional(),
    assignedUnitId: z.string().nullable().optional(),
});

export const StatusTransitionSchema = z.object({
    status: ProspectStatusSchema,
});

export type ProspectStatus = z.infer<typeof ProspectStatusSchema>;
export type Prospect = z.infer<typeof ProspectSchema>;
export type CreateProspectInput = z.infer<typeof CreateProspectSchema>;
export type UpdateProspectInput = z.infer<typeof UpdateProspectSchema>;
export type StatusTransitionInput = z.infer<typeof StatusTransitionSchema>;
