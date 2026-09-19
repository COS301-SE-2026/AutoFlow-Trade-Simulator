"""create multiplayer tables

Creates the tables in the shape they had before 827d048ce803, which then
alters them. IF NOT EXISTS keeps this a no-op on databases where the tables
were already created by SQLModel.metadata.create_all.

Revision ID: b7d3f2a91c4e
Revises: 52db084f8400
Create Date: 2026-09-19 13:10:00.000000
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'b7d3f2a91c4e'
down_revision = '52db084f8400'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE matchstatus AS ENUM ('in_progress', 'completed', 'abandoned');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE questiontype AS ENUM ('jargon', 'scenario');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS scenario (
            id SERIAL NOT NULL,
            name VARCHAR(100) NOT NULL,
            description VARCHAR,
            symbol VARCHAR(20) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            active BOOLEAN NOT NULL,
            PRIMARY KEY (id)
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS qtequestion (
            id SERIAL NOT NULL,
            question_type questiontype NOT NULL,
            prompt VARCHAR NOT NULL,
            options JSONB,
            correct_answer VARCHAR NOT NULL,
            correct_cash_delta_pct NUMERIC(6, 4) NOT NULL,
            incorrect_cash_delta_pct NUMERIC(6, 4) NOT NULL,
            active BOOLEAN NOT NULL,
            PRIMARY KEY (id)
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS multiplayermatch (
            id SERIAL NOT NULL,
            scenario_id INTEGER NOT NULL,
            symbol VARCHAR(20) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            initial_balance NUMERIC(18, 4) NOT NULL,
            status matchstatus NOT NULL,
            player_one_id INTEGER NOT NULL,
            player_two_id INTEGER NOT NULL,
            winner_user_id INTEGER,
            current_day_index INTEGER NOT NULL,
            started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            ended_at TIMESTAMP WITHOUT TIME ZONE,
            PRIMARY KEY (id),
            FOREIGN KEY(scenario_id) REFERENCES scenario (id),
            FOREIGN KEY(player_one_id) REFERENCES "user" (id),
            FOREIGN KEY(player_two_id) REFERENCES "user" (id),
            FOREIGN KEY(winner_user_id) REFERENCES "user" (id)
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS multiplayerparticipant (
            id SERIAL NOT NULL,
            match_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            perturbation_seed INTEGER NOT NULL,
            cash_balance NUMERIC(18, 4) NOT NULL,
            position_qty NUMERIC(18, 4) NOT NULL,
            final_balance NUMERIC(18, 4),
            action_log JSONB,
            disconnected_at TIMESTAMP WITHOUT TIME ZONE,
            PRIMARY KEY (id),
            FOREIGN KEY(match_id) REFERENCES multiplayermatch (id),
            FOREIGN KEY(user_id) REFERENCES "user" (id)
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS multiplayerparticipant")
    op.execute("DROP TABLE IF EXISTS multiplayermatch")
    op.execute("DROP TABLE IF EXISTS qtequestion")
    op.execute("DROP TABLE IF EXISTS scenario")
    op.execute("DROP TYPE IF EXISTS questiontype")
    op.execute("DROP TYPE IF EXISTS matchstatus")
