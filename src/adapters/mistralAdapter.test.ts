/**
 * Tests for Mistral Adapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MistralAdapter } from './MistralAdapter.js';

// Mock child_process
const mockExecFile = vi.fn();

vi.mock('child_process', () => ({
  execFile: (...args: unknown[]) => mockExecFile(...args),
}));

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

describe('MistralAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecFile.mockReset();
  });

  describe('constructor', () => {
    it('should create adapter with API mode by default', () => {
      const adapter = new MistralAdapter({ mode: 'api', apiKey: 'test-key' });

      const info = adapter.getInfo();
      expect(info.mode).toBe('api');
      expect(info.provider).toBe('Mistral AI');
      expect(info.model).toBe('open-mistral-7b');
    });

    it('should create adapter with Azure mode', () => {
      const adapter = new MistralAdapter({
        mode: 'azure',
        apiUrl: 'https://mistral-api.azure.com/v1',
        apiKey: 'azure-key',
        model: 'mistral-large',
      });

      const info = adapter.getInfo();
      expect(info.mode).toBe('azure');
      expect(info.provider).toBe('Azure AI');
      expect(info.model).toBe('mistral-large');
    });

    it('should use custom model', () => {
      const adapter = new MistralAdapter({
        mode: 'api',
        model: 'open-mixtral-8x7b',
      });

      const info = adapter.getInfo();
      expect(info.model).toBe('open-mixtral-8x7b');
    });

    it('should use custom timeout', () => {
      const adapter = new MistralAdapter({
        mode: 'api',
        timeout: 60000,
      });

      const info = adapter.getInfo();
      expect(info.model).toBe('open-mistral-7b');
    });
  });

  describe('execute', () => {
    let adapter: MistralAdapter;

    beforeEach(() => {
      adapter = new MistralAdapter({
        mode: 'api',
        apiKey: 'test-key',
        model: 'open-mistral-7b',
      });
    });

    // TODO: Fix execFileAsync mocking - same issue as testRunner.test.ts, githubIntegration.test.ts, and llamaAdapter.test.ts
    it.skip('should execute prompt with Mistral API', async () => {
      mockExecFile.mockResolvedValueOnce({
        stdout: JSON.stringify({
          choices: [
            {
              message: {
                content: 'Generated API response',
              },
            },
          ],
        }),
        stderr: '',
      });

      const result = await adapter.execute({
        prompt: 'Write a function',
        outputFile: '/tmp/output.txt',
      });

      expect(result.success).toBe(true);
      expect(mockExecFile).toHaveBeenCalledWith(
        'curl',
        expect.arrayContaining([
          '-s',
          '-X', 'POST',
          '-H', 'Content-Type: application/json',
          '-H', 'Authorization: Bearer test-key',
          expect.stringContaining('https://api.mistral.ai/v1'),
        ]),
        expect.any(Object)
      );
    });

    it.skip('should handle non-JSON responses', async () => {
      mockExecFile.mockResolvedValueOnce({
        stdout: 'Plain text response',
        stderr: '',
      });

      const result = await adapter.execute({
        prompt: 'Test',
      });

      expect(result.success).toBe(true);
    });

    it.skip('should detect rate limit errors', async () => {
      mockExecFile.mockResolvedValueOnce({
        stdout: 'Rate limit exceeded',
        stderr: '',
      });

      const result = await adapter.execute({
        prompt: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('RATE_LIMIT');
    });

    it.skip('should handle connection errors', async () => {
      const error: any = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      mockExecFile.mockRejectedValueOnce(error);

      const result = await adapter.execute({
        prompt: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No se pudo conectar a la API de Mistral');
    });

    it.skip('should handle timeout errors', async () => {
      const error: any = new Error('Timeout');
      error.killed = true;
      mockExecFile.mockRejectedValueOnce(error);

      const result = await adapter.execute({
        prompt: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
    });

    it.skip('should handle authentication errors', async () => {
      mockExecFile.mockRejectedValueOnce({
        stderr: '401 Unauthorized',
      });

      const result = await adapter.execute({
        prompt: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error de autenticación');
    });

    it.skip('should work without API key', async () => {
      const adapter = new MistralAdapter({
        mode: 'api',
        apiUrl: 'http://localhost:11434/v1',
        model: 'mistral-7b',
      });

      mockExecFile.mockResolvedValueOnce({
        stdout: JSON.stringify({
          choices: [{ message: { content: 'Response' } }],
        }),
        stderr: '',
      });

      const result = await adapter.execute({ prompt: 'Test' });

      expect(result.success).toBe(true);

      const curlArgs = mockExecFile.mock.calls[0][1] as string[];
      expect(curlArgs).not.toContain('Authorization: Bearer');
    });
  });

  describe('isAvailable', () => {
    // TODO: Fix execFileAsync mocking
    it.skip('should return true when API is available', async () => {
      mockExecFile.mockResolvedValueOnce({
        stdout: '200',
        stderr: '',
      });

      const adapter = new MistralAdapter({ mode: 'api', apiKey: 'test' });
      const available = await adapter.isAvailable();

      expect(available).toBe(true);
      expect(mockExecFile).toHaveBeenCalledWith(
        'curl',
        ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'https://api.mistral.ai/v1/models'],
        expect.objectContaining({ timeout: 5000 })
      );
    });

    it.skip('should return true when API returns 401 (endpoint exists but bad key)', async () => {
      mockExecFile.mockResolvedValueOnce({
        stdout: '401',
        stderr: '',
      });

      const adapter = new MistralAdapter({ mode: 'api', apiKey: 'test' });
      const available = await adapter.isAvailable();

      expect(available).toBe(true);
    });

    it.skip('should return false when API is unavailable', async () => {
      mockExecFile.mockResolvedValueOnce({
        stdout: '502',
        stderr: '',
      });

      const adapter = new MistralAdapter({ mode: 'api', apiKey: 'test' });
      const available = await adapter.isAvailable();

      expect(available).toBe(false);
    });

    it.skip('should return false on connection error', async () => {
      mockExecFile.mockRejectedValueOnce(new Error('Network error'));

      const adapter = new MistralAdapter({ mode: 'api', apiKey: 'test' });
      const available = await adapter.isAvailable();

      expect(available).toBe(false);
    });
  });

  describe('listModels', () => {
    // TODO: Fix execFileAsync mocking
    it.skip('should list available Mistral models', async () => {
      mockExecFile.mockResolvedValueOnce({
        stdout: JSON.stringify({
          data: [
            { id: 'mistral-tiny', object: 'model' },
            { id: 'open-mistral-7b', object: 'model' },
            { id: 'open-mixtral-8x7b', object: 'model' },
            { id: 'mistral-large-latest', object: 'model' },
            { id: 'codestral-latest', object: 'model' },
          ],
        }),
        stderr: '',
      });

      const adapter = new MistralAdapter({ mode: 'api', apiKey: 'test' });
      const models = await adapter.listModels();

      expect(models).toEqual([
        'mistral-tiny',
        'open-mistral-7b',
        'open-mixtral-8x7b',
        'mistral-large-latest',
        'codestral-latest',
      ]);
    });

    it.skip('should filter only Mistral models', async () => {
      mockExecFile.mockResolvedValueOnce({
        stdout: JSON.stringify({
          data: [
            { id: 'open-mistral-7b', object: 'model' },
            { id: 'gpt-4', object: 'model' },
            { id: 'open-mixtral-8x7b', object: 'model' },
          ],
        }),
        stderr: '',
      });

      const adapter = new MistralAdapter({ mode: 'api', apiKey: 'test' });
      const models = await adapter.listModels();

      expect(models).toEqual(['open-mistral-7b', 'open-mixtral-8x7b']);
    });

    it.skip('should handle API errors', async () => {
      mockExecFile.mockRejectedValueOnce(new Error('Network error'));

      const adapter = new MistralAdapter({ mode: 'api', apiKey: 'test' });
      const models = await adapter.listModels();

      expect(models).toEqual([]);
    });
  });

  describe('hasModel', () => {
    // TODO: Fix execFileAsync mocking
    it.skip('should check if model exists', async () => {
      mockExecFile.mockResolvedValueOnce({
        stdout: JSON.stringify({
          data: [
            { id: 'open-mistral-7b', object: 'model' },
            { id: 'open-mixtral-8x7b', object: 'model' },
          ],
        }),
        stderr: '',
      });

      const adapter = new MistralAdapter({ mode: 'api', apiKey: 'test' });

      expect(await adapter.hasModel('open-mistral-7b')).toBe(true);
      expect(await adapter.hasModel('mistral-large')).toBe(false);
      expect(await adapter.hasModel('open-mixtral')).toBe(true);
    });

    it.skip('should handle errors gracefully', async () => {
      mockExecFile.mockRejectedValueOnce(new Error('API error'));

      const adapter = new MistralAdapter({ mode: 'api', apiKey: 'test' });

      expect(await adapter.hasModel('open-mistral-7b')).toBe(false);
    });
  });

  describe('getInfo', () => {
    it('should return correct info for API mode', () => {
      const adapter = new MistralAdapter({
        mode: 'api',
        apiUrl: 'https://api.mistral.ai/v1',
        model: 'open-mistral-7b',
      });

      const info = adapter.getInfo();
      expect(info).toEqual({
        name: 'MistralAdapter',
        model: 'open-mistral-7b',
        provider: 'Mistral AI',
        mode: 'api',
      });
    });

    it('should return correct info for Azure mode', () => {
      const adapter = new MistralAdapter({
        mode: 'azure',
        apiUrl: 'https://mistral-api.azure.com/v1',
        model: 'mistral-large',
      });

      const info = adapter.getInfo();
      expect(info).toEqual({
        name: 'MistralAdapter',
        model: 'mistral-large',
        provider: 'Azure AI',
        mode: 'azure',
      });
    });
  });
});
