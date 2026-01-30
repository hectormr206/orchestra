---
name: e2e-testing
description: >
  Enterprise-grade E2E testing patterns: Page Object Model, data-driven testing,
  visual regression, cross-browser, mobile E2E, API E2E, test data management,
  CI/CD integration, performance testing, accessibility E2E, flaky test management.
  Trigger: When creating E2E tests, setting up E2E infrastructure, or E2E automation.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Creating E2E tests"
    - "Setting up E2E test infrastructure"
    - "E2E test automation"
    - "Playwright/Cypress/Selenium setup"
    - "Cross-browser testing"
    - "Mobile E2E testing"
    - "Visual regression testing"
allowed-tools: [Read,Edit,Write,Bash,Grep]
---

## When to Use

- Creating end-to-end test suites
- Setting up E2E test infrastructure (Playwright, Cypress, Selenium)
- Implementing Page Object Model
- Configuring cross-browser testing
- Mobile app E2E testing
- Visual regression testing
- API E2E testing
- CI/CD integration for E2E tests
- Performance testing in E2E
- Accessibility E2E testing
- Managing flaky tests

---

## Critical Patterns

### > **ALWAYS**

1. **Use Page Object Model (POM)**
   - Separate page structure from test logic
   - Reusable page components
   - Single source of truth for selectors
   ```typescript
   // pages/LoginPage.ts
   class LoginPage {
     readonly emailInput = this.page.locator('input[name="email"]');
     readonly passwordInput = this.page.locator('input[name="password"]');
     readonly submitButton = this.page.locator('button[type="submit"]');

     async login(email: string, password: string) {
       await this.emailInput.fill(email);
       await this.passwordInput.fill(password);
       await this.submitButton.click();
     }
   }
   ```

2. **Use data-testid selectors**
   - Stable across CSS changes
   - Semantic and self-documenting
   ```html
   <!-- BAD -->
   <button class="btn btn-primary btn-lg">Submit</button>

   <!-- GOOD -->
   <button data-testid="login-submit-button">Submit</button>
   ```

3. **Wait for elements, don't sleep**
   ```typescript
   // BAD
   await page.waitForTimeout(5000);

   // GOOD
   await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
   ```

4. **Use test data management**
   - Factories for test data
   - Fixtures for setup/teardown
   - Isolated test data per test

5. **Test one thing per test**
   - Clear failure reasons
   - Easier debugging
   - Faster feedback

6. **Clean up after tests**
   - Delete created resources
   - Reset state
   - Clear storage/cookies

7. **Use base URLs for environments**
   ```typescript
   // playwright.config.ts
   use: {
     baseURL: process.env.BASE_URL || 'http://localhost:3000',
   }
   ```

8. **Run tests in parallel**
   - Faster execution
   - Better resource utilization
   - Configure workers appropriately

### > **NEVER**

1. **Don't hardcode timeouts**
   - Use explicit waits/expectations
   - Timeouts make tests slow and flaky

2. **Don't test third-party services**
   - Mock external APIs
   - Test your integration, not theirs

3. **Don't share state between tests**
   - Each test should be independent
   - Can run in any order

4. **Don't use selectors that break easily**
   ```typescript
   // BAD - CSS classes can change
   page.locator('.btn-primary')

   // BAD - XPath is fragile
   page.locator('//div[3]/button')

   // GOOD - stable and semantic
   page.locator('[data-testid="submit-button"]')
   ```

5. **Don't ignore flaky tests**
   - Fix them, don't retry them into silence
   - Retries hide real problems

6. **Don't test everything in E2E**
   - Follow the Test Pyramid (10% E2E)
   - Critical user flows only

---

## Framework Comparison

| Feature | Playwright | Cypress | Selenium | Puppeteer |
|---------|-----------|---------|----------|-----------|
| **Speed** | ⚡ Fast | 🐢 Slow | 🐢 Slow | ⚡ Fast |
| **Reliability** | ✅ High | ✅ High | ⚠️ Medium | ⚠️ Medium |
| **Auto-wait** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Parallel** | ✅ Native | ⚠️ Paid | ✅ Yes | ⚠️ Manual |
| **Cross-browser** | ✅ All | ✅ All | ✅ All | ❌ Chrome only |
| **API Testing** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Mobile** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Learning Curve** | 📈 Medium | 📈 Medium | 📈 High | 📈 Low |
| **Maintenance** | ✅ Low | ✅ Low | ⚠️ High | ⚠️ High |

**Recommendation**: Use **Playwright** for new projects (best balance of speed, reliability, features).

---

## Page Object Model (POM)

### Structure

```
tests/
├── e2e/
│   ├── pages/
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   └── CheckoutPage.ts
│   ├── fixtures/
│   │   └── auth.ts
│   └── specs/
│       ├── auth.spec.ts
│       └── checkout.spec.ts
```

### Base Page Pattern

```typescript
// pages/BasePage.ts
import { Page, Locator } from '@playwright/test';

export class BasePage {
  constructor(readonly page: Page) {}

  async navigate(path: string) {
    await this.page.goto(path);
  }

  async click(locator: Locator) {
    await locator.click();
  }

  async fill(locator: Locator, value: string) {
    await locator.fill(value);
  }

  async waitForVisible(locator: Locator) {
    await expect(locator).toBeVisible();
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
```

### Login Page Example

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.submitButton = page.locator('[data-testid="login-submit-button"]');
    this.errorMessage = page.locator('[data-testid="login-error"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async navigateToLogin() {
    await this.navigate('/login');
  }

  async getErrorMessage(): Promise<string> {
    await this.waitForVisible(this.errorMessage);
    return await this.errorMessage.textContent();
  }
}
```

### Test Using POM

```typescript
// specs/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Authentication', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigateToLogin();
  });

  test('should login with valid credentials', async ({ page }) => {
    await loginPage.login('user@example.com', 'password123');

    // Assert - redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(dashboardPage.welcomeMessage).toContainText('Welcome');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await loginPage.login('wrong@example.com', 'wrongpass');

    // Assert - error message shown
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Invalid credentials');
    await expect(page).toHaveURL('/login');
  });
});
```

---

## Data-Driven Testing

### CSV File Approach

```typescript
// specs/login-data-driven.spec.ts
import { test } from '@playwright/test';

const loginData = [
  { email: 'user1@example.com', password: 'pass123', shouldSucceed: true },
  { email: 'user2@example.com', password: 'pass456', shouldSucceed: true },
  { email: 'invalid@example.com', password: 'wrong', shouldSucceed: false },
];

for (const data of loginData) {
  test(`login with ${data.email}`, async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', data.email);
    await page.fill('[data-testid="password-input"]', data.password);
    await page.click('[data-testid="login-submit-button"]');

    if (data.shouldSucceed) {
      await expect(page).toHaveURL('/dashboard');
    } else {
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    }
  });
}
```

### Test Fixtures Approach

```typescript
// fixtures/auth.ts
import { test as base } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Setup - login before test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-submit-button"]');
    await page.waitForURL('/dashboard');

    // Use authenticated page in test
    await use(page);

    // Cleanup - logout after test
    await page.click('[data-testid="logout-button"]');
  },
});
```

---

## Visual Regression Testing

### Playwright Screenshots

```typescript
// specs/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('homepage matches snapshot', async ({ page }) => {
    await page.goto('/');

    // Full page screenshot
    await expect(page).toHaveScreenshot('homepage.png');

    // Element screenshot
    await expect(page.locator('[data-testid="header"]')).toHaveScreenshot('header.png');
  });

  test('dashboard light mode', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveScreenshot('dashboard-light.png');
  });

  test('dashboard dark mode', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="theme-toggle"]');
    await expect(page).toHaveScreenshot('dashboard-dark.png');
  });
});
```

### Percy Integration

```typescript
// specs/percy.spec.ts
import { test, expect } from '@playwright/test';
import '@percy/playwright';

test.describe('Percy Visual Tests', () => {
  test('homepage visual snapshot', async ({ page }) => {
    await page.goto('/');
    await PercyUtils.snapshot(page, 'Homepage');
  });

  test('product page visual snapshot', async ({ page }) => {
    await page.goto('/products/1');
    await PercyUtils.snapshot(page, 'Product Page');
  });
});
```

---

## Cross-Browser Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
```

### Browser-Specific Tests

```typescript
// specs/cross-browser.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Cross-Browser', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only');

  test('Chrome-specific feature', async ({ page }) => {
    // Test Chrome DevTools Protocol features
    await page.goto('/');
    // ...
  });
});
```

---

## Mobile E2E Testing

### Appium Setup (React Native)

```typescript
// specs/mobile/App.spec.ts
import { test, expect } from '@playwright/test';

test.use({
  // Use device emulator
  ...devices['iPhone 12'],
});

test.describe('Mobile App', () => {
  test('user can login', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.tap('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('swipe gesture works', async ({ page }) => {
    await page.goto('/products');

    // Swipe left on product card
    await page.locator('[data-testid="product-card"]').first().swipe({ dx: -200 });

    await expect(page.locator('[data-testid="delete-button"]')).toBeVisible();
  });
});
```

---

## API E2E Testing

### Playwright API Testing

```typescript
// specs/api/auth-api.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication API', () => {
  const baseURL = 'https://api.example.com';

  test('POST /api/auth/login - valid credentials', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: 'user@example.com',
        password: 'password123',
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(body.user.email).toBe('user@example.com');
  });

  test('POST /api/auth/login - invalid credentials', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: 'wrong@example.com',
        password: 'wrongpass',
      },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toContain('Invalid credentials');
  });

  test('GET /api/users/me - authenticated', async ({ request }) => {
    // First login to get token
    const loginResponse = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: 'user@example.com',
        password: 'password123',
      },
    });

    const loginBody = await loginResponse.json();
    const token = loginBody.token;

    // Use token in subsequent request
    const response = await request.get(`${baseURL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.email).toBe('user@example.com');
  });
});
```

---

## Test Data Management

### Factory Pattern

```typescript
// utils/factories.ts
export class UserFactory {
  static create(overrides: Partial<User> = {}): User {
    return {
      id: crypto.randomUUID(),
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'SecurePass123!',
      ...overrides,
    };
  }

  static createMany(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

// Usage
const user = UserFactory.create({ name: 'Alice' });
const users = UserFactory.createMany(5);
```

### Database Seeding

```typescript
// utils/seed.ts
export async function seedDatabase() {
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      {
        email: 'admin@example.com',
        password: hash('admin123'),
        role: 'ADMIN',
      },
      {
        email: 'user@example.com',
        password: hash('user123'),
        role: 'USER',
      },
    ],
  });
}

// In test setup
test.beforeAll(async () => {
  await seedDatabase();
});
```

---

## CI/CD Integration

### GitHub Actions - Playwright

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-screenshots
          path: tests/e2e/screenshots/
          retention-days: 7

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-trace
          path: playwright/trace/
          retention-days: 7
```

### Parallel Execution

```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 4 : undefined,
  fullyParallel: true,
});
```

### Sharding

```yaml
# GitHub Actions with sharding
- name: Run E2E tests (shard 1)
  run: npx playwright test --shard=1/4

- name: Run E2E tests (shard 2)
  run: npx playwright test --shard=2/4

- name: Run E2E tests (shard 3)
  run: npx playwright test --shard=3/4

- name: Run E2E tests (shard 4)
  run: npx playwright test --shard=4/4
```

---

## Performance Testing in E2E

### Lighthouse CI

```typescript
// specs/performance/lighthouse.spec.ts
import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test.describe('Performance', () => {
  test('homepage performance', async ({ page }) => {
    await page.goto('/');

    await playAudit({
      page,
      port: 9222,
      thresholds: {
        performance: 90,
        accessibility: 100,
        'best-practices': 90,
        seo: 90,
      },
    });
  });
});
```

### Custom Performance Metrics

```typescript
// specs/performance/load-time.spec.ts
import { test, expect } from '@playwright/test';

test('page load time', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/');

  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(3000); // 3 seconds
});
```

---

## Accessibility E2E Testing

### Axe-core Integration

```typescript
// specs/a11y/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login form should be accessible', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="login-form"]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

---

## Flaky Test Management

### Retry Strategy

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
});
```

### Test-specific Retries

```typescript
test('flaky test with retries', async ({ page }) => {
  test.slow(); // Extend timeout

  // Test code that might be flaky
});
```

### Debugging Flaky Tests

```typescript
test('debug with trace', async ({ page }) => {
  // This will create a trace file if the test fails
  await page.goto('/');

  // Test code...
});
```

View trace:
```bash
npx playwright show-trace playwright/trace/[test-name].zip
```

---

## Best Practices Summary

### Test Organization
- ✅ Group related tests with `test.describe()`
- ✅ Use descriptive test names
- ✅ Follow Arrange-Act-Assert pattern
- ✅ Keep tests short and focused

### Selectors
- ✅ Use `data-testid` attributes
- ✅ Prefer user-visible text
- ❌ Avoid CSS classes
- ❌ Avoid XPath

### Performance
- ✅ Run tests in parallel
- ✅ Use test fixtures for setup
- ✅ Mock external dependencies
- ❌ Don't use arbitrary waits

### Reliability
- ✅ Use auto-waiting features
- ✅ Handle async properly
- ✅ Clean up test data
- ❌ Don't share state between tests

### CI/CD
- ✅ Run tests on every PR
- ✅ Parallelize execution
- ✅ Upload artifacts on failure
- ✅ Set appropriate timeouts

---

## Commands

```bash
# Install Playwright
npm init playwright@latest

# Run all E2E tests
npx playwright test

# Run headed (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/e2e/login.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug

# Run with trace on failure
npx playwright test --trace on

# Show test report
npx playwright show-report

# Run specific test
npx playwright test -g "should login"

# Update snapshots
npx playwright test --update-snapshots

# Install dependencies
npm install -D @playwright/test

# Install browsers
npx playwright install

# Install system dependencies (for Ubuntu)
npx playwright install-deps
```

---

## Resources

- **Playwright Docs**: [playwright.dev](https://playwright.dev)
- **Cypress Docs**: [docs.cypress.io](https://docs.cypress.io)
- **Page Object Model**: [martinfowler.com](https://martinfowler.com/bliki/PageObject.html)
- **Testing Library**: [testing-library.com](https://testing-library.com)
- **Axe-core**: [dequeuniversity.com](https://www.dequeuniversity.com/axe)
- **Percy**: [percy.io](https://percy.io)
- **Lighthouse CI**: [github.com/GoogleChrome/lighthouse-ci]

---

## Examples Index

### Basic E2E Tests
- [Playwright: Authentication Flow](#playwright-e2e-tests)
- [Cypress: Shopping Cart](#cypress-e2e-tests)

### Advanced Patterns
- [Page Object Model](#page-object-model-pom)
- [Data-Driven Testing](#data-driven-testing)
- [Visual Regression](#visual-regression-testing)

### Specialized Testing
- [Cross-Browser](#cross-browser-testing)
- [Mobile E2E](#mobile-e2e-testing)
- [API E2E](#api-e2e-testing)
- [Performance](#performance-testing-in-e2e)
- [Accessibility](#accessibility-e2e-testing)

### Infrastructure
- [Test Data Management](#test-data-management)
- [CI/CD Integration](#cicd-integration)
- [Flaky Test Management](#flaky-test-management)

---

**Last Updated**: 2025-01-25
**Version**: 1.0.0
**Maintained By**: ai-core
