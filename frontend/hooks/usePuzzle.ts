'use client';

import { apiClient, ApiError } from "@/lib/api";
import { useCallback, useState } from "react";
import {
    PuzzleStartResponse,
    PuzzleStartResponseSchema,
    PuzzleSubmitRequest,
    PuzzleSubmitResponse,
    PuzzleSubmitResponseSchema,
    TutorialCompleteResponse,
    TutorialCompleteResponseSchema,
} from "@/lib/types/puzzle";

export function usePuzzle() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startPuzzle = useCallback(async (strategyId: number, asset: string): Promise<PuzzleStartResponse | null> => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/puzzle/start`, {
                method: "POST",
                body: { strategy_id: strategyId, asset },
            });
            return PuzzleStartResponseSchema.parse(response);
        } catch (err: any) {
            if (err instanceof ApiError && err.status === 401) {
                return null;
            }
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const submitPuzzle = useCallback(async (puzzleId: number, body: PuzzleSubmitRequest): Promise<PuzzleSubmitResponse | null> => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/puzzle/${puzzleId}/submit`, {
                method: "POST",
                body,
            });
            return PuzzleSubmitResponseSchema.parse(response);
        } catch (err: any) {
            if (err instanceof ApiError && err.status === 401) {
                return null;
            }
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const completeTutorial = useCallback(async (strategyId: number): Promise<TutorialCompleteResponse | null> => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient(`/puzzle/tutorial/complete`, {
                method: "POST",
                body: { strategy_id: strategyId },
            });
            return TutorialCompleteResponseSchema.parse(response);
        } catch (err: any) {
            if (err instanceof ApiError && err.status === 401) {
                return null;
            }
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, startPuzzle, submitPuzzle, completeTutorial };
}