/**
 * Test Runner - Ejecuta tests automáticamente después de generar código
 */

import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import type { TestResult } from '../types.js';

const execFileAsync = promisify(execFile);

interface TestFramework {
  name: string;
  command: string;
  args: string[];
  detectFiles: string[];
  parseOutput: (output: string) => Partial<TestResult>;
}

const TEST_FRAMEWORKS: TestFramework[] = [
  {
    name: 'pytest',
    command: 'python3',
    args: ['-m', 'pytest', '-v', '--tb=short'],
    detectFiles: ['pytest.ini', 'pyproject.toml', 'setup.py', 'test_*.py', '*_test.py'],
    parseOutput: parsePytestOutput,
  },
  {
    name: 'jest',
    command: 'npx',
    args: ['jest', '--passWithNoTests', '--json'],
    detectFiles: ['jest.config.js', 'jest.config.ts', 'package.json'],
    parseOutput: parseJestOutput,
  },
  {
    name: 'mocha',
    command: 'npx',
    args: ['mocha', '--reporter', 'json'],
    detectFiles: ['.mocharc.js', '.mocharc.json', 'mocha.opts'],
    parseOutput: parseMochaOutput,
  },
  {
    name: 'vitest',
    command: 'npx',
    args: ['vitest', 'run', '--reporter=json'],
    detectFiles: ['vitest.config.ts', 'vitest.config.js', 'vite.config.ts'],
    parseOutput: parseVitestOutput,
  },
  {
    name: 'go test',
    command: 'go',
    args: ['test', '-v', './...'],
    detectFiles: ['go.mod', '*_test.go'],
    parseOutput: parseGoTestOutput,
  },
  {
    name: 'cargo test',
    command: 'cargo',
    args: ['test'],
    detectFiles: ['Cargo.toml'],
    parseOutput: parseCargoTestOutput,
  },
];

/**
 * Auto-detecta el framework de tests basado en archivos del proyecto
 */
export async function detectTestFramework(workingDir: string): Promise<TestFramework | null> {
  for (const framework of TEST_FRAMEWORKS) {
    for (const detectFile of framework.detectFiles) {
      // Handle glob patterns
      if (detectFile.includes('*')) {
        const { glob } = await import('glob');
        const matches = await glob(detectFile, { cwd: workingDir });
        if (matches.length > 0) {
          return framework;
        }
      } else {
        const filePath = path.join(workingDir, detectFile);
        if (existsSync(filePath)) {
          // Special check for package.json - verify it has test dependencies
          if (detectFile === 'package.json') {
            const content = await readFile(filePath, 'utf-8');
            const pkg = JSON.parse(content);
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps['jest'] || deps['@jest/core']) {
              return TEST_FRAMEWORKS.find(f => f.name === 'jest')!;
            }
            if (deps['mocha']) {
              return TEST_FRAMEWORKS.find(f => f.name === 'mocha')!;
            }
            if (deps['vitest']) {
              return TEST_FRAMEWORKS.find(f => f.name === 'vitest')!;
            }
          } else {
            return framework;
          }
        }
      }
    }
  }
  return null;
}

/**
 * Ejecuta los tests con el framework detectado o el comando especificado
 */
export async function runTests(
  workingDir: string,
  customCommand?: string,
  timeout: number = 120000
): Promise<TestResult> {
  const startTime = Date.now();

  // Use custom command if provided
  if (customCommand) {
    return runCustomCommand(customCommand, workingDir, timeout, startTime);
  }

  // Auto-detect framework
  const framework = await detectTestFramework(workingDir);

  if (!framework) {
    return {
      success: true,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: Date.now() - startTime,
      output: 'No test framework detected',
      command: 'none',
    };
  }

  return runFrameworkTests(framework, workingDir, timeout, startTime);
}

/**
 * Ejecuta tests con un comando personalizado
 */
async function runCustomCommand(
  command: string,
  workingDir: string,
  timeout: number,
  startTime: number
): Promise<TestResult> {
  const parts = command.split(' ');
  const cmd = parts[0];
  const args = parts.slice(1);

  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      cwd: workingDir,
      timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    const output = stdout + '\n' + stderr;
    const success = !stderr.toLowerCase().includes('failed') &&
                   !stderr.toLowerCase().includes('error');

    return {
      success,
      passed: 0, // Custom command doesn't parse results
      failed: 0,
      skipped: 0,
      duration: Date.now() - startTime,
      output,
      command,
    };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string };
    return {
      success: false,
      passed: 0,
      failed: 1,
      skipped: 0,
      duration: Date.now() - startTime,
      output: error.stdout || error.stderr || error.message || 'Test execution failed',
      command,
    };
  }
}

/**
 * Ejecuta tests con un framework específico
 */
async function runFrameworkTests(
  framework: TestFramework,
  workingDir: string,
  timeout: number,
  startTime: number
): Promise<TestResult> {
  const command = `${framework.command} ${framework.args.join(' ')}`;

  try {
    const { stdout, stderr } = await execFileAsync(framework.command, framework.args, {
      cwd: workingDir,
      timeout,
      maxBuffer: 10 * 1024 * 1024,
    });

    const output = stdout + '\n' + stderr;
    const parsed = framework.parseOutput(output);

    return {
      success: parsed.failed === 0,
      passed: parsed.passed || 0,
      failed: parsed.failed || 0,
      skipped: parsed.skipped || 0,
      duration: Date.now() - startTime,
      output,
      command,
    };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string; code?: number };
    const output = error.stdout || error.stderr || error.message || 'Test execution failed';
    const parsed = framework.parseOutput(output);

    return {
      success: false,
      passed: parsed.passed || 0,
      failed: parsed.failed || 1,
      skipped: parsed.skipped || 0,
      duration: Date.now() - startTime,
      output,
      command,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTPUT PARSERS
// ═══════════════════════════════════════════════════════════════════════════

function parsePytestOutput(output: string): Partial<TestResult> {
  // Parse pytest output: "X passed, Y failed, Z skipped"
  const summaryMatch = output.match(/(\d+) passed/);
  const failedMatch = output.match(/(\d+) failed/);
  const skippedMatch = output.match(/(\d+) skipped/);

  return {
    passed: summaryMatch ? parseInt(summaryMatch[1], 10) : 0,
    failed: failedMatch ? parseInt(failedMatch[1], 10) : 0,
    skipped: skippedMatch ? parseInt(skippedMatch[1], 10) : 0,
  };
}

function parseJestOutput(output: string): Partial<TestResult> {
  try {
    // Jest JSON output
    const jsonMatch = output.match(/\{[\s\S]*"numPassedTests"[\s\S]*\}/);
    if (jsonMatch) {
      const json = JSON.parse(jsonMatch[0]);
      return {
        passed: json.numPassedTests || 0,
        failed: json.numFailedTests || 0,
        skipped: json.numPendingTests || 0,
      };
    }
  } catch {
    // Fall back to text parsing
  }

  // Text output fallback
  const passedMatch = output.match(/(\d+) passed/);
  const failedMatch = output.match(/(\d+) failed/);

  return {
    passed: passedMatch ? parseInt(passedMatch[1], 10) : 0,
    failed: failedMatch ? parseInt(failedMatch[1], 10) : 0,
    skipped: 0,
  };
}

function parseMochaOutput(output: string): Partial<TestResult> {
  try {
    const json = JSON.parse(output);
    return {
      passed: json.stats?.passes || 0,
      failed: json.stats?.failures || 0,
      skipped: json.stats?.pending || 0,
    };
  } catch {
    // Text fallback
    const passedMatch = output.match(/(\d+) passing/);
    const failedMatch = output.match(/(\d+) failing/);

    return {
      passed: passedMatch ? parseInt(passedMatch[1], 10) : 0,
      failed: failedMatch ? parseInt(failedMatch[1], 10) : 0,
      skipped: 0,
    };
  }
}

function parseVitestOutput(output: string): Partial<TestResult> {
  try {
    const json = JSON.parse(output);
    const stats = json.testResults?.[0]?.assertionResults || [];
    return {
      passed: stats.filter((t: any) => t.status === 'passed').length,
      failed: stats.filter((t: any) => t.status === 'failed').length,
      skipped: stats.filter((t: any) => t.status === 'pending').length,
    };
  } catch {
    return { passed: 0, failed: 0, skipped: 0 };
  }
}

function parseGoTestOutput(output: string): Partial<TestResult> {
  // Go test output: ok/FAIL package
  const passed = (output.match(/^ok\s+/gm) || []).length;
  const failed = (output.match(/^FAIL\s+/gm) || []).length;

  // Also count individual test results
  const passedTests = (output.match(/--- PASS:/g) || []).length;
  const failedTests = (output.match(/--- FAIL:/g) || []).length;
  const skippedTests = (output.match(/--- SKIP:/g) || []).length;

  return {
    passed: passedTests || passed,
    failed: failedTests || failed,
    skipped: skippedTests,
  };
}

function parseCargoTestOutput(output: string): Partial<TestResult> {
  // Cargo test output: "test result: ok. X passed; Y failed; Z ignored"
  const summaryMatch = output.match(/test result:.*?(\d+) passed.*?(\d+) failed.*?(\d+) ignored/);

  if (summaryMatch) {
    return {
      passed: parseInt(summaryMatch[1], 10),
      failed: parseInt(summaryMatch[2], 10),
      skipped: parseInt(summaryMatch[3], 10),
    };
  }

  return { passed: 0, failed: 0, skipped: 0 };
}
