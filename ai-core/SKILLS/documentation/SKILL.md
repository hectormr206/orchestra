---
name: documentation
description: >
  Documentation best practices: README structure, API docs, architecture
  decision records (ADRs), inline comments.
  Trigger: When writing README, API documentation, or ADRs.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Writing README or docs"
    - "Documenting APIs"
    - "Recording architecture decisions"
allowed-tools: [Read,Edit,Write]
---

## When to Use

- Creating/updating README.md
- Writing API documentation
- Documenting architecture decisions
- Adding code comments

---

## Critical Patterns

### > **ALWAYS**

1. **README.md Structure**
   ```markdown
   # Project Name

   ## Description
   One-liner + longer description

   ## Features
   - Feature 1
   - Feature 2

   ## Installation
   ```bash
   npm install
   ```

   ## Quick Start
   ```bash
   npm start
   ```

   ## Usage
   Examples and use cases

   ## API Reference
   Link to full API docs

   ## Contributing
   Link to CONTRIBUTING.md

   ## License
   MIT
   ```

2. **API Documentation**
   ```yaml
   # OpenAPI/Swagger preferred
   endpoints:
     GET /api/users:
       summary: List all users
       parameters:
         - name: page
           in: query
           schema:
             type: integer
       responses:
         '200':
           description: Success
   ```

3. **Architecture Decision Records (ADRs)**
   ```markdown
   # ADR-001: Use PostgreSQL for primary database

   ## Status
   Accepted

   ## Context
   We need a relational database for transactional integrity.

   ## Decision
   Use PostgreSQL as our primary database.

   ## Consequences
   - Positive: ACID compliance, mature ecosystem
   - Negative: Requires manual scaling for writes
   ```

4. **Code Comments: WHY, not WHAT**
   ```python
   # WRONG - obvious
   i = i + 1  # increment i

   # RIGHT - explains reasoning
   # Start from 1 because 0 is reserved for admin
   for i in range(1, 10):
   ```

5. **Changelog**
   ```markdown
   # Changelog

   ## [1.2.0] - 2024-01-15
   ### Added
   - User authentication

   ### Changed
   - Updated dependency X to v2.0

   ### Fixed
   - Login bug on Safari

   ## [1.1.0] - 2024-01-01
   ```

6. **Document Edge Cases**
   ```python
   def process_payment(amount):
       # Handle zero amount (e.g., promo code)
       if amount == 0:
           return create_free_order()

       # Minimum payment: $0.50 (payment gateway limitation)
       if amount < 0.50:
           raise PaymentError("Minimum payment is $0.50")
   ```

### > **NEVER**

1. **Don't document outdated information**
   - Keep docs in sync with code
   - Review docs when changing features

2. **Don't write obvious comments**
   ```python
   # WRONG
   function add(a, b) {
       return a + b  # adds a and b
   }

   # RIGHT - no comment needed
   function add(a, b) {
       return a + b
   }
   ```

3. **Don't leave TODO comments without context**
   ```python
   # EXAMPLE: Bad vs good TODO comments
   # WRONG
   # EXAMPLE: # TODO: fix this

   # RIGHT
   # EXAMPLE: # TODO: Refactor when we upgrade to Python 3.12
   # Currently using workaround for bug in Python 3.9
   # See: https://github.com/python/cpython/issues/12345
   ```

---

## ADR Template

```markdown
# ADR-XXX: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-YYY]

## Context
[What is the issue we're facing?]

## Decision
[What did we decide?]

## Consequences
- [Positive outcomes]
- [Negative outcomes]
```

---

## API Documentation Example

```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0
  description: |
    User management API.

    ## Authentication
    All endpoints require Bearer token.

    ## Rate Limiting
    100 requests per minute.
```

---

## Resources

- **Writing READMEs**: [www.makeareadme.com](https://www.makeareadme.com)
- **ADR Template**: [adr.github.io](https://adr.github.io)
- **OpenAPI Specification**: [spec.openapis.org](https://spec.openapis.org)
- **Documentation Style Guide**: [diataxis.fr](https://diataxis.fr)

---

## Examples

### Example 1: Writing API Documentation with OpenAPI

```yaml
# OpenAPI 3.0 specification
openapi: 3.0.0
info:
  title: User Management API
  version: 1.0.0
  description: API for managing users in the system

paths:
  /users:
    get:
      summary: List all users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  meta:
                    $ref: '#/components/schemas/PaginationMeta'
    
    post:
      summary: Create new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreate'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        email:
          type: string
          format: email
        name:
          type: string
        created_at:
          type: string
          format: date-time
    
    UserCreate:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
        name:
          type: string
    
    PaginationMeta:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
