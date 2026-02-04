/**
 * Tests for gitIntegration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as gitIntegration from './gitIntegration.js';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe('gitIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', () => {
      const { execSync } = vi.mocked(require('child_process'));
      execSync.mockReturnValue('main\n');

      const branch = gitIntegration.getCurrentBranch();
      expect(branch).toBe('main');
    });

    it('should handle detached HEAD state', () => {
      const { execSync } = vi.mocked(require('child_process'));
      execSync.mockReturnValue('HEAD\n');

      const branch = gitIntegration.getCurrentBranch();
      expect(branch).toBe('HEAD');
    });
  });

  describe('hasUncommittedChanges', () => {
    it('should detect uncommitted changes', () => {
      const { execSync } = vi.mocked(require('child_process'));
      execSync.mockReturnValue(' M file.txt\n');

      const hasChanges = gitIntegration.hasUncommittedChanges();
      expect(hasChanges).toBe(true);
    });

    it('should return false when clean', () => {
      const { execSync } = vi.mocked(require('child_process'));
      execSync.mockReturnValue('\n');

      const hasChanges = gitIntegration.hasUncommittedChanges();
      expect(hasChanges).toBe(false);
    });
  });

  describe('commit', () => {
    it('should create commit with message', () => {
      const { execSync } = vi.mocked(require('child_process'));
      execSync.mockReturnValue('');

      const result = gitIntegration.commit('feat: new feature', ['file1.txt', 'file2.txt']);

      expect(result.success).toBe(true);
      expect(execSync).toHaveBeenCalled();
    });

    it('should handle commit errors', () => {
      const { execSync } = vi.mocked(require('child_process'));
      execSync.mockImplementation(() => {
        throw new Error('Git command failed');
      });

      const result = gitIntegration.commit('feat: new feature', ['file1.txt']);

      expect(result.success).toBe(false);
    });
  });

  describe('createBranch', () => {
    it('should create new branch', () => {
      const { execSync } = vi.mocked(require('child_process'));
      execSync.mockReturnValue('');

      const result = gitIntegration.createBranch('feature/test');

      expect(result.success).toBe(true);
    });

    it('should switch to existing branch', () => {
      const { execSync } = vi.mocked(require('child_process'));
      execSync.mockReturnValue('');

      const result = gitIntegration.createBranch('main');

      expect(result.success).toBe(true);
    });
  });

  describe('getCommitHistory', () => {
    it('should return commit history', () => {
      const { execSync } = vi.mocked(require('child_process'));
      execSync.mockReturnValue(
        'abc123 Initial commit\n' +
        'def456 Add feature\n' +
        'ghi789 Fix bug\n'
      );

      const history = gitIntegration.getCommitHistory(3);

      expect(history).toHaveLength(3);
      expect(history[0].hash).toBe('abc123');
      expect(history[0].message).toBe('Initial commit');
    });

    it('should limit number of commits', () => {
      const { execSync } = vi.mocked(require('child_process'));
      execSync.mockReturnValue('abc123 Commit 1\n');

      const history = gitIntegration.getCommitHistory(5);

      expect(history).toBeDefined();
    });
  });

  describe('isGitRepository', () => {
    it('should detect git repository', () => {
      const { existsSync } = vi.mocked(require('fs'));
      existsSync.mockImplementation((path: string) => {
        return path.includes('.git');
      });

      const isRepo = gitIntegration.isGitRepository();
      expect(isRepo).toBe(true);
    });

    it('should return false for non-git directory', () => {
      const { existsSync } = vi.mocked(require('fs'));
      existsSync.mockReturnValue(false);

      const isRepo = gitIntegration.isGitRepository();
      expect(isRepo).toBe(false);
    });
  });
});
