---
name: backend
description: >
  Universal backend patterns: API design, validation, error handling,
  authentication, rate limiting, logging.
  Trigger: When creating API endpoints, validating data, or implementing business logic.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Creating API endpoints"
    - "Validating incoming data"
    - "Implementing business logic"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Creating REST/GraphQL endpoints
- Implementing business logic
- Validating request data
- Handling errors
- Implementing authentication
- Processing background jobs

---

## Critical Patterns

### > **ALWAYS**

1. **Validate input early**
   ```python
   # Request handler
   def create_user(request):
       # Validate first
       data = UserCreateSchema.validate(request.json)
       # Then business logic
       user = User.create(data)
       return jsonify(user), 201
   ```

2. **Use appropriate HTTP status codes**
   | Code | Usage |
   |------|-------|
   | 200  | Success |
   | 201  | Created |
   | 204  | No Content (delete) |
   | 400  | Bad Request (validation) |
   | 401  | Unauthorized (no auth) |
   | 403  | Forbidden (auth but no permission) |
   | 404  | Not Found |
   | 409  | Conflict (duplicate) |
   | 422  | Unprocessable Entity |
   | 500  | Internal Server Error |

3. **Return consistent error responses**
   ```json
   {
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Email is required",
       "details": {"email": ["This field is required."]}
     }
   }
   ```

4. **Log structured data**
   ```python
   logger.info("user_created", extra={
       "user_id": user.id,
       "email": user.email,
       "ip_address": request.remote_addr
   })
   ```

5. **Sanitize output**
   - Remove internal fields (password, internal_id)
   - Serialize dates to ISO 8601
   - Handle circular references

6. **Use async for I/O operations**
   - Database queries
   - External API calls
   - File operations

7. **Implement idempotency**
   ```python
   # Idempotent delete
   @app.route("/users/:id", methods=["DELETE"])
   def delete_user(id):
       if user := db.get(id):
           user.delete()
       return "", 204  # Always 204, even if not found
   ```

### > **NEVER**

1. **Don't trust client validation**
   - Always validate server-side

2. **Don't return raw stack traces to clients**
   - Log internally, return generic error

3. **Don't block the event loop**
   ```python
   # WRONG - blocking
   def process_large_file():
       data = file.read()  # Blocks!

   # RIGHT - async
   async def process_large_file():
       data = await file.read()
   ```

4. **Don't hardcode URLs**
   ```python
   # WRONG
   return redirect("http://localhost:3000/dashboard")

   # RIGHT
   return redirect(url_for("dashboard", _external=True))
   ```

5. **Don't ignore errors**
   ```python
   # WRONG
   try:
       db.commit()
   except:
       pass

   # RIGHT
   try:
       db.commit()
   except DatabaseError as e:
       logger.error("Database commit failed", error=str(e))
       raise
   ```

---

## API Endpoint Structure

```python
@app.route("/api/users", methods=["POST"])
def create_user():
    # 1. Validate
    try:
        data = UserCreateSchema.validate(request.json)
    except ValidationError as e:
        return jsonify({"error": e.messages}), 400

    # 2. Business logic
    try:
        user = User.create(data)
    except DuplicateError:
        return jsonify({"error": "Email already exists"}), 409

    # 3. Response
    return jsonify(UserSchema.dump(user)), 201
```

---

## Validation Patterns

```python
from pydantic import BaseModel, EmailStr, Field

class UserCreateSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    age: int = Field(ge=18, le=120)

    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepass123",
                "age": 25
            }
        }
```

---

## Error Handling

```python
class APIError(Exception):
    def __init__(self, code, message, details=None):
        self.code = code
        self.message = message
        self.details = details

@app.errorhandler(APIError)
def handle_api_error(error):
    logger.error(f"API Error: {error.code}", extra={
        "message": error.message,
        "details": error.details
    })
    return jsonify({
        "error": {
            "code": error.code,
            "message": error.message,
            "details": error.details
        }
    }), 400
```

---

## GraphQL API Development

### Schema Validation

```graphql
# typeDefinitions.graphql
# GraphQL schema with input validation

input CreateUserInput {
  email: String! @constraint(format: "email")
  password: String! @constraint(minLength: 8, maxLength: 100)
  age: Int @constraint(min: 18, max: 120)
}

type Mutation {
  createUser(input: CreateUserInput!): UserPayload!
}

# Validation happens at schema level
# Use directives to enforce constraints
```

### GraphQL Security Best Practices

```javascript
const { ApolloServer } = require('apollo-server-express');
const { gql } = require('graphql-tag');

const typeDefs = gql`
  type Query {
    me: User
    user(id: ID!): User
  }

  # Add depth limiting to prevent deep queries
  extend type Query {
    user(id: ID!): User
      @auth(requires: "USER")
      @rateLimit(window: "60s", max: 30, message: "Too many requests")
  }
`;

const server = new ApolloServer({
  typeDefs,
  context: ({ req }) => ({
    user: getCurrentUser(req),
  }),

  // 1. Query depth limiting
  validationRules: [
    queryDepth(5),  // Max 5 levels deep
  ],

  // 2. Query complexity limiting
  validationRules: [
    queryComplexity({
      maximum: 1000,  # Max complexity score
      variables: depth => ({ complexity }) => {
        if (depth > 3) {
          return complexity * 2;  // Penalize deep queries
        }
        return complexity;
      },
    }),
  ],
});
```

### GraphQL Error Handling

```javascript
const { GraphQLError } = require('graphql');

class AuthenticationError extends GraphQLError {
  constructor(message) {
    super(message, {
      extensions: {
        code: 'AUTHENTICATION_ERROR',
      },
    });
  }
}

class ValidationError extends GraphQLError {
  constructor(message, details) {
    super(message, {
      extensions: {
        code: 'VALIDATION_ERROR',
        details,
      },
    });
  }
}

// Usage in resolvers
const resolvers = {
  Mutation: {
    createUser: (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }

      // Validate input
      if (!isValidEmail(input.email)) {
        throw new ValidationError('Invalid email format', {
          field: 'email',
          value: input.email,
        });
      }

      return createUser(input);
    },
  },
};
```

---

## Rate Limiting Implementation

### Token Bucket Algorithm

```python
from fastapi import FastAPI, Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
import time

app = FastAPI()
limiter = Limiter(key_func=get_remote_address)

# Token bucket store
token_buckets = {}  # { ip: {tokens, last_refill} }

class TokenBucket:
    def __init__(self, rate: int, per: int):
        self.rate = rate  # tokens per period
        self.per = per    # period in seconds
        self.tokens = rate
        self.last_refill = time.time()

    def consume(self, tokens: int = 1) -> bool:
        now = time.time()
        elapsed = now - self.last_refill

        # Refill tokens based on elapsed time
        tokens_to_add = int(elapsed * self.rate / self.per)
        self.tokens = min(self.rate, self.tokens + tokens_to_add)
        self.last_refill = now

        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False

# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    ip = get_remote_address(request)

    # Get or create bucket for this IP
    if ip not in token_buckets:
        token_buckets[ip] = TokenBucket(rate=100, per=60)  # 100 req/min

    bucket = token_buckets[ip]

    # Check if request is allowed
    if not bucket.consume():
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded", "retry_after": 60}
        )

    response = await call_next(request)
    return response
```

### Sliding Window Log

```python
from collections import deque, defaultdict
import time

class SlidingWindowRateLimiter:
    def __init__(self, rate: int, window: int):
        self.rate = rate
        self.window = window
        self.requests = defaultdict(deque)

    def is_allowed(self, identifier: str) -> bool:
        now = time.time()
        timestamps = self.requests[identifier]

        # Remove timestamps outside the window
        while timestamps and timestamps[0] <= now - self.window:
            timestamps.popleft()

        # Check if under the rate limit
        if len(timestamps) < self.rate:
            timestamps.append(now)
            return True

        return False

# Usage
@app.get("/api/expensive")
@limiter.limit("10/minute")
async def expensive_operation():
    return {"status": "ok"}
```

### API Gateway Rate Limiting

```yaml
# Kong API Gateway configuration
plugins:
  - name: rate-limiting
    config:
      minute: 100
      hour: 1000
      policy: local
      fault_tolerant: true

  - name: rate-limiting-advanced
    config:
      limit: [100, 1000]  # [minute, hour]
      window: [60, 3600]   # [minute, hour]
      redis:
        host: redis.example.com
        port: 6379
        database: 1
```

---

## OpenAPI (Swagger) Specification

### Complete OpenAPI 3.1 Specification

```yaml
# openapi.yaml
openapi: 3.1.0
info:
  title: User Management API
  version: 2.0.0
  description: API for managing users in the system
  contact:
    name: API Support
    email: support@example.com
    url: https://example.com/support
  license:
    name: Apache 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0.html

servers:
  - url: https://api.example.com/v2
    description: Production server
  - url: https://staging-api.example.com/v2
    description: Staging server
  - url: http://localhost:8000/v2
    description: Local development server

tags:
  - name: users
    description: User operations
  - name: auth
    description: Authentication operations

paths:
  /users:
    get:
      summary: List all users
      operationId: listUsers
      tags:
        - users
      security:
        - OAuth2: []
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
              example:
                - id: 1
                  email: "user@example.com"
                  name: "John Doe"
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
            minimum: 1
          description: Page number
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            minimum: 1
            maximum: 100
          description: Number of items per page

    post:
      summary: Create a new user
      operationId: createUser
      tags:
        - users
      security:
        - OAuth2: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserInput'
            examples:
              john_doe:
                summary: Create user John Doe
                value:
                  email: "john.doe@example.com"
                  password: "SecurePass123!"
                  name: "John Doe"
                  age: 25
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
              examples:
                created_user:
                  summary: User created
                  value:
                    id: 123
                    email: "john.doe@example.com"
                    name: "John Doe"
                    created_at: "2025-01-23T10:30:00Z"
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/ValidationError'

  /users/{userId}:
    get:
      summary: Get user by ID
      operationId: getUserById
      tags:
        - users
      security:
        - OAuth2: []
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: integer
          description: Unique user ID
          example: 123
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
        - name
      properties:
        id:
          type: integer
          description: User ID
          example: 123
        email:
          type: string
          format: email
          description: User email address
          example: user@example.com
        name:
          type: string
          description: User full name
          example: John Doe
        created_at:
          type: string
          format: date-time
          description: Account creation timestamp
          example: "2025-01-23T10:30:00Z"
        updated_at:
          type: string
          format: date-time
          description: Last update timestamp
          example: "2025-01-23T10:30:00Z"

    CreateUserInput:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
          example: user@example.com
        password:
          type: string
          format: password
          minLength: 8
          maxLength: 100
          example: SecurePass123!
        name:
          type: string
          minLength: 2
          maxLength: 100
          example: John Doe
        age:
          type: integer
          minimum: 18
          maximum: 120
          example: 25

  responses:
    Unauthorized:
      description: Authentication failed
      content:
        application/json:
          schema:
            type: object
            required:
              - error
            properties:
              error:
                type: string
                example: Unauthorized
              code:
                type: string
                example: AUTH_FAILED

    Forbidden:
      description: User doesn't have permission
      content:
        application/json:
          schema:
            type: object
            required:
              - error
            properties:
              error:
                type: string
                example: Forbidden
              code:
                type: string
                example: INSUFFICIENT_PERMISSIONS

    BadRequest:
      description: Invalid request data
      content:
        application/json:
          schema:
            type: object
            required:
              - error
            properties:
              error:
                type: string
                example: Bad Request
              code:
                type: string
                example: VALIDATION_ERROR
              details:
                type: object
                additionalProperties: true

    Conflict:
      description: Resource already exists
      content:
        application/json:
          schema:
            type: object
            required:
              - error
            properties:
              error:
                type: string
                example: Resource conflict
              code:
                type: string
                example: RESOURCE_EXISTS
              details:
                type: object
                properties:
                  field:
                    type: string
                    example: email
              example:
                field: "email"
                message: "Email already exists"

    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            type: object
            required:
              - error
            properties:
              error:
                type: string
                example: Not found
              code:
                type: string
                example: NOT_FOUND

    ValidationError:
      description: Input validation failed
      content:
        application/json:
          schema:
            type: object
            required:
              - error
            properties:
              error:
                type: string
                example: Validation failed
              code:
                type: string
                example: VALIDATION_ERROR
              details:
                type: object
                additionalProperties: true

# Generate OpenAPI docs
# Use swagger-ui-express for serving docs
```

---

## Commands

```bash
# Run development server with hot reload
uvicorn main:app --reload
nodemon server.js

# Check API health
curl http://localhost:8000/health

# Run load test
ab -n 1000 -c 10 http://localhost:8000/api/users
```

---

## Resources

- **REST API Tutorial**: [restapitutorial.com](https://restapitutorial.com)
- **HTTP Status Codes**: [developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- **API Best Practices**: [github.com/microsoft/api-guidelines](https://github.com/microsoft/api-guidelines)

---

## Examples

### Example 1: Building a REST API with FastAPI

**User request:** "Create a REST API for a task management system"

**Implementation:**

```python
from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional
from datetime import datetime
import uvicorn

app = FastAPI(
    title="Task Management API",
    version="1.0.0",
    description="REST API for managing tasks and users"
)

# Models
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: int = 1
    due_date: Optional[datetime] = None
    
    @validator('priority')
    def validate_priority(cls, v):
        if not 1 <= v <= 5:
            raise ValueError('Priority must be between 1 and 5')
        return v

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    user_id: int
    status: str = "pending"
    created_at: datetime
    
    class Config:
        from_attributes = True

# In-memory database (use real DB in production)
tasks_db: List[Task] = []
task_id_counter = 1

# Endpoints
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.get("/tasks", response_model=List[Task], tags=["Tasks"])
async def list_tasks(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None
):
    """List all tasks with pagination and filtering"""
    tasks = tasks_db
    
    if status:
        tasks = [t for t in tasks if t.status == status]
    
    return tasks[skip : skip + limit]

@app.get("/tasks/{task_id}", response_model=Task, tags=["Tasks"])
async def get_task(task_id: int):
    """Get a specific task by ID"""
    task = next((t for t in tasks_db if t.id == task_id), None)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found"
        )
    
    return task

@app.post("/tasks", 
          response_model=Task,
          status_code=status.HTTP_201_CREATED,
          tags=["Tasks"])
async def create_task(task: TaskCreate, user_id: int = 1):
    """Create a new task"""
    global task_id_counter
    
    new_task = Task(
        id=task_id_counter,
        user_id=user_id,
        **task.dict(),
        created_at=datetime.utcnow()
    )
    tasks_db.append(new_task)
    task_id_counter += 1
    
    return new_task

@app.patch("/tasks/{task_id}", response_model=Task, tags=["Tasks"])
async def update_task(task_id: int, updates: dict):
    """Partially update a task"""
    task = next((t for t in tasks_db if t.id == task_id), None)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found"
        )
    
    # Update only provided fields
    for key, value in updates.items():
        if hasattr(task, key):
            setattr(task, key, value)
    
    return task

@app.delete("/tasks/{task_id}", 
           status_code=status.HTTP_204_NO_CONTENT,
           tags=["Tasks"])
async def delete_task(task_id: int):
    """Delete a task"""
    global tasks_db
    
    task = next((t for t in tasks_db if t.id == task_id), None)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found"
        )
    
    tasks_db = [t for t in tasks_db if t.id != task_id]
    return None

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
```

**Best practices applied:**
- ✅ Input validation with Pydantic
- ✅ Proper HTTP status codes (404, 201, 204)
- ✅ Pagination support (skip, limit)
- ✅ Partial updates with PATCH
- ✅ OpenAPI documentation auto-generated
- ✅ Error handling with HTTPException
