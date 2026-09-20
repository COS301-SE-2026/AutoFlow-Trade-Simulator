"""create matcheventlog

IF NOT EXISTS keeps this a no-op on databases where the table was already
created by SQLModel.metadata.create_all.

Revision ID: 3e9a5c7d1b28
Revises: c362a6fedeef
Create Date: 2026-09-19 13:15:00.000000
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '3e9a5c7d1b28'
down_revision = 'c362a6fedeef'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS matcheventlog (
            match_id INTEGER NOT NULL,
            seq INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            day_index INTEGER NOT NULL,
            event_type VARCHAR(20) NOT NULL,
            payload JSONB,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY (match_id, seq),
            FOREIGN KEY(match_id) REFERENCES multiplayermatch (id),
            FOREIGN KEY(user_id) REFERENCES "user" (id)
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS matcheventlog")
