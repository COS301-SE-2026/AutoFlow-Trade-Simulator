from .base_strategy import BaseRubricStrategy
from .RubricEngineDTOs import CategoryScoreDTO, EvaluationResultDTO, ExecutionMetricDTO, Grade

class MeanReversionStrategy(BaseRubricStrategy):

    def evaulate(self, metrics: ExecutionMetricDTO) -> EvaluationResultDTO:

        # Win rate score
        if metrics.win_rate >= 0.65:
            win_score = 100.0
            win_fb = f"Outstanding performance! String win rate of {round(metrics.win_rate * 100, 1)}%."
        elif metrics.win_rate >= 0.50:
            win_score = 60.0 + ((metrics.win_rate - 0.50) / 0.15) * 40.0
            win_fb = f"Valient effort but, mean reversion targets a win rate of 65% you achieved a win rate of {round(metrics.win_rate * 100, 1)}%."
        else:
            win_score = (metrics.win_rate / 0.50) * 60.0
            win_fb = f"Low win rate ({round(metrics.win_rate * 100, 1)}%). Avoid entering to early."

        # Risk Management / Drawdown
        if metrics.max_drawdown_pct <= 5.0:
            risk_score = 100.0
            risk_fb = "Impecable risk management! Drawdown kept under 5%."
        elif metrics.max_drawdown_pct <= 12.0
            risk_score = 100.0 - ((metrics.max_drawdown_pct - 5.0) / 7.0) * 50.0
            risk_fb = f"Moderate drawdown ({metrics.max_drawdown_pct}%). Cut losses promptly when price trends are not in your favour"
        else:
            risk_score = max(0.0, 50.0 - (metrics.max_drawdown_pct - 12.0) * 3.0)
            risk_fb = f"Dangerous drawdown ({metrics.max_drawdown_pct}%). Stop-losses must be STRICTYLY enforced."

        # Avg holding time grading (gradings for this need to be consulted)
        target_max_hold_allowed_sec = 1000.0 #Just a rough estimate will need to consult to change
        if metrics.avg_holding_period_sec <= target_max_hold_allowed_sec:
            hold_score = 100.0
            hold_fb = f"Great execution speed! Average hold time of {round(metrics.avg_holding_period_sec / 60, 1)} mins fits mean reversion."
        elif metrics.avg_holding_period_sec <= 2800.0
            hold_score = 100.0 - ((metrics.avg_holding_period_sec - target_max_hold_allowed_sec) / 1200) * 50.0
            hold_fb = f"Positions held slightly too long ({round(metrics.avg_holding_period_sec / 60, 1)} mins). Watch out for bag-holding."
        else:
            hold_score = max(0.0, 50.0 - ((metrics.avg_holding_period_sec - 1800) / 600.0) * 10.0)
            hold_fb = hold_fb = f"Excessive holding time ({round(metrics.avg_holding_period_sec / 60, 1)} mins). Exit quickly on mean reversion targets."

    # Sharpe ratio and profitability
    alpha = metrics.total_return_pct - (metrics.benchmark_return_pct or 0.0)
    Sharpe = max(0.0, metrics.sharpe_ratio)
    profit_score = round (
        (min(1.0, sharpe / 1.5) * 50.0) + (min(1.0, max(0.0, alpha / 5.0)) * 50), 2
    )
    profit_fb = f"Sharpe: {metrics.sharpe_ratio}, Alpha +{round(alpha, 2)}% vs benchmark."

    final_score = round (
        (win_score * 0.30) + (risk_score * 0.25) + (hold_score * 0.25) + (profit_score * 0.20), 2
    )
