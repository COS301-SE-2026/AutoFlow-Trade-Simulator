import { z } from "zod";

export const TechNodeDTOSchema = z.object({
    name: z.string(),
    description: z.string(),
    cost: z.number().int(),
    prerequisites: z.array(z.string()).nullable().optional().default(null),
    unlocks: z.array(z.string()).nullable().optional().default(null),
});

export const TechNodeStateDTOSchema = z.object({
    name: z.string(),
    description: z.string(),
    cost: z.number().int(),
    prerequisites: z.array(z.string()).nullable().optional().default(null),
    unlocks: z.array(z.string()).nullable().optional().default(null),
    unlocked: z.boolean(),
    available: z.boolean(),
});

export const TechTreeResponseDTOSchema = z.object({
    experience_points: z.number().int(),
    upgrades: z.array(z.string()),
    nodes: z.array(TechNodeStateDTOSchema),
});

export const PurchaseRequestDTOSchema = z.object({
    tech_name: z.string(),
});

export const PurchaseResponseDTOSchema = z.object({
    experience_points: z.number().int(),
    upgrades: z.array(z.string()),
    purchased: z.string(),
});

export const UnlockCheckDTOSchema = z.object({
    tech_name: z.string(),
    unlocked: z.boolean(),
});

export const EpicStatusDTOSchema = z.object({
    epic: z.string(),
    status: z.string(),
});

export type TechTreeResponseDTO = z.infer<typeof TechTreeResponseDTOSchema>;