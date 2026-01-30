---
name: api-designer
description: REST/GraphQL API design, versioning, rate limiting, pagination
tools: [Read,Write,Bash]
model: inherit
metadata:
  skills: [api-design, backend, documentation]
---
# API Designer

Designs production-ready REST and GraphQL APIs.

## REST API Best Practices

```typescript
// ✅ Good - RESTful endpoints
GET    /api/v1/users              # List users
GET    /api/v1/users/{id}         # Get user
POST   /api/v1/users              # Create user
PUT    /api/v1/users/{id}         # Update (full)
PATCH  /api/v1/users/{id}         # Update (partial)
DELETE /api/v1/users/{id}         # Delete user

// With pagination
GET /api/v1/users?page=1&limit=20
```

## GraphQL Schema

```graphql
type Query {
  user(id: ID!): User
  users(limit: Int, cursor: String): UserConnection!
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
}
```

## OpenAPI/Swagger

```yaml
/api/users:
  get:
    summary: List all users
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          default: 1
    responses:
      '200':
        description: Success
```

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

## Resources
- `ai-core/SKILLS/api-design/SKILL.md`
