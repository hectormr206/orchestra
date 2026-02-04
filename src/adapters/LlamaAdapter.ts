/**
 * Llama 3 Adapter
 *
 * Soporte para Llama 3 mediante:
 * - Ollama (local)
 * - API-compatible endpoints (Groq, OpenAI-compatible, etc.)
 */

import { spawn, execFile } from 'child_process';
import { writeFile } from 'fs/promises';
import { promisify } from 'util';
import type { AdapterConfig, ExecuteOptions, AgentResult } from '../types.js';

const execFileAsync = promisify(execFile);

export interface LlamaAdapterOptions {
  /**
   * Modo de ejecución: 'ollama' para local, 'api' para API endpoint
   */
  mode: 'ollama' | 'api';

  /**
   * URL del API endpoint (solo modo 'api')
   * Por defecto: http://localhost:11434/v1 (Ollama API)
   */
  apiUrl?: string;

  /**
   * API key (opcional, solo para algunos proveedores como Groq)
   */
  apiKey?: string;

  /**
   * Modelo Llama 3 a usar
   * Ollama: 'llama3', 'llama3:70b', etc.
   * API: 'llama-3.1-8b', 'llama-3.1-70b', etc.
   */
  model?: string;

  /**
   * Timeout en ms
   */
  timeout?: number;
}

export class LlamaAdapter {
  private config: AdapterConfig;
  private options: LlamaAdapterOptions;

  constructor(options: LlamaAdapterOptions = { mode: 'ollama' }) {
    this.options = {
      mode: options.mode || 'ollama',
      apiUrl: options.apiUrl || 'http://localhost:11434/v1',
      apiKey: options.apiKey,
      model: options.model || 'llama3',
      timeout: options.timeout || 300000,
    };

    this.config = {
      command: options.mode === 'ollama' ? 'ollama' : 'curl',
      timeout: this.options.timeout || 300000,
      env: {
        ...options.apiKey && { LLAMA_API_KEY: options.apiKey },
      },
    };
  }

  /**
   * Ejecuta un prompt con Llama 3
   */
  async execute(options: ExecuteOptions): Promise<AgentResult> {
    const startTime = Date.now();

    if (this.options.mode === 'ollama') {
      return this.executeWithOllama(options, startTime);
    } else {
      return this.executeWithAPI(options, startTime);
    }
  }

  /**
   * Ejecuta usando Ollama CLI (local)
   */
  private async executeWithOllama(
    options: ExecuteOptions,
    startTime: number
  ): Promise<AgentResult> {
    return new Promise((resolve) => {
      // Ollama CLI: ollama run MODEL < prompt
      const args = ['run', this.options.model!, options.prompt];

      const proc = spawn(this.config.command, args, {
        cwd: options.workingDir || process.cwd(),
        env: { ...process.env, ...this.config.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Cerrar stdin inmediatamente
      proc.stdin.end();

      // Timeout
      const timeoutId = setTimeout(() => {
        proc.kill('SIGTERM');
        resolve({
          success: false,
          duration: Date.now() - startTime,
          error: `Timeout: Llama 3 (Ollama) tardó más de ${this.config.timeout / 1000}s`,
        });
      }, this.config.timeout);

      proc.on('close', async (code) => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        if (this.isRateLimitError(stderr) || this.isRateLimitError(stdout)) {
          resolve({
            success: false,
            duration,
            error: 'RATE_LIMIT: Llama 3 alcanzó su límite de uso',
          });
          return;
        }

        if (code === 0 || stdout.length > 0) {
          if (options.outputFile) {
            try {
              await writeFile(options.outputFile, stdout, 'utf-8');
            } catch (err) {
              resolve({
                success: false,
                duration,
                error: `Error escribiendo archivo: ${err}`,
              });
              return;
            }
          }

          resolve({
            success: true,
            duration,
            outputFile: options.outputFile,
          });
        } else {
          resolve({
            success: false,
            duration,
            error: stderr || `Ollama terminó con código ${code}`,
          });
        }
      });

      proc.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          duration: Date.now() - startTime,
          error: error.message,
        });
      });
    });
  }

  /**
   * Ejecuta usando API endpoint (Groq, OpenAI-compatible, etc.)
   */
  private async executeWithAPI(
    options: ExecuteOptions,
    startTime: number
  ): Promise<AgentResult> {
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
          error: 'RATE_LIMIT: Llama 3 API alcanzó su límite de uso',
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
          error: `No se pudo conectar a la API de Llama 3 en ${this.options.apiUrl}`,
        };
      }

      if (error.code === 'ETIMEDOUT' || error.killed) {
        return {
          success: false,
          duration,
          error: `Timeout: Llama 3 API tardó más de ${this.config.timeout / 1000}s`,
        };
      }

      return {
        success: false,
        duration,
        error: error.stderr || error.message || 'Error desconocido en Llama 3 API',
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
      if (this.options.mode === 'ollama') {
        // Verificar si Ollama está instalado y corriendo
        const result = await execFileAsync('which', ['ollama']);
        if (result.stdout.trim() === '') {
          return false;
        }

        // Verificar si Ollama está corriendo
        try {
          await execFileAsync('ollama', ['list'], { timeout: 5000 });
          return true;
        } catch {
          return false;
        }
      } else {
        // Modo API: verificar si el endpoint es accesible
        const curlArgs = ['-s', '-o', '/dev/null', '-w', '%{http_code}', `${this.options.apiUrl}/models`];

        try {
          const result = await execFileAsync('curl', curlArgs, { timeout: 5000 });
          const statusCode = parseInt(result.stdout.trim(), 10);
          return statusCode >= 200 && statusCode < 500;
        } catch {
          return false;
        }
      }
    } catch {
      return false;
    }
  }

  /**
   * Obtiene información del adapter
   */
  getInfo(): { name: string; model: string; provider: string; mode: string } {
    return {
      name: 'LlamaAdapter',
      model: this.options.model!,
      provider: this.options.mode === 'ollama' ? 'Ollama (Local)' : 'API',
      mode: this.options.mode,
    };
  }

  /**
   * Lista los modelos Llama 3 disponibles (solo Ollama)
   */
  async listModels(): Promise<string[]> {
    if (this.options.mode !== 'ollama') {
      throw new Error('listModels() solo está disponible en modo Ollama');
    }

    try {
      const result = await execFileAsync('ollama', ['list']);
      const output = result.stdout;

      // Parsear la salida de "ollama list"
      // Formato: NAME    ID      SIZE    MODIFIED
      const lines = output.split('\n').slice(1); // Skip header
      const models = lines
        .filter((line) => line.trim().length > 0)
        .map((line) => {
          const match = line.match(/^(\S+)/);
          return match ? match[1] : '';
        })
        .filter((model) => model.toLowerCase().includes('llama'));

      return models;
    } catch {
      return [];
    }
  }

  /**
   * Verifica si un modelo específico está disponible en Ollama
   */
  async hasModel(model: string): Promise<boolean> {
    if (this.options.mode !== 'ollama') {
      return false;
    }

    try {
      const models = await this.listModels();
      return models.some((m) => m === model || m.startsWith(model));
    } catch {
      return false;
    }
  }

  /**
   * Descarga un modelo en Ollama
   */
  async pullModel(model: string): Promise<{ success: boolean; error?: string }> {
    if (this.options.mode !== 'ollama') {
      return {
        success: false,
        error: 'pullModel() solo está disponible en modo Ollama',
      };
    }

    try {
      await execFileAsync('ollama', ['pull', model], { timeout: 300000 });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || `Error descargando modelo ${model}`,
      };
    }
  }
}
