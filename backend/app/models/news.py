from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel

class NewsCategory(Enum):
    RUMOR='Rumor'
    SENS= 'Sens'
    ARTICLE='Article'
    RULING='Ruling'


class News(SQLModel,table=True):
    id:Optional[int] = Field(default=None,primary_key=True)
    timestamp:datetime=Field()
    category:NewsCategory=Field(nullable=False)
    source:str = Field(nullable=False)
    author:str =Field(nullable=False)
    full_story:str =Field(nullable=False)

