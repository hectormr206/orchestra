/**
 * Observer - Validation module for Orchestra
 *
 * Supports two modes:
 * - "web": Captures screenshots via Playwright and sends to Vision API
 * - "output": Runs commands and analyzes stdout/stderr with text AI
 *
 * Both modes report issues in the same format for the Executor to fix.
 */

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type {
  ObserverConfig,
  ObserverResult,
  VisualValidationResult,
} from "../types.js";
import {
  FallbackVisionAdapter,
  KimiVisionAdapter,
  GLMVisionAdapter,
  type VisionAdapter,
} from "../adapters/VisionAdapter.js";
import { BrowserManager } from "./BrowserManager.js";
import { DevServerManager } from "./DevServerManager.js";
import { OutputObserver } from "./OutputObserver.js";
import {
  buildVisualValidationPrompt,
  parseVisualValidationResponse,
} from "../prompts/observer.js";
import { extractFilesFromPlan } from "../prompts/executor.js";

export interface ObserverCallbacks {
  onObserverStart?: () => void;
  onRouteCapture?: (route: string, index: number, total: number) => void;
  onRouteValidation?: (route: string, result: VisualValidationResult) => void;
  onVisualIteration?: (iteration: number, max: number) => void;
  onObserverComplete?: (result: ObserverResult) => void;
  onObserverError?: (error: string) => void;
}

export class Observer {
  private config: ObserverConfig;
  private callbacks: ObserverCallbacks;
  private visionAdapter: VisionAdapter;
  private browserManager: BrowserManager;
  private devServerManager: DevServerManager;
  private outputObserver: OutputObserver;

  constructor(config: ObserverConfig, callbacks: ObserverCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
    this.browserManager = new BrowserManager();
    this.devServerManager = new DevServerManager();
    this.outputObserver = new OutputObserver(config);

    // Select vision adapter based on config
    if (config.visionModel === "glm") {
      this.visionAdapter = new FallbackVisionAdapter([
        new GLMVisionAdapter(),
        new KimiVisionAdapter(),
      ]);
    } else {
      this.visionAdapter = new FallbackVisionAdapter([
        new KimiVisionAdapter(),
        new GLMVisionAdapter(),
      ]);
    }
  }

  /**
   * Run validation on all configured routes/commands
   */
  async validate(planContent: string): Promise<ObserverResult> {
    // Route to output mode if configured
    if (this.config.mode === "output") {
      return this.validateOutput(planContent);
    }

    return this.validateWeb(planContent);
  }

  /**
   * Output mode: Run commands and analyze their output
   */
  private async validateOutput(planContent: string): Promise<ObserverResult> {
    const startTime = Date.now();
    const validations: VisualValidationResult[] = [];

    this.callbacks.onObserverStart?.();

    let commands = this.config.commands || [];

    // Auto-detect commands if none configured
    if (commands.length === 0 && planContent) {
      const filesToCreate = extractFilesFromPlan(planContent);
      const filePaths = filesToCreate.map((f) => f.path);
      commands = OutputObserver.suggestCommands(filePaths);
    }

    if (commands.length === 0) {
      const error = "No commands configured and could not auto-detect for output mode Observer";
      this.callbacks.onObserverError?.(error);
      return {
        success: false,
        validations: [],
        totalIssues: 0,
        duration: Date.now() - startTime,
        screenshotDir: this.config.screenshotDir,
      };
    }

    try {
      // Check adapter availability
      if (!(await this.outputObserver.isAvailable())) {
        const error = "No text adapter available (check KIMI_API_KEY or ZAI_API_KEY)";
        this.callbacks.onObserverError?.(error);
        return {
          success: false,
          validations: [],
          totalIssues: 0,
          duration: Date.now() - startTime,
          screenshotDir: this.config.screenshotDir,
        };
      }

      // Start dev server if configured (for API validation)
      if (this.config.devServerCommand) {
        await this.devServerManager.start(
          this.config.devServerCommand,
          this.config.appUrl,
        );
      }

      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        this.callbacks.onRouteCapture?.(command, i, commands.length);

        const validation = await this.outputObserver.validateCommand(
          command,
          planContent,
          this.config.screenshotDir,
        );

        validations.push(validation);
        this.callbacks.onRouteValidation?.(command, validation);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.callbacks.onObserverError?.(errorMsg);

      return {
        success: false,
        validations,
        totalIssues: validations.reduce((sum, v) => sum + v.issues.length, 0),
        duration: Date.now() - startTime,
        screenshotDir: this.config.screenshotDir,
      };
    } finally {
      if (this.config.devServerCommand) {
        await this.devServerManager.stop();
      }
    }

    const totalIssues = validations.reduce((sum, v) => sum + v.issues.length, 0);
    const allApproved = validations.every((v) => v.status === "APPROVED");

    const result: ObserverResult = {
      success: allApproved,
      validations,
      totalIssues,
      duration: Date.now() - startTime,
      screenshotDir: this.config.screenshotDir,
    };

    this.callbacks.onObserverComplete?.(result);
    return result;
  }

  /**
   * Web mode: Capture screenshots and analyze with Vision API
   */
  private async validateWeb(planContent: string): Promise<ObserverResult> {
    const startTime = Date.now();
    const validations: VisualValidationResult[] = [];

    this.callbacks.onObserverStart?.();

    try {
      // Check vision adapter availability
      if (!(await this.visionAdapter.isAvailable())) {
        const error = "No vision adapter available (check KIMI_API_KEY or ZAI_API_KEY)";
        this.callbacks.onObserverError?.(error);
        return {
          success: false,
          validations: [],
          totalIssues: 0,
          duration: Date.now() - startTime,
          screenshotDir: this.config.screenshotDir,
        };
      }

      // Start dev server if configured (may use a different port)
      let activeAppUrl = this.config.appUrl;
      if (this.config.devServerCommand) {
        activeAppUrl = await this.devServerManager.start(
          this.config.devServerCommand,
          this.config.appUrl,
        );
      }

      // Launch browser
      await this.browserManager.launch(this.config);

      // Handle authentication if configured
      if (this.config.auth) {
        await this.browserManager.handleAuth(this.config);
      }

      // Ensure screenshot directory exists
      await mkdir(this.config.screenshotDir, { recursive: true });

      // Capture and validate each route
      const routes = this.config.routes.length > 0
        ? this.config.routes
        : ["/"];

      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        this.callbacks.onRouteCapture?.(route, i, routes.length);

        const url = route.startsWith("http")
          ? route
          : `${activeAppUrl}${route}`;

        const { screenshot, consoleErrors } =
          await this.browserManager.captureScreenshot(url, this.config);

        // Save screenshot
        const safeRouteName = route.replace(/\//g, "_").replace(/^_/, "") || "index";
        const screenshotPath = path.join(
          this.config.screenshotDir,
          `${safeRouteName}.png`,
        );
        await writeFile(screenshotPath, screenshot);

        // Resize if too large (> 4MB) - convert to JPEG with lower quality
        let imageData = screenshot.toString("base64");
        let mimeType: "image/png" | "image/jpeg" = "image/png";

        if (screenshot.length > 4 * 1024 * 1024) {
          // Screenshot too large, skip detailed analysis
          const validation: VisualValidationResult = {
            status: "NEEDS_WORK",
            route,
            screenshotPath,
            issues: [{
              severity: "minor",
              category: "rendering",
              description: "Screenshot too large for vision analysis (>4MB)",
              suggestion: "Reduce viewport size or page content",
            }],
            consoleErrors,
            summary: "Screenshot exceeds size limit for vision API",
          };
          validations.push(validation);
          this.callbacks.onRouteValidation?.(route, validation);
          continue;
        }

        // Build prompt and send to vision model
        const prompt = buildVisualValidationPrompt(
          planContent,
          route,
          consoleErrors,
        );

        const visionResult = await this.visionAdapter.analyzeScreenshot({
          prompt,
          images: [{ data: imageData, mimeType }],
          maxTokens: 4096,
        });

        let validation: VisualValidationResult;

        if (visionResult.success) {
          validation = parseVisualValidationResponse(
            visionResult.response,
            route,
            screenshotPath,
            consoleErrors,
          );
        } else {
          // Vision API failed - report as issue but don't block
          validation = {
            status: "NEEDS_WORK",
            route,
            screenshotPath,
            issues: [{
              severity: "minor",
              category: "rendering",
              description: `Vision analysis failed: ${visionResult.error}`,
              suggestion: "Review screenshot manually",
            }],
            consoleErrors,
            summary: `Vision API error: ${visionResult.error}`,
          };
        }

        validations.push(validation);
        this.callbacks.onRouteValidation?.(route, validation);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.callbacks.onObserverError?.(errorMsg);

      return {
        success: false,
        validations,
        totalIssues: validations.reduce((sum, v) => sum + v.issues.length, 0),
        duration: Date.now() - startTime,
        screenshotDir: this.config.screenshotDir,
      };
    } finally {
      // Always clean up
      await this.browserManager.close();
      if (this.config.devServerCommand) {
        await this.devServerManager.stop();
      }
    }

    const totalIssues = validations.reduce((sum, v) => sum + v.issues.length, 0);
    const allApproved = validations.every((v) => v.status === "APPROVED");

    const result: ObserverResult = {
      success: allApproved,
      validations,
      totalIssues,
      duration: Date.now() - startTime,
      screenshotDir: this.config.screenshotDir,
    };

    this.callbacks.onObserverComplete?.(result);
    return result;
  }
}
