/**
 * Tests for GitHub Checks integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createCheckRun,
  updateCheckRun,
  createAndStartCheck,
  completeCheck,
  generateCheckFromTests,
  generateCheckFromAudit,
  generateCheckFromExecution,
  type GitHubCheckRun,
  type CheckAnnotation,
  type CheckStatus,
  type CheckConclusion,
} from './utils/githubIntegration.js';

// Mock child_process
const mockExecFile = vi.fn();
vi.mock('child_process', () => ({
  execFile: (...args: unknown[]) => mockExecFile(...args),
}));

describe('GitHub Checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecFile.mockReset();
  });

  describe('generateCheckFromTests', () => {
    it('should generate successful check run', () => {
      const task = 'Run unit tests';
      const testResults = {
        passed: 10,
        failed: 0,
        skipped: 2,
        duration: 5000,
        output: 'All tests passed',
      };
      const headSha = 'abc123';

      const result = generateCheckFromTests(task, testResults, headSha);

      expect(result.name).toBe('Orchestra: Run unit tests');
      expect(result.headSha).toBe(headSha);
      expect(result.status).toBe('completed');
      expect(result.conclusion).toBe('success');
      expect(result.output?.title).toBe('Tests passed');
      expect(result.output?.summary).toContain('10/12 passed');
      expect(result.output?.summary).toContain('(5.0s)');
    });

    it('should generate failed check run', () => {
      const task = 'Run integration tests';
      const testResults = {
        passed: 5,
        failed: 3,
        skipped: 0,
        duration: 10000,
        output: '3 tests failed',
      };
      const headSha = 'def456';

      const result = generateCheckFromTests(task, testResults, headSha);

      expect(result.name).toBe('Orchestra: Run integration tests');
      expect(result.conclusion).toBe('failure');
      expect(result.output?.title).toBe('Tests failed');
      expect(result.output?.summary).toContain('5/8 passed');
      expect(result.output?.summary).toContain('3 failed');
    });

    it('should include test output in text', () => {
      const task = 'Run tests';
      const testResults = {
        passed: 1,
        failed: 0,
        skipped: 0,
        duration: 1000,
        output: 'Test output here',
      };
      const headSha = 'ghi789';

      const result = generateCheckFromTests(task, testResults, headSha);

      expect(result.output?.text).toBe('Test output here');
    });

    it('should truncate long output to 60000 characters', () => {
      const task = 'Test';
      const testResults = {
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        output: 'a'.repeat(70000), // 70000 chars
      };
      const headSha = 'jkl012';

      const result = generateCheckFromTests(task, testResults, headSha);

      expect(result.output?.text).toHaveLength(60000);
    });
  });

  describe('generateCheckFromAudit', () => {
    it('should generate success check for no issues', () => {
      const task = 'Audit code';
      const auditResults = [];
      const headSha = 'mno345';

      const result = generateCheckFromAudit(task, auditResults, headSha);

      expect(result.name).toBe('Orchestra Audit: Audit code');
      expect(result.conclusion).toBe('success');
      expect(result.output?.summary).toBe('0 critical, 0 major, 0 minor');
    });

    it('should generate failure check for critical issues', () => {
      const task = 'Security audit';
      const auditResults = [
        { file: 'auth.ts', description: 'SQL injection vulnerability', severity: 'critical' },
        { file: 'db.ts', description: 'Missing encryption', severity: 'critical' },
      ];
      const headSha = 'pqr678';

      const result = generateCheckFromAudit(task, auditResults, headSha);

      expect(result.conclusion).toBe('failure');
      expect(result.output?.summary).toBe('2 critical, 0 major, 0 minor');
      expect(result.annotations).toHaveLength(2);
    });

    it('should generate neutral check for major issues', () => {
      const task = 'Code review';
      const auditResults = [
        { file: 'utils.ts', description: 'Complex function', severity: 'major' },
        { file: 'api.ts', description: 'Missing error handling', severity: 'major' },
        { file: 'types.ts', description: 'Typo in docs', severity: 'minor' },
      ];
      const headSha = 'stu901';

      const result = generateCheckFromAudit(task, auditResults, headSha);

      expect(result.conclusion).toBe('neutral');
      expect(result.output?.summary).toBe('0 critical, 2 major, 1 minor');
    });

    it('should create annotations for each issue', () => {
      const task = 'Audit';
      const auditResults = [
        { file: 'test.ts', description: 'Bug found', severity: 'minor' },
        { file: 'main.ts', description: 'Critical bug', severity: 'critical' },
      ];
      const headSha = 'vwx234';

      const result = generateCheckFromAudit(task, auditResults, headSha);

      expect(result.annotations).toHaveLength(2);
      expect(result.annotations![0].annotation_level).toBe('notice');
      expect(result.annotations![1].annotation_level).toBe('failure');
      expect(result.annotations![0].title).toBe('MINOR: test.ts');
      expect(result.annotations![1].title).toBe('CRITICAL: main.ts');
    });

    it('should limit annotations to 50', () => {
      const task = 'Large audit';
      const auditResults = Array.from({ length: 100 }, (_, i) => ({
        file: `file${i}.ts`,
        description: `Issue ${i}`,
        severity: 'minor' as const,
      }));
      const headSha = 'yz345';

      const result = generateCheckFromAudit(task, auditResults, headSha);

      expect(result.annotations).toHaveLength(50);
    });

    it('should include audit details in text', () => {
      const task = 'Security check';
      const auditResults = [
        { file: 'auth.ts', description: 'Missing validation', severity: 'critical' },
      ];
      const headSha = 'zae456';

      const result = generateCheckFromAudit(task, auditResults, headSha);

      expect(result.output?.text).toContain('### auth.ts');
      expect(result.output?.text).toContain('**Severity:** critical');
      expect(result.output?.text).toContain('Missing validation');
    });
  });

  describe('generateCheckFromExecution', () => {
    it('should generate success check for successful execution', () => {
      const task = 'Generate API';
      const executionResults = {
        filesGenerated: 3,
        filesModified: 1,
        duration: 15000,
        success: true,
      };
      const headSha = 'bcd789';

      const result = generateCheckFromExecution(task, executionResults, headSha);

      expect(result.name).toBe('Orchestra Execution: Generate API');
      expect(result.conclusion).toBe('success');
      expect(result.output?.summary).toContain('3 generated, 1 modified');
      expect(result.output?.summary).toContain('Duration: 15.0s');
      expect(result.output?.title).toBe('Execution completed');
    });

    it('should generate failure check for failed execution', () => {
      const task = 'Failed task';
      const executionResults = {
        filesGenerated: 0,
        filesModified: 0,
        duration: 5000,
        success: false,
        errors: ['Syntax error', 'Import error'],
      };
      const headSha = 'cde890';

      const result = generateCheckFromExecution(task, executionResults, headSha);

      expect(result.conclusion).toBe('failure');
      expect(result.output?.title).toBe('Execution failed');
      expect(result.output?.text).toContain('Errors:');
      expect(result.output?.text).toContain('Syntax error');
      expect(result.output?.text).toContain('Import error');
    });

    it('should handle execution without errors', () => {
      const task = 'Simple task';
      const executionResults = {
        filesGenerated: 1,
        filesModified: 0,
        duration: 2000,
        success: true,
      };
      const headSha = 'def123';

      const result = generateCheckFromExecution(task, executionResults, headSha);

      expect(result.output?.text).toContain('successfully');
    });
  });

  describe('createAndStartCheck', () => {
    it.skip('should create and start check run', async () => {
      mockExecFile.mockResolvedValue({
        stdout: JSON.stringify({
          id: 42,
          html_url: 'https://github.com/user/repo/checks/42',
        }),
        stderr: '',
      });

      const result = await createAndStartCheck('Test check', 'abc123');

      expect(result.success).toBe(true);
      expect(result.checkId).toBe(42);
    });

    it.skip('should return error on failure', async () => {
      mockExecFile.mockRejectedValue(new Error('API error'));

      const result = await createAndStartCheck('Test check', 'abc123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('completeCheck', () => {
    it.skip('should complete check run', async () => {
      mockExecFile.mockResolvedValue({
        stdout: JSON.stringify({
          html_url: 'https://github.com/user/repo/checks/42',
        }),
        stderr: '',
      });

      const success = await completeCheck(42, 'success', {
        title: 'All good',
        summary: 'Passed',
      });

      expect(success).toBe(true);
    });

    it('should work with dry run mode', async () => {
      const success = await completeCheck(42, 'failure', undefined, {
        dryRun: true,
      });

      expect(success).toBe(true);
      expect(mockExecFile).not.toHaveBeenCalled();
    });
  });

  describe('createCheckRun', () => {
    it.skip('should create check run with all options', async () => {
      mockExecFile.mockResolvedValue({
        stdout: JSON.stringify({
          id: 123,
          html_url: 'https://github.com/user/repo/checks/123',
        }),
        stderr: '',
      });

      const check: GitHubCheckRun = {
        name: 'Test check',
        headSha: 'abc123',
        status: 'in_progress',
        conclusion: null,
        externalId: 'orchestra-123',
        startedAt: new Date().toISOString(),
      };

      const result = await createCheckRun(check);

      expect(result.success).toBe(true);
      expect(result.checkId).toBe(123);
    });

    it('should handle dry run mode', async () => {
      const check: GitHubCheckRun = {
        name: 'Test check',
        headSha: 'abc123',
      };

      const result = await createCheckRun(check, { dryRun: true });

      expect(result.success).toBe(true);
      expect(mockExecFile).not.toHaveBeenCalled();
    });
  });

  describe('updateCheckRun', () => {
    it.skip('should update check run status', async () => {
      mockExecFile.mockResolvedValue({
        stdout: JSON.stringify({
          html_url: 'https://github.com/user/repo/checks/123',
        }),
        stderr: '',
      });

      const result = await updateCheckRun(123, {
        status: 'completed',
        conclusion: 'success',
      });

      expect(result.success).toBe(true);
    });
  });
});
