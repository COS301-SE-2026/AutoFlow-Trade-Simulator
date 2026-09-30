import math
from decimal import Decimal
from datetime import datetime, time

from sqlmodel import Session, select
from fastapi import HTTPException, status
from .RubricEngineDTO import EpicStatusDTO, EvaluationResultDTO, ExecutionMetricDTO, Grade
from .base_strategy import BaseRubricStrategy
from .mean_reversion_strategy import MeanReversionStrategy

from typing import Dict, List, Tuple
from ...models.daily_OHLCV import DailyOHLCV
from ...models.asset import Asset
from ...models.multiplayer_match import MatchEventLog, MultiplayerMatch, MultiplayerParticipant
from ...epics.puzzles.PuzzleDTOs import PuzzleActionDTO
from ...models.puzzle_run import PuzzleRun
from ...epics.rewards.RewardService import award_match_progression

GRADE_TO_RUBRIC_SCORE: Dict[Grade, int] = {
    Grade.S: 10,
    Grade.A: 8,
    Grade.B: 6,
    Grade.C: 4,
    Grade.D: 2,
    Grade.E: 1,
    Grade.F: 0
}

class RubricEngineService:
    strategies: Dict[str, BaseRubricStrategy] = {
        "mean_reversion": MeanReversionStrategy()
    }

    def __init__(self, session: Session):
        self.session = session

    def map_metrics_from_match_log(self, match_id: int, user_id: int) -> ExecutionMetricDTO:
        match = self._get_match_or_404(match_id)
        self._validate_participant(match_id, user_id)

        events = self._get_match_event_logs(match_id, user_id)
        trade_events = [e for e in events if e.event_type in ("buy", "sell")]

        win_rate, avg_holding_sec = self._process_fifo_trades(trade_events)

        bars = self._get_match_bars(match.symbol, match.start_date, match.end_date)

        nav_series, daily_returns = self._build_nav_series_and_returns(match.initial_balance, events, bars)

        total_return_pct = self._calculate_total_return(match.initial_balance, nav_series)
        max_dd_pct = self._calculate_max_drawdown(nav_series)
        sharpe_ratio = self._calculate_sharpe_ratio(daily_returns)
        benchmark_return_pct = self._calculate_benchmark_return(bars)

        return ExecutionMetricDTO(
            total_return_pct = total_return_pct,
            max_drawdown_pct = max_dd_pct,
            sharpe_ratio = sharpe_ratio,
            total_trades = len(trade_events),
            win_rate = win_rate,
            avg_holding_period_sec=avg_holding_sec,
            benchmark_return_pct=benchmark_return_pct
        )

    def map_metrics_from_puzzle_run(self, puzzle_id: int, user_id: int) -> ExecutionMetricDTO:
        puzzle = self._get_puzzle_or_404(puzzle_id, user_id)

        bars = self._get_match_bars(puzzle.symbol, puzzle.start_date, puzzle.end_date)
        actions_raw = puzzle.actions or []
        actions = [PuzzleActionDTO(**act) for act in actions_raw]

        synthetic_events = self._puzzle_actions_to_event_logs(actions, bars)
        trade_events = [e for e in synthetic_events if e.event_type in ("buy", "sell")]

        win_rate, avg_holding_sec = self._process_fifo_trades(trade_events)

        init_bal = puzzle.initial_balance
        nav_series, daily_returns = self._build_nav_series_and_returns(init_bal, synthetic_events, bars)

        fin_bal = puzzle.final_balance  or init_bal
        total_return_pct = self._calculate_total_return(init_bal, nav_series) if nav_series else float(((fin_bal - init_bal) / init_bal) * 100)
        max_dd_pct = self._calculate_max_drawdown(nav_series)
        sharpe_ratio = self._calculate_sharpe_ratio(daily_returns)
        benchmark_return_pct = self._calculate_benchmark_return(bars)

        return ExecutionMetricDTO(
            total_return_pct=total_return_pct,
            max_drawdown_pct=max_dd_pct,
            sharpe_ratio=sharpe_ratio,
            total_trades=len(trade_events),
            win_rate=win_rate,
            avg_holding_period_sec=avg_holding_sec,
            benchmark_return_pct=benchmark_return_pct,
        )

    def evaluate_puzzle_for_user(self, strat_key: str, puzzle_id: int, user_id: int) -> EvaluationResultDTO:
        metrics = self.map_metrics_from_puzzle_run(puzzle_id=puzzle_id, user_id=user_id)
        result = self.evaluate_strategy(strat_key=strat_key, metrics=metrics)

        puzzle = self._get_puzzle_or_404(puzzle_id, user_id)
        puzzle.rubric_score = int(round(result.final_score))
        self.session.add(puzzle)
        self.session.commit()
        self.session.refresh(puzzle)

        return result

    def _get_match_or_404(self, match_id: int) -> MultiplayerMatch:
        match = self.session.exec(
            select(MultiplayerMatch).where(
                (MultiplayerMatch.id == match_id)
                if hasattr(MultiplayerMatch, "id")
                else (MultiplayerMatch.match_id == match_id)
            )
        ).first()

        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found"
            )
        return match

    def _get_puzzle_or_404(self, puzzle_id: int, user_id: int) -> PuzzleRun:
        puzzle = self.session.exec(
            select(PuzzleRun).where(PuzzleRun.id == puzzle_id)
        ).first()

        if not puzzle or puzzle.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Puzzle not found"
            )
        return puzzle

    def _validate_participant(self, match_id: int, user_id: int) -> None:
        participant = self.session.exec(
            select(MultiplayerParticipant)
            .where(MultiplayerParticipant.match_id == match_id)
            .where(MultiplayerParticipant.user_id == user_id)
        ).first()

        if not participant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You were not a valid participant in the match"
            )
        
    def _get_match_event_logs(self, match_id: int, user_id: int) -> List[MatchEventLog]:
        return list(
            self.session.exec(
                select(MatchEventLog)
                .where(MatchEventLog.match_id == match_id)
                .where(MatchEventLog.user_id == user_id)
                .order_by(MatchEventLog.seq)
            ).all()
        )

    def _get_match_bars(self, symbol: str, start_date, end_date) -> List[DailyOHLCV]:
        asset_id = self.session.exec(
            select(Asset.asset_id).where(Asset.symbol == symbol)
        ).first()

        if not asset_id:
            return []

        start_dt = (
            datetime.combine(start_date, time.min)
            if isinstance(start_date, type(datetime.now().date()))
            else start_date
        )
        end_dt = (
            datetime.combine(end_date, time.max)
            if isinstance(end_date, type(datetime.now().date()))
            else end_date
        )

        return list(
            self.session.exec(
                select(DailyOHLCV)
                .where(DailyOHLCV.asset_id == asset_id)
                .where(DailyOHLCV.timestamp >= start_dt)
                .where(DailyOHLCV.timestamp <= end_dt)
                .order_by(DailyOHLCV.timestamp)
            ).all()
        )

    def _puzzle_actions_to_event_logs(self, actions: List[PuzzleActionDTO], bars: List[DailyOHLCV]) -> List[MatchEventLog]:
        events = []
        for seq, act in enumerate(actions, start=1):
            price = bars[act.day_index].close if act.day_index < len(bars) else Decimal("0")
            events.append(
                MatchEventLog(
                    seq=seq,
                    day_index=act.day_index,
                    event_type=act.action,
                    payload={"qty": float(act.qty), "price": float(price)},
                    created_at=bars[act.day_index].timestamp if act.day_index < len(bars) else datetime.utcnow()
                )
            )
        return events

    def _process_fifo_trades(self, trade_events: List[MatchEventLog]) -> Tuple[float, float]:
        buy_queue: List[Dict] = []
        trade_profits: List[Decimal] = []
        holding_times_sec: List[float] = []

        for e in trade_events:
            payload = e.payload or {}
            q_val = payload.get("qty") if "qty" in payload else payload.get("quantity", 0)
            qty = Decimal(str(q_val))
            price = Decimal(str(payload.get("price", 0)))
            event_time = e.created_at or datetime.utcnow()

            if qty <= 0 or price <= 0:
                continue

            if e.event_type == "buy":
                buy_queue.append({"qty": qty, "price": price, "timestamp": event_time})

            elif e.event_type == "sell":
                qty_to_match = qty
                while qty_to_match > 0 and buy_queue:
                    earliest_buy = buy_queue[0]
                    match_qty = min(qty_to_match, earliest_buy["qty"])

                    profit = match_qty * (price - earliest_buy["price"])
                    trade_profits.append(profit)

                    duration = (event_time - earliest_buy["timestamp"]).total_seconds()
                    holding_times_sec.append(max(0.0, duration))

                    earliest_buy["qty"] -= match_qty
                    qty_to_match -= match_qty

                    if earliest_buy["qty"] <= 0:
                        buy_queue.pop(0)

        winning_trades = sum(1 for p in trade_profits if p > 0)
        closed_trades_count = len(trade_profits)

        win_rate = (winning_trades / closed_trades_count) if closed_trades_count > 0 else 0.0
        avg_holding_sec = (sum(holding_times_sec) / len(holding_times_sec)) if holding_times_sec else 0.0

        return win_rate, avg_holding_sec

    def _build_nav_series_and_returns(self, initial_balance: Decimal, events: List[MatchEventLog], bars: List[DailyOHLCV]) -> Tuple[List[Decimal], List[float]]:
        nav_series: List[Decimal] = []
        daily_returns: List[float] = []

        curr_cash = initial_balance
        curr_qty = Decimal("0")

        events_by_day: Dict[int, List[MatchEventLog]] = {}
        for e in events:
            events_by_day.setdefault(e.day_index, []).append(e)

        for day_idx, bar in enumerate(bars):
            if day_idx in events_by_day:
                for e in events_by_day[day_idx]:
                    payload = e.payload or {}
                    q_val = payload.get("qty") if "qty" in payload else payload.get("quantity", 0)
                    q = Decimal(str(q_val))
                    p = Decimal(str(payload.get("price", 0)))

                    if e.event_type == "buy":
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

        return nav_series, daily_returns

    def _calculate_total_return(self, initial_balance: Decimal, nav_series: List[Decimal]) -> float:
        if not nav_series or initial_balance <= 0:
            return 0.0
        final_nav = nav_series[-1]
        return float(((final_nav - initial_balance) / initial_balance) * 100)

    def _calculate_max_drawdown(self, nav_series: List[Decimal]) -> float:
        if not nav_series:
            return 0.0
        max_dd_pct = 0.0
        peak = nav_series[0]

        for val in nav_series:
            if val > peak:
                peak = val
            dd = float((peak - val) / peak * 100) if peak > 0 else 0.0
            if dd > max_dd_pct:
                max_dd_pct = dd

        return max_dd_pct

    def _calculate_sharpe_ratio(self, daily_returns: List[float]) -> float:
        if not daily_returns:
            return 0.0

        avg_ret = sum(daily_returns) / len(daily_returns)
        variance = sum((r - avg_ret) ** 2 for r in daily_returns) / len(daily_returns)
        std_dev = math.sqrt(variance)

        if std_dev > 0:
            return (avg_ret / std_dev) * math.sqrt(252)
        return 0.0

    def _calculate_benchmark_return(self, bars: List[DailyOHLCV]) -> float:
        if len(bars) < 2:
            return 0.0
        p_start = bars[0].close
        p_end = bars[-1].close
        if p_start > 0:
            return float(((p_end - p_start) / p_start) * 100)
        return 0.0

    def evaluate_match_for_user(self, strat_key: str, match_id: int, user_id: int) -> EvaluationResultDTO:
        metrics = self.map_metrics_from_match_log(match_id=match_id, user_id=user_id)
        result = self.evaluate_strategy(strat_key=strat_key, metrics=metrics)

        match = self._get_match_or_404(match_id)

        participants = list (
            self.session.exec(
                select(MultiplayerParticipant).where(MultiplayerParticipant.match_id == match_id)
            ).all()
        )
        user_ids = [p.user_id for p in participants]

        actions_by_user = {}
        for uid in user_ids:
            event_count = len(self._get_match_event_logs(match_id, uid))
            actions_by_user[uid] = event_count

        award_match_progression(
            db=self.session,
            match_id=match_id,
            winner_user_id=match.winner_user_id,
            user_ids=user_ids,
            actions_by_user=actions_by_user
        )

        return result

    def get_status(self) -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="Rubric Engine", status="Service Operational"
        )
    
    def evaluate_strategy(self, strat_key: str, metrics: ExecutionMetricDTO) -> EvaluationResultDTO:
        strategy = self.strategies.get(strat_key)
        if not strategy:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Strategy '{strat_key}' is not supported")

        result = strategy.evaluate(metrics)

        return result