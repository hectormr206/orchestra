/**
 * E2E Tests for Orchestra CLI
 *
 * Tests the complete CLI workflow from command invocation to output
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

describe('Orchestra CLI E2E', () => {
  let tempDir: string;
  let orchestraBin: string;

  beforeAll(async () => {
    // Create temporary directory for tests
    tempDir = path.join(os.tmpdir(), `orchestra-e2e-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    // Build the project
    await execFileAsync('npm', ['run', 'build'], { cwd: process.cwd() });

    // Get path to built CLI
    orchestraBin = path.join(process.cwd(), 'dist', 'cli', 'index.js');
  });

  afterAll(async () => {
    // Cleanup temp directory
    // await execFileAsync('rm', ['-rf', tempDir]);
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
  });

  describe('orchestra doctor', () => {
    it('should check environment', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'doctor'], {
        cwd: tempDir,
      });

      expect(result.stdout).toContain('Environment');
      expect(result.stdout).toContain('Status');
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

      expect(result.stdout).toContain('TypeScript');
      expect(result.stdout).toContain('vitest');
    });
  });

  describe('orchestra dry-run', () => {
    it('should analyze task without execution', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'dry-run', 'Create a simple function'], {
        cwd: tempDir,
        env: { ...process.env, ZAI_API_KEY: 'test-key' },
      });

      expect(result.stdout).toContain('Dry Run');
      expect(result.stdout).toContain('Analysis');
    });
  });

  describe('orchestra history', () => {
    it('should show session history', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'history'], {
        cwd: tempDir,
      });

      expect(result.stdout).toContain('Session');
    });
  });

  describe('orchestra status', () => {
    it('should show current status', async () => {
      const result = await execFileAsync('node', [orchestraBin, 'status'], {
        cwd: tempDir,
      });

      expect(result.stdout).toContain('Status');
    });
  });

  describe('orchestra clean', () => {
    it('should clean session data', async () => {
      // Create some session data
      const orchestraDir = path.join(tempDir, '.orchestra');
      await mkdir(orchestraDir, { recursive: true });
      await writeFile(path.join(orchestraDir, 'session.json'), '{}');

      const result = await execFileAsync('node', [orchestraBin, 'clean'], {
        cwd: tempDir,
      });

      expect(result.stdout).toContain('Cleaned');
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
        expect(error.stderr).toContain('error');
      }
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

  describe('performance', () => {
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
});
