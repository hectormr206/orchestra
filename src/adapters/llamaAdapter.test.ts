/**
 * Tests for LlamaAdapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LlamaAdapter } from './LlamaAdapter.js';
import type { ExecuteOptions } from '../types.js';

vi.mock('util', () => ({
  execFile: vi.fn(),
  promisify: vi.fn(() => () => {
    return new Promise((resolve) => {
      resolve({
        stdout: JSON.stringify({
          message: {
            content: 'Mock Llama response'
          }
        })
      });
    });
  }),
}));

describe('LlamaAdapter', () => {
  let adapter: LlamaAdapter;

  beforeEach(() => {
    adapter = new LlamaAdapter({
      apiKey: 'test-key',
    });
  });

  it('should execute prompt successfully', async () => {
    const options: ExecuteOptions = {
      prompt: 'Write Python code',
    };

    const result = await adapter.execute(options);
    expect(result.content).toContain('Mock Llama response');
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

  it('should support Ollama mode', async () => {
    const ollamaAdapter = new LlamaAdapter({
      mode: 'ollama',
      apiUrl: 'http://localhost:11434',
    });

    const options: ExecuteOptions = {
      prompt: 'Test Ollama',
    };

    const result = await ollamaAdapter.execute(options);
    expect(result).toBeDefined();
  });
});
