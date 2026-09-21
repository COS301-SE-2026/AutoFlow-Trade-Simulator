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