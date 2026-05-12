# DTOs (Data Transfer Objects)

DTOs define the shape of request and response data.

## Structure

Use separate DTOs for creates, updates, and responses:

```python
from sqlmodel import SQLModel
from pydantic import EmailStr, Field


class YourCreateDTO(SQLModel):
    """Used for POST requests."""
    name: str
    email: EmailStr


class YourUpdateDTO(SQLModel):
    """Used for PUT requests. All fields optional."""
    name: str | None = None
    email: EmailStr | None = None


class YourResponseDTO(SQLModel):
    """Used for responses. Includes ID and read-only fields."""
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True  # Allow hydration from ORM objects
```

## Key Points

1. **Validation** — Pydantic validates on instantiation
2. **from_attributes=True** — Converts SQLModel instances to DTOs automatically
3. **Separate for creates/updates** — Allows different validation rules
4. **Never expose internal fields** — No password_hash, secrets, etc. in response
5. **Use Pydantic types** — EmailStr, HttpUrl, PositiveInt, etc.

## Field Aliases

```python
class UserResponseDTO(SQLModel):
    id: int
    user_email: str = Field(alias="email")  # Map email -> user_email in response
    
    class Config:
        from_attributes = True
        populate_by_name = True  # Allow both email and user_email in requests
```

## Optional Fields

```python
class UserUpdateDTO(SQLModel):
    name: str | None = None
    email: str | None = None
```

## Defaults

```python
class PortfolioCreateDTO(SQLModel):
    name: str
    cash_balance: float = Field(default=0.0)  # Default value
```
