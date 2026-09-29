"""added slug to unify tech tree names for strategies

Revision ID: 728fde3a63ce
Revises: 8a906128ee8e
Create Date: 2026-09-29 22:05:17.837799
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel



# revision identifiers, used by Alembic.
revision = '728fde3a63ce'
down_revision = '8a906128ee8e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('strategies', sa.Column('slug', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True))
    op.create_index(op.f('ix_strategies_slug'), 'strategies', ['slug'], unique=True)
    op.add_column('strategies', sa.Column('tech_tree_node', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True))
    op.create_index(op.f('ix_strategies_tech_tree_node'), 'strategies', ['tech_tree_node'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_strategies_tech_tree_node'), table_name='strategies')
    op.drop_column('strategies', 'tech_tree_node')
    op.drop_index(op.f('ix_strategies_slug'), table_name='strategies')
    op.drop_column('strategies', 'slug')
