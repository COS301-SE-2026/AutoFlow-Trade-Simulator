from typing import Optional, Dict, Any
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import TypeDecorator
from sqlalchemy.engine import Dialect

class tech_node(TypeDecorator):

    impl = String

    def get_col_spec(self, **kw):
        return "TechNode"

    def process_bind_param(self, value, dialect: Dialect):
        if value is None:
            return None

        if isinstance(value, dict):
            name = value.get("name", "").replace("'", "''")
            desc = value.get("description", "").replace("'", "''")
            cost = value.get("cost", 0)
            preq = value.get("prerequisites")

            if preq is not None:
                e_preqs = [f"'{p.replace('\'', '\'\'')}'" for p in preq]
                preq_str = f"ARRAY[{','.join(e_preqs)}]"
            else:
                preq_str = "NULL"
            
            return f"('{name}', '{desc}', {preq_str}, {cost})"
        
        return value

    def process_result_value(self, value, dialect: Dialect):
        


class tech_tree(SQLModel, table=True):
    node_id: Optional[str] = Field(
        default=None,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    )
    node: Dict[str, Any] = Field(sa_column=Column(tech_node(), nullable=False))
