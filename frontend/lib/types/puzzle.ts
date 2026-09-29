import { z } from "zod";

export const PuzzleBarSchema = z.object({
    day_index: z.number().int(),
    open: z.number(),
    high: z.number(),
    low: z.number(),
    close: z.number(),
    volume: z.number(),
});

export const PuzzleStartRequestSchema = z.object({
    strategy_id: z.number().int(),
    asset: z.string(),
});

export const PuzzleStartResponseSchema = z.object({
    puzzle_id: z.number().int(),
    bars: z.array(PuzzleBarSchema),
});

export const PuzzleActionSchema = z.object({
    day_index: z.number().int().min(0),
    action: z.enum(["buy", "sell"]),
    qty: z.number().positive(),
});

export const PuzzleSubmitRequestSchema = z.object({
    actions: z.array(PuzzleActionSchema).min(1).max(100),
});

export const CategoryScoreSchema = z.object({
    score: z.number(),
    weight: z.number(),
    feedback: z.string(),
});

export const EvaluationResultSchema = z.object({
    passed: z.boolean(),
    final_score: z.number(),
    grade: z.enum(["S", "A", "B", "C", "D", "E", "F"]),
    detail_breakdown: z.record(z.string(), CategoryScoreSchema),
});

export const PuzzleSubmitResponseSchema = z.object({
    puzzle_id: z.number().int(),
    initial_balance: z.number(),
    final_balance: z.number(),
    return_pct: z.number(),
    trades_count: z.number().int(),
    rubric_score: z.number().int().nullable(),
    evaluation: EvaluationResultSchema,
    xp_awarded: z.number().int(),
});

export const TutorialCompleteRequestSchema = z.object({
    strategy_id: z.number().int(),
});

export const TutorialCompleteResponseSchema = z.object({
    status: z.literal("ok"),
});

export type PuzzleBar = z.infer<typeof PuzzleBarSchema>;
export type PuzzleStartRequest = z.infer<typeof PuzzleStartRequestSchema>;
export type PuzzleStartResponse = z.infer<typeof PuzzleStartResponseSchema>;
export type PuzzleAction = z.infer<typeof PuzzleActionSchema>;
export type PuzzleSubmitRequest = z.infer<typeof PuzzleSubmitRequestSchema>;
export type CategoryScore = z.infer<typeof CategoryScoreSchema>;
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
export type PuzzleSubmitResponse = z.infer<typeof PuzzleSubmitResponseSchema>;
export type TutorialCompleteRequest = z.infer<typeof TutorialCompleteRequestSchema>;
export type TutorialCompleteResponse = z.infer<typeof TutorialCompleteResponseSchema>;