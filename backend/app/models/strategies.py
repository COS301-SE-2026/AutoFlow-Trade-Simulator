from datetime import datetime
from sqlmodel import Field, SQLModel
from typing import Optional

class Strategies(SQLModel, table=True):
    strat_id:Optional[int]=Field(default=None, primary_key=True)
    name:str=Field(nullable=False, max_length=50)
    description_md:str=Field(nullable=False, description="Paragraph and bullet points using standard Markdown formatting")
