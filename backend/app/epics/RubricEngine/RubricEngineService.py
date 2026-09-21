from typing import Dict
from sqlmodel import Session, select
from fastapi import HTTPException, status
from .RubricEngineDTO import EpicStatusDTO, EvaluationResultDTO, ExecutionMetricDTO, EvaluateMatchRequestDTO
from .base_strategy import BaseRubricStrategy
from .mean_reversion_strategy import MeanReversionStrategy

import math
from datetime import datetime
from typing import Dict, List, Optional
from ...models.dailyOHLCV import DailyOHLCV
from ...models.multiplayer_match import MatchEventLog, MultiplayerMatch
from ...models.asset import Asset
from .RubricEngineDTO import EpicStatusDTO, EvaluationResultDTO, ExecutionMetricDTO

class RubricEngineService:

    def __init__(self, session: Session):
        self.session = session
        self._strategies: Dict[str, BaseRubricStrategy] = {
            "mean_reversion": MeanReversionStrategy()
        }

    def map_metrics_from_match_log(self, match_id: int, user_id: int) -> ExecutionMetricDTO:

        match = self.session.get(MultiplayerMatch, match_id)
        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Match {match_id} not found")

        events = list (
            self.session.exec(
                select(MatchEventLog)
                .where(MatchEventLog.match_id == match_id)
                .where(MatchEventLog.user_id == user_id)
                .order_by(MatchEventLog.seq)
            ).all()
        )

        trade_events = [e for e in events if e.event_type in ("buy", "sell")]
        total_trades = len(trade_events)

        cash = match.initial_balance
        position_qty = Decimal("0")

        buy_queue: List[Dict] = []
        trade_profits: List[Decimal] = []
        holding_times_sec: List[float] = []

        for e in events:
            if e.event_type not in ("buy", "sell"):
                continue

            payload = e.payload or {}
            qty = Decimal(str(payload.get("qty", 0)))
            price = Decimal(str(payload.get("price", 0)))
            event_time = e.created_at or datetime.utcnow()

            if qty <= 0 or price <= 0:
                continue

            if e.event_time == "buy":
                cash -= qty * price
                position_qty += qty
                buy_queue.append({"qty": qty, "price": price, "timestamp": event_time})

            elif e.event_type = "sell":
                cash += qty * price
                position_qty -= qty

                qty_to_match = qty
                while qty_to_match > 0 and buy_queue:
                    earliest_buy = buy_queue[0]
                    matched_qty = min(qty_to_match, earliest_buy["qty"])

                    profit = matched_qty * (price - earliest_buy["price"])
                    trade_profits.append(profit)

                    duration = (event_time - earliest_buy["timestamp"]).total_seconds()
                    holding_times_sec.append(max(0.0, duration))

                    earliest_buy["qty"] -= matched_qty
                    qty_to_match -= matched_qty

                    if earliest_buy["qty"] -= matched_qty
                    qty_to_match -= matched_qty

                    if earliest_buy["buy"] <= 0:
                        buy_queue.pop(0)

            winning_trades = sum(1 for p in trade_profits if p > 0)
            closed_trades_count = len(trade_profits)
            win_rate = (winning_trades / closed_trades_count) if closed_trades_count > 0 else 0.0
            avg_holding_sec = (sum(holding_times_sec) / len(holding_times_sec)) if holding_times_sec else 0.0

            asset_id = self.session.exec(select(Asset.asset_id).where(Asset.symbol == match.symbol)).first()
            bars: List[DailyOHLCV] = []
            if asset_id:
                bars = list (
                    self.session.exec(
                        select(DailyOHLCV)
                        .where(DailyOHLCV.asset_id == asset_id)
                        .where(DailyOHLCV.timestamp >= match.start_date)
                        .where(DailyOHLCV.timestamp <= match.end_date)
                        .order_by(DailyOHLCV.timestamp)
                    )
                )
            
            nav_series: List[Decimal] = []
            daily_returns: List[float] = []

            curr_cash = match.initial_balance
            curr_qty = Decimal("0")

            events_by_day: Dict[int, List[MatchEventLog]] = {}
            for e in events:
                events_by_day.setdefault(e.day_index, []).append(e)

            for day_idx, bar in enumerate(bars):
                if day_idx in events_by_day:
                    for e in events_by_day[day_idx]:
                        payload = e.payload or {}
                        q = Decimal(str(payload.get("qty", 0)))
                        p = Decimal(str(payload.get("price", 0)))
                        if e.event_type == "buy"
                            curr_cash -= q * p
                            curr_qty += q
                        elif e.event_type == "sell":
                            curr_cash += q * p
                            curr_qty -= q
                
                nav = curr_cash + (curr_qty * bar.close)
                nav_series.append(nav)

                if len(nav_series) > 1 and nav_series[-2] > 0:
                    prev_nav = nav_series[-2]
                    ret = float((nav - prev_nav) / prev_nav)
                    daily_returns.append(ret)

            
            final_nav = nav_series[-1] if nav_series else match.initial_balance
            total_return_pct = float(((final_nav - match.initial_balance) / match.initial_balance) * 100)

            max_dd_pct = 0.0
            if nav_series:
                peak = nav_series[0]
                for val in nav_series:
                    if val > peak:
                        peak = val
                    dd = float((peak - val) / peak * 100) if peak > 0 else 0.0
                    if dd > max_dd_pct:
                        max_dd_pct = dd

            sharpe_ratio = 0.0
            if daily_returns:
                avg_ret = sum(daily_returns) / len(daily_returns)
                varience = sum((r - avg_ret) ** 2 for r in daily_returns / len(daily_returns))
                std_dev = math.sqrt(varience)
                if std_dev > 0:
                    sharpe_ratio = (avg_ret / std_dev) * math.sqrt(252)

            benchmark_return_pct = 0.0
            if len(bars) >= 2:
                p_start = bars[0].close
                p_end = bars[-1].close
                if p_start > 0:
                    benchmark_return_pct = float(((p_end - p_start) / p_start) * 100)

            return ExecutionMetricDTO(
                total_return_pct=total_return_pct,
                max_drawdown_pct=max_dd_pct,
                sharpe_ratio=sharpe_ratio,
                total_trades=total_trades,
                win_rate=win_rate,
                avg_holding_period_sec=avg_holding_period_sec,
                benchmark_return_pct=benchmark_return_pct
            )

    
    def evaluate_match_for_user(self, strat_key: str, match_id: int, user_id: int) -> EvaluationResultDTO:
        metrics = self.map_metrics_from_match_log(match_id=match_id, user_id=user_id)
        return self.evaluate_strategy(strat_key=strat_key, metrics=metrics)


    def get_status(self) -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="Rubric Engine", status="Service Operational"
        )
    
    def evaluate_strategy(self, strat_key: str, metrics: ExecutionMetricDTO) -> EvaluationResultDTO:
        strategy = self._strategies.get(strat_key)
        if not strategy:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Strategy '{strat_key}' is not supported")

        result = strategy.evaluate(metrics)

        return result