/**
 * Dev Server Manager - Manages the development server lifecycle
 *
 * Starts a dev server (e.g., "npm run dev"), waits for it to be ready,
 * and cleanly shuts it down when no longer needed.
 */

import { spawn, type ChildProcess } from "child_process";
import { findAvailablePort, parsePort } from "../utils/portUtils.js";

export class DevServerManager {
  private process: ChildProcess | null = null;

  /**
   * Start the dev server with automatic port detection.
   * Returns the actual URL the server is running on (port may differ from appUrl).
   */
  async start(command: string, appUrl: string): Promise<string> {
    const requestedPort = parsePort(appUrl);
    const actualPort = await findAvailablePort(requestedPort);

    const [cmd, ...args] = command.split(/\s+/);

    this.process = spawn(cmd, args, {
      cwd: process.cwd(),
      stdio: "pipe",
      shell: true,
      env: { ...process.env, PORT: String(actualPort) },
    });

    // Log errors but don't throw - server output may contain warnings
    this.process.stderr?.on("data", () => {
      // Swallow stderr - dev servers often output warnings here
    });

    // Build the actual URL with the resolved port
    const parsed = new URL(appUrl);
    parsed.port = String(actualPort);
    const actualUrl = parsed.toString().replace(/\/$/, "");

    // Wait for the server to be ready
    const ready = await this.waitForReady(actualUrl, 30000);
    if (!ready) {
      await this.stop();
      throw new Error(
        `Dev server failed to start within 30s. Command: ${command}`,
      );
    }

    return actualUrl;
  }

  async waitForReady(url: string, timeout: number): Promise<boolean> {
    const startTime = Date.now();
    let delay = 500;

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(3000),
        });
        if (response.ok || response.status < 500) {
          return true;
        }
      } catch {
        // Server not ready yet
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, 3000); // Exponential backoff, max 3s
    }

    return false;
  }

  async stop(): Promise<void> {
    if (!this.process) return;

    return new Promise<void>((resolve) => {
      const proc = this.process!;
      this.process = null;

      const timeout = setTimeout(() => {
        proc.kill("SIGKILL");
        resolve();
      }, 5000);

      proc.on("exit", () => {
        clearTimeout(timeout);
        resolve();
      });

      // Try graceful shutdown first
      proc.kill("SIGTERM");
    });
  }
}
