"""fix jsonb null handling in tech node trigger

Revision ID: 9a6f8bdb1150
Revises: 3b3dfc08f075
Create Date: 2026-09-21 12:41:39.184295
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '9a6f8bdb1150'
down_revision = '3b3dfc08f075'
branch_labels = None
depends_on = None


def upgrade() -> None:
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

                IF jsonb_array_length(COALESCE(NULLIF(NEW.node->'prerequisites', 'null'::jsonb), '[]'::jsonb)) > 0 THEN
                    FOR prereq IN SELECT jsonb_array_elements_text(NEW.node->'prerequisites') LOOP
                        SELECT EXISTS (SELECT 1 FROM techtree WHERE node->>'name' = prereq) INTO prereq_exists;
                        IF NOT prereq_exists THEN
                            RAISE EXCEPTION 'Prerequisite node "%" does not exist', prereq;
                        END IF;
                    END LOOP;

                    WITH RECURSIVE prereq_path AS (
                        SELECT (node->>'name') AS current_node,
                               COALESCE(NULLIF(node->'prerequisites', 'null'::jsonb), '[]'::jsonb) AS req_prereqs
                        FROM techtree
                        WHERE (node->>'name') IN (SELECT jsonb_array_elements_text(NEW.node->'prerequisites'))
                        UNION ALL
                        SELECT (t.node->>'name'),
                               COALESCE(NULLIF(t.node->'prerequisites', 'null'::jsonb), '[]'::jsonb)
                        FROM techtree t
                        INNER JOIN prereq_path p
                            ON (t.node->>'name') IN (SELECT jsonb_array_elements_text(p.req_prereqs))
                    )
                    SELECT EXISTS (SELECT 1 FROM prereq_path WHERE current_node = (NEW.node->>'name')) INTO has_cycle;

                    IF has_cycle THEN
                        RAISE EXCEPTION 'Circular dependency detected! Node "%" creates a loop.', (NEW.node->>'name');
                    END IF;
                END IF;

                IF jsonb_array_length(COALESCE(NULLIF(NEW.node->'unlocks', 'null'::jsonb), '[]'::jsonb)) > 0 THEN
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
            """)

    op.execute("""
            CREATE OR REPLACE FUNCTION validate_user_tech_purchase()
            RETURNS TRIGGER AS $$
            DECLARE
                new_tech VARCHAR;
                tech_record RECORD;
                req_prereq VARCHAR;
                prereq_satisfied BOOLEAN;
                total_cost INT := 0;
            BEGIN
                IF OLD.upgrades IS NOT DISTINCT FROM NEW.upgrades THEN
                    RETURN NEW;
                END IF;

                FOR new_tech IN
                    SELECT unnest(NEW.upgrades)
                    EXCEPT
                    SELECT unnest(OLD.upgrades)
                LOOP
                    SELECT (node->>'cost')::int AS cost,
                           node->'prerequisites' AS prerequisites
                    INTO tech_record
                    FROM techtree
                    WHERE node->>'name' = new_tech;

                    IF NOT FOUND THEN
                        RAISE EXCEPTION 'Technology "%" is not in the skill tree', new_tech;
                    END IF;

                    IF jsonb_array_length(COALESCE(NULLIF(tech_record.prerequisites, 'null'::jsonb), '[]'::jsonb)) > 0 THEN
                        FOR req_prereq IN SELECT jsonb_array_elements_text(tech_record.prerequisites) LOOP
                            prereq_satisfied := req_prereq = ANY(OLD.upgrades);
                            IF NOT prereq_satisfied THEN
                                RAISE EXCEPTION 'Cannot unlock "%": prerequisite "%" not unlocked.', new_tech, req_prereq;
                            END IF;
                        END LOOP;
                    END IF;

                    total_cost := total_cost + tech_record.cost;
                END LOOP;

                IF OLD.experience_points < total_cost THEN
                    RAISE EXCEPTION 'Insufficient XP. Required: %, Available: %.', total_cost, OLD.experience_points;
                END IF;

                NEW.experience_points := OLD.experience_points - total_cost;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
    """)

    op.execute("""
            DROP TRIGGER IF EXISTS check_user_tech_purchase_before_update ON "user";
            CREATE TRIGGER check_user_tech_purchase_before_update
            BEFORE UPDATE OF upgrades ON "user"
            FOR EACH ROW
            EXECUTE FUNCTION validate_user_tech_purchase();
    """)

    op.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_trigger
                    WHERE tgname = 'check_user_tech_purchase_before_update'
                      AND tgrelid = '"user"'::regclass
                ) THEN
                    RAISE EXCEPTION 'Trigger check_user_tech_purchase_before_update was not installed';
                END IF;
            END $$;
    """)


def downgrade() -> None:
    # previous version was broken. leaving the fixed functions in place.
    pass