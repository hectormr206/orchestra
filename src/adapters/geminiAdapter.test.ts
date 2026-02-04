/**
 * Tests for GeminiAdapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeminiAdapter } from './GeminiAdapter.js';
import type { ExecuteOptions } from '../types.js';

vi.mock('util', () => ({
  execFile: vi.fn(),
  promisify: vi.fn(() => () => {
    return new Promise((resolve) => {
      resolve({
        stdout: JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  { text: 'Mock Gemini response' }
                ]
              }
            }
          ]
        })
      });
    });
  }),
}));

describe('GeminiAdapter', () => {
  let adapter: GeminiAdapter;

  beforeEach(() => {
    adapter = new GeminiAdapter({
      apiKey: 'test-key',
    });
  });

  it('should execute prompt successfully', async () => {
    const options: ExecuteOptions = {
      prompt: 'Generate code',
    };

    const result = await adapter.execute(options);
    expect(result.content).toContain('Mock Gemini response');
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
});
