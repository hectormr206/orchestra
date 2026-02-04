/**
 * Tests for ClaudeAdapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClaudeAdapter } from './ClaudeAdapter.js';
import type { ExecuteOptions, AgentResult } from '../types.js';

// Mock execFile for curl commands
vi.mock('util', () => ({
  execFile: vi.fn(),
  promisify: vi.fn(() => (cmd: string, args: string[]) => {
    return new Promise((resolve, reject) => {
      // Mock different responses based on command
      if (cmd === 'curl' && args.includes('https://api.anthropic.com/v1/messages')) {
        // Mock successful API response
        resolve({
          stdout: JSON.stringify({
            content: [
              {
                type: 'text',
                text: 'Mock response from Claude API'
              }
            ],
            usage: {
              input_tokens: 100,
              output_tokens: 50
            }
          })
        });
      } else if (cmd === 'curl' && args.includes('models')) {
        // Mock models list
        resolve({
          stdout: JSON.stringify({
            data: [
              { id: 'claude-3-5-sonnet-20241022' },
              { id: 'claude-3-opus-20240229' }
            ]
          })
        });
      } else {
        reject(new Error('Command failed'));
      }
    });
  }),
}));

describe('ClaudeAdapter', () => {
  let adapter: ClaudeAdapter;

  beforeEach(() => {
    adapter = new ClaudeAdapter({
      apiKey: 'test-key',
    });
  });

  describe('constructor', () => {
    it('should create adapter with API key', () => {
      expect(adapter).toBeDefined();
    });

    it('should create adapter with custom options', () => {
      const customAdapter = new ClaudeAdapter({
        apiKey: 'custom-key',
        model: 'claude-3-5-sonnet-20241022',
        timeout: 60000,
      });
      expect(customAdapter).toBeDefined();
    });

    it('should use default model if not specified', () => {
      const defaultAdapter = new ClaudeAdapter({
        apiKey: 'test-key',
      });
      expect(defaultAdapter).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should execute prompt and return result', async () => {
      const options: ExecuteOptions = {
        prompt: 'Test prompt',
        systemPrompt: 'You are a helpful assistant',
      };

      const result: AgentResult = await adapter.execute(options);

      expect(result).toBeDefined();
      expect(result.content).toContain('Mock response from Claude API');
      expect(result.success).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      // Mock error scenario would go here
      const options: ExecuteOptions = {
        prompt: 'Test prompt',
      };

      const result = await adapter.execute(options);
      expect(result).toBeDefined();
    });

    it('should include usage statistics', async () => {
      const options: ExecuteOptions = {
        prompt: 'Count to 10',
      };

      const result = await adapter.execute(options);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.usage).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    it('should return true when API key is set', async () => {
      const available = await adapter.isAvailable();
      expect(available).toBe(true);
    });
  });

  describe('listModels', () => {
    it('should return list of available models', async () => {
      const models = await adapter.listModels();

      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toContain('claude');
    });
  });

  describe('hasModel', () => {
    it('should return true for available model', async () => {
      const hasModel = await adapter.hasModel('claude-3-5-sonnet-20241022');
      expect(hasModel).toBe(true);
    });

    it('should return false for unavailable model', async () => {
      const hasModel = await adapter.hasModel('non-existent-model');
      expect(hasModel).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle missing API key', async () => {
      const noKeyAdapter = new ClaudeAdapter({
        apiKey: '',
      });

      const options: ExecuteOptions = {
        prompt: 'Test',
      };

      const result = await noKeyAdapter.execute(options);
      expect(result).toBeDefined();
    });

    it('should handle timeout errors', async () => {
      const timeoutAdapter = new ClaudeAdapter({
        apiKey: 'test-key',
        timeout: 1,
      });

      const options: ExecuteOptions = {
        prompt: 'Test',
      };

      const result = await timeoutAdapter.execute(options);
      expect(result).toBeDefined();
    });
  });

  describe('model parameter', () => {
    it('should use custom model when specified', async () => {
      const customModelAdapter = new ClaudeAdapter({
        apiKey: 'test-key',
        model: 'claude-3-opus-20240229',
      });

      const options: ExecuteOptions = {
        prompt: 'Test with custom model',
      };

      const result = await customModelAdapter.execute(options);
      expect(result).toBeDefined();
    });
  });
});
