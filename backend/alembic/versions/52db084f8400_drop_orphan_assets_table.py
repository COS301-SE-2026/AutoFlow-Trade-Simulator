"""drop orphan assets table

Revision ID: 52db084f8400
Revises: 55245d569300
Create Date: 2026-09-19 11:56:56.698845
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel



# revision identifiers, used by Alembic.
revision = '52db084f8400'
down_revision = '55245d569300'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS assets CASCADE;")


def downgrade() -> None:
    op.create_table('assets',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('ticker', sa.VARCHAR(length=10), nullable=False),
    sa.Column('name', sa.VARCHAR(length=100), nullable=True),
    sa.PrimaryKeyConstraint('id', name=op.f('assets_pkey')),
    sa.UniqueConstraint('ticker', name=op.f('assets_ticker_key'))
    )
