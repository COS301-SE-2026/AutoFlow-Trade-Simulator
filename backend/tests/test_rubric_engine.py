import math
from datetime import datetime, time, timezone
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException, status

from app.epics.RubricEngine.RubricEngineDTO import EvaluationResultDTO, ExecutionMetricDTO, Grade
from app.epics.RubricEngine.RubricEngineService import RubricEngineService, GRADE_TO_RUBRIC_SCORE

@pytest.fixture
def mock_session():
    return MagicMock()

@pytest.fixture
def rubric_service(mock_session):
    return RubricEngineService(session=mock_session)

@pytest.fixture
def mock_strategy():
    strategy = MagicMock()
    eval_result = EvaluationResultDTO(
        passed=True,
        final_score=85.4,
        grade=Grade.A,
        feedback=[]
    )
    strategy.evaluate.return_value = eval_result
    return strategy

@pytest.fixture
def sample_bars():
    bar1 = MagicMock(asset_id=1, timestamp=datetime(2026, 1, 1, 0, 0, tzinfo=timezone.utc), close=Decimal("100.0"))
    bar2 = MagicMock(asset_id=1, timestamp=datetime(2026, 1, 2, 0, 0, tzinfo=timezone.utc), close=Decimal("110.0"))
    bar3 = MagicMock(asset_id=1, timestamp=datetime(2026, 1, 3, 0, 0, tzinfo=timezone.utc), close=Decimal("105.0"))
    return [bar1, bar2, bar3]

def test_get_match_or_404_success(rubric_service, mock_session):
    mock_match = MagicMock(id=10, initial_balance=Decimal("10000"));
    mock_session.exec.return_value.first.return_value = mock_match

    match = rubric_service._get_match_or_404(match_id=10)
    assert match == mock_match

def test_get_match_or_404_not_found(rubric_service, mock_session):
    mock_session.exec.return_value.first.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        rubric_service._get_match_or_404(match_id=999)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
    assert exc_info.value.detail == "Match not found"

def test_get_puzzle_or_404_success(rubric_service, mock_session):
    mock_puzzle = MagicMock(id=5, user_id=42)
    mock_session.exec.return_value.first.return_value = mock_puzzle

    puzzle = rubric_service._get_puzzle_or_404(puzzle_id=5, user_id=42)
    assert puzzle == mock_puzzle

def test_get_puzzle_or_404_user_mismatch_raises_404(rubric_service, mock_session):
    mock_puzzle = MagicMock(id=5, user_id=99)
    mock_session.exec.return_value._first.return_value_ = mock_puzzle

    with pytest.raises(HTTPException) as exc_info:
        rubric_service._get_puzzle_or_404(puzzle_id=5, user_id=42)
    
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
    assert exc_info.value.detail == "Puzzle not found"

def test_validate_participant_forbidden(rubric_service, mock_session):
    mock_session.exec.return_value.first.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        rubric_service._validate_participant(match_id=1, user_id=100)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert exc_info.value.detail == "You were not a valid participant in the match"

def test_process_fifo_trades_single_buy_sell(rubric_service):
    t1 = datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc)
    t2 = datetime(2026, 1, 1, 10, 5, tzinfo=timezone.utc)

    buy_event = MagicMock(
        event_type="buy",
        payload={"qty": 2, "price": 100},
        created_at=t1
    )
    sell_event = MagicMock(
        event_type="sell",
        payload={"qty": 2, "price": 120},
        created_at=t2
    )

    win_rate, avg_holding = rubric_service._process_fifo_trades([buy_event, sell_event])

    assert win_rate == 1.0
    assert avg_holding == 300.0

def test_process_fifo_trades_partial_fills_and_loss(rubric_service):
    t0 = datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)
    t1 = datetime(2026, 1, 1, 12, 10, tzinfo=timezone.utc)

    buy_event = MagicMock(event_type="buy", payload={"qty": 10, "price": 100}, created_at=t0)
    sell_event = MagicMock(event_type="sell", payload={"qty": 5, "price": 80}, created_at=t1)

    win_rate, avg_holding = rubric_service._process_fifo_trades([buy_event, sell_event])

    assert win_rate == 0.0
    assert avg_holding == 600.0

def test_calculate_max_drawdown(rubric_service):
    nav_series = [Decimal("100"), Decimal("90"), Decimal("80"), Decimal("110"), Decimal("99")]
    max_dd = rubric_service._calculate_max_drawdown(nav_series)
    assert max_dd == pytest.approx(20.0, rel=1e-2)

def test_calculate_sharpe_ratio(rubric_service):
    returns = [0.01, 0.02, -0.01, 0.0015, -0.005]
    sharpe = rubric_service._calculate_sharpe_ratio(returns);
    assert isinstance(sharpe, float)
    assert sharpe > 0.0

def test_calculate_sharpe_ratio_variance(rubric_service):
    returns = [0.01, 0.01, 0.01]
    assert rubric_service._calculate_sharpe_ratio(returns) == 0.0

def test_calculate_benchmark_return(rubric_service, sample_bars):
    bm_return = rubric_service._calculate_benchmark_return(sample_bars)
    assert bm_return == pytest.approx(5.0, rel=1e-2)

def test_evaluate_startegy_success(rubric_service, mock_strategy):
    rubric_service.strategies = {"mean_reversion": mock_strategy}
    dummy_metric = MagicMock(spec=ExecutionMetricDTO)

    res = rubric_service.evaluate_strategy("mean_reversion", dummy_metric)
    assert res.final_score == 85.4
    assert res.grade == Grade.A

def test_evaluate_startegy_unsupported_key(rubric_service):
    dummy_metric = MagicMock(spec=ExecutionMetricDTO)

    with pytest.raises(HTTPException) as exc_info:
        rubric_service.evaluate_strategy("unknown_strategy", dummy_metric)
    
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "Strategy 'unknown_strategy' is not supported" in exc_info.value.detail

def test_evauluate_puzzle_for_user(rubric_service, mock_session, mock_strategy):
    puzzle_id, user_id = 1, 42
    mock_puzzle = MagicMock(
        id=puzzle_id,
        user_id=user_id,
        symbol="AAPL",
        initial_balance=Decimal("1000"),
        final_balance=Decimal("1200"),
        actions=[]
    )

    with patch.object(rubric_service, "map_metrics_from_puzzle_run") as mock_map, \
        patch.object(rubric_service, "_get_puzzle_or_404", return_value=mock_puzzle):

        mock_map.return_value = MagicMock(spec=ExecutionMetricDTO)
        rubric_service.strategies = {"mean_reversion": mock_strategy}

        result = rubric_service.evaluate_puzzle_for_user("mean_reversion", puzzle_id, user_id)

        assert mock_puzzle.rubric_score == 85
        mock_session.add.assert_called_once_with(mock_puzzle)
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once_with(mock_puzzle)
        assert result.final_score == 85.4

@patch("app.epics.RubricEngine.RubricEngineService.award_match_progression")
def test_evaluate_match_for_user(mock_award, rubric_service, mock_session, mock_strategy):
    match_id, user_id = 10, 100

    mock_match = MagicMock(id=match_id, winner_user_id=100)
    p1 = MagicMock(user_id=100)
    p2 = MagicMock(user_id=101)

    with patch.object(rubric_service, "map_metrics_from_match_log") as mock_map, \
         patch.object(rubric_service, "_get_match_or_404", return_value=mock_match), \
         patch.object(rubric_service, "_get_match_event_logs", side_effect=[[1, 2], [1]]):

        mock_session.exec.return_value.all.return_value = [p1, p2]
        mock_map.return_value = MagicMock(spec=ExecutionMetricDTO)
        rubric_service.strategies = {"mean_reversion": mock_strategy}

        res = rubric_service.evaluate_match_for_user("mean_reversion", match_id, user_id)

        mock_award.assert_called_once_with(
            db=mock_session,
            match_id=match_id,
            winner_user_id=100,
            user_ids=[100, 101],
            actions_by_user={100: 2, 101: 1}
        )
        assert res.final_score == 85.4

def test_get_status(rubric_service):
    status_dto = rubric_service.get_status()
    assert status_dto.epic == "Rubric Engine"
    assert status_dto.status == "Service Operational"