"""merge interval fixes into main line

Revision ID: 34ef447d914c
Revises: 2f1c70b453d1, 49f6698cac4c
Create Date: 2026-07-24 20:47:59.297089
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel



# revision identifiers, used by Alembic.
revision = '34ef447d914c'
down_revision = ('2f1c70b453d1', '49f6698cac4c')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
