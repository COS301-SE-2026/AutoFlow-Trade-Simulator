from .base_strategy import BaseRubricStrategy
from .RubricEngineDTO import CategoryScoreDTO, ExecutionMetricDTO, EvaluationResultDTO, Grade

class MomentumStrategy(BaseRubricStrategy):

    def evaluate(self, metrics: ExecutionMetricDTO) -> EvaluationResultDTO:
        
        if metrics.total_return_pct >= 15.0:
            return_score = 100.0
            return_fb = f"Outstanding trend capture! Strong return of {round(metrics.total_return_pct, 2)}%."
        elif metrics.total_return_pct >= 5.0:
            return_score = 60.0 + ((metrics.total_return_pct - 5.0) / 10.0) * 40.0
            return_fb = f"Decent momentum build, return of {round(metrics.total_return_pct, 2)}% (target >15% for top grade)."
        else:
            return_score = max(0.0, (metrics.total_return_pct / 5.0) * 60.0) if metrics.total_return_pct > 0 else 0.0
            return_fb = f"Weak momentum follow-through ({round(metrics.total_return_pct, 2)}%). Failed to ride the trend."

        if metrics.max_drawdown_pct <= 8.0:
            risk_score = 100.0
            risk_fb = "Impeccable trend control! Drawdown kept under 8% during pullbacks."
        elif metrics.max_drawdown_pct <= 20.0:
            risk_score = 100.0 - ((metrics.max_drawdown_pct - 8.0) / 12.0) * 50.0
            risk_fb = f"Moderate pullback drawdown ({metrics.max_drawdown_pct}%). Watch out for trend exhaustion."
        else:
            risk_score = max(0.0, 50.0 - (metrics.max_drawdown_pct - 20.0) * 3.0)
            risk_fb = f"Dangerous trend reversal drawdown ({metrics.max_drawdown_pct}%). Trailing stops need tightening."

        avg_hold_min = round(metrics.avg_holding_period_sec / 60, 1)
        if 600.0 <= metrics.avg_holding_period_sec <= 7200.0:
            hold_score = 100.0
            hold_fb = f"Ideal trend-riding duration! Average hold time of {avg_hold_min} mins."
        elif metrics.avg_holding_period_sec < 600.0:
            hold_score = max(40.0, (metrics.avg_holding_period_sec / 600.0) * 100.0)
            hold_fb = f"Exited too early ({avg_hold_min} mins). Momentum needs room to compound."
        else:
            hold_score = max(0.0, 100.0 - ((metrics.avg_holding_period_sec - 7200.0) / 3600.0) * 50.0)
            hold_fb = f"Positions held too long ({avg_hold_min} mins). Stagnant trend holding detected."
        
        alpha = metrics.total_return_pct - (metrics .benchmark_return_pct or 0.0)
        Sharpe = max(0.0, metrics.sharpe_ratio)
        profit_score = round(
            (min(1.0, Sharpe / 1.5) * 50.0) + (min(1.0, max(0.0, alpha / 5.0)) * 50), 2
        )
        profit_fb = f"Sharpe: {round(metrics.sharpe_ratio, 2)}, Alpha +{round(alpha, 2)}% vs benchmark."

        final_score = round (
            (return_score * 0.30) + (risk_score * 0.25) + (hold_score * 0.25) + (profit_score * 0.20), 2
        )

        if metrics.total_trades < 3:
            acc_score = final_score
            final_score = min(final_score, 45.0)
            hold_fb += f" [SCORE CAPPED]: Minimum of 3 trades is required (made {metrics.total_trades}). Raw score was {acc_score}."

        grade = self._compute_grade(final_score)
        passed = final_score >= 60.0

        return EvaluationResultDTO(
            passed=passed,
            final_score=final_score,
            grade=grade,
            detail_breakdown={
                "trend_capture": CategoryScoreDTO(
                    score=round(return_score, 2), weight=0.30, feedback=return_fb
                ),
                "risk_management": CategoryScoreDTO(
                    score=round(risk_score, 2), weight=0.25, feedback=risk_fb
                ),
                "holding_discipline": CategoryScoreDTO(
                    score=round(hold_score, 2), weight=0.25, feedback=hold_fb
                ),
                "alpha_efficiency": CategoryScoreDTO(
                    score=round(profit_score, 2), weight=0.20, feedback=profit_fb
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

        
        

