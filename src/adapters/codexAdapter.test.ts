/**
 * Tests for CodexAdapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodexAdapter } from './CodexAdapter.js';
import type { ExecuteOptions } from '../types.js';

vi.mock('util', () => ({
  execFile: vi.fn(),
  promisify: vi.fn(() => () => {
    return new Promise((resolve) => {
      resolve({
        stdout: JSON.stringify({
          choices: [
            {
              message: {
                content: 'Mock Codex response'
              }
            }
          ]
        })
      });
    });
  }),
}));

describe('CodexAdapter', () => {
  let adapter: CodexAdapter;

  beforeEach(() => {
    adapter = new CodexAdapter({
      apiKey: 'test-key',
    });
  });

  it('should execute prompt successfully', async () => {
    const options: ExecuteOptions = {
      prompt: 'Create a function',
    };

    const result = await adapter.execute(options);
    expect(result.content).toContain('Mock Codex response');
    expect(result.success).toBe(true);
  });

  it('should check availability', async () => {
    const available = await adapter.isAvailable();
    expect(available).toBe(true);
  });

  it('should list models', async () => {
    const models = await adapter.listModels();
    expect(Array.isArray(models)).toBe(true);
  });
});
