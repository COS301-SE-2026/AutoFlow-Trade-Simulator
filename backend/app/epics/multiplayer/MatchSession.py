import asyncio
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from typing import Callable, Dict, List, Optional

from fastapi import WebSocket
from pydantic import ValidationError
from sqlmodel import Session, select

from ..market_data.generator import LCGPseudoRandomGenerator
from ...models.daily_OHLCV import DailyOHLCV
from ...models.multiplayer_match import MatchEventLog, MatchStatus, MultiplayerMatch, MultiplayerParticipant, QTEQuestion
from ..simulation.SimulationService import SimulationService
from .MultiplayerDTOs import (
    ActionAckMessage,
    ActionMessage,
    BarDTO,
    DayMessage,
    ErrorMessage,
    MatchEndMessage,
    MatchFoundMessage,
    QteOfferDTO,
    QtePlayerOutcome,
    QteResultMessage,
)
from .PerturbationService import derive_seed, perturb_bars

DISCONNECT_GRACE_SECONDS: float = 30.0

TICK_SECONDS: float = 2.0
QTE_TIMEOUT_SECONDS: float = 10.0
QTE_PROBABILITY: float = 0.175

PERTURBATION_VERSION: str = "v1"
DATA_SNAPSHOT_ID: str = "demo"


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
        self.start_date = start
        self.end_date = end
        self.initial_balance = initial_balance
        self.session_factory = session_factory

        self.players: Dict[int, PlayerState] = {p.user_id: p for p in players}

        self.day_index: int = 0
        self.total_days: int = 0  # set in prepare(), once the bar range is loaded
        self.status: MatchStatus = MatchStatus.in_progress

        self.lock = asyncio.Lock()
        self.task: Optional[asyncio.Task] = None

        self.current_qte: Optional[QTEQuestion] = None
        self.qte_event = asyncio.Event()
        self.actions_event = asyncio.Event()

        #also assigned after prepare()
        self.seed: Optional[int]=None
        self.rnd_gen: Optional[LCGPseudoRandomGenerator] = None
        self.next_seq: int = 1

    async def prepare(self) -> None:
        players = list(self.players.values())
        player_one, player_two = players[0], players[1]

        with self.session_factory() as db:
            sim_service = SimulationService(db)
            base_bars = sim_service.load_bars(self.symbol, self.start_date, self.end_date)

            self.seed = derive_seed("match", f"{self.match_id}:{player_one.user_id}:{player_two.user_id}")
            self.rnd_gen = LCGPseudoRandomGenerator(self.seed)
            match = MultiplayerMatch(
                scenario_id=self.scenario_id,
                symbol=self.symbol,
                start_date=self.start_date,
                end_date=self.end_date,
                initial_balance=self.initial_balance,
                player_one_id=player_one.user_id,
                player_two_id=player_two.user_id,
                perturbation_seed=self.seed,
                perturbation_version=PERTURBATION_VERSION,
                data_snapshot_id=DATA_SNAPSHOT_ID,
            )
            db.add(match)
            db.commit()
            db.refresh(match)
            assert match.id is not None
            self.match_id = match.id

            perturbed_bars = perturb_bars(base_bars, self.rnd_gen)
            self.total_days = len(perturbed_bars)

            for player in players:
                player.seed = self.seed
                player.bars = perturbed_bars
                player.cash = self.initial_balance

                participant = MultiplayerParticipant(
                    match_id=self.match_id,
                    user_id=player.user_id,
                    cash_balance=self.initial_balance,
                )
                db.add(participant)
            db.commit()

        for player in players:
            opponent = player_two if player is player_one else player_one
            message = MatchFoundMessage(
                match_id=self.match_id,
                symbol=self.symbol,
                start_date=self.start_date,
                end_date=self.end_date,
                initial_balance=float(self.initial_balance),
                opponent_user_id=opponent.user_id,
                total_days=self.total_days,
            )
            await player.socket.send_text(message.model_dump_json())

    def log_event(self, user_id: int, event_type: str, payload: Dict) -> None:
        with self.session_factory() as db:
            db.add(
                MatchEventLog(
                    match_id=self.match_id,
                    seq=self.next_seq,
                    user_id=user_id,
                    day_index=self.day_index,
                    event_type=event_type,
                    payload=payload,
                )
            )
            db.commit()
        self.next_seq += 1

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
                    error = self.apply_trade(player, bar, action, qty)
                    if error is None:
                        player.pending_action = PendingAction(type=action, qty=qty or 0.0, price=bar.close)
                        if action != "hold": # we don't need to remember that they did nothing
                            self.log_event(user_id, event_type=action, payload={"qty": qty or 0.0, "price": float(bar.close)})
                        if all(p.pending_action is not None for p in self.players.values()):
                            self.actions_event.set()

            if self.current_qte is not None and qte_answer is not None and player.pending_qte_answer is None:
                player.pending_qte_answer = qte_answer
                self.log_event(user_id, event_type="qte_attempt", payload={"question_id": self.current_qte.id, "answer": qte_answer})
                if all(p.pending_qte_answer is not None for p in self.players.values()):
                    self.qte_event.set()

            return error

    def apply_trade(self, player: PlayerState, bar: DailyOHLCV, action: str, qty: Optional[float]) -> Optional[str]:
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

    async def run(self) -> None:
        while self.day_index < self.total_days:
            if self.status != MatchStatus.in_progress:
                return  # match was forfeited mid-tick; finalize() must not run

            for player in self.players.values():
                player.pending_action = None
                player.pending_qte_answer = None
            self.actions_event.clear()
            self.qte_event.clear()
            self.current_qte = None
            if self.rnd_gen.generate_float() < QTE_PROBABILITY:
                self.current_qte = self.pick_qte_question()

            bar = next(iter(self.players.values())).bars[self.day_index]
            current_date = bar.timestamp.date()

            for player in self.players.values():
                await self.send_day(player, bar, current_date)

            if self.current_qte is not None:
                await self.collect_qte(timeout=QTE_TIMEOUT_SECONDS)
            else:
                await self.collect_actions(timeout=TICK_SECONDS)

            for player in self.players.values():
                if player.pending_action is None:
                    player.pending_action = PendingAction(type="hold", qty=0.0, price=bar.close)

            if self.current_qte is not None:
                outcomes = {
                    player.user_id: self.apply_qte_effect(player, self.current_qte)
                    for player in self.players.values()
                }
                for user_id, outcome in outcomes.items():
                    self.log_event(user_id, event_type="qte_result", payload={"question_id": self.current_qte.id, "answer": outcome.answer, "correct": outcome.correct, "cash_delta": outcome.cash_delta})
                await self.send_qte_result(self.current_qte, outcomes)

            self.day_index += 1

        if self.status == MatchStatus.in_progress:
            await self.finalize()

    async def collect_actions(self, timeout: float) -> None:
        try:
            await asyncio.wait_for(self.actions_event.wait(), timeout=timeout)
        except asyncio.TimeoutError:
            pass

    async def collect_qte(self, timeout: float) -> None:
        try:
            await asyncio.wait_for(self.qte_event.wait(), timeout=timeout)
        except asyncio.TimeoutError:
            pass

    async def send_day(self, player: PlayerState, bar: DailyOHLCV, current_date: date) -> None:
        qte_offer: Optional[QteOfferDTO] = None
        if self.current_qte is not None:
            qte_offer = QteOfferDTO(
                question_id=self.current_qte.id,
                question_type=self.current_qte.question_type.value,
                prompt=self.current_qte.prompt,
                options=self.current_qte.options,
                timeout_seconds=int(QTE_TIMEOUT_SECONDS),
            )

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
            qte=qte_offer,
        )
        await player.socket.send_text(message.model_dump_json())

    def pick_qte_question(self) -> Optional[QTEQuestion]:
        with self.session_factory() as db:
            questions = list(db.exec(select(QTEQuestion).where(QTEQuestion.active == True)).all())
        if not questions:
            return None
        return self.rnd_gen.choice(questions)

    def apply_qte_effect(self, player: PlayerState, question: QTEQuestion) -> QtePlayerOutcome:
        answer = player.pending_qte_answer
        if answer is None:
            return QtePlayerOutcome(answer=None, correct=False, cash_delta=0.0)

        correct = answer == question.correct_answer
        pct = question.correct_cash_delta_pct if correct else question.incorrect_cash_delta_pct
        delta = player.cash * pct
        player.cash += delta
        return QtePlayerOutcome(answer=answer, correct=correct, cash_delta=float(delta))

    async def send_qte_result(self, question: QTEQuestion, outcomes: Dict[int, QtePlayerOutcome]) -> None:
        message = QteResultMessage(
            day_index=self.day_index,
            question_id=question.id,
            correct_answer=question.correct_answer,
            per_player={str(user_id): outcome for user_id, outcome in outcomes.items()},
        )
        for player in self.players.values():
            await player.socket.send_text(message.model_dump_json())

    async def finalize(self) -> None:
        final_bar = next(iter(self.players.values())).bars[-1]

        for player in self.players.values():
            if player.qty > 0:
                self.apply_trade(player, final_bar, "sell", float(player.qty))
                self.log_event(player.user_id, event_type="sell", payload={"qty": float(player.qty), "price": float(final_bar.close), "reason": "final_liquidation"})

        balances: Dict[int, Decimal] = {p.user_id: p.cash for p in self.players.values()}
        winner_user_id: Optional[int] = None
        values = list(balances.values())
        if values[0] != values[1]:
            winner_user_id = max(balances, key=lambda uid: balances[uid])

        with self.session_factory() as db:
            match = db.get(MultiplayerMatch, self.match_id)
            match.status = MatchStatus.completed
            match.winner_user_id = winner_user_id
            match.ended_at = datetime.utcnow()
            match.current_day_index = self.day_index
            db.add(match)

            for player in self.players.values():
                participant = db.exec(
                    select(MultiplayerParticipant)
                    .where(MultiplayerParticipant.match_id == self.match_id)
                    .where(MultiplayerParticipant.user_id == player.user_id)
                ).one()
                participant.cash_balance = player.cash
                participant.position_qty = player.qty
                db.add(participant)

            db.commit()

        self.status = MatchStatus.completed

        message = MatchEndMessage(
            match_id=self.match_id,
            final_balances={str(user_id): float(cash) for user_id, cash in balances.items()},
            winner_user_id=winner_user_id,
            reason="completed",
        )
        for player in self.players.values():
            await player.socket.send_text(message.model_dump_json())

    def start(self) -> None:
        self.task = asyncio.create_task(self.run())

    async def handle_client_message(self, user_id: int, raw: str) -> None:
        player = self.players.get(user_id)
        if player is None:
            return

        try:
            action = ActionMessage.model_validate_json(raw)
        except ValidationError:
            await player.socket.send_text(ErrorMessage(detail="malformed action message").model_dump_json())
            return

        error = await self.submit_action(user_id, action.day_index, action.action, action.qty, action.qte_answer)
        ack = ActionAckMessage(
            day_index=action.day_index,
            cash_balance=float(player.cash),
            position_qty=float(player.qty),
            error=error,
        )
        await player.socket.send_text(ack.model_dump_json())

    async def handle_disconnect(self, user_id: int) -> None:
        player = self.players.get(user_id)
        if player is None:
            return

        player.connected = False

        with self.session_factory() as db:
            participant = db.exec(
                select(MultiplayerParticipant)
                .where(MultiplayerParticipant.match_id == self.match_id)
                .where(MultiplayerParticipant.user_id == user_id)
            ).one()
            participant.disconnected_at = datetime.utcnow()
            db.add(participant)
            db.commit()

        asyncio.create_task(self.disconnect_grace(user_id))

    async def disconnect_grace(self, user_id: int, seconds: float = DISCONNECT_GRACE_SECONDS) -> None:
        await asyncio.sleep(seconds)
        player = self.players.get(user_id)
        if player is None or player.connected:
            return  # reconnected within the grace period
        await self.forfeit(disconnected_user_id=user_id)

    async def forfeit(self, disconnected_user_id: int) -> None:
        if self.status != MatchStatus.in_progress:
            return  # match already completed or already forfeited

        winner_user_id = next(uid for uid in self.players if uid != disconnected_user_id)

        with self.session_factory() as db:
            match = db.get(MultiplayerMatch, self.match_id)
            match.status = MatchStatus.abandoned
            match.winner_user_id = winner_user_id
            match.ended_at = datetime.utcnow()
            db.add(match)
            db.commit()

        self.status = MatchStatus.abandoned

        message = MatchEndMessage(
            match_id=self.match_id,
            final_balances={str(uid): float(p.cash) for uid, p in self.players.items()},
            winner_user_id=winner_user_id,
            reason="opponent_disconnected",
        )
        winner = self.players[winner_user_id]
        if winner.connected:
            await winner.socket.send_text(message.model_dump_json())

    async def rebind_socket(self, user_id: int, socket: WebSocket) -> None:
        player = self.players.get(user_id)
        if player is None:
            raise ValueError(f"No player {user_id} in match {self.match_id}")

        player.socket = socket
        player.connected = True

        with self.session_factory() as db:
            participant = db.exec(
                select(MultiplayerParticipant)
                .where(MultiplayerParticipant.match_id == self.match_id)
                .where(MultiplayerParticipant.user_id == user_id)
            ).one()
            participant.disconnected_at = None
            db.add(participant)
            db.commit()