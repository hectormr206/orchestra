/**
 * Tests for githubIntegration.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock child_process BEFORE importing the module
vi.mock('child_process', () => ({
  execFile: vi.fn((cmd: string, args: string[], callback: any) => {
    // Default implementation - can be overridden in tests
    callback(null, { stdout: '', stderr: '' });
  }),
}));

import { execFile } from 'child_process';
import {
  validateIssueTitle,
  validateBody,
  validateLabels,
  createIssue,
  createPullRequest,
  createBatchIssues,
  createBatchPRs,
  createBranch,
  pushBranch,
  generateIssueFromAudit,
  generatePRFromTask,
  createCheckRun,
  updateCheckRun,
  generateCheckFromTests,
  generateCheckFromAudit,
  generateCheckFromExecution,
  createAndStartCheck,
  completeCheck,
  isGitHubAvailable,
  getRepoInfo,
  type GitHubIssue,
  type GitHubPR,
  type GitHubCheckRun,
} from './githubIntegration.js';

const execFileMock = vi.mocked(execFile);

describe('githubIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default behavior
    execFileMock.mockImplementation((cmd: string, args: string[], callback: any) => {
      callback(null, { stdout: '', stderr: '' });
    });
    // Mock console.log/console.warn to avoid cluttering test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  const mockExecFileSuccess = (stdout: string) => {
    execFileMock.mockImplementation((cmd: string, args: string[], callback: any) => {
      callback(null, { stdout, stderr: '' });
    });
  };

  const mockExecFileError = (error: any) => {
    execFileMock.mockImplementation((cmd: string, args: string[], callback: any) => {
      callback(error, null);
    });
  };

  describe('validateIssueTitle', () => {
    it('should accept valid titles', () => {
      expect(validateIssueTitle('Valid title').valid).toBe(true);
      expect(validateIssueTitle('Title with numbers 123').valid).toBe(true);
      expect(validateIssueTitle('Title-with.special.chars').valid).toBe(true);
    });

    it('should reject empty titles', () => {
      const result = validateIssueTitle('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Title is required');
    });

    it('should reject whitespace-only titles', () => {
      const result = validateIssueTitle('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Title is required');
    });

    it('should reject titles over 256 characters', () => {
      const longTitle = 'a'.repeat(257);
      const result = validateIssueTitle(longTitle);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Title must be 256 characters or less');
    });

    it('should accept exactly 256 character titles', () => {
      const maxTitle = 'a'.repeat(256);
      expect(validateIssueTitle(maxTitle).valid).toBe(true);
    });

    it('should reject titles with dangerous characters', () => {
      const invalidChars = ['<', '>', '{', '}', '|'];

      invalidChars.forEach(char => {
        const result = validateIssueTitle(`Title with ${char} character`);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Title contains invalid characters');
      });
    });
  });

  describe('validateBody', () => {
    it('should accept valid bodies', () => {
      expect(validateBody('Valid body').valid).toBe(true);
      expect(validateBody('').valid).toBe(true);
    });

    it('should reject bodies over 65536 characters', () => {
      const longBody = 'a'.repeat(65537);
      const result = validateBody(longBody);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Body must be 65536 characters or less');
    });

    it('should accept exactly 65536 character bodies', () => {
      const maxBody = 'a'.repeat(65536);
      expect(validateBody(maxBody).valid).toBe(true);
    });
  });

  describe('validateLabels', () => {
    it('should accept valid labels', () => {
      const result = validateLabels(['bug', 'enhancement', 'docs']);
      expect(result.valid).toBe(true);
    });

    it('should accept labels with valid special characters', () => {
      const result = validateLabels(['label-with-dash', 'label_with_underscore', 'label.with.dot']);
      expect(result.valid).toBe(true);
    });

    it('should reject more than 100 labels', () => {
      const tooManyLabels = Array.from({ length: 101 }, (_, i) => `label${i}`);
      const result = validateLabels(tooManyLabels);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot add more than 100 labels');
    });

    it('should accept exactly 100 labels', () => {
      const maxLabels = Array.from({ length: 100 }, (_, i) => `label${i}`);
      expect(validateLabels(maxLabels).valid).toBe(true);
    });

    it('should reject labels over 57 characters', () => {
      const result = validateLabels(['a'.repeat(58)]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds 57 character limit');
    });

    it('should accept exactly 57 character labels', () => {
      const maxLabel = 'a'.repeat(57);
      expect(validateLabels([maxLabel]).valid).toBe(true);
    });

    it('should reject labels with invalid characters', () => {
      const invalidLabels = ['label with spaces', 'label@symbol', 'label/slash'];

      invalidLabels.forEach(label => {
        const result = validateLabels([label]);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('contains invalid characters');
      });
    });
  });

  describe('createIssue', () => {
    it('should create issue successfully', async () => {
      mockExecFileSuccess('https://github.com/owner/repo/issues/123\n');

      const issue: GitHubIssue = {
        title: 'Test issue',
        body: 'Test body',
        labels: ['bug', 'high-priority'],
      };

      const result = await createIssue(issue);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://github.com/owner/repo/issues/123');
      expect(result.number).toBe(123);
    });

    it('should fail validation for empty title', async () => {
      const issue: GitHubIssue = {
        title: '',
        body: 'Test body',
      };

      const result = await createIssue(issue);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Title is required');
      expect(execFileMock).not.toHaveBeenCalled();
    });

    it('should fail validation for invalid labels', async () => {
      const issue: GitHubIssue = {
        title: 'Test issue',
        body: 'Test body',
        labels: ['invalid label with spaces'],
      };

      const result = await createIssue(issue);

      expect(result.success).toBe(false);
      expect(result.error).toContain('contains invalid characters');
      expect(execFileMock).not.toHaveBeenCalled();
    });

    it('should handle gh CLI not found', async () => {
      const error = new Error('Command failed') as NodeJS.ErrnoException;
      error.code = 'ENOTFOUND';
      mockExecFileError(error);

      const issue: GitHubIssue = {
        title: 'Test issue',
        body: 'Test body',
      };

      const result = await createIssue(issue);

      expect(result.success).toBe(false);
      expect(result.error).toContain('gh CLI not found');
    });

    it('should handle GraphQL errors', async () => {
      mockExecFileError({ stderr: 'GraphQL: Could not resolve to a Repository' });

      const issue: GitHubIssue = {
        title: 'Test issue',
        body: 'Test body',
      };

      const result = await createIssue(issue);

      expect(result.success).toBe(false);
      expect(result.error).toContain('GitHub API error');
    });

    it('should handle dry run mode', async () => {
      const issue: GitHubIssue = {
        title: 'Test issue',
        body: 'Test body',
        labels: ['bug'],
      };

      const result = await createIssue(issue, { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://github.com/mock/issues/0');
      expect(execFileMock).not.toHaveBeenCalled();
    });
  });

  describe('createPullRequest', () => {
    it('should create PR successfully', async () => {
      mockExecFileSuccess('https://github.com/owner/repo/pull/456\n');

      const pr: GitHubPR = {
        title: 'Test PR',
        body: 'Test PR body',
        branch: 'feature/test',
        baseBranch: 'main',
        draft: true,
      };

      const result = await createPullRequest(pr);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://github.com/owner/repo/pull/456');
      expect(result.number).toBe(456);
    });

    it('should create PR without optional fields', async () => {
      mockExecFileSuccess('https://github.com/owner/repo/pull/457\n');

      const pr: GitHubPR = {
        title: 'Test PR',
        body: 'Test PR body',
        branch: 'feature/test',
      };

      const result = await createPullRequest(pr);

      expect(result.success).toBe(true);
    });

    it('should fail validation for long body', async () => {
      const pr: GitHubPR = {
        title: 'Test PR',
        body: 'a'.repeat(65537),
        branch: 'feature/test',
      };

      const result = await createPullRequest(pr);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Body must be 65536 characters or less');
    });

    it('should handle Unprocessable error', async () => {
      mockExecFileError({ stderr: 'Unprocessable Entity' });

      const pr: GitHubPR = {
        title: 'Test PR',
        body: 'Test PR body',
        branch: 'feature/test',
      };

      const result = await createPullRequest(pr);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid PR');
    });

    it('should handle dry run mode', async () => {
      const pr: GitHubPR = {
        title: 'Test PR',
        body: 'Test PR body',
        branch: 'feature/test',
      };

      const result = await createPullRequest(pr, { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://github.com/mock/pull/0');
      expect(execFileMock).not.toHaveBeenCalled();
    });
  });

  describe('createBatchIssues', () => {
    it('should create multiple issues successfully', async () => {
      mockExecFileSuccess('https://github.com/owner/repo/issues/1\n');

      const issues: GitHubIssue[] = [
        { title: 'Issue 1', body: 'Body 1' },
        { title: 'Issue 2', body: 'Body 2' },
        { title: 'Issue 3', body: 'Body 3' },
      ];

      const results = await createBatchIssues(issues);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(execFileMock).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure', async () => {
      let callCount = 0;
      execFileMock.mockImplementation((cmd: string, args: string[], callback: any) => {
        callCount++;
        if (callCount === 2) {
          callback({ stderr: 'GraphQL error' }, null);
        } else {
          callback(null, { stdout: 'https://github.com/owner/repo/issues/1\n', stderr: '' });
        }
      });

      const issues: GitHubIssue[] = [
        { title: 'Issue 1', body: 'Body 1' },
        { title: 'Issue 2', body: 'Body 2' },
        { title: 'Issue 3', body: 'Body 3' },
      ];

      const results = await createBatchIssues(issues);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });

    it('should add delay between issues', async () => {
      mockExecFileSuccess('https://github.com/owner/repo/issues/1\n');

      const sleepSpy = vi.spyOn(global, 'setTimeout' as any);

      const issues: GitHubIssue[] = [
        { title: 'Issue 1', body: 'Body 1' },
        { title: 'Issue 2', body: 'Body 2' },
      ];

      await createBatchIssues(issues);

      // Should have at least one setTimeout call for the delay
      expect(sleepSpy).toHaveBeenCalled();
      // Check that one of the calls was for 500ms delay
      expect(sleepSpy).toHaveBeenCalledWith(expect.any(Function), 500);
    });
  });

  describe('createBatchPRs', () => {
    it('should create multiple PRs successfully', async () => {
      mockExecFileSuccess('');

      const prs: GitHubPR[] = [
        { title: 'PR 1', body: 'Body 1', branch: 'feature/1' },
        { title: 'PR 2', body: 'Body 2', branch: 'feature/2' },
      ];

      const results = await createBatchPRs(prs);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle branch creation failure', async () => {
      mockExecFileError({ stderr: 'Branch already exists' });

      const prs: GitHubPR[] = [
        { title: 'PR 1', body: 'Body 1', branch: 'feature/1' },
      ];

      const results = await createBatchPRs(prs);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Failed to create branch');
    });
  });

  describe('createBranch', () => {
    it('should create branch successfully', async () => {
      mockExecFileSuccess('');

      const result = await createBranch('feature/test');

      expect(result).toBe(true);
    });

    it('should handle creation failure', async () => {
      mockExecFileError({ stderr: 'Branch already exists' });

      const result = await createBranch('feature/test');

      expect(result).toBe(false);
    });
  });

  describe('pushBranch', () => {
    it('should push branch successfully', async () => {
      mockExecFileSuccess('');

      const result = await pushBranch('feature/test');

      expect(result).toBe(true);
    });

    it('should handle push failure', async () => {
      mockExecFileError({ stderr: 'Push rejected' });

      const result = await pushBranch('feature/test');

      expect(result).toBe(false);
    });
  });

  describe('generateIssueFromAudit', () => {
    it('should generate issue from audit results', () => {
      const task = 'Fix authentication bug';
      const issues = [
        { file: 'auth.ts', description: 'Missing error handling', severity: 'critical' },
        { file: 'auth.ts', description: 'No input validation', severity: 'major' },
        { file: 'user.ts', description: 'Typo in comment', severity: 'minor' },
      ];

      const result = generateIssueFromAudit(task, issues);

      expect(result.title).toBe('[Orchestra] Issues de auditoría: Fix authentication bug');
      expect(result.labels).toEqual(['orchestra', 'audit', 'critical']);
      expect(result.body).toContain('## Resumen');
      expect(result.body).toContain('| Critical  | 1 |');
      expect(result.body).toContain('| Major     | 1 |');
      expect(result.body).toContain('| Minor     | 1 |');
    });

    it('should not include critical label if no critical issues', () => {
      const task = 'Refactor code';
      const issues = [
        { file: 'file.ts', description: 'Code smell', severity: 'minor' },
      ];

      const result = generateIssueFromAudit(task, issues);

      expect(result.labels).not.toContain('critical');
      expect(result.labels).toEqual(['orchestra', 'audit']);
    });
  });

  describe('generatePRFromTask', () => {
    it('should generate PR from task', () => {
      const task = 'Add user authentication';
      const files = ['auth.ts', 'user.ts', 'middleware.ts'];
      const branchName = 'feature/auth';

      const result = generatePRFromTask(task, files, branchName);

      expect(result.title).toBe('feat: Add user authentication');
      expect(result.branch).toBe('feature/auth');
      expect(result.draft).toBe(true);
      expect(result.body).toContain('## Descripción');
      expect(result.body).toContain('- `auth.ts`');
      expect(result.body).toContain('- `user.ts`');
      expect(result.body).toContain('- `middleware.ts`');
    });
  });

  describe('createCheckRun', () => {
    it('should create check run successfully', async () => {
      mockExecFileSuccess(JSON.stringify({
        id: 789,
        html_url: 'https://github.com/owner/repo/checks/789',
      }));

      const check: GitHubCheckRun = {
        name: 'Test check',
        headSha: 'abc123',
        status: 'completed',
        conclusion: 'success',
        output: {
          title: 'Check passed',
          summary: 'All checks passed',
        },
      };

      const result = await createCheckRun(check);

      expect(result.success).toBe(true);
      expect(result.checkId).toBe(789);
      expect(result.url).toBe('https://github.com/owner/repo/checks/789');
    });

    it('should handle dry run mode', async () => {
      const check: GitHubCheckRun = {
        name: 'Test check',
        headSha: 'abc123',
      };

      const result = await createCheckRun(check, { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://github.com/mock/checks/0');
      expect(execFileMock).not.toHaveBeenCalled();
    });
  });

  describe('updateCheckRun', () => {
    it('should update check run successfully', async () => {
      mockExecFileSuccess(JSON.stringify({
        html_url: 'https://github.com/owner/repo/checks/789',
      }));

      const result = await updateCheckRun(789, {
        status: 'completed',
        conclusion: 'success',
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://github.com/owner/repo/checks/789');
    });

    it('should handle dry run mode', async () => {
      const result = await updateCheckRun(789, { status: 'completed' }, { dryRun: true });

      expect(result.success).toBe(true);
      expect(execFileMock).not.toHaveBeenCalled();
    });
  });

  describe('generateCheckFromTests', () => {
    it('should generate success check from passed tests', () => {
      const testResults = {
        passed: 10,
        failed: 0,
        skipped: 2,
        duration: 5000,
        output: 'All tests passed',
      };

      const check = generateCheckFromTests('Run tests', testResults, 'abc123');

      expect(check.name).toBe('Orchestra: Run tests');
      expect(check.status).toBe('completed');
      expect(check.conclusion).toBe('success');
      expect(check.output?.title).toBe('Tests passed');
      expect(check.output?.summary).toBe('**Tests:** 10/12 passed, 2 skipped (5.0s)');
    });

    it('should generate failure check from failed tests', () => {
      const testResults = {
        passed: 8,
        failed: 2,
        skipped: 0,
        duration: 3000,
        output: '2 tests failed',
      };

      const check = generateCheckFromTests('Run tests', testResults, 'abc123');

      expect(check.conclusion).toBe('failure');
      expect(check.output?.title).toBe('Tests failed');
      expect(check.output?.summary).toBe('**Tests:** 8/10 passed, 2 failed (3.0s)');
    });

    it('should truncate long output to 60000 characters', () => {
      const testResults = {
        passed: 1,
        failed: 0,
        skipped: 0,
        duration: 100,
        output: 'a'.repeat(70000),
      };

      const check = generateCheckFromTests('Run tests', testResults, 'abc123');

      expect(check.output?.text?.length).toBe(60000);
    });
  });

  describe('generateCheckFromAudit', () => {
    it('should generate failure check with critical issues', () => {
      const auditResults = [
        { file: 'file.ts', description: 'Security vulnerability', severity: 'critical' },
      ];

      const check = generateCheckFromAudit('Audit code', auditResults, 'abc123');

      expect(check.name).toBe('Orchestra Audit: Audit code');
      expect(check.conclusion).toBe('failure');
      expect(check.output?.annotations?.[0].annotation_level).toBe('failure');
    });

    it('should generate neutral check with major issues', () => {
      const auditResults = [
        { file: 'file.ts', description: 'Code smell', severity: 'major' },
      ];

      const check = generateCheckFromAudit('Audit code', auditResults, 'abc123');

      expect(check.conclusion).toBe('neutral');
      expect(check.output?.annotations?.[0].annotation_level).toBe('warning');
    });

    it('should generate success check with only minor issues', () => {
      const auditResults = [
        { file: 'file.ts', description: 'Style issue', severity: 'minor' },
      ];

      const check = generateCheckFromAudit('Audit code', auditResults, 'abc123');

      expect(check.conclusion).toBe('success');
      expect(check.output?.annotations?.[0].annotation_level).toBe('notice');
    });

    it('should limit annotations to 50', () => {
      const auditResults = Array.from({ length: 100 }, (_, i) => ({
        file: `file${i}.ts`,
        description: `Issue ${i}`,
        severity: 'minor',
      }));

      const check = generateCheckFromAudit('Audit code', auditResults, 'abc123');

      expect(check.output?.annotations).toHaveLength(50);
    });
  });

  describe('generateCheckFromExecution', () => {
    it('should generate success check from successful execution', () => {
      const executionResults = {
        filesGenerated: 5,
        filesModified: 2,
        duration: 10000,
        success: true,
      };

      const check = generateCheckFromExecution('Generate API', executionResults, 'abc123');

      expect(check.name).toBe('Orchestra Execution: Generate API');
      expect(check.status).toBe('completed');
      expect(check.conclusion).toBe('success');
      expect(check.output?.title).toBe('Execution completed');
    });

    it('should generate failure check from failed execution', () => {
      const executionResults = {
        filesGenerated: 0,
        filesModified: 1,
        duration: 5000,
        success: false,
        errors: ['Syntax error', 'Missing dependency'],
      };

      const check = generateCheckFromExecution('Generate API', executionResults, 'abc123');

      expect(check.conclusion).toBe('failure');
      expect(check.output?.title).toBe('Execution failed');
      expect(check.output?.text).toContain('Errors:');
    });
  });

  describe('createAndStartCheck', () => {
    it('should create and start check', async () => {
      mockExecFileSuccess(JSON.stringify({
        id: 100,
        html_url: 'https://github.com/owner/repo/checks/100',
      }));

      const result = await createAndStartCheck('Test check', 'abc123');

      expect(result.success).toBe(true);
      expect(result.checkId).toBe(100);
    });

    it('should handle creation failure', async () => {
      mockExecFileError({ stderr: 'API error' });

      const result = await createAndStartCheck('Test check', 'abc123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.checkId).toBeUndefined();
    });
  });

  describe('completeCheck', () => {
    it('should complete check successfully', async () => {
      mockExecFileSuccess(JSON.stringify({
        html_url: 'https://github.com/owner/repo/checks/100',
      }));

      const result = await completeCheck(100, 'success', {
        title: 'Completed',
        summary: 'Check completed successfully',
      });

      expect(result).toBe(true);
    });

    it('should handle completion failure', async () => {
      mockExecFileError({ stderr: 'API error' });

      const result = await completeCheck(100, 'success');

      expect(result).toBe(false);
    });
  });

  describe('isGitHubAvailable', () => {
    it('should return true when gh is authenticated', async () => {
      mockExecFileSuccess('');

      const result = await isGitHubAvailable();

      expect(result).toBe(true);
    });

    it('should return false when gh is not authenticated', async () => {
      mockExecFileError({ stderr: 'not logged in' });

      const result = await isGitHubAvailable();

      expect(result).toBe(false);
    });
  });

  describe('getRepoInfo', () => {
    it('should return repo info for personal repo', async () => {
      mockExecFileSuccess(JSON.stringify({
        owner: { login: 'user', type: 'User' },
        name: 'repo',
      }));

      const result = await getRepoInfo();

      expect(result).toEqual({
        owner: 'user',
        repo: 'repo',
        isOrg: false,
      });
    });

    it('should return repo info for organization repo', async () => {
      mockExecFileSuccess(JSON.stringify({
        owner: { login: 'org', type: 'Organization' },
        name: 'repo',
      }));

      const result = await getRepoInfo();

      expect(result).toEqual({
        owner: 'org',
        repo: 'repo',
        isOrg: true,
      });
    });

    it('should return null on error', async () => {
      mockExecFileError({ stderr: 'not a git repo' });

      const result = await getRepoInfo();

      expect(result).toBeNull();
    });
  });
});
