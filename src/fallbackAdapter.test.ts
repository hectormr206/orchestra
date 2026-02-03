/**
 * Tests for Fallback Adapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FallbackAdapter, type Adapter, type FallbackAdapterCallbacks } from './adapters/FallbackAdapter';
import type { ExecuteOptions, AgentResult } from './types';

// Mock adapter for testing
class MockAdapter implements Adapter {
  constructor(
    private name: string,
    private model: string,
    private provider: string,
    private shouldSucceed: boolean = true,
    private isAvailableValue: boolean = true,
    private errorMessage?: string
  ) {}

  async execute(options: ExecuteOptions): Promise<AgentResult> {
    if (this.shouldSucceed) {
      return {
        success: true,
        outputFile: `/tmp/${this.name}-output.txt`,
        duration: 100,
      };
    }
    return {
      success: false,
      error: this.errorMessage || 'Execution failed',
      duration: 50,
    };
  }

  async isAvailable(): Promise<boolean> {
    return this.isAvailableValue;
  }

  getInfo() {
    return {
      name: this.name,
      model: this.model,
      provider: this.provider,
    };
  }
}

describe('FallbackAdapter', () => {
  describe('constructor', () => {
    it('should create adapter with multiple adapters', () => {
      const adapter1 = new MockAdapter('adapter1', 'model1', 'provider1');
      const adapter2 = new MockAdapter('adapter2', 'model2', 'provider2');
      const callbacks: FallbackAdapterCallbacks = {};

      const fallbackAdapter = new FallbackAdapter([adapter1, adapter2], callbacks);

      expect(fallbackAdapter).toBeDefined();
    });

    it('should throw error with empty adapter list', () => {
      const callbacks: FallbackAdapterCallbacks = {};

      expect(() => new FallbackAdapter([], callbacks)).toThrow('FallbackAdapter requiere al menos un adapter');
    });

    it('should accept single adapter', () => {
      const adapter1 = new MockAdapter('adapter1', 'model1', 'provider1');
      const callbacks: FallbackAdapterCallbacks = {};

      const fallbackAdapter = new FallbackAdapter([adapter1], callbacks);

      expect(fallbackAdapter).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should execute first adapter successfully', async () => {
      const adapter1 = new MockAdapter('adapter1', 'model1', 'provider1', true);
      const callbacks: FallbackAdapterCallbacks = {};
      const fallbackAdapter = new FallbackAdapter([adapter1], callbacks);

      const result = await fallbackAdapter.execute({ prompt: 'test' });

      expect(result.success).toBe(true);
      expect(result.outputFile).toContain('adapter1');
    });

    it('should fallback to second adapter on failure', async () => {
      const adapter1 = new MockAdapter('adapter1', 'model1', 'provider1', false, true, 'First adapter failed');
      const adapter2 = new MockAdapter('adapter2', 'model2', 'provider2', true);
      const onAdapterFallback = vi.fn();
      const callbacks: FallbackAdapterCallbacks = { onAdapterFallback };
      const fallbackAdapter = new FallbackAdapter([adapter1, adapter2], callbacks);

      const result = await fallbackAdapter.execute({ prompt: 'test' });

      expect(result.success).toBe(true);
      expect(result.outputFile).toContain('adapter2');
      expect(onAdapterFallback).toHaveBeenCalledTimes(1);
      expect(onAdapterFallback).toHaveBeenCalledWith('model1', 'model2', expect.stringContaining('Error'));
    });

    it('should skip unavailable adapters', async () => {
      const adapter1 = new MockAdapter('adapter1', 'model1', 'provider1', true, false);
      const adapter2 = new MockAdapter('adapter2', 'model2', 'provider2', true, true);
      const onAdapterFallback = vi.fn();
      const callbacks: FallbackAdapterCallbacks = { onAdapterFallback };
      const fallbackAdapter = new FallbackAdapter([adapter1, adapter2], callbacks);

      const result = await fallbackAdapter.execute({ prompt: 'test' });

      expect(result.success).toBe(true);
      expect(result.outputFile).toContain('adapter2');
      expect(onAdapterFallback).toHaveBeenCalledWith('model1', 'model2', 'No disponible');
    });

    it('should mark rate-limited adapters', async () => {
      const adapter1 = new MockAdapter('adapter1', 'model1', 'provider1', false, true, 'RATE_LIMIT: Exceeded quota');
      const adapter2 = new MockAdapter('adapter2', 'model2', 'provider2', true);
      const callbacks: FallbackAdapterCallbacks = {};
      const fallbackAdapter = new FallbackAdapter([adapter1, adapter2], callbacks);

      const result = await fallbackAdapter.execute({ prompt: 'test' });

      expect(result.success).toBe(true);
      expect(result.outputFile).toContain('adapter2');
    });

    it('should call onAdapterStart callback', async () => {
      const adapter1 = new MockAdapter('adapter1', 'model1', 'provider1', true);
      const onAdapterStart = vi.fn();
      const callbacks: FallbackAdapterCallbacks = { onAdapterStart };
      const fallbackAdapter = new FallbackAdapter([adapter1], callbacks);

      await fallbackAdapter.execute({ prompt: 'test' });

      expect(onAdapterStart).toHaveBeenCalledTimes(1);
      expect(onAdapterStart).toHaveBeenCalledWith('model1', 0, 1);
    });

    it('should call onAdapterSuccess callback', async () => {
      const adapter1 = new MockAdapter('adapter1', 'model1', 'provider1', true);
      const onAdapterSuccess = vi.fn();
      const callbacks: FallbackAdapterCallbacks = { onAdapterSuccess };
      const fallbackAdapter = new FallbackAdapter([adapter1], callbacks);

      await fallbackAdapter.execute({ prompt: 'test' });

      expect(onAdapterSuccess).toHaveBeenCalledTimes(1);
      expect(onAdapterSuccess).toHaveBeenCalledWith('model1', 100);
    });

    it('should return error when all adapters fail', async () => {
      const adapter1 = new MockAdapter('adapter1', 'model1', 'provider1', false);
      const adapter2 = new MockAdapter('adapter2', 'model2', 'provider2', false);
      const callbacks: FallbackAdapterCallbacks = {};
      const fallbackAdapter = new FallbackAdapter([adapter1, adapter2], callbacks);

      const result = await fallbackAdapter.execute({ prompt: 'test' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getInfo', () => {
    it('should return adapter info', () => {
      const adapter1 = new MockAdapter('adapter1', 'model1', 'provider1');
      const callbacks: FallbackAdapterCallbacks = {};
      const fallbackAdapter = new FallbackAdapter([adapter1], callbacks);

      const info = fallbackAdapter.getInfo();

      expect(info).toBeDefined();
      expect(info.name).toBeDefined();
      expect(info.model).toBeDefined();
      expect(info.provider).toBeDefined();
    });
  });

  describe('rate limit detection', () => {
    it('should detect rate limit errors', () => {
      const rateLimitErrors = [
        'RATE_LIMIT: Exceeded',
        'Rate limit exceeded',
        'You have exceeded your quota',
        'Limit reached for this API',
      ];

      rateLimitErrors.forEach(error => {
        const isRateLimit =
          error.startsWith('RATE_LIMIT:') ||
          error.toLowerCase().includes('rate limit') ||
          error.toLowerCase().includes('limit') ||
          error.toLowerCase().includes('quota');

        expect(isRateLimit).toBe(true);
      });
    });

    it('should not detect non-rate-limit errors as rate limits', () => {
      const nonRateLimitErrors = [
        'Connection failed',
        'Invalid API key',
        'Timeout error',
        'Parsing error',
      ];

      nonRateLimitErrors.forEach(error => {
        const isRateLimit =
          error.startsWith('RATE_LIMIT:') ||
          error.toLowerCase().includes('rate limit') ||
          error.toLowerCase().includes('limit') ||
          error.toLowerCase().includes('quota');

        expect(isRateLimit).toBe(false);
      });
    });
  });
});
