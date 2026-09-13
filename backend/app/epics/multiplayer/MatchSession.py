import asyncio
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Callable, Dict, List, Optional

from fastapi import WebSocket
from sqlmodel import Session

from ...models.daily_OHLCV import DailyOHLCV
from ...models.multiplayer_match import ActionLogEntry, MatchStatus, MultiplayerMatch, MultiplayerParticipant, QTEQuestion
from ..simulation.SimulationService import SimulationService
from .MultiplayerDTOs import BarDTO, DayMessage, MatchFoundMessage
from .PerturbationService import derive_seed, perturb_bars

TICK_SECONDS: float = 2.0
QTE_TIMEOUT_SECONDS: float = 10.0
QTE_PROBABILITY: float = 0.175


@dataclass
class PendingAction:
    type: str
    qty: float
    price: Decimal


class PlayerState:
    def __init__(self, user_id: int, socket: WebSocket) -> None:
        self.user_id = user_id
        self.socket = socket
        self.cash: Decimal = Decimal("0")
        self.qty: Decimal = Decimal("0")
        self.seed: int = 0
        self.bars: List[DailyOHLCV] = []
        self.action_log: List[ActionLogEntry] = []
        self.connected: bool = True
        self.pending_action: Optional[PendingAction] = None
        self.pending_qte_answer: Optional[str] = None


class MatchSession:
    def __init__(
        self,
        scenario_id: int,
        symbol: str,
        start: date,
        end: date,
        initial_balance: Decimal,
        players: List[PlayerState],
        session_factory: Callable[[], Session],
    ) -> None:
        self.match_id: Optional[int] = None  # assigned once prepare() persists the MultiplayerMatch row
        self.scenario_id = scenario_id
        self.symbol = symbol
        self.start = start
        self.end = end
        self.initial_balance = initial_balance
        self.session_factory = session_factory

        self.players: Dict[int, PlayerState] = {p.user_id: p for p in players}

        self.day_index: int = 0
        self.total_days: int = 0  # set in prepare(), once the bar range is loaded
        self.status: MatchStatus = MatchStatus.in_progress

        self.lock = asyncio.Lock()
        self.task: Optional[asyncio.Task] = None

        self._current_qte: Optional[QTEQuestion] = None
        self._qte_event = asyncio.Event()
        self._actions_event = asyncio.Event()

    async def prepare(self) -> None:
        players = list(self.players.values())
        player_one, player_two = players[0], players[1]

        with self.session_factory() as db:
            sim_service = SimulationService(db)
            base_bars = sim_service.load_bars(self.symbol, self.start, self.end)

            match = MultiplayerMatch(
                scenario_id=self.scenario_id,
                symbol=self.symbol,
                start_date=self.start,
                end_date=self.end,
                initial_balance=self.initial_balance,
                player_one_id=player_one.user_id,
                player_two_id=player_two.user_id,
            )
            db.add(match)
            db.commit()
            db.refresh(match)
            assert match.id is not None
            self.match_id = match.id

            seed = derive_seed(self.match_id, player_one.user_id, player_two.user_id)
            perturbed_bars = perturb_bars(base_bars, seed)
            self.total_days = len(perturbed_bars)

            for player in players:
                player.seed = seed
                player.bars = perturbed_bars
                player.cash = self.initial_balance

                participant = MultiplayerParticipant(
                    match_id=self.match_id,
                    user_id=player.user_id,
                    perturbation_seed=seed,
                    cash_balance=self.initial_balance,
                )
                db.add(participant)
            db.commit()

        for player in players:
            opponent = player_two if player is player_one else player_one
            message = MatchFoundMessage(
                match_id=self.match_id,
                symbol=self.symbol,
                start_date=self.start,
                end_date=self.end,
                initial_balance=float(self.initial_balance),
                opponent_user_id=opponent.user_id,
                total_days=self.total_days,
            )
            await player.socket.send_text(message.model_dump_json())

    async def submit_action(
        self,
        user_id: int,
        day_index: int,
        action: str,
        qty: Optional[float],
        qte_answer: Optional[str],
    ) -> Optional[str]:
        async with self.lock:
            if day_index != self.day_index:
                return f"day_index {day_index} is stale; current day is {self.day_index}"

            player = self.players.get(user_id)
            if player is None:
                return "unknown player"

            error: Optional[str] = None

            if action in ("buy", "sell", "hold"):
                if player.pending_action is not None:
                    error = "action already submitted for this day"
                else:
                    bar = player.bars[self.day_index]
                    error = self._apply_trade(player, bar, action, qty)
                    if error is None:
                        player.pending_action = PendingAction(type=action, qty=qty or 0.0, price=bar.close)
                        if all(p.pending_action is not None for p in self.players.values()):
                            self._actions_event.set()

            if self._current_qte is not None and qte_answer is not None and player.pending_qte_answer is None:
                player.pending_qte_answer = qte_answer
                if all(p.pending_qte_answer is not None for p in self.players.values()):
                    self._qte_event.set()

            return error

    def _apply_trade(self, player: PlayerState, bar: DailyOHLCV, action: str, qty: Optional[float]) -> Optional[str]:
        if action == "hold":
            return None

        if qty is None or qty <= 0:
            return "qty must be positive for buy/sell"

        price = bar.close
        qty_dec = Decimal(str(qty))

        if action == "buy":
            cost = qty_dec * price
            if cost > player.cash:
                return "insufficient cash for buy"
            player.cash -= cost
            player.qty += qty_dec
            return None

        if action == "sell":
            if qty_dec > player.qty:
                return "insufficient holdings to sell"
            player.cash += qty_dec * price
            player.qty -= qty_dec
            return None

        return f"unknown action type: {action}"

    async def _run(self) -> None:
        while self.day_index < self.total_days:
            for player in self.players.values():
                player.pending_action = None
                player.pending_qte_answer = None
            self._actions_event.clear()
            self._qte_event.clear()
            self._current_qte = None  # QTE selection is added in a later step

            bar = next(iter(self.players.values())).bars[self.day_index]
            current_date = bar.timestamp.date()

            for player in self.players.values():
                await self._send_day(player, bar, current_date)

            if self._current_qte is not None:
                await self._collect_qte(timeout=QTE_TIMEOUT_SECONDS)
            else:
                await self._collect_actions(timeout=TICK_SECONDS)

            for player in self.players.values():
                if player.pending_action is None:
                    player.pending_action = PendingAction(type="hold", qty=0.0, price=bar.close)

            self.day_index += 1

        await self._finalize()

    async def _collect_actions(self, timeout: float) -> None:
        try:
            await asyncio.wait_for(self._actions_event.wait(), timeout=timeout)
        except asyncio.TimeoutError:
            pass

    async def _collect_qte(self, timeout: float) -> None:
        try:
            await asyncio.wait_for(self._qte_event.wait(), timeout=timeout)
        except asyncio.TimeoutError:
            pass

    async def _send_day(self, player: PlayerState, bar: DailyOHLCV, current_date: date) -> None:
        message = DayMessage(
            day_index=self.day_index,
            date=current_date,
            bar=BarDTO(
                open=float(bar.open),
                high=float(bar.high),
                low=float(bar.low),
                close=float(bar.close),
                volume=float(bar.volume),
            ),
            cash_balance=float(player.cash),
            position_qty=float(player.qty),
            qte=None,
        )
        await player.socket.send_text(message.model_dump_json())

    async def _finalize(self) -> None:
        pass  

    def start(self) -> None:
        self.task = asyncio.create_task(self._run())
