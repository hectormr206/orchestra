/**
 * Tests for Claude Adapter
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClaudeAdapter } from './adapters/ClaudeAdapter.js';
import type { ExecuteOptions } from './types.js';

// Create mock spawn function
const mockSpawnFn = vi.fn();
vi.mock('child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawnFn(...args),
  default: { spawn: (...args: unknown[]) => mockSpawnFn(...args) },
}));

// Mock fs/promises writeFile
const mockWriteFile = vi.fn();
vi.mock('fs/promises', () => ({
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

describe('ClaudeAdapter', () => {
  let adapter: ClaudeAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSpawnFn.mockReset();
    adapter = new ClaudeAdapter();
  });

  afterEach(() => {
    // Clean up any ANTHROPIC_* env vars we might have set
    for (const key in process.env) {
      if (key.startsWith('ANTHROPIC_')) {
        delete process.env[key];
      }
    }
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      expect(adapter).toBeDefined();
    });

    it('should have correct info', () => {
      const info = adapter.getInfo();

      expect(info.name).toBe('ClaudeAdapter');
      expect(info.model).toBe('Claude Opus 4.5');
      expect(info.provider).toBe('Anthropic');
    });
  });

  describe('execute', () => {
    it('should spawn claude command and filter ANTHROPIC_* env vars', async () => {
      // Set some ANTHROPIC_* env vars that should be filtered out
      process.env.ANTHROPIC_API_KEY = 'should-be-filtered';
      process.env.ANTHROPIC_BASE_URL = 'should-be-filtered';

      const mockProc: any = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        stdin: { end: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
      };

      mockSpawnFn.mockReturnValueOnce(mockProc);

      // Simulate successful execution
      process.nextTick(() => {
        const stdoutHandler = mockProc.stdout.on.mock.calls.find(
          ([event]: [string]) => event === 'data'
        )?.[1] as ((data: Buffer) => void) | undefined;
        const closeHandler = mockProc.on.mock.calls.find(
          ([event]: [string]) => event === 'close'
        )?.[1] as ((code: number) => void) | undefined;

        stdoutHandler?.(Buffer.from('Test response'));
        closeHandler?.(0);
      });

      const options: ExecuteOptions = {
        prompt: 'Test prompt',
      };

      const result = await adapter.execute(options);

      expect(mockSpawnFn).toHaveBeenCalledWith(
        'claude',
        ['Test prompt'],
        expect.objectContaining({
          env: expect.not.objectContaining({
            ANTHROPIC_API_KEY: 'should-be-filtered',
            ANTHROPIC_BASE_URL: 'should-be-filtered',
          }),
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      );
      expect(result.success).toBe(true);
    });

    it('should handle rate limit errors', async () => {
      const mockProc: any = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        stdin: { end: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
      };

      mockSpawnFn.mockReturnValueOnce(mockProc);

      // Simulate rate limit error
      process.nextTick(() => {
        const stderrHandler = mockProc.stderr.on.mock.calls.find(
          ([event]: [string]) => event === 'data'
        )?.[1] as ((data: Buffer) => void) | undefined;
        const closeHandler = mockProc.on.mock.calls.find(
          ([event]: [string]) => event === 'close'
        )?.[1] as ((code: number) => void) | undefined;

        stderrHandler?.(Buffer.from('rate limit exceeded'));
        closeHandler?.(1);
      });

      const options: ExecuteOptions = {
        prompt: 'Test prompt',
      };

      const result = await adapter.execute(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('RATE_LIMIT');
    });

    it('should write to output file when specified', async () => {
      const mockProc: any = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        stdin: { end: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
      };

      mockSpawnFn.mockReturnValueOnce(mockProc);
      mockWriteFile.mockResolvedValueOnce(undefined);

      // Simulate successful execution
      process.nextTick(() => {
        const stdoutHandler = mockProc.stdout.on.mock.calls.find(
          ([event]: [string]) => event === 'data'
        )?.[1] as ((data: Buffer) => void) | undefined;
        const closeHandler = mockProc.on.mock.calls.find(
          ([event]: [string]) => event === 'close'
        )?.[1] as ((code: number) => void) | undefined;

        stdoutHandler?.(Buffer.from('Test response'));
        closeHandler?.(0);
      });

      const options: ExecuteOptions = {
        prompt: 'Test prompt',
        outputFile: '/tmp/output.txt',
      };

      const result = await adapter.execute(options);

      expect(mockWriteFile).toHaveBeenCalledWith('/tmp/output.txt', 'Test response', 'utf-8');
      expect(result.success).toBe(true);
      expect(result.outputFile).toBe('/tmp/output.txt');
    });

    it('should handle file write errors', async () => {
      const mockProc: any = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        stdin: { end: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
      };

      mockSpawnFn.mockReturnValueOnce(mockProc);
      mockWriteFile.mockRejectedValueOnce(new Error('Write failed'));

      // Simulate successful execution
      process.nextTick(() => {
        const stdoutHandler = mockProc.stdout.on.mock.calls.find(
          ([event]: [string]) => event === 'data'
        )?.[1] as ((data: Buffer) => void) | undefined;
        const closeHandler = mockProc.on.mock.calls.find(
          ([event]: [string]) => event === 'close'
        )?.[1] as ((code: number) => void) | undefined;

        stdoutHandler?.(Buffer.from('Test response'));
        closeHandler?.(0);
      });

      const options: ExecuteOptions = {
        prompt: 'Test prompt',
        outputFile: '/tmp/output.txt',
      };

      const result = await adapter.execute(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error escribiendo archivo');
    });

    it('should handle process errors', async () => {
      const mockProc: any = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        stdin: { end: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
      };

      mockSpawnFn.mockReturnValueOnce(mockProc);

      // Simulate process error
      process.nextTick(() => {
        const errorHandler = mockProc.on.mock.calls.find(
          ([event]: [string]) => event === 'error'
        )?.[1] as ((error: Error) => void) | undefined;
        errorHandler?.(new Error('Command not found'));
      });

      const options: ExecuteOptions = {
        prompt: 'Test prompt',
      };

      const result = await adapter.execute(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Command not found');
    });

    it('should accept successful execution with non-zero exit code but output', async () => {
      const mockProc: any = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        stdin: { end: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
      };

      mockSpawnFn.mockReturnValueOnce(mockProc);

      // Simulate successful execution with stdout but non-zero exit
      process.nextTick(() => {
        const stdoutHandler = mockProc.stdout.on.mock.calls.find(
          ([event]: [string]) => event === 'data'
        )?.[1] as ((data: Buffer) => void) | undefined;
        const closeHandler = mockProc.on.mock.calls.find(
          ([event]: [string]) => event === 'close'
        )?.[1] as ((code: number) => void) | undefined;

        stdoutHandler?.(Buffer.from('Test response'));
        closeHandler?.(1); // Non-zero exit code
      });

      const options: ExecuteOptions = {
        prompt: 'Test prompt',
      };

      const result = await adapter.execute(options);

      // ClaudeAdapter accepts stdout.length > 0 as success
      expect(result.success).toBe(true);
    });
  });

  describe('availability', () => {
    it('should check if claude command is available', async () => {
      const mockWhichProc: any = { on: vi.fn() };

      mockSpawnFn.mockReturnValueOnce(mockWhichProc);

      process.nextTick(() => {
        const closeHandler = mockWhichProc.on.mock.calls.find(
          ([event]: [string]) => event === 'close'
        )?.[1] as ((code: number) => void) | undefined;
        closeHandler?.(0);
      });

      const available = await adapter.isAvailable();

      expect(available).toBe(true);
    });

    it('should return false when claude is not found', async () => {
      const mockWhichProc: any = { on: vi.fn() };

      mockSpawnFn.mockReturnValueOnce(mockWhichProc);

      process.nextTick(() => {
        const closeHandler = mockWhichProc.on.mock.calls.find(
          ([event]: [string]) => event === 'close'
        )?.[1] as ((code: number) => void) | undefined;
        closeHandler?.(1);
      });

      const available = await adapter.isAvailable();

      expect(available).toBe(false);
    });
  });

  describe('rate limit detection', () => {
    it('should detect various rate limit patterns', async () => {
      const patterns = [
        'rate limit exceeded',
        'quota exceeded',
        'too many requests',
        '429',
        'resource exhausted',
        'overloaded',
      ];

      for (const pattern of patterns) {
        mockSpawnFn.mockReset();

        const mockProc: any = {
          stdout: { on: vi.fn() },
          stderr: { on: vi.fn() },
          stdin: { end: vi.fn() },
          on: vi.fn(),
          kill: vi.fn(),
        };

        mockSpawnFn.mockReturnValueOnce(mockProc);

        // Simulate rate limit error
        process.nextTick(() => {
          const stderrHandler = mockProc.stderr.on.mock.calls.find(
            ([event]: [string]) => event === 'data'
          )?.[1] as ((data: Buffer) => void) | undefined;
          const closeHandler = mockProc.on.mock.calls.find(
            ([event]: [string]) => event === 'close'
          )?.[1] as ((code: number) => void) | undefined;

          stderrHandler?.(Buffer.from(pattern));
          closeHandler?.(1);
        });

        const result = await adapter.execute({ prompt: 'Test' });

        expect(result.success).toBe(false);
        expect(result.error).toContain('RATE_LIMIT');
      }
    });
  });
});
