/**
 * Tests for MistralAdapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MistralAdapter } from './MistralAdapter.js';
import type { ExecuteOptions } from '../types.js';

vi.mock('util', () => ({
  execFile: vi.fn(),
  promisify: vi.fn(() => (cmd: string, args: string[]) => {
    return new Promise((resolve) => {
      if (args.includes('models')) {
        resolve({
          stdout: JSON.stringify({
            data: [
              { id: 'open-mistral-7b' },
              { id: 'mistral-large-latest' }
            ]
          })
        });
      } else {
        resolve({
          stdout: JSON.stringify({
            choices: [
              {
                message: {
                  content: 'Mock Mistral response'
                }
              }
            ]
          })
        });
      }
    });
  }),
}));

describe('MistralAdapter', () => {
  let adapter: MistralAdapter;

  beforeEach(() => {
    adapter = new MistralAdapter({
      apiKey: 'test-key',
    });
  });

  it('should execute prompt successfully', async () => {
    const options: ExecuteOptions = {
      prompt: 'Generate TypeScript types',
    };

    const result = await adapter.execute(options);
    expect(result.content).toContain('Mock Mistral response');
    expect(result.success).toBe(true);
  });

  it('should check availability', async () => {
    const available = await adapter.isAvailable();
    expect(available).toBe(true);
  });

  it('should list models', async () => {
    const models = await adapter.listModels();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
  });

  it('should support API mode', async () => {
    const apiAdapter = new MistralAdapter({
      mode: 'api',
      apiKey: 'test-key',
    });

    const options: ExecuteOptions = {
      prompt: 'Test API mode',
    };

    const result = await apiAdapter.execute(options);
    expect(result).toBeDefined();
  });

  it('should support Azure mode', async () => {
    const azureAdapter = new MistralAdapter({
      mode: 'azure',
      apiKey: 'test-key',
      apiUrl: 'https://azure-mistral.openai.azure.com',
    });

    const options: ExecuteOptions = {
      prompt: 'Test Azure mode',
    };

    const result = await azureAdapter.execute(options);
    expect(result).toBeDefined();
  });
});
