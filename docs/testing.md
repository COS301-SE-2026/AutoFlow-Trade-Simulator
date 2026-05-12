# Testing Services

Test services in isolation by mocking the session.

## Unit Test with Mock Session

```python
from unittest.mock import MagicMock
from sqlmodel import Session
import pytest


def test_create_user():
    """Test service.create() method."""
    mock_session = MagicMock(spec=Session)
    service = UserService(mock_session)
    
    # Define mock return values
    mock_session.get.return_value = None  # Email doesn't exist
    
    # Call service
    result = service.create(UserCreateDTO(
        email="user@example.com",
        full_name="John Doe",
        password_hash="hashed"
    ))
    
    # Verify calls
    mock_session.add.assert_called_once()
    mock_session.commit.assert_called_once()
    mock_session.refresh.assert_called_once()


def test_get_user_by_id_found():
    """Test get when user exists."""
    mock_session = MagicMock(spec=Session)
    mock_user = User(id=1, email="test@example.com", full_name="Test", password_hash="hash")
    mock_session.get.return_value = mock_user
    
    service = UserService(mock_session)
    result = service.get_by_id(1)
    
    assert result == mock_user
    mock_session.get.assert_called_once_with(User, 1)


def test_get_user_by_id_not_found():
    """Test get when user doesn't exist."""
    mock_session = MagicMock(spec=Session)
    mock_session.get.return_value = None
    
    service = UserService(mock_session)
    result = service.get_by_id(999)
    
    assert result is None


def test_delete_user_success():
    """Test delete when user exists."""
    mock_session = MagicMock(spec=Session)
    mock_user = User(id=1, email="test@example.com", full_name="Test", password_hash="hash")
    mock_session.get.return_value = mock_user
    
    service = UserService(mock_session)
    result = service.delete(1)
    
    assert result is True
    mock_session.delete.assert_called_once_with(mock_user)
    mock_session.commit.assert_called_once()


def test_delete_user_not_found():
    """Test delete when user doesn't exist."""
    mock_session = MagicMock(spec=Session)
    mock_session.get.return_value = None
    
    service = UserService(mock_session)
    result = service.delete(999)
    
    assert result is False
    mock_session.delete.assert_not_called()
```

## Integration Test with Real Database

```python
import pytest
from sqlmodel import Session, create_engine
from sqlmodel.pool import StaticPool


@pytest.fixture
def session():
    """Create an in-memory SQLite session for tests."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    from ...models import SQLModel
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        yield session


def test_create_and_retrieve_user(session):
    """Test end-to-end create and retrieve."""
    service = UserService(session)
    
    # Create
    user = service.create(UserCreateDTO(
        email="test@example.com",
        full_name="John Doe",
        password_hash="hashed"
    ))
    
    # Retrieve
    retrieved = service.get_by_id(user.id)
    
    assert retrieved is not None
    assert retrieved.email == "test@example.com"
```

## Best Practices

1. **Mock the session** — Don't test with real DB
2. **Test happy path** — User created successfully
3. **Test error cases** — Not found, duplicate, etc.
4. **Verify calls** — Assert add/commit were called
5. **Use fixtures** — Reusable setup for tests
6. **One assertion per test** — Unless testing a flow

## Example Test File Structure

```python
# backend/tests/test_user_service.py

import pytest
from unittest.mock import MagicMock
from sqlmodel import Session
from app.epics.user.UserService import UserService
from app.epics.user.UserDTOs import UserCreateDTO
from app.models import User


@pytest.fixture
def mock_session():
    return MagicMock(spec=Session)


@pytest.fixture
def service(mock_session):
    return UserService(mock_session)


class TestUserServiceCreate:
    def test_create_success(self, service, mock_session):
        # Test code here
        pass


class TestUserServiceRead:
    def test_get_by_id_found(self, service, mock_session):
        # Test code here
        pass


class TestUserServiceDelete:
    def test_delete_success(self, service, mock_session):
        # Test code here
        pass
```

## Running Tests

```bash
cd backend
pytest tests/test_user_service.py -v
```
