"""added new source of xp: tutorials

Revision ID: 8a906128ee8e
Revises: 9a6f8bdb1150
Create Date: 2026-09-23 12:46:53.025522
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel



# revision identifiers, used by Alembic.
revision = '8a906128ee8e'
down_revision = '9a6f8bdb1150'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE progression_source ADD VALUE IF NOT EXISTS 'tutorial'")


def downgrade() -> None: # postgres doesn't support removing specific enum values
    pass
