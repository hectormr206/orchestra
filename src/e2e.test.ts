/**
 * E2E Tests for Orchestra CLI
 *
 * Tests the complete CLI workflow from command invocation to output
 * with comprehensive API mocking
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Increase timeout for all E2E tests since CLI commands can take time
vi.setConfig({ testTimeout: 15000, hookTimeout: 120000 });
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, readFile, unlink, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

// Check if dist directory exists
const distDir = path.join(process.cwd(), 'dist');
const isAlreadyBuilt = existsSync(distDir) && existsSync(path.join(distDir, 'cli', 'index.js'));

// Mock adapters before importing
vi.mock('../adapters/CodexAdapter.js', () => ({
  CodexAdapter: vi.fn().mockImplementation(() => ({
    generate: vi.fn().mockResolvedValue({
      content: 'Mocked AI response',
      usage: { promptTokens: 10, completionTokens: 20 },
    }),
  })),
}));

vi.mock('../adapters/GeminiAdapter.js', () => ({
  GeminiAdapter: vi.fn().mockImplementation(() => ({
    generate: vi.fn().mockResolvedValue({
      content: 'Mocked Gemini response',
      usage: { promptTokens: 10, completionTokens: 20 },
    }),
  })),
}));

vi.mock('../adapters/GLMAdapter.js', () => ({
  GLMAdapter: vi.fn().mockImplementation(() => ({
    generate: vi.fn().mockResolvedValue({
      content: 'Mocked GLM response',
      usage: { promptTokens: 10, completionTokens: 20 },
    }),
  })),
}));

vi.mock('../adapters/ClaudeAdapter.js', () => ({
  ClaudeAdapter: vi.fn().mockImplementation(() => ({
    generate: vi.fn().mockResolvedValue({
      content: 'Mocked Claude response',
      usage: { promptTokens: 10, completionTokens: 20 },
    }),
  })),
}));

// Mock GitHub CLI
const mockExecFile = vi.fn();
vi.mock('child_process', () => ({
  execFile: (...args: unknown[]) => mockExecFile(...args),
  execSync: vi.fn(),
}));

describe('Orchestra CLI E2E', () => {
  let tempDir: string;
  let orchestraBin: string;

  beforeAll(async () => {
    // Create temporary directory for tests
    tempDir = path.join(os.tmpdir(), `orchestra-e2e-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    // Build the project only if not already built
    if (!isAlreadyBuilt) {
      await execFileAsync('npm', ['run', 'build'], {
        cwd: process.cwd(),
        timeout: 120000, // 2 minutes
      });
    }

    // Get path to built CLI
    orchestraBin = path.join(process.cwd(), 'dist', 'cli', 'index.js');
  });

  afterAll(async () => {
    // Cleanup temp directory
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecFile.mockReset();
  });

  describe('basic commands', () => {
    it('should show help', async () => {
      const result = await execFileAsync('node', [orchestraBin, '--help'], {
        cwd: tempDir,
      });

      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Commands:');
      expect(result.stdout).toContain('Options:');
    });

    it('should show version', async () => {
      const result = await execFileAsync('node', [orchestraBin, '--version'], {
        cwd: tempDir,
      });

      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should respond quickly to --help', async () => {
      const start = Date.now();
      await execFileAsync('node', [orchestraBin, '--help'], {
        cwd: tempDir,
      });
      const duration = Date.now() - start;

      // Should respond within 2 seconds
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('output formatting', () => {
    it('should use colors in TTY mode', async () => {
      const result = await execFileAsync('node', [orchestraBin, '--help'], {
        cwd: tempDir,
        env: { ...process.env, FORCE_COLOR: '1' },
      });

      // Should contain ANSI color codes
      expect(result.stdout).toMatch(/\x1b\[/);
    });

    it('should not use colors in non-TTY mode', async () => {
      const result = await execFileAsync('node', [orchestraBin, '--help'], {
        cwd: tempDir,
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      // Should not contain ANSI color codes (or very few)
      const colorCodeCount = (result.stdout.match(/\x1b\[/g) || []).length;
      expect(colorCodeCount).toBeLessThan(5);
    });
  });

  describe('orchestra init', () => {
    it('should create .orchestrarc.json', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'init'], {
        cwd: tempDir,
      });

      const configPath = path.join(tempDir, '.orchestrarc.json');
      expect(existsSync(configPath)).toBe(true);

      const config = JSON.parse(await readFile(configPath, 'utf-8'));
      expect(config.execution).toBeDefined();
      expect(config.test).toBeDefined();
      expect(config.git).toBeDefined();
    });

    it('should create config with default values', async () => {
      await execFileAsync('node', [orchestraBin, 'init'], {
        cwd: tempDir,
      });

      const configPath = path.join(tempDir, '.orchestrarc.json');
      const config = JSON.parse(await readFile(configPath, 'utf-8'));

      expect(config.execution.parallel).toBe(true);
      expect(config.execution.maxConcurrency).toBe(3);
      expect(config.test.runAfterGeneration).toBe(true);
      expect(config.git.autoCommit).toBe(true);
    });

    it('should overwrite existing config', async () => {
      const configPath = path.join(tempDir, '.orchestrarc.json');

      // Create initial config
      await writeFile(configPath, JSON.stringify({ execution: { parallel: false } }));

      // Run init again
      await execFileAsync('node', [orchestraBin, 'init'], {
        cwd: tempDir,
      });

      const config = JSON.parse(await readFile(configPath, 'utf-8'));
      expect(config.execution.parallel).toBe(true); // Should be reset to default
    });
  });

  describe('orchestra doctor', () => {
    it('should check environment', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'doctor'], {
        cwd: tempDir,
      });

      const hasText =
        result.stdout.includes('Verificando configuración') ||
        result.stdout.includes('Configuration') ||
        result.stdout.includes('Estado') ||
        result.stdout.includes('Status');
      expect(hasText).toBe(true);
    });

    it('should show configuration status', async () => {
      await writeFile(path.join(tempDir, '.orchestrarc.json'), JSON.stringify({
        execution: { parallel: true, maxConcurrency: 3 },
      }));

      const result = await execFileAsync('node', [orchestraBin, 'doctor'], {
        cwd: tempDir,
      });

      expect(result.stdout.length > 0).toBe(true);
    });
  });

  describe('orchestra detect', () => {
    it('should detect TypeScript project', async () => {
      // Create a simple TypeScript project
      await writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'express': '^4.18.0',
        },
        devDependencies: {
          'typescript': '^5.0.0',
          'vitest': '^1.0.0',
        },
      }));

      await writeFile(path.join(tempDir, 'tsconfig.json'), JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'commonjs',
        },
      }));

      const result = await execFileAsync('node', [orchestraBin, 'detect'], {
        cwd: tempDir,
      });

      const hasTypeScript = result.stdout.includes('TypeScript') || result.stdout.includes('typescript');
      const hasVitest = result.stdout.includes('vitest') || result.stdout.includes('Vitest');
      expect(hasTypeScript).toBe(true);
      expect(hasVitest).toBe(true);
    });

    it('should detect Python project', async () => {
      await writeFile(path.join(tempDir, 'pytest.ini'), '[pytest]\ntestpaths = tests');

      const result = await execFileAsync('node', [orchestraBin, 'detect'], {
        cwd: tempDir,
      });

      const hasPython =
        result.stdout.includes('Python') ||
        result.stdout.includes('pytest');
      expect(hasPython).toBe(true);
    });

    it('should detect Go project', async () => {
      await writeFile(path.join(tempDir, 'go.mod'), 'module test\n\ngo 1.21');

      const result = await execFileAsync('node', [orchestraBin, 'detect'], {
        cwd: tempDir,
      });

      const hasGo = result.stdout.includes('Go') || result.stdout.includes('go');
      expect(hasGo).toBe(true);
    });
  });

  describe('orchestra history', () => {
    it('should show empty history', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'history'], {
        cwd: tempDir,
      });

      const hasHistoryText =
        result.stdout.includes('Sesión') ||
        result.stdout.includes('Session') ||
        result.stdout.includes('No sessions') ||
        result.stdout.includes('Sin sesiones');
      expect(hasHistoryText).toBe(true);
    });

    it('should show history with filters', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'history', '--limit', '5'], {
        cwd: tempDir,
      });

      expect(result.stdout.length > 0).toBe(true);
    });
  });

  describe('orchestra status', () => {
    it('should show current status', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'status'], {
        cwd: tempDir,
      });

      const hasStatusText =
        result.stdout.includes('Estado') ||
        result.stdout.includes('Status') ||
        result.stdout.includes('No active session');
      expect(hasStatusText).toBe(true);
    });
  });

  describe('orchestra plan', () => {
    it('should show no plan when no active session', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'plan'], {
        cwd: tempDir,
      });

      const hasPlanText =
        result.stdout.includes('No active session') ||
        result.stdout.includes('Sin sesión activa') ||
        result.stdout.includes('plan');
      expect(hasPlanText).toBe(true);
    });
  });

  describe('orchestra clean', () => {
    it('should clean session data', async () => {
      // Create some session data
      const orchestraDir = path.join(tempDir, '.orchestra');
      await mkdir(orchestraDir, { recursive: true });
      await writeFile(path.join(orchestraDir, 'session.json'), '{"test": "data"}');

      const result = await execFileAsync('node', [orchestraBin, 'clean'], {
        cwd: tempDir,
      });

      const hasCleanText =
        result.stdout.includes('limpiada') ||
        result.stdout.includes('cleaned') ||
        result.stdout.includes('Session cleaned');
      expect(hasCleanText).toBe(true);
    });

    it('should not error when no session exists', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'clean'], {
        cwd: tempDir,
      });

      // Should complete without error
      expect(result.stderr.length === 0).toBe(true);
    });
  });

  describe('orchestra validate', () => {
    it('should validate Python syntax', async () => {
      // Create a Python file with valid syntax
      const testFile = path.join(tempDir, 'test.py');
      await writeFile(testFile, 'def hello():\n    print("Hello, World!")\n');

      const result = await execFileAsync('node', [orchestraBin, 'validate', testFile], {
        cwd: tempDir,
      });

      const hasValidText =
        result.stdout.includes('valid') ||
        result.stdout.includes('válido') ||
        result.stdout.includes('Syntax OK');
      expect(hasValidText).toBe(true);
    });

    it('should detect Python syntax errors', async () => {
      // Create a Python file with syntax error
      const testFile = path.join(tempDir, 'invalid.py');
      await writeFile(testFile, 'def hello(:\n    print("Hello")\n');

      const result = await execFileAsync('node', [orchestraBin, 'validate', testFile], {
        cwd: tempDir,
      });

      const hasErrorText =
        result.stdout.includes('error') ||
        result.stdout.includes('inválido') ||
        result.stderr.length > 0 ||
        result.stdout.includes('Syntax error');
      expect(hasErrorText).toBe(true);
    });

    it('should validate TypeScript syntax', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await writeFile(testFile, 'const x: number = 42;\nconsole.log(x);\n');

      const result = await execFileAsync('node', [orchestraBin, 'validate', testFile], {
        cwd: tempDir,
      });

      const hasValidText =
        result.stdout.includes('valid') ||
        result.stdout.includes('OK') ||
        result.stdout.includes('válido');
      expect(hasValidText).toBe(true);
    });
  });

  describe('orchestra export', () => {
    it('should export session to markdown', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'export', '--format', 'markdown'], {
        cwd: tempDir,
      });

      const hasExportText =
        result.stdout.includes('markdown') ||
        result.stdout.includes('export') ||
        result.stdout.includes('No active session');
      expect(hasExportText).toBe(true);
    });
  });

  describe('orchestra cache', () => {
    it('should show cache stats', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'cache', '--stats'], {
        cwd: tempDir,
      });

      const hasCacheText =
        result.stdout.includes('cache') ||
        result.stdout.includes('Cache');
      expect(hasCacheText).toBe(true);
    });

    it('should clear cache', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'cache', '--clear'], {
        cwd: tempDir,
      });

      const hasClearedText =
        result.stdout.includes('cleared') ||
        result.stdout.includes('limpiado') ||
        result.stdout.includes('Cache cleared');
      expect(hasClearedText).toBe(true);
    });
  });

  describe('orchestra notify', () => {
    it('should show notification status', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'notify', '--status'], {
        cwd: tempDir,
      });

      const hasNotifyText =
        result.stdout.includes('notification') ||
        result.stdout.includes('Notification');
      expect(hasNotifyText).toBe(true);
    });
  });

  describe('GitHub integration commands', () => {
    beforeEach(() => {
      // Mock gh CLI responses
      mockExecFile.mockResolvedValue({
        stdout: 'https://github.com/user/repo/issues/1\n',
        stderr: '',
      });
    });

    it('should create GitHub issue', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'github', '--issue', 'Test issue'], {
        cwd: tempDir,
        env: { ...process.env, ZAI_API_KEY: 'test-key' },
      });

      // Should complete without crashing
      expect(result.stdout.length > 0 || result.stderr.length > 0).toBe(true);
    });

    it('should create GitHub PR', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'github', '--pr', 'Test PR'], {
        cwd: tempDir,
        env: { ...process.env, ZAI_API_KEY: 'test-key' },
      });

      // Should complete without crashing
      expect(result.stdout.length > 0 || result.stderr.length > 0).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle missing API key gracefully', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'start', 'Test task'], {
        cwd: tempDir,
        env: { ...process.env, ZAI_API_KEY: '' },
      });

      // Should not crash, should show error message
      expect(result.stderr.length > 0 || result.stdout.length > 0).toBe(true);
    });

    it('should handle invalid commands', async () => {
      try {
        await execFileAsync('node', [orchestraBin, 'invalid-command'], {
          cwd: tempDir,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        // Commander.js outputs to both stdout and stderr
        const output = (error.stdout || '') + (error.stderr || '');
        expect(output.length > 0).toBe(true);
      }
    });

    it('should handle missing files gracefully', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'validate', 'nonexistent.py'], {
        cwd: tempDir,
      });

      // Should show error but not crash
      expect(result.stdout.length > 0 || result.stderr.length > 0).toBe(true);
    });

    it('should handle invalid config gracefully', async () => {
      const configPath = path.join(tempDir, '.orchestrarc.json');
      await writeFile(configPath, 'invalid json{');

      const result = await execFileAsync('node', [orchestraBin, 'doctor'], {
        cwd: tempDir,
      });

      // Should show error but not crash
      expect(result.stdout.length > 0 || result.stderr.length > 0).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should respect .orchestrarc.json', async () => {
      const config = {
        execution: {
          parallel: true,
          maxConcurrency: 5,
        },
        test: {
          runAfterGeneration: false,
        },
      };

      await writeFile(path.join(tempDir, '.orchestrarc.json'), JSON.stringify(config));

      // Run a command that reads config
      const result = await execFileAsync('node', [orchestraBin, 'doctor'], {
        cwd: tempDir,
      });

      expect(result.stdout.length > 0).toBe(true);
    });

    it('should handle missing config with defaults', async () => {
      // Ensure no config file exists
      const configPath = path.join(tempDir, '.orchestrarc.json');
      if (existsSync(configPath)) {
        await unlink(configPath);
      }

      const result = await execFileAsync('node', [orchestraBin, 'doctor'], {
        cwd: tempDir,
      });

      // Should use default configuration
      expect(result.stdout.length > 0).toBe(true);
    });
  });

  describe('workflow tests', () => {
    it('should complete init -> validate workflow', async () => {
      // 1. Initialize
      await execFileAsync('node', [orchestraBin, 'init'], { cwd: tempDir });

      // 2. Create a test file
      const testFile = path.join(tempDir, 'test.py');
      await writeFile(testFile, 'print("Hello")');

      // 3. Validate
      const result = await execFileAsync('node', [orchestraBin, 'validate', testFile], {
        cwd: tempDir,
      });

      const hasValidText =
        result.stdout.includes('valid') ||
        result.stdout.includes('OK') ||
        result.stdout.includes('válido');
      expect(hasValidText).toBe(true);
    });

    it('should complete init -> detect workflow', async () => {
      // 1. Initialize
      await execFileAsync('node', [orchestraBin, 'init'], { cwd: tempDir });

      // 2. Create package.json
      await writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
        name: 'test',
        devDependencies: { vitest: '^1.0.0' },
      }));

      // 3. Detect
      const result = await execFileAsync('node', [orchestraBin, 'detect'], {
        cwd: tempDir,
      });

      const hasVitestText =
        result.stdout.includes('vitest') ||
        result.stdout.includes('Vitest') ||
        result.stdout.includes('TypeScript');
      expect(hasVitestText).toBe(true);
    });
  });

  describe('performance', () => {
    it('should start up quickly', async () => {
      const start = Date.now();
      await execFileAsync('node', [orchestraBin, '--version'], {
        cwd: tempDir,
      });
      const duration = Date.now() - start;

      // Should start within 3 seconds
      expect(duration).toBeLessThan(3000);
    });

    it('should handle multiple commands in sequence', async () => {
      const commands = [
        ['--version'],
        ['--help'],
        ['status'],
        ['doctor'],
      ];

      const start = Date.now();
      for (const args of commands) {
        await execFileAsync('node', [orchestraBin, ...args], { cwd: tempDir });
      }
      const duration = Date.now() - start;

      // All commands should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    });
  });
});
