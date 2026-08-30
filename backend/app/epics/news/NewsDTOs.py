from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel

from ...models.news import NewsCategory


class EpicStatusDTO(SQLModel):
    epic: str
    status: str

class NewsItem(SQLModel):
    id:int
    timestamp:datetime
    category:NewsCategory
    description:str
    source:Optional[str]
    author:Optional[str]
    full_story:str

class NewsRepsonse(SQLModel):
    news_items: list[NewsItem]

class NewsRequest(SQLModel):
    start_date:datetime
    end_date:datetime
    ticker:str
