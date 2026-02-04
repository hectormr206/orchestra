# Testing Guide

Guide for testing Orchestra CLI and contributions.

## Table of Contents

- [Overview](#overview)
- [Test Framework](#test-framework)
- [Writing Tests](#writing-tests)
- [Test Structure](#test-structure)
- [Mocking](#mocking)
- [Coverage](#coverage)
- [Running Tests](#running-tests)

---

## Overview

Orchestra uses **Vitest** as its test framework with:
- ✅ Fast execution with esbuild
- ✅ Built-in mocking capabilities
- ✅ TypeScript support
- ✅ Watch mode for development
- ✅ Coverage reporting

---

## Test Framework

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  testMatch: ['**/*.test.ts'],
  coverage: {
    include: ['src/**/*.ts'],
    exclude: ['**/*.test.ts', 'src/tui/**'],
  },
  globals: true,
});
```

---

## Writing Tests

### Test Structure

Follow this pattern:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { myFunction } from './myModule.js';

// Mock external dependencies if needed
vi.mock('./externalModule.js', () => ({
  externalFunction: vi.fn(),
}));

describe('myModule', () => {
  let mockData: any;

  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
    mockData = { key: 'value' };
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('myFunction', () => {
    it('should return expected result', () => {
      const result = myFunction('input');
      expect(result).toBe('expected');
    });

    it('should handle errors gracefully', () => {
      expect(() => myFunction('invalid')).not.toThrow();
    });

    it('should call external dependency', () => {
      // Test with mocks
      const result = myFunction('data');
      expect(result).toBeDefined();
    });
  });
});
```

---

## Test Structure

### Unit Tests

Test individual functions/classes in isolation:

```typescript
// src/utils/myUtils.test.ts
import { describe, it, expect } from 'vitest';
import { formatDuration, calculateHash } from './myUtils.js';

describe('formatDuration', () => {
  it('should format milliseconds as human-readable', () => {
    expect(formatDuration(1000)).toBe('1.0s');
    expect(formatDuration(60000)).toBe('1m 0s');
  });
});
```

### Integration Tests

Test multiple components working together:

```typescript
// tests/integration/orchestration.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { Orchestrator } from '../../src/orchestrator/Orchestrator.js';

describe('Orchestration Integration', () => {
  let orchestrator: Orchestrator;

  beforeAll(async () => {
    orchestrator = new Orchestrator({ parallel: false });
  });

  it('should complete simple task', async () => {
    const result = await orchestrator.orchestate('Create a simple function');
    expect(result).toBe(true);
  });
});
```

### E2E Tests

Test the full CLI from user perspective:

```typescript
// tests/e2e.test.ts
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('CLI E2E', () => {
  it('should show help', () => {
    const result = execSync('node dist/cli/index.js --help', { encoding: 'utf8' });
    expect(result).toContain('Usage:');
  });

  it('should start orchestration', () => {
    const result = execSync('node dist/cli/index.js start "test task"', { encoding: 'utf8' });
    expect(result).toContain('Orchestrating');
  });
});
```

---

## Mocking

### Mocking Functions

```typescript
import { vi } from 'vitest';

vi.mock('./myModule.js', () => ({
  myFunction: vi.fn().mockReturnValue('mocked result'),
}));
```

### Mocking File System

```typescript
import { vi } from 'vitest';
import { existsSync, readFileSync } from 'fs';

vi.mock('fs', () => ({
  existsSync: vi.fn((path: string) => {
    return path.includes('exists.txt');
  }),
  readFileSync: vi.fn((path, encoding) => {
    if (path.includes('data.json')) {
      return JSON.stringify({ data: 'test' });
    }
    return '';
  }),
}));
```

### Mocking External APIs

```typescript
import { vi } from 'vitest';

vi.mock('./adapters/ClaudeAdapter.js', () => ({
  ClaudeAdapter: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({
      content: 'Mock response',
      success: true,
    }),
    isAvailable: vi.fn().mockResolvedValue(true),
  })),
}));
```

### Partial Mocking

```typescript
vi.mock('./myModule.js', async () => ({
  ...(await vi.importActual('./myModule.js')),
  myFunction: vi.fn().mockReturnValue('mocked'),
}));
```

---

## Coverage

### Viewing Coverage Report

```bash
npm run test:coverage
```

### Coverage Thresholds

Target coverage:
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

### Improving Coverage

1. Add tests for uncovered code paths
2. Test edge cases and error conditions
3. Increase test complexity
4. Add integration tests for component interactions

---

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test File

```bash
npm test myUtils.test.ts
```

### Watch Mode (Development)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

### UI Tests

```bash
npm test -- tui
```

---

## Best Practices

### 1. Test Isolation

Each test should be independent:

```typescript
beforeEach(() => {
  // Reset state
  vi.clearAllMocks();
});
```

### 2. Descriptive Test Names

```typescript
// Good
it('should return error when file does not exist', () => {
  // ...
});

// Bad
it('should handle error', () => {
  // Too vague
});
```

### 3. Test Error Cases

```typescript
it('should throw validation error for invalid input', () => {
  expect(() => validateEmail('invalid')).toThrow();
});
```

### 4. Use expect.extend for Custom Matchers

```typescript
import { expect } from 'vitest';

expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      pass,
      message: () =>
        pass ? 'Expected valid email' : `Expected invalid email, got "${received}"`,
    };
  },
});

it('should validate email', () => {
  expect('user@example.com').toBeValidEmail();
});
```

---

## Common Test Scenarios

### Testing Async Code

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

### Testing Event Handlers

```typescript
it('should call callback on success', () => {
  const callback = vi.fn();
  myFunction('input', callback);
  expect(callback).toHaveBeenCalledWith('result');
});
```

### Testing with Timers

```typescript
vi.useFakeTimers();

it('should timeout after delay', () => {
  vi.advanceTimersByTime(1000);
  // Test timeout behavior
});
```

---

## Integration with CI/CD

### GitHub Actions

Tests run automatically on PR:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

### Coverage Badge

[![Coverage](https://img.shields.io/badge/coverage-%252080-brightgreen.svg)](https://github.com/user/repo)

---

## Troubleshooting Tests

### Test Timeout

**Problem**: Tests timeout after 5000ms by default

**Solution**: Increase timeout
```typescript
it('should handle long operation', async () => {
  const result = await longRunningOperation();
  expect(result).toBe('done');
}, 10000); // 10 second timeout
```

### Mock Not Working

**Problem**: Mock doesn't work as expected

**Solutions**:
1. Check mock path matches import path
2. Use `vi.mock()` before importing
3. For ES modules, use `vi.mocked()`

### Import Errors

**Problem**: Tests fail with import errors

**Solutions**:
1. Ensure `vitest.config.ts` includes correct paths
2. Check tsconfig includes test files
3. Verify aliases are correctly configured

---

## See Also

- [Development Guide](./development.md)
- [Orchestrator API](../api/orchestrator.md)
- [Adapter Interface](../api/adapters.md)
