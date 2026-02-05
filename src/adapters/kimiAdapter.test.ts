/**
 * Tests for KimiAdapter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KimiAdapter } from './KimiAdapter.js';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// Mock child_process
vi.mock('child_process');

describe('KimiAdapter', () => {
  let adapter: KimiAdapter;
  let mockProcess: any;

  beforeEach(() => {
    adapter = new KimiAdapter();

    // Create mock process
    mockProcess = new EventEmitter();
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    mockProcess.stdin = {
      end: vi.fn(),
    };
    mockProcess.kill = vi.fn();

    vi.mocked(spawn).mockReturnValue(mockProcess as any);
  });

  describe('execute', () => {
    it('should execute successfully with valid response', async () => {
      const promise = adapter.execute({
        prompt: 'Analiza la arquitectura del proyecto',
        outputFile: 'test-output.txt',
      });

      // Simulate successful response
      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Arquitectura analizada exitosamente');
        mockProcess.emit('close', 0);
      }, 10);

      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.outputFile).toBe('test-output.txt');
    });

    it('should handle rate limit errors (429)', async () => {
      const promise = adapter.execute({
        prompt: 'Test prompt',
      });

      // Simulate rate limit error
      setTimeout(() => {
        mockProcess.stderr.emit('data', 'Error: rate limit exceeded (429)');
        mockProcess.emit('close', 1);
      }, 10);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('RATE_LIMIT_429');
    });

    it('should handle context exceeded errors', async () => {
      const promise = adapter.execute({
        prompt: 'Very long prompt...',
      });

      // Simulate context exceeded error
      setTimeout(() => {
        mockProcess.stderr.emit('data', 'Error: context length exceeded');
        mockProcess.emit('close', 1);
      }, 10);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('CONTEXT_EXCEEDED');
    });

    it('should handle timeout', async () => {
      // Reduce timeout for testing
      (adapter as any).config.timeout = 100;

      const promise = adapter.execute({
        prompt: 'Test prompt',
      });

      // Don't emit close event to trigger timeout
      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('TIMEOUT');
      expect(mockProcess.kill).toHaveBeenCalled();
    });

    it('should handle process errors', async () => {
      const promise = adapter.execute({
        prompt: 'Test prompt',
      });

      // Simulate process error
      setTimeout(() => {
        mockProcess.emit('error', new Error('Command not found'));
      }, 10);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('API_ERROR');
    });

    it('should detect Chinese rate limit messages', async () => {
      const promise = adapter.execute({
        prompt: 'Test prompt',
      });

      // Simulate Chinese rate limit error
      setTimeout(() => {
        mockProcess.stderr.emit('data', '错误：请求过于频繁');
        mockProcess.emit('close', 1);
      }, 10);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('RATE_LIMIT_429');
    });

    it('should detect Chinese context exceeded messages', async () => {
      const promise = adapter.execute({
        prompt: 'Test prompt',
      });

      // Simulate Chinese context exceeded error
      setTimeout(() => {
        mockProcess.stderr.emit('data', '错误：上下文过长');
        mockProcess.emit('close', 1);
      }, 10);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('CONTEXT_EXCEEDED');
    });
  });

  describe('isAvailable', () => {
    it('should return true when kimi is available', async () => {
      const promise = adapter.isAvailable();

      setTimeout(() => {
        mockProcess.emit('close', 0);
      }, 10);

      const result = await promise;
      expect(result).toBe(true);
    });

    it('should return false when kimi is not available', async () => {
      const promise = adapter.isAvailable();

      setTimeout(() => {
        mockProcess.emit('close', 1);
      }, 10);

      const result = await promise;
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const promise = adapter.isAvailable();

      setTimeout(() => {
        mockProcess.emit('error', new Error('Command not found'));
      }, 10);

      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe('getModelInfo', () => {
    it('should return correct model information', () => {
      const info = adapter.getModelInfo();

      expect(info.id).toBe('kimi-k2.5');
      expect(info.provider).toBe('moonshot');
      expect(info.contextWindow).toBe(200000);
      expect(info.capabilities).toContain('agent-swarm');
      expect(info.recommendedFor).toContain('architect');
      expect(info.cost).toHaveProperty('input');
      expect(info.cost).toHaveProperty('output');
    });
  });
});
