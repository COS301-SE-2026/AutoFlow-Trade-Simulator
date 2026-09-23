import math
import secrets
from datetime import datetime
from decimal import Decimal
from typing import List

from fastapi import HTTPException, WebSocket, status
from sqlalchemy import func
from sqlmodel import Session, select

from ...models.asset import Asset
from ...models.daily_OHLCV import DailyOHLCV
from ...models.puzzle_run import PuzzleRun
from ...models.strategies import Strategies
from ..market_data.generator import LCGPseudoRandomGenerator
from ..simulation.SimulationService import SimulationService
from ..multiplayer.PerturbationService import perturb_bars
from .PuzzleDTOs import PuzzleActionDTO, PuzzleBarDTO, PuzzleStartResponse, PuzzleSubmitResponse

PUZZLE_DAYS = 30
PUZZLE_INITIAL_BALANCE = Decimal("100000")


class PuzzleService:

    def __init__(self, session: Session):
        self.session = session

    def get_puzzle(self,asset:str,user_id:int,strat_id:int) -> PuzzleStartResponse:
        puzzle = self.generate_random_puzzle(asset,user_id,strat_id)
        bars = self.build_bars(puzzle)
        return PuzzleStartResponse(
            puzzle_id=puzzle.id,
            bars=[
                PuzzleBarDTO(
                    day_index=index,
                    open=float(bar.open),
                    high=float(bar.high),
                    low=float(bar.low),
                    close=float(bar.close),
                    volume=float(bar.volume),
                )
                for index, bar in enumerate(bars)
            ],
        )

    def build_bars(self, puzzle: PuzzleRun) -> List[DailyOHLCV]:
        base_bars = SimulationService(self.session).load_bars(puzzle.symbol, puzzle.start_date, puzzle.end_date)
        return perturb_bars(base_bars, LCGPseudoRandomGenerator(seed=puzzle.seed))

    def submit_puzzle(self, puzzle_id:int, user_id:int, actions:List[PuzzleActionDTO]) -> PuzzleSubmitResponse:
        puzzle = self.session.exec(select(PuzzleRun).where(PuzzleRun.id == puzzle_id).with_for_update()).first()
        if puzzle is None or puzzle.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Puzzle not found")
        if puzzle.completed_at is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Puzzle already submitted")

        bars = self.build_bars(puzzle)
        cash = puzzle.initial_balance
        held = Decimal("0")
        previous_day = 0

        for position, action in enumerate(actions):
            if action.day_index < 0 or action.day_index >= len(bars):
                raise self.invalid_action(position, f"day {action.day_index} is outside the puzzle")
            if not math.isfinite(action.qty) or action.qty <= 0:
                raise self.invalid_action(position, "quantity must be a positive number")
            if action.day_index < previous_day:
                raise self.invalid_action(position, "actions must be in day order")
            previous_day = action.day_index

            price = bars[action.day_index].close
            qty = Decimal(str(action.qty))
            if action.action == "buy":
                cost = qty * price
                if cost > cash:
                    raise self.invalid_action(position, "insufficient cash")
                cash -= cost
                held += qty
            else:
                if qty > held:
                    raise self.invalid_action(position, "insufficient holdings to sell")
                cash += qty * price
                held -= qty

        final_balance = (cash + held * bars[-1].close).quantize(Decimal("0.0001"))

        puzzle.actions = [action.model_dump(mode="json") for action in actions]
        puzzle.final_balance = final_balance
        puzzle.completed_at = datetime.utcnow()
        self.session.add(puzzle)
        self.session.commit()
        self.session.refresh(puzzle)

        return PuzzleSubmitResponse(
            puzzle_id=puzzle.id,
            initial_balance=float(puzzle.initial_balance),
            final_balance=float(final_balance),
            return_pct=float(((final_balance / puzzle.initial_balance) - 1) * 100),
            trades_count=len(actions),
            rubric_score=puzzle.rubric_score,
        )

    def invalid_action(self, position:int, reason:str) -> HTTPException:
        return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Action {position}: {reason}")

    def generate_random_puzzle(self,asset:str,user_id:int,strat_id:int) -> PuzzleRun:
        if self.session.get(Strategies, strat_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")

        asset_id = self.session.exec(select(Asset.asset_id).where(Asset.symbol == asset)).first()
        if asset_id is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

        #select a random available period in the ohlcvdata
        total_days = self.session.exec(
            select(func.count()).select_from(DailyOHLCV).where(DailyOHLCV.asset_id == asset_id)
        ).one()
        if total_days < PUZZLE_DAYS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Not enough price history for {asset} to build a {PUZZLE_DAYS} day puzzle",
            )

        offset = secrets.randbelow(total_days - PUZZLE_DAYS + 1)
        window = self.session.exec(
            select(DailyOHLCV.timestamp)
            .where(DailyOHLCV.asset_id == asset_id)
            .order_by(DailyOHLCV.timestamp)
            .offset(offset)
            .limit(PUZZLE_DAYS)
        ).all()

        # save the puzzle data to the database with the users id and its associated strat
        puzzle = PuzzleRun(
            user_id=user_id,
            strategy_id=strat_id,
            symbol=asset,
            start_date=window[0].date(),
            end_date=window[-1].date(),
            seed=secrets.randbits(31),
            initial_balance=PUZZLE_INITIAL_BALANCE,
        )
        self.session.add(puzzle)
        self.session.commit()
        self.session.refresh(puzzle)

        #return the row
        return puzzle
