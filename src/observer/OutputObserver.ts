/**
 * Output Observer - Validates non-web apps by running commands and analyzing output
 *
 * Supports CLI apps, backend APIs (via curl), database queries, and any command
 * that produces stdout/stderr. Uses the same Vision adapters in text-only mode
 * (no images) for output analysis.
 */

import { spawn } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type {
  ObserverConfig,
  VisualValidationResult,
} from "../types.js";
import {
  FallbackVisionAdapter,
  KimiVisionAdapter,
  GLMVisionAdapter,
  type VisionAdapter,
} from "../adapters/VisionAdapter.js";
import {
  buildOutputValidationPrompt,
  parseOutputValidationResponse,
} from "../prompts/observer.js";

export interface CommandResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  duration: number;
}

export class OutputObserver {
  private adapter: VisionAdapter;

  constructor(config: ObserverConfig) {
    // Reuse vision adapters in text-only mode (no images sent)
    if (config.visionModel === "glm") {
      this.adapter = new FallbackVisionAdapter([
        new GLMVisionAdapter(),
        new KimiVisionAdapter(),
      ]);
    } else {
      this.adapter = new FallbackVisionAdapter([
        new KimiVisionAdapter(),
        new GLMVisionAdapter(),
      ]);
    }
  }

  /**
   * Run a command and capture its output
   */
  async runCommand(command: string, timeout: number = 30000): Promise<CommandResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const proc = spawn(command, [], {
        cwd: process.cwd(),
        shell: true,
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

      proc.stdin.end();

      const timeoutId = setTimeout(() => {
        proc.kill("SIGTERM");
        resolve({
          command,
          stdout,
          stderr: stderr + "\n[TIMEOUT after " + timeout + "ms]",
          exitCode: null,
          duration: Date.now() - startTime,
        });
      }, timeout);

      proc.on("close", (code) => {
        clearTimeout(timeoutId);
        resolve({
          command,
          stdout,
          stderr,
          exitCode: code,
          duration: Date.now() - startTime,
        });
      });

      proc.on("error", (error) => {
        clearTimeout(timeoutId);
        resolve({
          command,
          stdout,
          stderr: error.message,
          exitCode: null,
          duration: Date.now() - startTime,
        });
      });
    });
  }

  /**
   * Validate a single command's output using AI analysis
   */
  async validateCommand(
    command: string,
    planContent: string,
    outputDir: string,
  ): Promise<VisualValidationResult> {
    const result = await this.runCommand(command);

    // Save output to file
    await mkdir(outputDir, { recursive: true });
    const safeName = command.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 60);
    const outputPath = path.join(outputDir, `${safeName}.txt`);
    const outputContent = [
      "Command: " + command,
      "Exit Code: " + result.exitCode,
      "Duration: " + result.duration + "ms",
      "",
      "=== STDOUT ===",
      result.stdout || "(empty)",
      "",
      "=== STDERR ===",
      result.stderr || "(empty)",
    ].join("\n");

    await writeFile(outputPath, outputContent, "utf-8");

    // Analyze with AI (text-only, no images)
    const prompt = buildOutputValidationPrompt(planContent, command, result);

    const analysisResult = await this.adapter.analyzeScreenshot({
      prompt,
      images: [],
      maxTokens: 4096,
    });

    if (analysisResult.success) {
      return parseOutputValidationResponse(
        analysisResult.response,
        command,
        outputPath,
        result.stderr ? result.stderr.split("\n").filter(Boolean) : [],
      );
    }

    // Analysis failed - fall back to exit code check
    return {
      status: result.exitCode === 0 ? "APPROVED" : "NEEDS_WORK",
      route: command,
      screenshotPath: outputPath,
      issues:
        result.exitCode !== 0
          ? [
              {
                severity: "major",
                category: "output_error",
                description: "Command exited with code " + result.exitCode,
                suggestion: "Check stderr output for error details",
              },
            ]
          : [],
      consoleErrors: result.stderr
        ? result.stderr.split("\n").filter(Boolean)
        : [],
      summary:
        "Command " +
        (result.exitCode === 0 ? "succeeded" : "failed") +
        " (AI analysis unavailable: " +
        analysisResult.error +
        ")",
    };
  }

  async isAvailable(): Promise<boolean> {
    return this.adapter.isAvailable();
  }

  /**
   * Suggest validation commands based on generated file types
   * Used when no explicit commands are configured
   */
  static suggestCommands(filePaths: string[]): string[] {
    const commands: string[] = [];
    const extensions = new Set(
      filePaths.map((f) => f.split(".").pop()?.toLowerCase() || ""),
    );
    const fileNames = filePaths.map((f) => f.split("/").pop()?.toLowerCase() || "");

    // Python projects
    if (extensions.has("py")) {
      // Check for common entry points
      const mainFile = filePaths.find((f) =>
        /\b(main|app|server|run|manage)\.py$/.test(f),
      );
      if (mainFile) {
        commands.push(`python3 -c "import importlib.util; spec = importlib.util.spec_from_file_location('m', '${mainFile}'); mod = importlib.util.module_from_spec(spec); print('Module loaded OK')" 2>&1`);
      }
      // Syntax check for all Python files
      const pyFiles = filePaths.filter((f) => f.endsWith(".py"));
      if (pyFiles.length > 0) {
        commands.push(`python3 -m py_compile ${pyFiles.join(" ")} && echo "Syntax OK"`);
      }
      // Check for requirements.txt
      if (fileNames.includes("requirements.txt")) {
        const reqFile = filePaths.find((f) => f.endsWith("requirements.txt"));
        if (reqFile) {
          commands.push(`pip install --dry-run -r ${reqFile} 2>&1 | tail -5`);
        }
      }
    }

    // Node.js/TypeScript projects
    if (extensions.has("js") || extensions.has("ts") || extensions.has("tsx") || extensions.has("jsx")) {
      // TypeScript compilation check
      if (extensions.has("ts") || extensions.has("tsx")) {
        commands.push("npx tsc --noEmit 2>&1 | head -20");
      }
      // Node syntax check for JS files
      const jsFiles = filePaths.filter((f) => f.endsWith(".js"));
      for (const jsFile of jsFiles.slice(0, 3)) {
        commands.push(`node --check ${jsFile} && echo "Syntax OK: ${jsFile}"`);
      }
      // Check for package.json
      if (fileNames.includes("package.json")) {
        commands.push("npm ls --depth=0 2>&1 | tail -10");
      }
    }

    // Go projects
    if (extensions.has("go")) {
      commands.push("go build ./... 2>&1 | head -20");
      commands.push("go vet ./... 2>&1 | head -20");
    }

    // Rust projects
    if (extensions.has("rs")) {
      commands.push("cargo check 2>&1 | tail -20");
    }

    return commands;
  }
}
