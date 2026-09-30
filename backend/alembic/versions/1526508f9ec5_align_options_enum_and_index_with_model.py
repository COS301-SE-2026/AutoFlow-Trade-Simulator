"""align options enum and index with model

Revision ID: 1526508f9ec5
Revises: 827d048ce803
Create Date: 2026-09-19 11:56:57.347096
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel



# revision identifiers, used by Alembic.
revision = '1526508f9ec5'
down_revision = '827d048ce803'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('options', 'in_the_money', existing_type=sa.BOOLEAN(), server_default=None, existing_nullable=False)
    op.drop_index(op.f('options_timestamp_idx'), table_name='options')


def downgrade() -> None:
    op.create_index(op.f('options_timestamp_idx'), 'options', [sa.literal_column('timestamp DESC')], unique=False)
    op.alter_column('options', 'in_the_money', existing_type=sa.BOOLEAN(), server_default=sa.text('false'), existing_nullable=False)
