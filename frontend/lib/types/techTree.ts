import { z } from 'zod';

export const TechNodeSchema = z.object({
    name: z.string(),
    description: z.string(),
    cost: z.number().int(),
    prerequisites: z.array(z.string()).default([]),
    unlocks: z.array(z.string()).default([]),
    unlocked: z.boolean(),
    available: z.boolean(),
});

export const TechTreeSchema = z.object({
    experience_points: z.number().int(),
    upgrades: z.array(z.string()),
    nodes: z.array(TechNodeSchema),
});

export const UnlockCheckSchema = z.object({
    tech_name: z.string(),
    unlocked: z.boolean(),
});

export const PurchaseResponseSchema = z.object({
    experience_points: z.number().int(),
    upgrades: z.array(z.string()),
    purchased: z.string(),
});

export type TechNode = z.infer<typeof TechNodeSchema>;
export type TechTree = z.infer<typeof TechTreeSchema>;
export type UnlockCheck = z.infer<typeof UnlockCheckSchema>;
export type PurchaseResponse = z.infer<typeof PurchaseResponseSchema>;