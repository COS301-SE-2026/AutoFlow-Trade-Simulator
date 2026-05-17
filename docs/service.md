# Services

Services handle business logic and database operations.

## Basic Structure

```python
from sqlmodel import Session, select
from ...models import YourModel
from .YourDTOs import YourCreateDTO


class YourService:
    def __init__(self, session: Session):
        self.session = session

    def create(self, data: YourCreateDTO) -> YourModel:
        obj = YourModel.model_validate(data)
        self.session.add(obj)
        self.session.commit()
        self.session.refresh(obj)
        return obj

    def get_by_id(self, id: int) -> YourModel | None:
        return self.session.get(YourModel, id)

    def get_all(self) -> list[YourModel]:
        return list(self.session.exec(select(YourModel)).all())

    def update(self, id: int, updates: dict) -> YourModel | None:
        obj = self.session.get(YourModel, id)
        if not obj:
            return None
        for key, value in updates.items():
            if hasattr(obj, key):
                setattr(obj, key, value)
        self.session.add(obj)
        self.session.commit()
        self.session.refresh(obj)
        return obj

    def delete(self, id: int) -> bool:
        obj = self.session.get(YourModel, id)
        if not obj:
            return False
        self.session.delete(obj)
        self.session.commit()
        return True
```

## Key Principles

1. **Session as constructor parameter** — Injected per-request
2. **Store as instance member** — Use `self.session` throughout methods
3. **No FastAPI imports** — Services are framework-agnostic
4. **Return model instances** — Not DTOs, let controller handle conversion
5. **Handle None cases** — Return None or raise exceptions for errors

## CRUD Methods

### Create
```python
def create(self, data: CreateDTO) -> Model:
    obj = Model.model_validate(data)
    self.session.add(obj)
    self.session.commit()
    self.session.refresh(obj)  # Get DB-generated fields
    return obj
```

### Read
```python
def get_by_id(self, id: int) -> Model | None:
    return self.session.get(Model, id)

def get_all(self) -> list[Model]:
    return list(self.session.exec(select(Model)).all())
```

### Update
```python
def update(self, id: int, updates: dict) -> Model | None:
    obj = self.session.get(Model, id)
    if not obj:
        return None
    for key, value in updates.items():
        if hasattr(obj, key):
            setattr(obj, key, value)
    self.session.add(obj)
    self.session.commit()
    self.session.refresh(obj)
    return obj
```

### Delete
```python
def delete(self, id: int) -> bool:
    obj = self.session.get(Model, id)
    if not obj:
        return False
    self.session.delete(obj)
    self.session.commit()
    return True
```

## Custom Queries

```python
def get_by_email(self, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    return self.session.exec(statement).first()

def get_by_filter(self, filters: dict) -> list[Model]:
    statement = select(Model)
    for key, value in filters.items():
        if hasattr(Model, key):
            statement = statement.where(getattr(Model, key) == value)
    return list(self.session.exec(statement).all())
```
