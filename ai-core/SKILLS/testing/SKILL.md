---
name: testing
description: >
  Strategic testing patterns: Test Pyramid, TDD, mocking, integration tests,
  E2E testing, coverage goals, edge cases.
  Trigger: When writing tests, reviewing test coverage, or setting up test infrastructure.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Writing tests (unit, integration, E2E)"
    - "Reviewing test coverage"
    - "Setting up test infrastructure"
allowed-tools: [Read,Edit,Write,Bash,Grep]
---

## When to Use

- Writing new features (test-first or test-after)
- Debugging failing tests
- Setting up CI/CD test pipelines
- Reviewing PR test coverage
- Refactoring (tests as safety net)

---

## Critical Patterns

### > **ALWAYS**

1. **Follow the Test Pyramid**
   ```
        E2E         10% - Slow, expensive, fragile
       /------------------\
      /   Integration     20% - Medium speed, medium cost
     /-----------------------\
    /        Unit               70% - Fast, cheap, abundant
   /_______________________________\
   ```

2. **Use Arrange-Act-Assert (AAA) pattern**
   ```python
   def test_user_creation():
       # Arrange
       user_data = {"name": "Alice", "email": "alice@example.com"}

       # Act
       user = User.create(user_data)

       # Assert
       assert user.name == "Alice"
       assert user.id is not None
   ```

3. **Test behavior, not implementation**
   ```python
   # BAD - tests implementation detail
   def test_get_user_calls_db():
       mock_db.assert_called_with("SELECT * FROM users")

   # GOOD - tests behavior
   def test_get_user_returns_correct_user():
       user = get_user(123)
       assert user.id == 123
   ```

4. **Mock external dependencies**
   - Databases, APIs, file system
   - Time, random, UUIDs
   - Keep tests fast and isolated

5. **Test edge cases**
   - Empty inputs
   - Null/None values
   - Boundary conditions (0, -1, MAX_INT)
   - Duplicate data
   - Concurrent operations

6. **Use descriptive test names**
   ```python
   # BAD
   def test_1():

   # GOOD
   def test_user_cannot_login_with_wrong_password():
   ```

7. **Each test should be independent**
   - Can run in any order
   - No shared state between tests
   - Clean up in `tearDown()` or fixtures

### > **NEVER**

1. **Don't test third-party code**
   - Trust that libraries work
   - Test YOUR integration with them

2. **Don't test trivial code**
   - Getters/setters
   - Simple pass-through functions

3. **Don't write fragile tests**
   - Avoid exact string matches on UI
   - Avoid sleep() waits (use polling)
   - Avoid brittle selectors

4. **Don't ignore failing tests**
   - Fix or delete, never ignore

5. **Don't write tests without assertions**
   ```python
   # BAD - no assertion
   def test_something():
       result = calculate(1, 2)

   # GOOD
   def test_something():
       result = calculate(1, 2)
       assert result == 3
   ```

---

## Coverage Goals

| Metric | Target | Notes |
|--------|--------|-------|
| Line coverage | 80%+ | Below 60% = risky |
| Branch coverage | 70%+ | Critical paths should be 100% |
| Critical paths | 100% | Auth, payments, data modification |

**Note**: 100% coverage is NOT a goal. Aim for *meaningful* coverage.

---

## Test Types

### Unit Tests
- **Scope**: Single function/class
- **Speed**: < 1ms each
- **Isolation**: Mock everything external
- **Example**:
  ```python
  def test_calculate_tax():
      assert calculate_tax(100, 0.1) == 10
  ```

### Integration Tests
- **Scope**: Multiple components working together
- **Speed**: 10-500ms each
- **Isolation**: Use test database, mock external APIs
- **Example**:
  ```python
  def test_create_order_in_db():
      response = client.post("/orders", json={...})
      assert response.status_code == 201
      assert db.query(Order).count() == 1
  ```

### E2E Tests
- **Scope**: Full user flow
- **Speed**: 1-10s each
- **Isolation**: None (real browser, real API)
- **Example**:
  ```python
  def test_user_checkout_flow():
      browser.visit("/login")
      browser.fill("email", "user@example.com")
      browser.click("Login")
      browser.visit("/products/1")
      browser.click("Add to Cart")
      browser.click("Checkout")
      assert browser.is_text_present("Order confirmed")
  ```

---

## TDD Workflow (Red-Green-Refactor)

```
1. RED    → Write failing test
2. GREEN  → Write minimal code to pass
3. REFACTOR → Clean up while tests pass
```

---

## Examples

### Unit Test with Mock (Python)
```python
from unittest.mock import patch

def test_send_email_notification():
    with patch('smtplib.SMTP') as mock_smtp:
        send_notification("user@example.com", "Hello")

        # Assert email was sent
        mock_smtp.return_value.send_message.assert_called_once()
```

### Integration Test (Node.js)
```javascript
describe('POST /api/users', () => {
  it('creates a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Alice', email: 'alice@example.com' })
      .expect(201);

    expect(response.body.name).toBe('Alice');
    expect(response.body.id).toBeDefined();
  });
});
```

### E2E Test (Playwright)
```typescript
test('user login flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Commands

```bash
# Run all tests
npm test
pytest

# Run specific file
pytest tests/test_auth.py
npm test -- login.test.js

# Run with coverage
pytest --cov=.
npm test -- --coverage

# Watch mode (re-run on changes)
pytest --watch
npm test -- --watch

# Debug failing test
pytest -xvs  # stop on first failure, verbose
npm test -- --debug
```

---

## Resources

- **Test Pyramid**: [martinfowler.com](https://martinfowler.com/articles/practical-test-pyramid.html)
- **Testing Best Practices**: [testingjavascript.com](https://testingjavascript.com)
- **Given-When-Then**: [martinfowler.com](https://martinfowler.com/bliki/GivenWhenThen.html)
