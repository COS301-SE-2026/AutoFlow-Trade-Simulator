"""add google oauth fields to user

Revision ID: a1b2c3d4e5f6
Revises: 0d5cc0f73107
Create Date: 2026-08-31 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '0d5cc0f73107'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('user', 'password_hash', existing_type=sa.VARCHAR(), nullable=True)
    op.add_column('user', sa.Column('google_sub', sa.String(), nullable=True))
    op.create_index(op.f('ix_user_google_sub'), 'user', ['google_sub'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_google_sub'), table_name='user')
    op.drop_column('user', 'google_sub')
    op.alter_column('user', 'password_hash', existing_type=sa.VARCHAR(), nullable=False)
