from .base_strategy import BaseRubricStrategy
from .RubricEngineDTO import (
    CategoryScoreDTO,
    EvaluationResultDTO,
    ExecutionMetricDTO,
    Grade,
)


class BuyAndHoldStrategy(BaseRubricStrategy):
    MIN_HOLD_SEC = 1 * 24 * 60 * 60
    FULL_HOLD_SEC = 10 * 24 * 60 * 60
    MAX_ACCEPTABLE_TRADES = 2
    HARD_TRADE_CAP = 10

    def evaluate(self, metrics: ExecutionMetricDTO) -> EvaluationResultDTO:
        trade_score, trade_fb = self._score_trade_discipline(metrics)
        ret_score, ret_fb = self._score_return_tracking(metrics)
        hold_score, hold_fb = self._score_holding_period(metrics)
        risk_score, risk_fb = self._score_risk(metrics)

        final_score = round(
            trade_score * 0.30
            + ret_score * 0.35
            + hold_score * 0.20
            + risk_score * 0.15,
            2,
        )

        if metrics.total_trades == 0:
            final_score = 0.0
            trade_fb += " [SCORE ZEROED]: No trades were executed."

        grade = self._compute_grade(final_score)
        passed = final_score >= 60.0

        return EvaluationResultDTO(
            passed=passed,
            final_score=final_score,
            grade=grade,
            detail_breakdown={
                "trade_discipline": CategoryScoreDTO(
                    score=round(trade_score, 2), weight=0.30, feedback=trade_fb
                ),
                "return_tracking": CategoryScoreDTO(
                    score=round(ret_score, 2), weight=0.35, feedback=ret_fb
                ),
                "holding_period": CategoryScoreDTO(
                    score=round(hold_score, 2), weight=0.20, feedback=hold_fb
                ),
                "risk_profile": CategoryScoreDTO(
                    score=round(risk_score, 2), weight=0.15, feedback=risk_fb
                ),
            },
        )

    def _score_trade_discipline(self, metrics: ExecutionMetricDTO):
        n = metrics.total_trades
        if n == 0:
            return 0.0, "No trades executed. Buy-and-hold requires at least one buy."
        if n <= self.MAX_ACCEPTABLE_TRADES:
            return 100.0, (
                f"Excellent discipline - {n} trade(s) is textbook buy-and-hold."
            )
        if n <= self.HARD_TRADE_CAP:
            span = self.HARD_TRADE_CAP - self.MAX_ACCEPTABLE_TRADES
            score = 100.0 - ((n - self.MAX_ACCEPTABLE_TRADES) / span) * 100.0
            return max(0.0, score), (
                f"{n} trades executed. Buy-and-hold should be 1–2 trades; "
                f"excessive churn means the position was not actually held."
            )
        return 0.0, (
            f"{n} trades is far too active. This looks like active trading, "
            f"not a passive strategy."
        )

    def _score_return_tracking(self, metrics: ExecutionMetricDTO):
        bench = metrics.benchmark_return_pct or 0.0
        diff = abs(metrics.total_return_pct - bench)

        if diff <= 0.5:
            return 100.0, (
                f"Return ({metrics.total_return_pct:.2f}%) tracks the benchmark "
                f"({bench:.2f}%) within tolerance - confirms you held the underlying."
            )
        if diff <= 2.0:
            score = 100.0 - ((diff - 0.5) / 1.5) * 20.0
            return score, (
                f"Return deviates {diff:.2f}% from benchmark. Small drift, likely "
                f"entry/exit timing rather than strategy deviation."
            )
        if diff <= 5.0:
            score = 80.0 - ((diff - 2.0) / 3.0) * 40.0
            return score, (
                f"Return deviates {diff:.2f}% from benchmark. Buy-and-hold should "
                f"mirror the index - timing the entry/exit hurt performance."
            )
        score = max(0.0, 40.0 - (diff - 5.0) * 4.0)
        return score, (
            f"Return diverges significantly ({diff:.2f}% vs benchmark). "
            f"This is not buy-and-hold behaviour."
        )

    def _score_holding_period(self, metrics: ExecutionMetricDTO):
        held = metrics.avg_holding_period_sec

        if held <= 0.0:
            bench = metrics.benchmark_return_pct or 0.0
            if metrics.total_trades in (1, 2) and abs(
                    metrics.total_return_pct - bench
            ) <= 1.0:
                return 100.0, (
                    "Position effectively held through the match window "
                    "(still open at close). Full holding credit awarded."
                )
            return 0.0, (
                "Average holding period could not be measured - either no "
                "closed trades or positions were not carried."
            )

        if held >= self.FULL_HOLD_SEC:
            return 100.0, (
                f"Held for an average of {held / 86400:.1f} days. "
                f"Exactly what buy-and-hold demands."
            )
        if held <= self.MIN_HOLD_SEC:
            return 0.0, (
                f"Average hold of {held / 3600:.1f} hours is far too short "
                f"for a buy-and-hold strategy."
            )

        span = self.FULL_HOLD_SEC - self.MIN_HOLD_SEC
        score = ((held - self.MIN_HOLD_SEC) / span) * 100.0
        return score, (
            f"Average hold of {held / 86400:.1f} days partially satisfies "
            f"buy-and-hold; aim for a full multi-day carry."
        )

    def _score_risk(self, metrics: ExecutionMetricDTO):
        dd = metrics.max_drawdown_pct
        if dd <= 15.0:
            return 100.0, (
                f"Drawdown of {dd:.2f}% is within normal range for a held position."
            )
        if dd <= 30.0:
            score = 100.0 - ((dd - 15.0) / 15.0) * 30.0
            return score, (
                f"Drawdown of {dd:.2f}% is elevated - check leverage and "
                f"concentration risk even for a passive strategy."
            )
        score = max(0.0, 70.0 - (dd - 30.0) * 2.0)
        return score, (
            f"Drawdown of {dd:.2f}% is extreme. Buy-and-hold does not justify "
            f"this level of downside - sizing or leverage is off."
        )

    def _compute_grade(self, score: float) -> Grade:
        if score >= 90.0: return Grade.S
        if score >= 80.0: return Grade.A
        if score >= 70.0: return Grade.B
        if score >= 60.0: return Grade.C
        if score >= 50.0: return Grade.D
        if score >= 40.0: return Grade.E
        return Grade.F
