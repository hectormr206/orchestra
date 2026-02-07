import { describe, it, expect, vi, beforeEach } from "vitest";
import { Observer, type ObserverCallbacks } from "./Observer.js";
import type { ObserverConfig } from "../types.js";

// Mock dependencies
vi.mock("../adapters/VisionAdapter.js", () => {
  const mockAdapter = {
    isAvailable: vi.fn().mockResolvedValue(true),
    analyzeScreenshot: vi.fn().mockResolvedValue({
      success: true,
      response: JSON.stringify({
        status: "APPROVED",
        issues: [],
        summary: "Page looks great",
      }),
      duration: 1000,
      tokensUsed: 100,
    }),
    getInfo: () => ({ name: "MockVision", model: "mock", provider: "test" }),
  };

  return {
    KimiVisionAdapter: vi.fn().mockImplementation(() => mockAdapter),
    GLMVisionAdapter: vi.fn().mockImplementation(() => mockAdapter),
    FallbackVisionAdapter: vi.fn().mockImplementation(() => mockAdapter),
  };
});

vi.mock("./BrowserManager.js", () => {
  return {
    BrowserManager: vi.fn().mockImplementation(() => ({
      launch: vi.fn().mockResolvedValue(undefined),
      captureScreenshot: vi.fn().mockResolvedValue({
        screenshot: Buffer.from("fake-screenshot-data"),
        consoleErrors: [],
      }),
      handleAuth: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

vi.mock("./DevServerManager.js", () => {
  return {
    DevServerManager: vi.fn().mockImplementation(() => ({
      start: vi.fn().mockResolvedValue("http://localhost:3000"),
      stop: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

vi.mock("fs/promises", () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

const getConfig = (overrides: Partial<ObserverConfig> = {}): ObserverConfig => ({
  enabled: true,
  appUrl: "http://localhost:3000",
  renderWaitMs: 1000,
  maxVisualIterations: 3,
  viewport: { width: 1920, height: 1080 },
  routes: ["/"],
  captureConsoleErrors: true,
  visionModel: "kimi",
  screenshotDir: ".orchestra/screenshots",
  ...overrides,
});

describe("Observer", () => {
  let callbacks: ObserverCallbacks;

  beforeEach(() => {
    vi.clearAllMocks();
    callbacks = {
      onObserverStart: vi.fn(),
      onRouteCapture: vi.fn(),
      onRouteValidation: vi.fn(),
      onObserverComplete: vi.fn(),
      onObserverError: vi.fn(),
    };
  });

  it("should validate a single route successfully", async () => {
    const config = getConfig();
    const observer = new Observer(config, callbacks);

    const result = await observer.validate("Build a landing page");

    expect(result.success).toBe(true);
    expect(result.validations).toHaveLength(1);
    expect(result.validations[0].status).toBe("APPROVED");
    expect(result.totalIssues).toBe(0);
    expect(callbacks.onObserverStart).toHaveBeenCalled();
    expect(callbacks.onRouteCapture).toHaveBeenCalledWith("/", 0, 1);
    expect(callbacks.onObserverComplete).toHaveBeenCalled();
  });

  it("should validate multiple routes", async () => {
    const config = getConfig({ routes: ["/", "/about", "/contact"] });
    const observer = new Observer(config, callbacks);

    const result = await observer.validate("Multi-page app");

    expect(result.validations).toHaveLength(3);
    expect(callbacks.onRouteCapture).toHaveBeenCalledTimes(3);
  });

  it("should default to root route when no routes configured", async () => {
    const config = getConfig({ routes: [] });
    const observer = new Observer(config, callbacks);

    const result = await observer.validate("App");

    expect(result.validations).toHaveLength(1);
    expect(callbacks.onRouteCapture).toHaveBeenCalledWith("/", 0, 1);
  });

  it("should start dev server when configured", async () => {
    const config = getConfig({ devServerCommand: "npm run dev" });
    const observer = new Observer(config, callbacks);

    await observer.validate("App");

    const { DevServerManager } = await import("./DevServerManager.js");
    const instance = (DevServerManager as any).mock.results[0].value;
    expect(instance.start).toHaveBeenCalledWith("npm run dev", "http://localhost:3000");
    expect(instance.stop).toHaveBeenCalled();
  });

  it("should not start dev server when not configured", async () => {
    const config = getConfig();
    const observer = new Observer(config, callbacks);

    await observer.validate("App");

    const { DevServerManager } = await import("./DevServerManager.js");
    const instance = (DevServerManager as any).mock.results[0].value;
    expect(instance.start).not.toHaveBeenCalled();
  });

  it("should handle auth when configured", async () => {
    const config = getConfig({
      auth: {
        loginUrl: "/login",
        usernameSelector: "#email",
        passwordSelector: "#password",
        submitSelector: "button",
        username: "admin",
        password: "pass",
      },
    });
    const observer = new Observer(config, callbacks);

    await observer.validate("App");

    const { BrowserManager } = await import("./BrowserManager.js");
    const instance = (BrowserManager as any).mock.results[0].value;
    expect(instance.handleAuth).toHaveBeenCalledWith(config);
  });

  it("should report failure when vision adapter is unavailable", async () => {
    // Override mock to be unavailable
    const { FallbackVisionAdapter } = await import("../adapters/VisionAdapter.js");
    (FallbackVisionAdapter as any).mockImplementation(() => ({
      isAvailable: vi.fn().mockResolvedValue(false),
      analyzeScreenshot: vi.fn(),
      getInfo: () => ({ name: "Mock", model: "m", provider: "t" }),
    }));

    const config = getConfig();
    const observer = new Observer(config, callbacks);

    const result = await observer.validate("App");

    expect(result.success).toBe(false);
    expect(callbacks.onObserverError).toHaveBeenCalled();
  });

  it("should handle vision API failure gracefully", async () => {
    const { FallbackVisionAdapter } = await import("../adapters/VisionAdapter.js");
    (FallbackVisionAdapter as any).mockImplementation(() => ({
      isAvailable: vi.fn().mockResolvedValue(true),
      analyzeScreenshot: vi.fn().mockResolvedValue({
        success: false,
        response: "",
        duration: 0,
        error: "Vision API timeout",
      }),
      getInfo: () => ({ name: "Mock", model: "m", provider: "t" }),
    }));

    const config = getConfig();
    const observer = new Observer(config, callbacks);

    const result = await observer.validate("App");

    expect(result.success).toBe(false);
    expect(result.validations[0].status).toBe("NEEDS_WORK");
    expect(result.validations[0].issues[0].description).toContain("Vision analysis failed");
  });

  it("should always close browser even on error", async () => {
    const { BrowserManager } = await import("./BrowserManager.js");
    const mockBrowserInstance = {
      launch: vi.fn().mockRejectedValue(new Error("Launch failed")),
      captureScreenshot: vi.fn(),
      handleAuth: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    };
    (BrowserManager as any).mockImplementation(() => mockBrowserInstance);

    // Also need to make vision available
    const { FallbackVisionAdapter } = await import("../adapters/VisionAdapter.js");
    (FallbackVisionAdapter as any).mockImplementation(() => ({
      isAvailable: vi.fn().mockResolvedValue(true),
      analyzeScreenshot: vi.fn(),
      getInfo: () => ({ name: "Mock", model: "m", provider: "t" }),
    }));

    const config = getConfig();
    const observer = new Observer(config, callbacks);

    const result = await observer.validate("App");

    expect(result.success).toBe(false);
    expect(mockBrowserInstance.close).toHaveBeenCalled();
  });

  it("should handle large screenshots gracefully", async () => {
    const { BrowserManager } = await import("./BrowserManager.js");
    const largeBuf = Buffer.alloc(5 * 1024 * 1024); // 5MB
    (BrowserManager as any).mockImplementation(() => ({
      launch: vi.fn().mockResolvedValue(undefined),
      captureScreenshot: vi.fn().mockResolvedValue({
        screenshot: largeBuf,
        consoleErrors: [],
      }),
      handleAuth: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    }));

    const { FallbackVisionAdapter } = await import("../adapters/VisionAdapter.js");
    (FallbackVisionAdapter as any).mockImplementation(() => ({
      isAvailable: vi.fn().mockResolvedValue(true),
      analyzeScreenshot: vi.fn(),
      getInfo: () => ({ name: "Mock", model: "m", provider: "t" }),
    }));

    const config = getConfig();
    const observer = new Observer(config, callbacks);

    const result = await observer.validate("App");

    // Should still produce a result (with size issue noted)
    expect(result.validations).toHaveLength(1);
    expect(result.validations[0].issues[0].description).toContain("too large");
  });

  it("should call callbacks in correct order", async () => {
    const callOrder: string[] = [];

    const config = getConfig({ routes: ["/"] });
    const orderedCallbacks: ObserverCallbacks = {
      onObserverStart: () => callOrder.push("start"),
      onRouteCapture: () => callOrder.push("capture"),
      onRouteValidation: () => callOrder.push("validation"),
      onObserverComplete: () => callOrder.push("complete"),
    };

    // Reset mocks to default behavior
    const { FallbackVisionAdapter } = await import("../adapters/VisionAdapter.js");
    (FallbackVisionAdapter as any).mockImplementation(() => ({
      isAvailable: vi.fn().mockResolvedValue(true),
      analyzeScreenshot: vi.fn().mockResolvedValue({
        success: true,
        response: JSON.stringify({ status: "APPROVED", issues: [], summary: "OK" }),
        duration: 100,
      }),
      getInfo: () => ({ name: "Mock", model: "m", provider: "t" }),
    }));

    const { BrowserManager } = await import("./BrowserManager.js");
    (BrowserManager as any).mockImplementation(() => ({
      launch: vi.fn().mockResolvedValue(undefined),
      captureScreenshot: vi.fn().mockResolvedValue({
        screenshot: Buffer.from("screenshot"),
        consoleErrors: [],
      }),
      handleAuth: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    }));

    const observer = new Observer(config, orderedCallbacks);
    await observer.validate("App");

    expect(callOrder).toEqual(["start", "capture", "validation", "complete"]);
  });
});
