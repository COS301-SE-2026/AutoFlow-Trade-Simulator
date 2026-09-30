"""rename praticesimulation to practicesimulation

Revision ID: 55245d569300
Revises: a1b2c3d4e5f6
Create Date: 2026-09-19 11:56:56.375124
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel



# revision identifiers, used by Alembic.
revision = '55245d569300'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.rename_table('praticesimulation', 'practicesimulation')
    op.drop_constraint('backtestresults_simu_id_fkey', 'backtestresults', type_='foreignkey')
    op.create_foreign_key('backtestresults_simu_id_fkey', 'backtestresults', 'practicesimulation', ['simu_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('backtestresults_simu_id_fkey', 'backtestresults', type_='foreignkey')
    op.rename_table('practicesimulation', 'praticesimulation')
    op.create_foreign_key('backtestresults_simu_id_fkey', 'backtestresults', 'praticesimulation', ['simu_id'], ['id'])
