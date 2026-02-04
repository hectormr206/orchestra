/**
 * Tests for testRunner
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as testRunner from './testRunner.js';

vi.mock('child_process', () => ({
  execSync: vi.fn(() => 'Test output'),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

describe('testRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectTestFramework', () => {
    it('should detect pytest project', () => {
      const { existsSync } = vi.mocked(require('fs'));
      existsSync.mockImplementation((path: string) => {
        return path.includes('pytest.ini') || path.includes('test_');
      });

      const framework = testRunner.detectTestFramework('.');
      expect(framework).toBe('pytest');
    });

    it('should detect jest project', () => {
      const { existsSync } = vi.mocked(require('fs'));
      existsSync.mockImplementation((path: string) => {
        return path.includes('jest.config.') || path.includes('package.json');
      });

      const framework = testRunner.detectTestFramework('.');
      expect(framework).toBe('jest');
    });

    it('should detect vitest project', () => {
      const { existsSync } = vi.mocked(require('fs'));
      existsSync.mockImplementation((path: string) => {
        return path.includes('vitest.config.');
      });

      const framework = testRunner.detectTestFramework('.');
      expect(framework).toBe('vitest');
    });

    it('should return null for unknown framework', () => {
      const { existsSync } = vi.mocked(require('fs'));
      existsSync.mockReturnValue(false);

      const framework = testRunner.detectTestFramework('.');
      expect(framework).toBeNull();
    });
  });

  describe('runTests', () => {
    it('should run pytest tests', async () => {
      const result = await testRunner.runTests('pytest');
      expect(result).toBeDefined();
    });

    it('should run jest tests', async () => {
      const result = await testRunner.runTests('jest');
      expect(result).toBeDefined();
    });

    it('should run go tests', async () => {
      const result = await testRunner.runTests('go');
      expect(result).toBeDefined();
    });

    it('should run cargo tests', async () => {
      const result = await testRunner.runTests('cargo');
      expect(result).toBeDefined();
    });

    it('should handle unknown framework', async () => {
      const result = await testRunner.runTests('unknown');
      expect(result).toBeDefined();
    });
  });

  describe('parseTestOutput', () => {
    it('should parse pytest output', () => {
      const output = `
========================= test session starts ==========================
collected 5 items

test_module.py::test_function PASSED

========================= 5 passed in 2.5s =========================
      `;

      const result = testRunner.parseTestOutput('pytest', output);
      expect(result).toBeDefined();
      expect(result.total).toBe(5);
      expect(result.passed).toBe(5);
    });

    it('should parse jest output', () => {
      const output = `
 PASS src/app.test.js
  ✓ Component renders correctly (5ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
      `;

      const result = testRunner.parseTestOutput('jest', output);
      expect(result).toBeDefined();
    });
  });
});
