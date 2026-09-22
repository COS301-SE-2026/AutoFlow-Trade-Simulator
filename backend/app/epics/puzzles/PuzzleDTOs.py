from typing import List, Literal, Optional

from sqlmodel import Field, SQLModel


class TutorialCompleteRequest(SQLModel):
    tutorial_id:int


class PuzzleStartRequest(SQLModel):
    strategy_id:int
    asset:str


class PuzzleBarDTO(SQLModel):
    day_index:int
    open:float
    high:float
    low:float
    close:float
    volume:float


class PuzzleStartResponse(SQLModel):
    puzzle_id:int
    bars:List[PuzzleBarDTO]


MAX_PUZZLE_ACTIONS = 100


class PuzzleActionDTO(SQLModel):
    day_index:int = Field(ge=0)
    action:Literal["buy","sell"]
    qty:float = Field(gt=0)


class PuzzleSubmitRequest(SQLModel):
    actions:List[PuzzleActionDTO] = Field(min_length=1, max_length=MAX_PUZZLE_ACTIONS)


class PuzzleSubmitResponse(SQLModel):
    puzzle_id:int
    initial_balance:float
    final_balance:float
    return_pct:float
    trades_count:int
    rubric_score:Optional[int] = None
