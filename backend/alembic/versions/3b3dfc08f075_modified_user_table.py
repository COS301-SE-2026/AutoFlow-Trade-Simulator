"""add upgrades to user and validate tech purchases

Revision ID: 3b3dfc08f075
Revises: eb0054a6c93b
Create Date: 2026-09-19 15:46:10.976571
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '3b3dfc08f075'
down_revision = 'eb0054a6c93b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('user', sa.Column('upgrades', postgresql.ARRAY(sa.String()), server_default='{}', nullable=False))

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
        
                IF tech_record.prerequisites IS NOT NULL
                   AND jsonb_array_length(tech_record.prerequisites) > 0 THEN
                    FOR req_prereq IN SELECT jsonb_array_elements_text(tech_record.prerequisites) LOOP
                        prereq_satisfied := req_prereq = ANY(OLD.upgrades);
                        IF NOT prereq_satisfied THEN
                            RAISE EXCEPTION 'Cannot unlock "%": prerequisite "%" not unlocked.', new_tech, req_prereq;
                        END IF;
                    END LOOP;
                END IF;
        
                total_cost := total_cost + tech_record.cost;
            END LOOP;
        
            IF OLD.experience_points < experience_points THEN
                RAISE EXCEPTION 'Insufficient XP. Required: %, Available: %.', total_cost, OLD.experience_points;
            END IF;
        
            NEW.experience_points := OLD.experience_points - total_cost;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS check_user_tech_purchase_before_update ON \"user\";")
    op.execute("DROP FUNCTION IF EXISTS validate_user_tech_purchase();")
    op.drop_column('user', 'upgrades')