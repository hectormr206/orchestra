/**
 * GLM 4.7 Adapter via z.ai
 *
 * Usa Claude CLI redirigido a la API de z.ai para usar GLM 4.7
 */

import { spawn } from "child_process";
import { writeFile } from "fs/promises";
import type { AdapterConfig, ExecuteOptions, AgentResult } from "../types.js";
import { isContextExceededError, compactPrompt } from "./contextCompaction.js";

export class GLMAdapter {
  private config: AdapterConfig;

  constructor() {
    const apiKey = process.env.ZAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "ZAI_API_KEY no está configurada. Agrégala a tu .zshrc:\n" +
          '  export ZAI_API_KEY="tu-api-key"',
      );
    }

    this.config = {
      command: "claude",
      timeout: 900000, // 15 minutos (igual que el orchestrator)
      env: {
        ANTHROPIC_API_KEY: apiKey,
        ANTHROPIC_BASE_URL: "https://api.z.ai/api/anthropic",
        API_TIMEOUT_MS: "3000000",
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
      },
    };
  }

  /**
   * Ejecuta un prompt y guarda el resultado en un archivo
   * Incluye retry automático con compactación si se excede el contexto
   */
  async execute(options: ExecuteOptions, retryCount: number = 0): Promise<AgentResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const proc = spawn(
        this.config.command,
        ["--print", "-p", options.prompt],
        {
          cwd: options.workingDir || process.cwd(),
          env: {
            ...process.env,
            ...this.config.env,
          },
          stdio: ["pipe", "pipe", "pipe"],
        },
      );

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      // Cerrar stdin inmediatamente
      proc.stdin.end();

      // Timeout
      const timeoutId = setTimeout(() => {
        proc.kill("SIGTERM");
        resolve({
          success: false,
          duration: Date.now() - startTime,
          error: "Timeout: el proceso tardó más de 10 minutos",
        });
      }, this.config.timeout);

      proc.on("close", async (code) => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        // Detectar límite de uso
        if (this.isRateLimitError(stderr) || this.isRateLimitError(stdout)) {
          resolve({
            success: false,
            duration,
            error: "RATE_LIMIT: GLM 4.7 alcanzó su límite de uso",
          });
          return;
        }

        // Detectar contexto excedido y aplicar compactación automática
        if (isContextExceededError(stderr) || isContextExceededError(stdout)) {
          if (retryCount < 2) {
            console.warn(`⚠️  [GLMAdapter] Contexto excedido. Compactando prompt (intento ${retryCount + 1}/2)...`);

            const compactionResult = compactPrompt(options.prompt);
            console.log(`📦 [GLMAdapter] Prompt compactado: ${compactionResult.originalLength} → ${compactionResult.compactedLength} chars (${compactionResult.reductionPercent}% reducción)`);

            // Reintentar con prompt compactado
            const retryResult = await this.execute({
              ...options,
              prompt: compactionResult.compactedPrompt
            }, retryCount + 1);

            resolve(retryResult);
            return;
          } else {
            resolve({
              success: false,
              duration,
              error: "CONTEXT_EXCEEDED: El prompt es demasiado largo incluso después de compactación",
            });
            return;
          }
        }

        if (code === 0) {
          // Si hay archivo de salida, escribir el resultado
          if (options.outputFile) {
            try {
              await writeFile(options.outputFile, stdout, "utf-8");
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

      proc.on("error", (error) => {
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
    ];
    return rateLimitPatterns.some((pattern) => pattern.test(output));
  }

  /**
   * Verifica si el adapter está disponible
   */
  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn("which", ["claude"]);
      proc.on("close", (code) => {
        resolve(code === 0);
      });
      proc.on("error", () => {
        resolve(false);
      });
    });
  }

  /**
   * Obtiene información del adapter
   */
  getInfo(): { name: string; model: string; provider: string } {
    return {
      name: "GLMAdapter",
      model: "Claude (GLM 4.7)",
      provider: "z.ai",
    };
  }
}
