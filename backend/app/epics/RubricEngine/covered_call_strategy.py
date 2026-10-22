from .base_strategy import BaseRubricStrategy
from .RubricEngineDTO import CategoryScoreDTO, EvaluationResultDTO, ExecutionMetricDTO, Grade

class CoveredCallStrategy(BaseRubricStrategy):

    def evaluate(self, metrics: ExecutionMetricDTO) -> EvaluationResultDTO:
        if metrics.win_rate >= 0.70:
            income_score = 100.0
            income_fb = f"Exceptional income generation! Strong win rate of {round(metrics.win_rate * 100, 1)}%."
        elif metrics.win_rate >= 0.50:
            income_score = 60.0 + ((metrics.win_rate - 0.50) / 0.20) * 40.0
            income_fb = f"Steady income capture, win rate at {round(metrics.win_rate * 100, 1)}% (target >70% for prime covered call yield)."
        else:
            income_score = max(0.0, (metrics.win_rate / 0.50) * 60.0)
            income_fb = f"Subpar income stability ({round(metrics.win_rate * 100, 1)}% win rate). Frequent breaches hurt premium collection."

        if metrics.max_drawdown_pct <= 6.0:
            risk_score = 100.0
            risk_fb = "Superb downside cushion! Drawdown well-mitigated by premium collection."
        elif metrics.max_drawdown_pct <= 15.0:
            risk_score = 100.0 - ((metrics.max_drawdown_pct - 6.0) / 9.0) * 50.0
            risk_fb = f"Moderate drawdown ({metrics.max_drawdown_pct}%). Ensure underlying drops don't exceed your cushion."
        else:
            risk_score = max(0.0, 50.0 - (metrics.max_drawdown_pct - 15.0) * 3.0)
            risk_fb = f"Excessive drawdown ({metrics.max_drawdown_pct}%). Premium buffer breached by sharp underlying decline."

        avg_hold_min = round(metrics.avg_holding_period_sec / 60, 1)
        if metrics.avg_holding_period_sec >= 1800.0:
            hold_score = 100.0
            hold_fb = f"Excellent holding patience! Average duration of {avg_hold_min} mins allows theta decay to work."
        elif metrics.avg_holding_period_sec >= 600.0:
            hold_score = 60.0 + ((metrics.avg_holding_period_sec - 600.0) / 1200.0) * 40.0
            hold_fb = f"Decent hold time ({avg_hold_min} mins), but letting positions approach expiration maximizes premium retention."
        else:
            hold_score = max(0.0, (metrics.avg_holding_period_sec / 600.0) * 60.0)
            hold_fb = f"Too jittery / short-term ({avg_hold_min} mins). Covered calls require holding steady through expiration cycles."

        alpha = metrics.total_return_pct - (metrics.benchmark_return_pct or 0.0)
        Sharpe = max(0.0, metrics.sharpe_ratio)
        yield_score = round(
            (min(1.0, Sharpe / 1.2) * 50.0) + (min(1.0, max(0.0, (alpha + 5.0) / 10.0)) * 50), 2
        )
        yield_fb = f"Sharpe: {round(metrics.sharpe_ratio, 2)}, Risk-adjusted yield efficiency optimized."

        final_score = round(
            (income_score * 0.30) + (risk_score * 0.25) + (hold_score * 0.25) + (yield_score * 0.20), 2
        )

        if metrics.total_trades < 2:
            acc_score = final_score
            final_score = min(final_score, 45.0)
            hold_fb += f" [SCORE CAPPED]: Minimum of 2 trades required for premium cycle (made {metrics.total_trades}). Raw score was {acc_score}."

        grade = self._compute_grade(final_score)
        passed = final_score >= 60.0

        return EvaluationResultDTO(
            passed=passed,
            final_score=final_score,
            grade=grade,
            detail_breakdown={
                "income_generation": CategoryScoreDTO(
                    score=round(income_score, 2), weight=0.30, feedback=income_fb
                ),
                "downside_mitigation": CategoryScoreDTO(
                    score=round(risk_score, 2), weight=0.25, feedback=risk_fb
                ),
                "holding_discipline": CategoryScoreDTO(
                    score=round(hold_score, 2), weight=0.25, feedback=hold_fb
                ),
                "yield_efficiency": CategoryScoreDTO(
                    score=round(yield_score, 2), weight=0.20, feedback=yield_fb
                )
            }
        )

    def _compute_grade(self, score: float) -> Grade:
        if score >= 90.0:
            return Grade.S
        if score >= 80.0:
            return Grade.A
        if score >= 70.0:
            return Grade.B
        if score >= 60.0:
            return Grade.C
        if score >= 50.0:
            return Grade.D
        if score >= 40.0:
            return Grade.E
        return Grade.F