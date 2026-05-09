# Controllers

Controllers wire up services and handle HTTP requests/responses.

## Dependency Factory

Create a factory function that provides a fresh service per request:

```python
from fastapi import Depends
from ...database import get_session

def get_your_service(session: Session = Depends(get_session)) -> YourService:
    return YourService(session)
```

**Why?**
- Fresh service instance per request
- Fresh session per request
- Automatic cleanup after response
- No session sharing or concurrency issues

## Route Definition

```python
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/yourmodel", tags=["yourmodel"])


@router.post("/", response_model=YourResponseDTO)
def create(
    data: YourCreateDTO,
    service: YourService = Depends(get_your_service)
):
    return service.create(data)


@router.get("/{id}", response_model=YourResponseDTO)
def read(id: int, service: YourService = Depends(get_your_service)):
    obj = service.get_by_id(id)
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return obj


@router.get("/", response_model=list[YourResponseDTO])
def list_all(service: YourService = Depends(get_your_service)):
    return service.get_all()


@router.put("/{id}", response_model=YourResponseDTO)
def update(
    id: int,
    updates: dict,
    service: YourService = Depends(get_your_service)
):
    obj = service.update(id, updates)
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return obj


@router.delete("/{id}")
def delete(id: int, service: YourService = Depends(get_your_service)):
    success = service.delete(id)
    if not success:
        raise HTTPException(status_code=404, detail="Not found")
    return {"deleted": True}
```

## Controller Responsibilities

1. **Parse HTTP requests** — Extract query/path/body params
2. **Call service methods** — Pass cleaned data
3. **Handle errors** — Convert service exceptions to HTTP responses
4. **Format responses** — Use response_model DTOs
5. **Return status codes** — 200, 201, 404, 409, etc.

## Error Handling

```python
@router.post("/", response_model=YourResponseDTO)
def create(data: YourCreateDTO, service: YourService = Depends(get_your_service)):
    try:
        return service.create(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal error")
```

## Register Router in Main

```python
# backend/app/main.py
from .epics.your_epic.YourController import router as your_router

app.include_router(your_router)
```
