from typing import Optional

from .base_strategy import BaseRubricStrategy
from .RubricEngineDTO import CategoryScoreDTO, ExecutionMetricDTO, EvaluationResultDTO

MIN_SELLS_REQUIRED = 3
RETENTION_FLOOR_PCT = 10.0
RETENTION_CEILING_PCT = 30.0
MAX_SINGLE_SELL_PCT_THRESHOLD = 40.0
COVERAGE_TARGET_PCT = 70.0
HARVEST_TARGET_PCT = 15.0
CAP_SCORE = 45.0


class SystematicProfitTakingStrategy(BaseRubricStrategy):

    def evaluate(self, metrics: ExecutionMetricDTO) -> EvaluationResultDTO:
        sell_discipline, sd_fb = self._score_sell_discipline(metrics)
        retention, ret_fb = self._score_retention(metrics.held_through_pct)
        risk, risk_fb = self._score_risk(metrics.max_drawdown_pct)
        harvest, harvest_fb = self._score_harvest(metrics)

        final_score = round(
            (sell_discipline * 0.30)
            + (retention * 0.25)
            + (risk * 0.20)
            + (harvest * 0.25),
            2,
            )

        if metrics.sell_count < MIN_SELLS_REQUIRED:
            raw = final_score
            final_score = min(final_score, CAP_SCORE)
            sd_fb += (
                f" [SCORE CAPPED]: Minimum of {MIN_SELLS_REQUIRED} sells is "
                f"required for a systematic pattern (made {metrics.sell_count}). "
                f"Raw score was {raw}."
            )

        if 0 < metrics.held_through_pct < RETENTION_FLOOR_PCT:
            raw = final_score
            final_score = min(final_score, CAP_SCORE)
            ret_fb += (
                f" [SCORE CAPPED]: You held only {round(metrics.held_through_pct, 1)}% "
                f"of your peak position - this is exit, not systematic harvest. "
                f"Raw score was {raw}."
            )

        grade = self._compute_grade(final_score)
        passed = self._compute_passed(final_score)

        return EvaluationResultDTO(
            passed=passed,
            final_score=final_score,
            grade=grade,
            detail_breakdown={
                "sell_discipline": CategoryScoreDTO(
                    score=round(sell_discipline, 2), weight=0.30, feedback=sd_fb
                ),
                "retention": CategoryScoreDTO(
                    score=round(retention, 2), weight=0.25, feedback=ret_fb
                ),
                "risk_management": CategoryScoreDTO(
                    score=round(risk, 2), weight=0.20, feedback=risk_fb
                ),
                "harvest_efficiency": CategoryScoreDTO(
                    score=round(harvest, 2), weight=0.25, feedback=harvest_fb
                ),
            },
        )

    def _score_sell_discipline(
            self, metrics: ExecutionMetricDTO
    ) -> tuple[float, str]:
        interval_score = self._cv_to_score(
            metrics.sell_interval_cv, full=0.20, pass_cv=0.60, decay=60.0
        )
        coverage_score = min(
            100.0, (metrics.sell_schedule_coverage_pct / COVERAGE_TARGET_PCT) * 100.0
        )
        cadence = interval_score * 0.70 + coverage_score * 0.30

        amount_score = self._cv_to_score(
            metrics.sell_amount_cv, full=0.25, pass_cv=0.70, decay=60.0
        )
        if metrics.max_single_sell_pct > MAX_SINGLE_SELL_PCT_THRESHOLD:
            penalty = (metrics.max_single_sell_pct - MAX_SINGLE_SELL_PCT_THRESHOLD) * 2.5
            amount_score = max(0.0, min(amount_score, 100.0 - penalty))

        score = cadence * 0.50 + amount_score * 0.50

        if metrics.sell_count == 0:
            return score, (
                "No sells placed. Buy-and-hold lets gains sit unrealised - "
                "systematic profit taking means actually harvesting on a schedule."
            )
        if metrics.sell_interval_cv is None and metrics.sell_count >= 2:
            cadence_msg = (
                "All sells landed on the same day. This is a burst, not a "
                "harvest - the whole point is spreading exits across the window."
            )
        elif interval_score >= 100.0:
            cadence_msg = (
                f"Clockwork cadence - sells were evenly spaced and covered "
                f"{round(metrics.sell_schedule_coverage_pct, 1)}% of the window."
            )
        elif interval_score >= 60.0:
            cadence_msg = (
                f"Mostly regular sells, but the gaps varied. A fixed interval "
                f"makes the harvest predictable (covered "
                f"{round(metrics.sell_schedule_coverage_pct, 1)}% of the window)."
            )
        else:
            cadence_msg = (
                f"Irregular selling pattern (covered "
                f"{round(metrics.sell_schedule_coverage_pct, 1)}% of the window). "
                f"Burst selling is market timing, not harvest discipline."
            )

        if metrics.max_single_sell_pct > MAX_SINGLE_SELL_PCT_THRESHOLD:
            amount_msg = (
                f" Largest single sell was {round(metrics.max_single_sell_pct, 1)}% "
                f"of your position - that's a dump, not a harvest tranche."
            )
        elif metrics.sell_amount_cv is None:
            amount_msg = " Not enough sells to measure amount consistency."
        elif amount_score >= 100.0:
            amount_msg = " Tranche sizes were near-identical."
        elif amount_score >= 60.0:
            amount_msg = (
                " Tranche sizes drifted - small, consistent sells keep you "
                "in the position while locking in gains."
            )
        else:
            amount_msg = (
                " Tranche sizes varied widely - sizing up on hunches is market "
                "timing, not systematic profit taking."
            )

        return score, cadence_msg + amount_msg

    def _score_retention(self, held_through_pct: float) -> tuple[float, str]:
        if held_through_pct <= 0.0:
            return 0.0, (
                "No position remaining. You sold everything - that's exit, "
                "not harvest. Systematic profit taking keeps skin in the game."
            )
        if held_through_pct >= RETENTION_CEILING_PCT:
            return 100.0, (
                f"You still hold {round(held_through_pct, 1)}% of your peak "
                f"position - you harvested gains without giving up participation "
                f"in further upside."
            )
        span = RETENTION_CEILING_PCT - RETENTION_FLOOR_PCT
        score = ((held_through_pct - RETENTION_FLOOR_PCT) / span) * 100.0
        if held_through_pct < RETENTION_FLOOR_PCT:
            score = 0.0
            return score, (
                f"Only {round(held_through_pct, 1)}% of your peak position "
                f"remains - mostly exited. Consider keeping 30%+ so you still "
                f"participate in further upside."
            )
        return score, (
            f"Held {round(held_through_pct, 1)}% through the window - decent, "
            f"but systematic harvest usually keeps 30%+ for upside participation."
        )

    def _score_risk(self, drawdown: float) -> tuple[float, str]:
        if drawdown <= 6.0:
            return 100.0, (
                "Drawdown kept under 6% - your harvest strategy absorbed "
                "volatility and preserved the gains you realised."
            )
        if drawdown <= 15.0:
            score = 100.0 - ((drawdown - 6.0) / 9.0) * 50.0
            return score, (
                f"Drawdown of {drawdown:.2f}% - systematic profit taking "
                f"should cushion pullbacks; if the underlying is dropping more "
                f"than this, size your tranches larger or exit earlier."
            )
        score = max(0.0, 50.0 - (drawdown - 15.0) * 3.0)
        return score, (
            f"Drawdown of {drawdown:.2f}% - high. Consistent income matters "
            f"less if the underlying is still bleeding. Revisit when you harvest."
        )

    def _score_harvest(
            self, metrics: ExecutionMetricDTO
    ) -> tuple[float, str]:
        volume = min(
            100.0, (metrics.harvested_pct / HARVEST_TARGET_PCT) * 100.0
        )
        sharpe = max(0.0, metrics.sharpe_ratio)
        sharpe_term = min(100.0, (sharpe / 1.2) * 100.0)
        alpha = metrics.total_return_pct - (metrics.benchmark_return_pct or 0.0)
        alpha_term = max(0.0, min(100.0, ((alpha + 3.0) / 8.0) * 100.0))

        score = round(
            volume * 0.40 + sharpe_term * 0.30 + alpha_term * 0.30, 2
        )

        if metrics.harvested_pct <= 0.0:
            volume_msg = "No cash realised from sells - nothing harvested yet."
        elif volume >= 100.0:
            volume_msg = (
                f"Harvested {round(metrics.harvested_pct, 1)}% of your initial "
                f"balance - real cash in hand, not just paper gains."
            )
        else:
            volume_msg = (
                f"Harvested {round(metrics.harvested_pct, 1)}% of your initial "
                f"balance - you're taking profit but the volume could grow."
            )

        return score, (
            f"{volume_msg} Sharpe {round(metrics.sharpe_ratio, 2)}, "
            f"alpha {alpha:+.2f}% vs benchmark."
        )

    def _cv_to_score(
            self, cv: Optional[float], full: float, pass_cv: float, decay: float
    ) -> float:
        if cv is None:
            return 0.0
        if cv <= full:
            return 100.0
        if cv <= pass_cv:
            return 100.0 - ((cv - full) / (pass_cv - full)) * 40.0
        return max(0.0, 60.0 - (cv - pass_cv) * decay)