"""merge conflicting migration heads

Revision ID: 56b7a22b33b4
Revises: 2f1c70b453d1, 49f6698cac4c
Create Date: 2026-07-24 20:41:00.743472
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel



# revision identifiers, used by Alembic.
revision = '56b7a22b33b4'
down_revision = ('2f1c70b453d1', '49f6698cac4c')
branch_labels = None
depends_on = None


def upgrade() -> None: #NOSONAR
    pass


def downgrade() -> None: #NOSONAR
    pass
