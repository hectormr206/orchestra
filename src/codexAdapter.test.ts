/**
 * Tests for Codex Adapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodexAdapter } from './adapters/CodexAdapter';
import type { ExecuteOptions } from './types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CodexAdapter', () => {
  let adapter: CodexAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new CodexAdapter();
  });

  describe('initialization', () => {
    it('should initialize with config', () => {
      expect(adapter).toBeDefined();
    });

    it('should have correct info', () => {
      const info = adapter.getInfo();

      expect(info.name).toBe('CodexAdapter');
      expect(info.model).toBe('Codex CLI');
      expect(info.provider).toBe('OpenAI');
    });
  });

  describe('execute', () => {
    it('should send request to API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Test response' }],
          usage: { total_tokens: 100 },
        }),
      } as Response);

      const options: ExecuteOptions = {
        prompt: 'Test prompt',
      };

      const result = await adapter.execute(options);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const options: ExecuteOptions = {
        prompt: 'Test prompt',
      };

      const result = await adapter.execute(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const options: ExecuteOptions = {
        prompt: 'Test prompt',
      };

      const result = await adapter.execute(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should format request with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response' }],
        }),
      } as Response);

      const options: ExecuteOptions = {
        prompt: 'Test prompt',
      };

      await adapter.execute(options);

      const callArgs = mockFetch.mock.calls[0];

      expect(callArgs[0]).toContain('api.anthropic.com');
      expect(callArgs[1].method).toBe('POST');
      expect(callArgs[1].headers).toHaveProperty('x-api-key');
    });
  });

  describe('availability', () => {
    it('should be available when API key is set', async () => {
      const available = await adapter.isAvailable();

      expect(available).toBe(true);
    });

    it('should format request correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response' }],
        }),
      } as Response);

      const options: ExecuteOptions = {
        prompt: 'Test prompt',
      };

      await adapter.execute(options);

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('messages');
      expect(callArgs[1].method).toBe('POST');
      expect(callArgs[1].headers).toHaveProperty('x-api-key');
    });
  });

  describe('rate limiting', () => {
    it('should handle rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          get: (name: string) => {
            if (name === 'retry-after') return '60';
            return null;
          },
        },
      } as Response);

      const options: ExecuteOptions = {
        prompt: 'Test prompt',
      };

      const result = await adapter.execute(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('RATE_LIMIT');
    });
  });

  describe('response parsing', () => {
    it('should extract text from content blocks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            { text: 'First block' },
            { text: 'Second block' },
          ],
        }),
      } as Response);

      const options: ExecuteOptions = {
        prompt: 'Test',
      };

      const result = await adapter.execute(options);

      expect(result.success).toBe(true);
    });

    it('should handle empty content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [],
        }),
      } as Response);

      const options: ExecuteOptions = {
        prompt: 'Test',
      };

      const result = await adapter.execute(options);

      expect(result.success).toBe(true);
    });
  });
});
