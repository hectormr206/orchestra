/**
 * Tests for GLMAdapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GLMAdapter } from './GLMAdapter.js';
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
                content: 'Mock GLM response'
              }
            }
          ]
        })
      });
    });
  }),
}));

describe('GLMAdapter', () => {
  let adapter: GLMAdapter;

  beforeEach(() => {
    adapter = new GLMAdapter({
      apiKey: 'test-key',
    });
  });

  it('should execute prompt successfully', async () => {
    const options: ExecuteOptions = {
      prompt: 'Explain this code',
    };

    const result = await adapter.execute(options);
    expect(result.content).toContain('Mock GLM response');
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

  it('should support different model versions', async () => {
    const glm4Adapter = new GLMAdapter({
      apiKey: 'test-key',
      model: 'glm-4',
    });

    const options: ExecuteOptions = {
      prompt: 'Test',
    };

    const result = await glm4Adapter.execute(options);
    expect(result).toBeDefined();
  });
});
