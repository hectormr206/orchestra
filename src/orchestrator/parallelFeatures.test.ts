/**
 * Tests for Parallel Consultant and Early Observer features
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Orchestrator } from "./Orchestrator.js";
import { rm } from "fs/promises";
import { existsSync } from "fs";

const TEST_ORCHESTRA_DIR = ".orchestra-test-parallel";

describe("Parallel Features", () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    orchestrator = new Orchestrator({
      orchestraDir: TEST_ORCHESTRA_DIR,
      parallelConsultant: true,
      consultantMaxConcurrency: 3,
      earlyObserver: true,
      criticalFilesPatterns: ["src/App.tsx", "src/main.ts"],
      criticalFilesThreshold: 1,
    });
  });

  afterEach(async () => {
    if (existsSync(TEST_ORCHESTRA_DIR)) {
      await rm(TEST_ORCHESTRA_DIR, { recursive: true, force: true });
    }
  });

  describe("Configuration", () => {
    it("should have parallel consultant enabled by default", () => {
      const defaultOrchestrator = new Orchestrator({
        orchestraDir: TEST_ORCHESTRA_DIR,
      });

      // Access internal config through type assertion
      const config = (defaultOrchestrator as any).config;
      expect(config.parallelConsultant).toBe(true);
      expect(config.consultantMaxConcurrency).toBe(3);
    });

    it("should have early observer disabled by default", () => {
      const defaultOrchestrator = new Orchestrator({
        orchestraDir: TEST_ORCHESTRA_DIR,
      });

      const config = (defaultOrchestrator as any).config;
      expect(config.earlyObserver).toBe(false);
    });

    it("should accept custom critical file patterns", () => {
      const customOrchestrator = new Orchestrator({
        orchestraDir: TEST_ORCHESTRA_DIR,
        earlyObserver: true,
        criticalFilesPatterns: ["app.py", "main.py"],
        criticalFilesThreshold: 2,
      });

      const config = (customOrchestrator as any).config;
      expect(config.criticalFilesPatterns).toEqual(["app.py", "main.py"]);
      expect(config.criticalFilesThreshold).toBe(2);
    });
  });

  describe("Parallel Consultant", () => {
    it("should create consultant fix requests", () => {
      const request = (orchestrator as any).createConsultantRequest(
        "/path/to/file.ts",
        "file.ts",
        "syntax_error",
        "Missing semicolon",
        "const x = 1"
      );

      expect(request).toEqual({
        filePath: "/path/to/file.ts",
        fileName: "file.ts",
        errorType: "syntax_error",
        errorMessage: "Missing semicolon",
        code: "const x = 1",
      });
    });

    it("should detect critical files correctly", () => {
      const isCritical = (orchestrator as any).isCriticalFile.bind(orchestrator);

      expect(isCritical("src/App.tsx")).toBe(true);
      expect(isCritical("src/main.ts")).toBe(true);
      expect(isCritical("src/utils/helper.ts")).toBe(false);
      expect(isCritical("app.py")).toBe(false); // Not in default patterns
    });

    it("should handle glob patterns in critical files", () => {
      const globOrchestrator = new Orchestrator({
        orchestraDir: TEST_ORCHESTRA_DIR,
        earlyObserver: true,
        criticalFilesPatterns: ["src/*App*", "*.config.ts"],
      });

      const isCritical = (globOrchestrator as any).isCriticalFile.bind(globOrchestrator);

      expect(isCritical("src/App.tsx")).toBe(true);
      expect(isCritical("src/MainApp.ts")).toBe(true);
      expect(isCritical("vite.config.ts")).toBe(true);
    });
  });

  describe("Early Observer State", () => {
    it("should initialize early observer state correctly", () => {
      const state = (orchestrator as any).earlyObserverState;

      expect(state.started).toBe(false);
      expect(state.completed).toBe(false);
      expect(state.criticalFilesReady).toBeInstanceOf(Set);
      expect(state.criticalFilesReady.size).toBe(0);
    });

    it("should reset early observer state", () => {
      // Modify state
      (orchestrator as any).earlyObserverState.started = true;
      (orchestrator as any).earlyObserverState.criticalFilesReady.add("src/App.tsx");

      // Reset
      (orchestrator as any).resetEarlyObserver();

      const state = (orchestrator as any).earlyObserverState;
      expect(state.started).toBe(false);
      expect(state.completed).toBe(false);
      expect(state.criticalFilesReady.size).toBe(0);
    });
  });

  describe("Integration with Config", () => {
    it("should merge parallel consultant settings from project config", async () => {
      const orchestratorWithConfig = new Orchestrator({
        orchestraDir: TEST_ORCHESTRA_DIR,
        parallelConsultant: false,
        consultantMaxConcurrency: 5,
      });

      const config = (orchestratorWithConfig as any).config;
      expect(config.parallelConsultant).toBe(false);
      expect(config.consultantMaxConcurrency).toBe(5);
    });

    it("should handle observer config with early observer", () => {
      const orchestratorWithObserver = new Orchestrator({
        orchestraDir: TEST_ORCHESTRA_DIR,
        earlyObserver: true,
        observerConfig: {
          enabled: true,
          mode: "web",
          appUrl: "http://localhost:3000",
          renderWaitMs: 3000,
          maxVisualIterations: 3,
          viewport: { width: 1920, height: 1080 },
          routes: ["/", "/about"],
          captureConsoleErrors: true,
          screenshotDir: ".orchestra/screenshots",
        },
      });

      const config = (orchestratorWithObserver as any).config;
      expect(config.earlyObserver).toBe(true);
      expect(config.observerConfig?.enabled).toBe(true);
    });
  });
});
