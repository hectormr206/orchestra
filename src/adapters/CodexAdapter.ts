/**
 * Codex Adapter
 *
 * Usa Codex CLI para el rol de Consultor
 * Especializado en problemas algorítmicos y debugging
 */

import { spawn } from 'child_process';
import { writeFile } from 'fs/promises';
import type { AdapterConfig, ExecuteOptions, AgentResult } from '../types.js';

export class CodexAdapter {
  private config: AdapterConfig;

  constructor() {
    this.config = {
      command: 'codex',
      timeout: 300000, // 5 minutos
      env: {},
    };
  }

  /**
   * Ejecuta un prompt con Codex CLI
   */
  async execute(options: ExecuteOptions): Promise<AgentResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      // Codex CLI usa 'exec' para modo no-interactivo
      // --dangerously-bypass-approvals-and-sandbox para ejecución automática
      // -o para escribir el resultado a un archivo
      const args = [
        'exec',
        '--dangerously-bypass-approvals-and-sandbox',
        options.prompt,
      ];

      if (options.outputFile) {
        args.push('-o', options.outputFile);
      }

      const proc = spawn(this.config.command, args, {
        cwd: options.workingDir || process.cwd(),
        env: {
          ...process.env,
          ...this.config.env,
        },
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
          error: 'Timeout: Codex tardó más de 5 minutos',
        });
      }, this.config.timeout);

      proc.on('close', async (code) => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        // Detectar límite de uso
        if (this.isRateLimitError(stderr) || this.isRateLimitError(stdout)) {
          resolve({
            success: false,
            duration,
            error: 'RATE_LIMIT: Codex alcanzó su límite de uso',
          });
          return;
        }

        if (code === 0 || stdout.length > 0) {
          // Si hay archivo de salida, escribir el resultado
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
            error: stderr || `Proceso terminó con código ${code}`,
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
   * Detecta si el error es por límite de uso
   */
  private isRateLimitError(output: string): boolean {
    const rateLimitPatterns = [
      /rate limit/i,
      /quota exceeded/i,
      /too many requests/i,
      /429/,
      /resource exhausted/i,
      /limit reached/i,
      /usage limit/i,
      /insufficient_quota/i,
    ];
    return rateLimitPatterns.some(pattern => pattern.test(output));
  }

  /**
   * Verifica si el adapter está disponible
   */
  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('which', ['codex']);
      proc.on('close', (code) => {
        resolve(code === 0);
      });
      proc.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Obtiene información del adapter
   */
  getInfo(): { name: string; model: string; provider: string } {
    return {
      name: 'CodexAdapter',
      model: 'Codex CLI',
      provider: 'OpenAI',
    };
  }
}
