from typing import Optional, List, Dict
from sqlmodel import Session, select
from sqlalchemy import col

from app.models import User
from app.models.progression_grant import ProgressionGrant, ProgressionSource

XP_WINNER = 100
XP_LOSER = 40
XP_PUZZLE_BASE = 50
XP_PUZZLE_PER_RUBRIC_POINT = 10
ELO_K = 32
ELO_DEFAULT = 1000


def compute_elo_delta(rating_a: int, rating_b: int, score_a: float) -> int:
    expected_a = 1 / (1 + 10 ** ((rating_b - rating_a) / 400))
    return round(ELO_K * (score_a - expected_a))


def award_match_progression(
        db: Session,
        match_id: int,
        winner_user_id: Optional[int],
        user_ids: List[int],
        actions_by_user: Dict[int, int],
) -> None:
    existing = db.exec(
        select(ProgressionGrant)
        .where(ProgressionGrant.source_type == ProgressionSource.match)
        .where(ProgressionGrant.source_id == match_id)
    ).first()
    if existing is not None:
        return

    users = {
        user.id: user
        for user in db.exec(select(User).where(col(User.id).in_(user_ids))).all()
    }
    if len(users) != 2:
        raise ValueError(f"expected 2 users for match {match_id}, got {len(users)}")

    both_played = all(actions_by_user.get(user_id, 0) > 0 for user_id in user_ids)

    elo_deltas: Dict[int, int] = dict.fromkeys(user_ids, 0)
    if both_played:
        player_a, player_b = user_ids
        if winner_user_id is None:
            score_a = 0.5
        elif winner_user_id == player_a:
            score_a = 1.0
        else:
            score_a = 0.0
        delta_a = compute_elo_delta(users[player_a].elo_rating, users[player_b].elo_rating, score_a)
        elo_deltas[player_a] = delta_a
        elo_deltas[player_b] = -delta_a

    for user_id in user_ids:
        action_count = actions_by_user.get(user_id, 0)
        if action_count == 0:
            xp = 0
        elif winner_user_id is None:
            xp = XP_LOSER
        elif user_id == winner_user_id:
            xp = XP_WINNER
        else:
            xp = XP_LOSER

        elo_delta = elo_deltas[user_id]

        if xp == 0 and elo_delta == 0:
            continue

        user = users[user_id]
        user.experience_points += xp
        user.elo_rating += elo_delta
        db.add(
            ProgressionGrant(
                user_id=user_id,
                source_type=ProgressionSource.match,
                source_id=match_id,
                xp_awarded=xp,
                elo_delta=elo_delta,
            )
        )

    db.commit()


def award_puzzle_progression(
        db: Session,
        puzzle_run_id: int,
        user_id: int,
        rubric_score: int,
) -> None:
    existing = db.exec(
        select(ProgressionGrant)
        .where(ProgressionGrant.source_type == ProgressionSource.puzzle)
        .where(ProgressionGrant.source_id == puzzle_run_id)
    ).first()
    if existing is not None:
        return

    user = db.get(User, user_id)
    if user is None:
        raise ValueError(f"user {user_id} not found for puzzle run {puzzle_run_id}")

    xp = XP_PUZZLE_BASE + rubric_score * XP_PUZZLE_PER_RUBRIC_POINT

    user.experience_points += xp
    db.add(
        ProgressionGrant(
            user_id=user_id,
            source_type=ProgressionSource.puzzle,
            source_id=puzzle_run_id,
            xp_awarded=xp,
            elo_delta=0,
        )
    )
    db.commit()
