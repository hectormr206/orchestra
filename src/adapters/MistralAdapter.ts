/**
 * Mistral Adapter
 *
 * Soporte para Mistral AI mediante:
 * - Mistral AI API (https://docs.mistral.ai/)
 * - Azure AI (Mistral models via Azure)
 * - OpenAI-compatible endpoints que sirven modelos Mistral
 */

import { spawn } from 'child_process';
import { writeFile } from 'fs/promises';
import { promisify } from 'util';
import { execFile } from 'child_process';
import type { AdapterConfig, ExecuteOptions, AgentResult } from '../types.js';

const execFileAsync = promisify(execFile);

export interface MistralAdapterOptions {
  /**
   * Modo de ejecución: 'api' para Mistral AI API, 'azure' para Azure AI
   */
  mode: 'api' | 'azure' | 'custom';

  /**
   * URL del API endpoint
   * Por defecto: https://api.mistral.ai/v1
   */
  apiUrl?: string;

  /**
   * API key para Mistral AI
   */
  apiKey?: string;

  /**
   * Modelo Mistral a usar
   * Opciones: 'open-mistral-7b', 'open-mixtral-8x7b', 'mistral-large-latest', etc.
   */
  model?: string;

  /**
   * Timeout en ms
   */
  timeout?: number;
}

export class MistralAdapter {
  private config: AdapterConfig;
  private options: MistralAdapterOptions;

  constructor(options: MistralAdapterOptions) {
    this.options = {
      mode: options.mode || 'api',
      apiUrl: options.apiUrl || 'https://api.mistral.ai/v1',
      apiKey: options.apiKey,
      model: options.model || 'open-mistral-7b',
      timeout: options.timeout || 300000,
    };

    this.config = {
      command: 'curl',
      timeout: this.options.timeout || 300000,
      env: {
        ...options.apiKey && { MISTRAL_API_KEY: options.apiKey },
      },
    };
  }

  /**
   * Ejecuta un prompt con Mistral
   */
  async execute(options: ExecuteOptions): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const apiUrl = this.options.apiUrl!;
      const model = this.options.model!;

      // Construir el payload para la API
      const payload = JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: options.prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      });

      // Construir los argumentos para curl
      const curlArgs = [
        '-s', // Silent mode
        '-X', 'POST',
        '-H', 'Content-Type: application/json',
        ...(this.options.apiKey ? ['-H', `Authorization: Bearer ${this.options.apiKey}`] : []),
        '-d', payload,
        `${apiUrl}/chat/completions`,
      ];

      const result = await execFileAsync('curl', curlArgs, {
        cwd: options.workingDir || process.cwd(),
        timeout: this.config.timeout,
      });

      const duration = Date.now() - startTime;

      // Parsear la respuesta de la API
      let responseText: string;
      try {
        const response = JSON.parse(result.stdout);
        responseText = response.choices?.[0]?.message?.content || result.stdout;
      } catch {
        // Si no es JSON válido, usar el stdout tal cual
        responseText = result.stdout;
      }

      // Verificar errores de rate limit
      if (this.isRateLimitError(result.stderr) || this.isRateLimitError(result.stdout)) {
        return {
          success: false,
          duration,
          error: 'RATE_LIMIT: Mistral API alcanzó su límite de uso',
        };
      }

      // Escribir al archivo de salida si se especificó
      if (options.outputFile) {
        await writeFile(options.outputFile, responseText, 'utf-8');
      }

      return {
        success: true,
        duration,
        outputFile: options.outputFile,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Detectar errores específicos
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          duration,
          error: `No se pudo conectar a la API de Mistral en ${this.options.apiUrl}`,
        };
      }

      if (error.code === 'ETIMEDOUT' || error.killed) {
        return {
          success: false,
          duration,
          error: `Timeout: Mistral API tardó más de ${this.config.timeout / 1000}s`,
        };
      }

      // Verificar si es un error de autenticación
      if (error.stderr?.includes('401') || error.stderr?.includes('Unauthorized')) {
        return {
          success: false,
          duration,
          error: 'Error de autenticación: Verifica tu API key de Mistral',
        };
      }

      return {
        success: false,
        duration,
        error: error.stderr || error.message || 'Error desconocido en Mistral API',
      };
    }
  }

  /**
   * Detecta si el error es por límite de uso
   */
  private isRateLimitError(output: string): boolean {
    const rateLimitPatterns = [
      /rate limit/i,
      /quota exceeded/i,
      /too many requests/i,
      /429/,
      /resource exhausted/i,
      /overloaded/i,
      /rate_limit/i,
    ];
    return rateLimitPatterns.some((pattern) => pattern.test(output));
  }

  /**
   * Verifica si el adapter está disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const curlArgs = ['-s', '-o', '/dev/null', '-w', '%{http_code}', `${this.options.apiUrl}/models`];

      const result = await execFileAsync('curl', curlArgs, { timeout: 5000 });
      const statusCode = parseInt(result.stdout.trim(), 10);

      // 200-299: Success, 401: API key issue but endpoint exists
      return statusCode >= 200 && statusCode < 500;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene información del adapter
   */
  getInfo(): { name: string; model: string; provider: string; mode: string } {
    return {
      name: 'MistralAdapter',
      model: this.options.model!,
      provider: this.options.mode === 'azure' ? 'Azure AI' : 'Mistral AI',
      mode: this.options.mode,
    };
  }

  /**
   * Lista los modelos Mistral disponibles
   */
  async listModels(): Promise<string[]> {
    try {
      const curlArgs = [
        '-s',
        '-H', 'Content-Type: application/json',
        ...(this.options.apiKey ? ['-H', `Authorization: Bearer ${this.options.apiKey}`] : []),
        `${this.options.apiUrl}/models`,
      ];

      const result = await execFileAsync('curl', curlArgs, { timeout: 10000 });

      try {
        const response = JSON.parse(result.stdout);
        const models = response.data
          ?.filter((m: any) => m.id.includes('mistral') || m.id.includes('mixtral') || m.id.includes('codestral'))
          .map((m: any) => m.id);

        return models || [];
      } catch {
        return [];
      }
    } catch {
      return [];
    }
  }

  /**
   * Verifica si un modelo específico está disponible
   */
  async hasModel(model: string): Promise<boolean> {
    try {
      const models = await this.listModels();
      return models.some((m) => m === model || m.startsWith(model));
    } catch {
      return false;
    }
  }
}
