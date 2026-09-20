"""create_tech_tree_table_and_udt

Revision ID: eb0054a6c93b
Revises: 3b3dfc08f075
Create Date: 2026-09-20 14:09:23.758102
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import UserDefinedType
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'eb0054a6c93b'
down_revision = 'c88820a17c87'
branch_labels = None
depends_on = None


def upgrade() -> None:
     # I will be leaving some of my own comments to demark what I added so I dont repeat not knowing what I touched beforehand

    # Make the UDT (Postgres is the best)
    op.execute("""
        CREATE TYPE "TechNode" AS (
            name VARCHAR,
            description VARCHAR,
            prerequisites VARCHAR[],
            unlocks VARCHAR[],
            cost INT
        );
    """)

    class TechNodeUDT(UserDefinedType):
        def get_col_spec(self, **kw):
            return '"TechNode"'

    #Make the table that houses the DAG (Directed Acyclic Graph)
    op.create_table(
        'techtree',
        sa.Column(
            'node_id',
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()')
        ),
        sa.Column('node', TechNodeUDT(), nullable=False)
    )

    #Add trigger for technodes
    # This will check if the previous tech exists or if your arnt making the price negative
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
            IF (NEW.node).cost < 0 Then
                RAISE EXCEPTION 'There is no such thing as a free lunch. Techology cost cannot be negative: %', (NEW.node).cost;
            END IF;

            IF (NEW.node).prerequisites IS NOT NULL AND cardinality((NEW.node).prerequisites) > 0 THEN

              
                FOREACH prereq IN ARRAY (NEW.node).prerequisites LOOP
                    SELECT EXISTS (
                        SELECT 1 FROM techtree WHERE (node).name = prereq
                    ) INTO prereq_exists;

                    IF NOT prereq_exists THEN
                        RAISE EXCEPTION 'Prerequisite node "%" does not exist in the tech tree', prereq;
                    END IF;
                END LOOP;


                -- Due to the nature of DAG I need to prevent a cyclic dependency
                WITH RECURSIVE prereq_path AS (
                    SELECT (node).name AS current_node, (node).prerequisites AS req_prereqs
                    FROM techtree
                    WHERE (node).name = ANY((NEW.node).prerequisites)

                    UNION ALL

                    Select (t.node).name, (t.node).prerequisites
                    FROM techtree t
                    INNER JOIN prereq_path p ON (t.node).name = ANY(p.req_prereqs)
                )   
                SELECT EXISTS (
                    SELECT 1 FROM prereq_path WHERE current_node = (NEW.node).name
                ) INTO has_cycle;

                IF has_cycle THEN
                    RAISE EXCEPTION 'Circular dependency detected! Node "%" creates a loop in the tech tree. ', (NEW.node).name;
                END IF;

            END IF;

            IF (NEW.node).unlocks IS NOT NULL AND cardinality((NEW.node).unlocks) > 0 THEN
                FOREACH unlock_target IN ARRAY (NEW.node).unlocks LOOP
                    SELECT EXISTS (
                        SELECT 1 FROM techtree WHERE (node).name = unlock_target
                    ) INTO unlock_exists;

                    IF NOT unlock_exists THEN
                        RAISE EXCEPTION 'Unlock target node "%" does not exist in the tech tree', unlock_target;
                    END IF;
                END LOOP;
            END IF;

            RETURN NEW;
        END;

        $$ Language plpgsql;

        CREATE TRIGGER check_tech_node_before_save
        BEFORE INSERT OR UPDATE ON techtree
        FOR EACH ROW
        EXECUTE FUNCTION validate_tech_node();
    """)


def downgrade() -> None:
     #Drop the trigger functions
    op.execute("DROP TRIGGER IF EXISTS check_tech_node_before_save ON techtree; ")
    op.execute("DROP FUNCTION IF EXISTS validate_tech_node(); ")

    #Drop the UDT and DAG
    op.drop_table('techtree')
    op.execute('DROP TYPE IF EXISTS "TechNode" CASCADE; ')
