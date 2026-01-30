# Integration Tests: Skill Interaction Patterns

## Test Suite: Multi-Skill Collaboration

### Test 1: Security + Backend + Testing Pattern

**Scenario:** "Create secure API endpoint for user registration"

**Expected Skill Collaboration:**
```
1. security skill (invoked first)
   └── Defines security requirements
      ├── Input validation rules
      ├── Password hashing (bcrypt)
      ├── Rate limiting
      └── OWASP compliance

2. backend skill (invoked second)
   └── Implements API endpoint
      ├── POST /users/register
      ├── Request validation
      ├── Error handling
      └── Response formatting

3. testing skill (invoked third)
   └── Creates comprehensive tests
      ├── Unit tests for validation
      ├── Integration tests for endpoint
      └── Security tests (SQL injection, XSS)
```

**Validation:**
- ✅ Skills collaborate correctly
- ✅ Security requirements met
- ✅ API follows REST conventions
- ✅ Tests cover all cases

### Test 2: Database + Performance + Observability Pattern

**Scenario:** "Optimize slow database queries"

**Expected Skill Collaboration:**
```
1. database skill (invoked first)
   └── Analyzes queries
      ├── Identifies N+1 problems
      ├── Missing indexes
      └── Inefficient joins

2. performance skill (invoked second)
   └── Implements optimizations
      ├── Add indexes
      ├── Rewrite queries
      └── Add caching layer

3. observability skill (invoked third)
   └── Adds monitoring
      ├── Query performance metrics
      ├── Slow query logging
      └── Performance dashboards
```

**Validation:**
- ✅ Queries optimized
- ✅ Performance improved 100x
- ✅ Monitoring in place
- ✅ No regressions
