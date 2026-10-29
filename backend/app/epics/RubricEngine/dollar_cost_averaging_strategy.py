from typing import Optional

from .base_strategy import BaseRubricStrategy
from .RubricEngineDTO import CategoryScoreDTO, EvaluationResultDTO, ExecutionMetricDTO

MIN_BUYS_REQUIRED = 4

class DollarCostAveragingStrategy(BaseRubricStrategy):

    def evaluate(self, metrics: ExecutionMetricDTO) -> EvaluationResultDTO:

        # Schedule consistency: buy on a regular interval across the whole window
        interval_score = self._cv_to_score(metrics.buy_interval_cv, full_marks_cv=0.15, pass_cv=0.50, decay=60.0)
        coverage_score = min(100.0, (metrics.schedule_coverage_pct / 75.0) * 100.0)
        schedule_score = (interval_score * 0.70) + (coverage_score * 0.30)

        if metrics.buy_count == 0:
            schedule_fb = "No purchases made. DCA means buying on a recurring interval."
        elif metrics.buy_interval_cv is None:
            schedule_fb = ("All purchases landed on the same day. DCA means buying "
                           "across the window, not in a burst.")
        elif interval_score >= 100.0:
            schedule_fb = f"Clockwork schedule! Your buys were evenly spaced and covered {round(metrics.schedule_coverage_pct, 1)}% of the window."
        elif interval_score >= 60.0:
            schedule_fb = f"Mostly regular buys, but the gaps between them varied. Stick to a fixed interval (covered {round(metrics.schedule_coverage_pct, 1)}% of the window)."
        else:
            schedule_fb = f"Irregular buying pattern (covered {round(metrics.schedule_coverage_pct, 1)}% of the window). Buying in bursts is market timing, not DCA."

        # Amount consistency: invest the same cash amount every period
        amount_score = self._cv_to_score(metrics.buy_amount_cv, full_marks_cv=0.10, pass_cv=0.35, decay=80.0)

        if metrics.buy_amount_cv is None:
            amount_fb = "Not enough purchases to measure amount consistency. Pick a fixed amount and invest it every period."
        elif amount_score >= 100.0:
            amount_fb = "Excellent! You invested a near-identical amount each period, letting the share count adjust to price."
        elif amount_score >= 60.0:
            amount_fb = "Your investment amount drifted between periods. Keep the rand amount fixed and let the share count vary."
        else:
            amount_fb = "Investment amounts varied widely. DCA relies on a fixed amount per period, not sizing up on hunches."

        # Accumulation discipline: keep buying, don't sell, actually put capital to work
        total_orders = metrics.buy_count + metrics.sell_count
        sell_ratio = (metrics.sell_count / total_orders) if total_orders > 0 else 0.0
        sell_score = max(0.0, 100.0 - sell_ratio * 150.0)
        deploy_score = min(100.0, (metrics.capital_deployed_pct / 50.0) * 100.0)
        discipline_score = (sell_score * 0.60) + (deploy_score * 0.40)

        if total_orders == 0:
            discipline_score = 0.0
            discipline_fb = "No trades placed. DCA requires making purchases on a schedule."
        else:
            if metrics.sell_count == 0:
                discipline_fb = f"Disciplined accumulation with no panic selling. Deployed {round(metrics.capital_deployed_pct, 1)}% of your capital."
            else:
                discipline_fb = f"You sold {metrics.sell_count} time(s). DCA is an accumulation strategy, so hold through volatility. Deployed {round(metrics.capital_deployed_pct, 1)}% of your capital."
            if metrics.capital_deployed_pct < 50.0:
                discipline_fb += " Too much cash left idle, so commit more capital to your schedule."

        # Cost basis efficiency: fixed amounts buy more shares when cheap, so cost basis should sit at or below the average price
        diff = metrics.avg_cost_vs_mean_price_pct
        if diff is None:
            cost_score = 0.0
            cost_fb = "No purchases made, so there is no cost basis to evaluate."
        elif diff <= 0.0:
            cost_score = 100.0
            cost_fb = f"Your average cost was {round(abs(diff), 2)}% below the average price. This is the DCA advantage in action."
        elif diff <= 3.0:
            cost_score = 100.0 - (diff / 3.0) * 50.0
            cost_fb = f"Your average cost was {round(diff, 2)}% above the average price. Fixed amounts naturally buy more shares when prices dip."
        else:
            cost_score = max(0.0, 50.0 - (diff - 3.0) * 10.0)
            cost_fb = f"Your average cost was {round(diff, 2)}% above the average price. Buying more after rallies is chasing the market."

        final_score = round (
            (schedule_score * 0.30) + (amount_score * 0.25) + (discipline_score * 0.20) + (cost_score * 0.25), 2
        )

        # A single lump-sum buy is not DCA, so require a minimum number of periodic buys
        if metrics.buy_count < MIN_BUYS_REQUIRED:
            acc_score = final_score
            final_score = min(final_score, 45.0)
            schedule_fb += f" [SCORE CAPPED]: Minimum of {MIN_BUYS_REQUIRED} buys is required (made {metrics.buy_count}). Raw score was {acc_score}."
        # Buying several times on one day is a lump sum split into pieces, not DCA
        elif metrics.buy_interval_cv is None:
            acc_score = final_score
            final_score = min(final_score, 45.0)
            schedule_fb += f" [SCORE CAPPED]: Buys must be spread over at least 2 different days. Raw score was {acc_score}."

        grade = self._compute_grade(final_score)
        passed = final_score >= 60.0

        return EvaluationResultDTO(
            passed=passed,
            final_score=final_score,
            grade=grade,
            detail_breakdown={
                "schedule_consistency": CategoryScoreDTO(
                    score=round(schedule_score, 2), weight=0.30, feedback=schedule_fb
                ),
                "amount_consistency": CategoryScoreDTO(
                    score=round(amount_score, 2), weight=0.25, feedback=amount_fb
                ),
                "accumulation_discipline": CategoryScoreDTO(
                    score=round(discipline_score, 2), weight=0.20, feedback=discipline_fb
                ),
                "cost_basis_efficiency": CategoryScoreDTO(
                    score=round(cost_score, 2), weight=0.25, feedback=cost_fb
                )
            }
        )

    def _cv_to_score(self, cv: Optional[float], full_marks_cv: float, pass_cv: float, decay: float) -> float:
        # Lower coefficient of variation = more consistent. Full marks up to full_marks_cv,
        # linear down to 60 at pass_cv, then decays by `decay` points per unit of cv.
        if cv is None:
            return 0.0
        if cv <= full_marks_cv:
            return 100.0
        if cv <= pass_cv:
            return 100.0 - ((cv - full_marks_cv) / (pass_cv - full_marks_cv)) * 40.0
        return max(0.0, 60.0 - (cv - pass_cv) * decay)
