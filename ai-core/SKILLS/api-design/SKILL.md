---
name: api-design
description: >
  REST/GraphQL API design patterns: versioning, documentation, rate limiting,
  pagination, error responses, idempotency.
  Trigger: When designing APIs, versioning endpoints, or writing API docs.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Designing API contracts"
    - "Versioning APIs"
    - "Writing API documentation"
allowed-tools: [Read,Edit,Write,Grep]
---

## When to Use

- Designing REST/GraphQL APIs
- Planning API versioning strategy
- Implementing rate limiting
- Adding pagination
- Writing OpenAPI/Swagger docs

---

## Critical Patterns

### > **ALWAYS**

1. **Use nouns for resources, verbs for actions**
   ```
   GET    /users          → List users
   GET    /users/123      → Get user 123
   POST   /users          → Create user
   PUT    /users/123      → Update user 123
   DELETE /users/123      → Delete user 123
   POST   /users/123/deactivate → Action
   ```

2. **API Versioning**
   ```
   /api/v1/users
   /api/v2/users

   OR header-based:
   Accept: application/vnd.myapi.v2+json
   ```

3. **Return consistent response structure**
   ```json
   {
     "data": { ... },
     "meta": { "page": 1, "total": 100 },
     "errors": [ ... ]
   }
   ```

4. **Use appropriate HTTP verbs**
   | Verb | Safe | Idempotent | Usage |
   |------|------|------------|-------|
   | GET  | ✓ | ✓ | Fetch |
   | POST | ✗ | ✗ | Create |
   | PUT  | ✗ | ✓ | Replace |
   | PATCH| ✗ | ✗ | Modify |
   | DELETE| ✗ | ✓ | Delete |

5. **Pagination for list endpoints**
   ```
   GET /users?page=1&limit=20&sort=-created_at

   Response:
   {
     "data": [...],
     "meta": {
       "page": 1,
       "limit": 20,
       "total": 1000,
       "pages": 50
     },
     "links": {
       "next": "/users?page=2",
       "prev": null
     }
   }
   ```

6. **Rate limiting**
   ```
   RateLimit-Limit: 100
   RateLimit-Remaining: 95
   RateLimit-Reset: 1633020800

   429 Too Many Requests:
   {
     "error": "Rate limit exceeded",
     "retry_after": 60
   }
   ```

7. **Idempotency keys for non-idempotent operations**
   ```
   POST /charges
   Idempotency-Key: unique-key-12345
   ```

### > **NEVER**

1. **Don't return nested arrays**
   ```json
   // WRONG
   {
     "users": [
       {"name": "Alice", "orders": [
         {"id": 1, "items": [...]}
       ]}
     ]
   }

   // RIGHT - use separate endpoint with pagination
   GET /users/123/orders?page=1
   ```

2. **Don't use verbs in URLs (except actions)**
   ```
   /users/create     → WRONG (use POST /users)
   /users/123/get    → WRONG (use GET /users/123)
   /users/123/delete → WRONG (use DELETE /users/123)
   ```

3. **Don't expose internal IDs**
   ```
   /users/123                    → WRONG (sequential, reveals info)
   /users/a1b2c3d4-e5f6-7890  → RIGHT (UUID)
   ```

---

## REST vs GraphQL

| Aspect | REST | GraphQL |
|--------|------|---------|
| Overfetching | Common | Solves it |
| Caching | HTTP cache | Complex |
| Versioning | URL-based | @deprecated directive |
| Complexity | Simple | High |
| Monitoring | Easy | Harder |

---

## OpenAPI Example

```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
paths:
  /users:
    get:
      summary: List users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
```

---

## Resources

- **REST API Tutorial**: [restapitutorial.com](https://restapitutorial.com)
- **OpenAPI Specification**: [spec.openapis.org](https://spec.openapis.org/oas/latest.html)
- **GraphQL Best Practices**: [graphql.org/learn/best-practices](https://graphql.org/learn/best-practices)

---

## Examples

### Example 1: Designing a REST API for User Management

**User request:** "Design a REST API for managing users in a SaaS application"

**API Design:**

```yaml
# API Endpoints
GET    /api/v1/users                    # List users (paginated)
GET    /api/v1/users/:id                # Get specific user
POST   /api/v1/users                    # Create user
PATCH  /api/v1/users/:id                # Update user (partial)
DELETE /api/v1/users/:id                # Delete user
GET    /api/v1/users/:id/orders         # Get user's orders (nested resource)

# Request Examples

# Create user
POST /api/v1/users
Content-Type: application/json

{
  "user": {
    "email": "user@example.com",
    "password": "secure_password",
    "profile": {
      "name": "John Doe",
      "company": "Acme Corp"
    }
  }
}

# Response
201 Created
Location: /api/v1/users/123

{
  "data": {
    "id": "123",
    "email": "user@example.com",
    "profile": {
      "name": "John Doe",
      "company": "Acme Corp"
    },
    "created_at": "2024-01-23T10:00:00Z",
    "updated_at": "2024-01-23T10:00:00Z"
  },
  "meta": {
    "version": "1.0"
  }
}

# List users with pagination
GET /api/v1/users?page=1&limit=20&sort=-created_at

{
  "data": [
    { "id": "123", "email": "user1@example.com", ... },
    { "id": "124", "email": "user2@example.com", ... }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "pages": 8
  },
  "links": {
    "self": "/api/v1/users?page=1",
    "next": "/api/v1/users?page=2",
    "last": "/api/v1/users?page=8"
  }
}
```

**Best practices applied:**
- ✅ Noun-based resource URLs (/users)
- ✅ HTTP verbs for actions (GET, POST, PATCH, DELETE)
- ✅ API versioning in URL (/api/v1/)
- ✅ Pagination with metadata
- ✅ Consistent response structure (data, meta, links)
- ✅ Proper status codes (201 Created with Location header)
- ✅ Nested resources for relationships (/users/:id/orders)
