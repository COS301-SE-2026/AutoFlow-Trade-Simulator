from dataclasses import dataclass, field
from decimal import Decimal
from typing import List, Optional

from fastapi import WebSocket

from ...models.daily_OHLCV import DailyOHLCV
from ...models.multiplayer_match import ActionLogEntry

TICK_SECONDS: float = 2.0
QTE_TIMEOUT_SECONDS: float = 10.0
QTE_PROBABILITY: float = 0.175


@dataclass
class PendingAction:
    type: str
    qty: float
    price: Decimal


class PlayerState:
    def __init__(self, user_id: int, socket: WebSocket, cash: Decimal, seed: int, bars: List[DailyOHLCV]) -> None:
        self.user_id = user_id
        self.socket = socket
        self.cash = cash
        self.qty: Decimal = Decimal("0")
        self.seed = seed
        self.bars = bars
        self.action_log: List[ActionLogEntry] = []
        self.connected: bool = True
        self.pending_action: Optional[PendingAction] = None
        self.pending_qte_answer: Optional[str] = None
