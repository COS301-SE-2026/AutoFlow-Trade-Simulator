"""add seed tracking to multiplayer matches

Revision ID: 827d048ce803
Revises: 52db084f8400
Create Date: 2026-09-19 11:56:57.029201
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql



# revision identifiers, used by Alembic.
revision = '827d048ce803'
down_revision = '52db084f8400'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('multiplayermatch', sa.Column('perturbation_seed', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('multiplayermatch', sa.Column('perturbation_version', sqlmodel.sql.sqltypes.AutoString(length=10), nullable=False, server_default='v1'))
    op.add_column('multiplayermatch', sa.Column('data_snapshot_id', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False, server_default='demo'))

    op.drop_constraint('multiplayerparticipant_pkey', 'multiplayerparticipant', type_='primary')
    op.create_primary_key('multiplayerparticipant_pkey', 'multiplayerparticipant', ['match_id', 'user_id'])

    op.drop_column('multiplayerparticipant', 'perturbation_seed')
    op.drop_column('multiplayerparticipant', 'action_log')
    op.drop_column('multiplayerparticipant', 'id')
    op.drop_column('multiplayerparticipant', 'final_balance')


def downgrade() -> None:
    op.add_column('multiplayerparticipant', sa.Column('final_balance', sa.NUMERIC(precision=18, scale=4), nullable=True))
    op.add_column('multiplayerparticipant', sa.Column('action_log', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('multiplayerparticipant', sa.Column('perturbation_seed', sa.INTEGER(), nullable=False, server_default='0'))

    op.drop_constraint('multiplayerparticipant_pkey', 'multiplayerparticipant', type_='primary')
    op.add_column('multiplayerparticipant', sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False))
    op.create_primary_key('multiplayerparticipant_pkey', 'multiplayerparticipant', ['id'])

    op.drop_column('multiplayermatch', 'data_snapshot_id')
    op.drop_column('multiplayermatch', 'perturbation_version')
    op.drop_column('multiplayermatch', 'perturbation_seed')
