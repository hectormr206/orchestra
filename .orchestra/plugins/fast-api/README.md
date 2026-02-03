# FastAPI Plugin for Orchestra CLI

Official plugin for enhanced FastAPI development support in Orchestra CLI.

## Features

### 🔍 Automatic Detection
Automatically detects FastAPI projects by checking for `fastapi` in `requirements.txt`, `pyproject.toml`, or `setup.py`.

### 📝 Enhanced Prompts
Provides FastAPI-specific context and best practices during the planning phase:
- APIRouter pattern guidance
- Dependency injection patterns
- Async/await best practices
- Pydantic model validation
- Security recommendations

### ✅ Validation
Validates generated FastAPI code for:
- Proper APIRouter structure
- Async handler usage
- Pydantic model validation
- Dependency injection patterns
- CORS setup
- Security middleware

### 💡 Best Practices Suggestions
Suggests improvements based on:
- Project structure (routers/, schemas/, dependencies/)
- Task context (routes, dependencies, errors)
- Common FastAPI patterns

## Installation

The plugin is included with Orchestra CLI. Simply ensure your project has FastAPI installed:

```bash
pip install fastapi
```

Orchestra will automatically detect and activate the plugin.

## Usage

The plugin automatically hooks into the Orchestra workflow:

### Planning Phase
```bash
orchestra start "Add user authentication with JWT"
```

The plugin will:
1. Detect FastAPI in your project
2. Enhance the prompt with FastAPI context
3. Suggest proper patterns for authentication in FastAPI

### Code Generation
```bash
orchestra start "Create a REST API for products"
```

The plugin will:
1. Generate code following FastAPI best practices
2. Suggest using APIRouter for modular routes
3. Recommend Pydantic models for validation
4. Use async def for route handlers

### Auditing
```bash
orchestra start "Audit my FastAPI application"
```

The plugin will:
1. Run FastAPI-specific audit rules
2. Check for security issues
3. Validate async handlers
4. Suggest improvements

## Audit Rules

The plugin includes 6 FastAPI-specific audit rules:

| Rule | Severity | Description |
|------|----------|-------------|
| `fastapi-router-structure` | Major | Validates proper FastAPI APIRouter usage |
| `fastapi-async-handlers` | Critical | Ensures routes use async def for performance |
| `fastapi-pydantic-models` | Critical | Checks for Pydantic model usage for validation |
| `fastapi-dependency-injection` | Major | Validates dependency injection with Depends() |
| `fastapi-cors` | Major | Validates CORS middleware setup |
| `fastapi-security` | Major | Checks for security middleware (HTTPS redirect, trusted hosts) |

## Configuration

The plugin can be configured via `.orchestrarc.json`:

```json
{
  "plugins": {
    "fast-api": {
      "enabled": true,
      "config": {
        "detectRouters": true,
        "detectDependencies": true,
        "suggestPatterns": true
      }
    }
  }
}
```

## Best Practices Enforced

### 1. APIRouter Pattern
```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/users")
async def get_users():
    return {"users": []}

# In main.py: app.include_router(router)
```

### 2. Dependency Injection
```python
from fastapi import Depends

async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/items/")
async def read_items(db: Session = Depends(get_db)):
    return {"items": []}
```

### 3. Pydantic Models
```python
from pydantic import BaseModel

class Item(BaseModel):
    name: str
    price: float
    is_offer: bool = False

@router.post("/items/")
async def create_item(item: Item):
    return item
```

### 4. Async Handlers
```python
@router.get("/async")
async def get_async_data():
    data = await fetch_data()
    return {"data": data}
```

### 5. Error Handling
```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )
```

## Example Output

When working on a FastAPI project, Orchestra will provide enhanced prompts:

```
You are working on a FastAPI application. Follow these patterns:

1. **Routes**: Use APIRouter for modular routes
2. **Async Handlers**: Use async def for route handlers
3. **Validation**: Use Pydantic models for request/response validation
4. **Dependency Injection**: Use Depends() for dependencies
5. **Error Handling**: Use exception handlers for custom errors
6. **CORS**: Add CORSMiddleware for cross-origin requests
7. **Security**: Add security middleware (HTTPSRedirectMiddleware, TrustedHostMiddleware)

Task: Add user authentication with JWT

Consider the FastAPI best practices when generating code.
```

## Development

To test the plugin:

```bash
npm test -- fastApiPlugin.test.ts
```

## License

MIT

## Author

Orchestra Team

## Version

0.1.0
