from .base_strategy import BaseRubricStrategy
from .RubricEngineDTO import CategoryScoreDTO, EvaluationResultDTO, ExecutionMetricDTO, Grade

class MeanReversionStrategy(BaseRubricStrategy):

    def evaluate(self, metrics: ExecutionMetricDTO) -> EvaluationResultDTO:

        # Win rate score
        if metrics.win_rate >= 0.65:
            win_score = 100.0
            win_fb = f"Outstanding performance! Strong win rate of {round(metrics.win_rate * 100, 1)}%."
        elif metrics.win_rate >= 0.50:
            win_score = 60.0 + ((metrics.win_rate - 0.50) / 0.15) * 40.0
            win_fb = f"Valiant effort but, mean reversion targets a win rate of 65% you achieved a win rate of {round(metrics.win_rate * 100, 1)}%."
        else:
            win_score = (metrics.win_rate / 0.50) * 60.0
            win_fb = f"Low win rate ({round(metrics.win_rate * 100, 1)}%). Avoid entering too early."

        # Risk Management / Drawdown
        if metrics.max_drawdown_pct <= 5.0:
            risk_score = 100.0
            risk_fb = "Impeccable risk management! Drawdown kept under 5%."
        elif metrics.max_drawdown_pct <= 12.0:
            risk_score = 100.0 - ((metrics.max_drawdown_pct - 5.0) / 7.0) * 50.0
            risk_fb = f"Moderate drawdown ({metrics.max_drawdown_pct}%). Cut losses promptly when price trends are not in your favor."
        else:
            risk_score = max(0.0, 50.0 - (metrics.max_drawdown_pct - 12.0) * 3.0)
            risk_fb = f"Dangerous drawdown ({metrics.max_drawdown_pct}%). Stop-losses must be STRICTLY enforced."

        # Avg holding time grading (gradings for this need to be consulted)
        target_max_hold_allowed_sec = 1000.0 #Just a rough estimate will need to consult to change
        if metrics.avg_holding_period_sec <= target_max_hold_allowed_sec:
            hold_score = 100.0
            hold_fb = f"Great execution speed! Average hold time of {round(metrics.avg_holding_period_sec / 60, 1)} mins fits mean reversion."
        elif metrics.avg_holding_period_sec <= 2800.0:
            hold_score = max(0.0, 100.0 - ((metrics.avg_holding_period_sec - target_max_hold_allowed_sec) / 1800) * 50.0)
            hold_fb = f"Positions held slightly too long ({round(metrics.avg_holding_period_sec / 60, 1)} mins). Watch out for bag-holding."
        else:
            hold_score = max(0.0, 50.0 - ((metrics.avg_holding_period_sec - 1800) / 600.0) * 10.0)
            hold_fb = f"Excessive holding time ({round(metrics.avg_holding_period_sec / 60, 1)} mins). Exit quickly on mean reversion targets."

        # Sharpe ratio and profitability
        alpha = metrics.total_return_pct - (metrics.benchmark_return_pct or 0.0)
        Sharpe = max(0.0, metrics.sharpe_ratio)
        profit_score = round (
            (min(1.0, Sharpe / 1.5) * 50.0) + (min(1.0, max(0.0, alpha / 5.0)) * 50), 2
        )
        profit_fb = f"Sharpe: {metrics.sharpe_ratio}, Alpha +{round(alpha, 2)}% vs benchmark."

        final_score = round (
            (win_score * 0.30) + (risk_score * 0.25) + (hold_score * 0.25) + (profit_score * 0.20), 2
        )

        # Idk my closet model to this is an afk timer. You need x a mount of trades to pass
        if metrics.total_trades < 3:
            acc_score = final_score
            final_score = min(final_score, 45.0)
            hold_fb += f" [SCORE CAPPED]: Minimum of 3 trades is required (made {metrics.total_trades}). Raw score was {acc_score}."

        grade = self._compute_grade(final_score)
        passed = final_score >= 60.0 #Idk maybe we should make it 50

        return EvaluationResultDTO(
            passed=passed,
            final_score=final_score,
            grade=grade,
            detail_breakdown={
                "win_rate_consistency": CategoryScoreDTO(
                    score=round(win_score, 2), weight=0.30, feedback=win_fb
                ),
                "risk_management": CategoryScoreDTO(
                    score=round(risk_score, 2), weight=0.25, feedback=risk_fb
                ),
                "holding_discipline": CategoryScoreDTO(
                    score=round(hold_score, 2), weight=0.25, feedback=hold_fb
                ),
                "profitability_efficiency": CategoryScoreDTO(
                    score=round(profit_score, 2), weight=0.20, feedback=profit_fb
                )
            }
        )

    def _compute_grade(self, score: float) -> Grade:
        if score >= 90.0: return Grade.S
        if score >= 80.0: return Grade.A
        if score >= 70.0: return Grade.B
        if score >= 60.0: return Grade.C
        if score >= 50.0: return Grade.D
        if score >= 40.0: return Grade.E
        return Grade.F