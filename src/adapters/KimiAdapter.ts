/**
 * Kimi Adapter
 *
 * Usa Kimi CLI para el rol de Architect (con Agent Swarm)
 * Kimi k2.5 puede lanzar sub-agentes para investigar dependencias y riesgos
 */

import { spawn } from 'child_process';
import { writeFile } from 'fs/promises';
import type { AdapterConfig, ExecuteOptions, AgentResult } from '../types.js';

export class KimiAdapter {
  private config: AdapterConfig;

  constructor() {
    this.config = {
      command: 'kimi',
      timeout: 600000, // 10 minutos (planning puede ser complejo)
      env: {},
    };
  }

  /**
   * Ejecuta un prompt y guarda el resultado en un archivo
   */
  async execute(options: ExecuteOptions): Promise<AgentResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      // Kimi CLI usa el prompt como argumento posicional
      // -y (yolo) para aprobar automáticamente
      const args = ['-y', options.prompt];

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
          error: 'TIMEOUT: El proceso tardó más de 10 minutos',
        });
      }, this.config.timeout);

      proc.on('close', async (code) => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        // Detectar límite de uso (429)
        if (this.isRateLimitError(stderr) || this.isRateLimitError(stdout)) {
          resolve({
            success: false,
            duration,
            error: 'RATE_LIMIT_429: Kimi alcanzó su límite de uso',
          });
          return;
        }

        // Detectar contexto excedido
        if (this.isContextExceededError(stderr) || this.isContextExceededError(stdout)) {
          resolve({
            success: false,
            duration,
            error: 'CONTEXT_EXCEEDED: La solicitud excede el contexto máximo de Kimi',
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
          error: `API_ERROR: ${error.message}`,
        });
      });
    });
  }

  /**
   * Detecta si el error es por límite de uso (429)
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
      /RESOURCE_EXHAUSTED/i,
      /请求过于频繁/i, // Kimi puede devolver mensajes en chino
      /配额已用完/i,
    ];
    return rateLimitPatterns.some(pattern => pattern.test(output));
  }

  /**
   * Detecta si el error es por contexto excedido
   */
  private isContextExceededError(output: string): boolean {
    const contextPatterns = [
      /context.{0,20}exceed/i,
      /maximum context/i,
      /context.{0,20}limit/i,
      /too.{0,10}long/i,
      /token.{0,20}limit/i,
      /上下文过长/i, // Kimi mensajes en chino
    ];
    return contextPatterns.some(pattern => pattern.test(output));
  }

  /**
   * Verifica si el adapter está disponible
   */
  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('which', ['kimi']);
      proc.on('close', (code) => {
        resolve(code === 0);
      });
      proc.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Implementa la interfaz Adapter
   */
  getInfo(): { name: string; model: string; provider: string } {
    return {
      name: "KimiAdapter",
      model: "Kimi",
      provider: "Moonshot",
    };
  }

  /**
   * Obtiene información detallada del modelo
   */
  getModelInfo() {
    return {
      id: 'kimi-k2.5',
      provider: 'moonshot',
      name: 'Kimi k2.5',
      contextWindow: 200000, // 200K tokens
      capabilities: ['agent-swarm', 'long-context', 'code-generation'],
      recommendedFor: ['architect', 'consultant'],
      cost: {
        input: 0.001, // USD por 1K tokens (estimado)
        output: 0.002,
      },
    };
  }
}
