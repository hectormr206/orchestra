/**
 * Kimi Adapter via Claude Code
 *
 * Usa Claude CLI redirigido a la API de Kimi (kimi.com/code)
 * Similar a GLMAdapter pero usando el provider de Kimi
 */

import { spawn } from "child_process";
import { writeFile } from "fs/promises";
import type { AdapterConfig, ExecuteOptions, AgentResult } from "../types.js";
import { isContextExceededError, compactPrompt } from "./contextCompaction.js";

export class KimiAdapter {
  private config: AdapterConfig;
  private isWindows: boolean;

  constructor() {
    const apiKey = process.env.KIMI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "KIMI_API_KEY no está configurada. Agrégala a tu .zshrc:\n" +
          '  export KIMI_API_KEY="tu-api-key"',
      );
    }

    this.isWindows = process.platform === "win32";

    this.config = {
      command: this.isWindows ? "wsl" : "claude",
      timeout: 600000, // 10 minutos (planning puede ser complejo)
      env: {
        ANTHROPIC_API_KEY: apiKey,
        ANTHROPIC_BASE_URL: "https://api.kimi.com/coding/",
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
      // En Windows usamos WSL con zsh para cargar claude-kimi desde .zshrc
      // En Linux/Mac ejecutamos claude directamente con env vars
      let args: string[];
      let spawnEnv;

      if (this.isWindows) {
        // Usar función claude-kimi de .zshrc (carga env vars automáticamente)
        args = ["zsh", "-i", "-c", `claude --print -p ${this.escapeShellArg(options.prompt)}`];
        spawnEnv = process.env; // No necesitamos configurar ANTHROPIC_* aquí
      } else {
        // En Linux/Mac configurar env vars manualmente
        args = ["--print", "-p", options.prompt];
        spawnEnv = {
          ...process.env,
          ...this.config.env,
        };
      }

      const proc = spawn(this.config.command, args, {
        cwd: options.workingDir || process.cwd(),
        env: spawnEnv,
        stdio: ["pipe", "pipe", "pipe"],
      });

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
            error: "RATE_LIMIT: Kimi alcanzó su límite de uso",
          });
          return;
        }

        // Detectar contexto excedido y aplicar compactación automática
        if (isContextExceededError(stderr) || isContextExceededError(stdout)) {
          if (retryCount < 2) {
            console.warn(`⚠️  [KimiAdapter] Contexto excedido. Compactando prompt (intento ${retryCount + 1}/2)...`);

            const compactionResult = compactPrompt(options.prompt);
            console.log(`📦 [KimiAdapter] Prompt compactado: ${compactionResult.originalLength} → ${compactionResult.compactedLength} chars (${compactionResult.reductionPercent}% reducción)`);

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
   * Escapa argumentos para shell en WSL
   */
  private escapeShellArg(arg: string): string {
    // Reemplazar comillas simples con '\''
    return `'${arg.replace(/'/g, "'\\''")}'`;
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
      /用量已达上限/i, // Mensaje en chino
      /请求过于频繁/i,
    ];
    return rateLimitPatterns.some((pattern) => pattern.test(output));
  }

  /**
   * Verifica si el adapter está disponible
   */
  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isWindows) {
        // En Windows, verificar si WSL está disponible
        const proc = spawn("wsl", ["which", "claude"]);
        proc.on("close", (code) => {
          resolve(code === 0);
        });
        proc.on("error", () => {
          resolve(false);
        });
      } else {
        // En Linux/Mac, verificar directamente
        const proc = spawn("which", ["claude"]);
        proc.on("close", (code) => {
          resolve(code === 0);
        });
        proc.on("error", () => {
          resolve(false);
        });
      }
    });
  }

  /**
   * Obtiene información del adapter
   */
  getInfo(): { name: string; model: string; provider: string } {
    return {
      name: "KimiAdapter",
      model: "Claude (Kimi k2.5)",
      provider: "kimi.com",
    };
  }

  /**
   * Obtiene información detallada del modelo
   */
  getModelInfo() {
    return {
      id: "kimi-k2.5",
      provider: "moonshot",
      name: "Kimi k2.5",
      contextWindow: 200000, // 200K tokens
      capabilities: ["agent-swarm", "long-context", "code-generation"],
      recommendedFor: ["architect", "consultant"],
      cost: {
        input: 0.001, // USD por 1K tokens (estimado)
        output: 0.002,
      },
      status: "active",
    };
  }
}
