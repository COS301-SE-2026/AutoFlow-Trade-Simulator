import re
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

        if hasattr(value, "model_dump"):
            value = value.model_dump()
        elif hasattr(value, "dict"):
            value = value.dict()

        if isinstance(value, dict):
            name = value.get("name", "").replace("'", "''")
            desc = value.get("description", "").replace("'", "''")
            cost = value.get("cost", 0)
            preq = value.get("prerequisites")
            unlk = value.get("unlocks")

            if preq is not None:
                e_preqs = [f"'{p.replace('\'', '\'\'')}'" for p in preq]
                preq_str = f"ARRAY[{','.join(e_preqs)}]"
            else:
                preq_str = "NULL"

            if unlk is not None:
                e_unlk = [f"'{u.replace('\'', '\'\'')}'" for u in unlk]
                unlk_str = f"ARRAY[{','.join(e_unlk)}]"
            else:
                unlk_str = "NULL"
            
            return f"('{name}', '{desc}', {preq_str}, {unlk_str}, {cost})"
        
        return value

    def process_result_value(self, value, dialect: Dialect):
        if value is None:
            return None

        if isinstance(value, dict):
            return value

        raw = str(value).strip("()")

        pattern = r'(?:"([^"]*)"|([^,]+))'
        matches = [m[0] or m[1] for m in re.findall(pattern, raw)]

        if len(matches) >= 5:
            name, desc, raw_preq, raw_unlk, cost = matches[0], matches[1], matches[2], matches[3], matches[4]

            def parse_raw_array(raw_arr):
                if raw_arr and raw_arr != "NULL" and raw_arr.startswith("{"):
                    clean = raw_arr.strip("{}")         
                    return [item.strip('"\' ') for item in clean.split(",") if item.strip()]
                return None

            return {
                "name": name,
                "description": desc,
                "prerequisites": parse_raw_array(raw_preq),
                "unlocks": parse_raw_array(raw_unlk),
                "cost": int(cost) if cost.isdigit() else 0
            }

        return value

class tech_tree(SQLModel, table=True):
    node_id: Optional[str] = Field(
        default=None,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    )
    node: Dict[str, Any] = Field(sa_column=Column(tech_node(), nullable=False))
