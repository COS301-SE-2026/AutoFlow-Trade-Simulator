from typing import Optional

from .base_strategy import BaseRubricStrategy
from .RubricEngineDTO import CategoryScoreDTO, ExecutionMetricDTO, EvaluationResultDTO


class MomentumStrategy(BaseRubricStrategy):

    def evaluate(self, metrics: ExecutionMetricDTO) -> EvaluationResultDTO:
        alpha = metrics.total_return_pct - (metrics.benchmark_return_pct or 0.0)

        trend_score, trend_fb = self._score_trend_capture(
            metrics.avg_winner_pct, metrics.avg_loser_pct, alpha
        )
        risk_score, risk_fb = self._score_risk(metrics.max_drawdown_pct)
        hold_score, hold_fb = self._score_hold(metrics.avg_holding_period_sec)
        alpha_score, alpha_fb = self._score_alpha_efficiency(
            alpha, metrics.sharpe_ratio
        )

        final_score = round(
            (trend_score * 0.30)
            + (risk_score * 0.25)
            + (hold_score * 0.25)
            + (alpha_score * 0.20),
            2,
            )

        if metrics.total_trades < 3:
            acc_score = final_score
            final_score = min(final_score, 45.0)
            hold_fb += (
                f" [SCORE CAPPED]: Minimum of 3 trades is required to measure "
                f"momentum behaviour (made {metrics.total_trades}). "
                f"Raw score was {acc_score}."
            )

        grade = self._compute_grade(final_score)
        passed = final_score >= 60.0

        return EvaluationResultDTO(
            passed=passed,
            final_score=final_score,
            grade=grade,
            detail_breakdown={
                "trend_capture": CategoryScoreDTO(
                    score=round(trend_score, 2), weight=0.30, feedback=trend_fb
                ),
                "risk_management": CategoryScoreDTO(
                    score=round(risk_score, 2), weight=0.25, feedback=risk_fb
                ),
                "holding_discipline": CategoryScoreDTO(
                    score=round(hold_score, 2), weight=0.25, feedback=hold_fb
                ),
                "alpha_efficiency": CategoryScoreDTO(
                    score=round(alpha_score, 2), weight=0.20, feedback=alpha_fb
                ),
            },
        )

    def _score_trend_capture(
            self,
            avg_winner_pct: Optional[float],
            avg_loser_pct: Optional[float],
            alpha: float,
    ) -> tuple[float, str]:
        if avg_winner_pct is None and avg_loser_pct is None:
            base = max(0.0, min(100.0, (alpha / 10.0) * 100.0))
            return base, (
                f"No closed round-trips yet, so this is scored on alpha "
                f"({alpha:+.2f}%). Open with a stop and let the trend develop "
                f"before you exit."
            )
        if avg_loser_pct is None:
            return 90.0, (
                f"Only winning trades (avg +{avg_winner_pct:.2f}%). Strong "
                f"signals — but a run with no losers usually means trends "
                f"were cut before they had a chance to reverse."
            )
        if avg_winner_pct is None:
            return 0.0, (
                f"Only losing trades (avg {avg_loser_pct:.2f}%). Every closed "
                f"trade went against you — momentum requires at least some "
                f"trends to run."
            )

        ratio = avg_winner_pct / abs(avg_loser_pct) if avg_loser_pct != 0 else 0.0
        if ratio >= 2.0:
            return 100.0, (
                f"Winners +{avg_winner_pct:.2f}% vs losers "
                f"{avg_loser_pct:.2f}% (ratio {ratio:.2f}x) — textbook "
                f"momentum. You're cutting losers fast and letting winners run."
            )
        if ratio >= 1.0:
            score = 50.0 + min(50.0, (ratio - 1.0) * 50.0)
            return score, (
                f"Winners +{avg_winner_pct:.2f}% vs losers "
                f"{avg_loser_pct:.2f}% (ratio {ratio:.2f}x) — winners are "
                f"bigger, but momentum targets 2x. Let your best trades run longer."
            )
        score = max(0.0, ratio * 50.0)
        return score, (
            f"Winners +{avg_winner_pct:.2f}% vs losers "
            f"{avg_loser_pct:.2f}% (ratio {ratio:.2f}x) — losers are bigger "
            f"than winners. This is the inverse of momentum: you're cutting "
            f"winners early and holding losers through reversals."
        )

    def _score_risk(self, drawdown: float) -> tuple[float, str]:
        if drawdown <= 8.0:
            return 100.0, (
                f"Drawdown kept under 8% — your trailing stops held during "
                f"pullbacks and preserved the trend's gains."
            )
        if drawdown <= 20.0:
            score = 100.0 - ((drawdown - 8.0) / 12.0) * 50.0
            return score, (
                f"Pullback of {drawdown:.2f}% — beyond 8% usually signals "
                f"trend exhaustion. Tighten the trailing stop."
            )
        score = max(0.0, 50.0 - (drawdown - 20.0) * 3.0)
        return score, (
            f"Severe drawdown of {drawdown:.2f}% — you held through a full "
            f"reversal. Momentum exits before the trend gives back its gains."
        )

    def _score_hold(self, held_sec: float) -> tuple[float, str]:
        # Thresholds unchanged (per reviewer).
        avg_min = round(held_sec / 60.0, 1)
        if 600.0 <= held_sec <= 7200.0:
            return 100.0, (
                f"Average hold of {avg_min} min — the momentum sweet spot: "
                f"long enough for the trend to develop, short enough to exit "
                f"before stagnation."
            )
        if held_sec < 600.0:
            score = max(40.0, (held_sec / 600.0) * 100.0)
            return score, (
                f"Exited after {avg_min} min — too quick for momentum. "
                f"Trends need breathing room; let the position compound before "
                f"you bail."
            )
        score = max(0.0, 100.0 - ((held_sec - 7200.0) / 3600.0) * 50.0)
        return score, (
            f"Held {avg_min} min — well past the momentum window. A trend "
            f"becomes a bag-holding bet once the move is exhausted. Take "
            f"profits when momentum stalls."
        )

    def _score_alpha_efficiency(
            self, alpha: float, sharpe: float
    ) -> tuple[float, str]:
        s = max(0.0, sharpe)
        score = round(
            (min(1.0, s / 1.5) * 50.0)
            + (min(1.0, max(0.0, alpha / 5.0)) * 50.0),
            2,
            )
        return score, (
            f"Sharpe {sharpe:.2f}, alpha {alpha:+.2f}% vs benchmark — "
            f"risk-adjusted edge on top of the raw trend."
        )