import { apiClient } from '@/lib/api';

export async function completeTutorial(strategyId: number): Promise<void> {
    await apiClient('/puzzle/tutorial/complete', {
        method: 'POST',
        body: { strategy_id: strategyId },
    });
}
