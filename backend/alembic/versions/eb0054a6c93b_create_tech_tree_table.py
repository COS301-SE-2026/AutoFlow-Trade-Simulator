"""create_tech_tree_table

Revision ID: eb0054a6c93b
Revises: c88820a17c87
Create Date: 2026-09-20 14:09:23.758102
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID


# revision identifiers, used by Alembic.
revision = 'eb0054a6c93b'
down_revision = 'c88820a17c87'
branch_labels = None
depends_on = None

'''
{
    "name": "string",                       unique identifier, referenced by prerequisites/unlocks
    "description": "string",                shown in the UI
    "prerequisites": ["string"] |   null,   names of nodes that must be unlocked first
    "unlocks": ["string"] | null,           names of nodes this one leads to (UI hint, not enforced)
    "cost": int                             XP cost to unlock, must be >= 0
}
'''

def upgrade() -> None:
    op.create_table(
        'techtree',
        sa.Column('node_id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('node', JSONB, nullable=False),
    )

    # makes sure that each node's name is unique so that we can use it as a virtual PK
    op.execute("CREATE UNIQUE INDEX techtree_node_name_key ON techtree ((node->>'name'));")

    op.execute("""
        CREATE OR REPLACE FUNCTION validate_tech_node()
        RETURNS TRIGGER AS $$
        DECLARE
            prereq VARCHAR;
            prereq_exists BOOLEAN;
            has_cycle BOOLEAN;
            unlock_target VARCHAR;
            unlock_exists BOOLEAN;
        BEGIN
            IF (NEW.node->>'cost')::int < 0 THEN
                RAISE EXCEPTION 'Technology cost cannot be negative: %', (NEW.node->>'cost')::int;
            END IF;

            IF jsonb_array_length(COALESCE(NEW.node->'prerequisites', '[]'::jsonb)) > 0 THEN
                -- each prerequisite must exist
                FOR prereq IN SELECT jsonb_array_elements_text(NEW.node->'prerequisites') LOOP
                    SELECT EXISTS (SELECT 1 FROM techtree WHERE node->>'name' = prereq) INTO prereq_exists;
                    IF NOT prereq_exists THEN
                        RAISE EXCEPTION 'Prerequisite node "%" does not exist', prereq;
                    END IF;
                END LOOP;

                -- recursively check for a cycle
                WITH RECURSIVE prereq_path AS (
                    SELECT (node->>'name') AS current_node, node->'prerequisites' AS req_prereqs
                    FROM techtree
                    WHERE (node->>'name') IN (SELECT jsonb_array_elements_text(NEW.node->'prerequisites'))
                    UNION ALL
                    SELECT (t.node->>'name'), t.node->'prerequisites'
                    FROM techtree t
                    INNER JOIN prereq_path p
                        ON (t.node->>'name') IN (SELECT jsonb_array_elements_text(p.req_prereqs))
                )
                SELECT EXISTS (SELECT 1 FROM prereq_path WHERE current_node = (NEW.node->>'name')) INTO has_cycle;

                IF has_cycle THEN
                    RAISE EXCEPTION 'Circular dependency detected! Node "%" creates a loop.', (NEW.node->>'name');
                END IF;
            END IF;

            IF jsonb_array_length(COALESCE(NEW.node->'unlocks', '[]'::jsonb)) > 0 THEN
                FOR unlock_target IN SELECT jsonb_array_elements_text(NEW.node->'unlocks') LOOP
                    SELECT EXISTS (SELECT 1 FROM techtree WHERE node->>'name' = unlock_target) INTO unlock_exists;
                    IF NOT unlock_exists THEN
                        RAISE EXCEPTION 'Unlock target node "%" does not exist', unlock_target;
                    END IF;
                END LOOP;
            END IF;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER check_tech_node_before_save
        BEFORE INSERT OR UPDATE ON techtree
        FOR EACH ROW
        EXECUTE FUNCTION validate_tech_node();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS check_tech_node_before_save ON techtree;")
    op.execute("DROP FUNCTION IF EXISTS validate_tech_node();")
    op.drop_table('techtree')