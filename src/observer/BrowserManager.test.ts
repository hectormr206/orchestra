import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserManager } from "./BrowserManager.js";
import type { ObserverConfig } from "../types.js";

// Mock playwright module
vi.mock("playwright", () => {
  const mockPage = {
    goto: vi.fn().mockResolvedValue(undefined),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    waitForLoadState: vi.fn().mockResolvedValue(undefined),
    screenshot: vi.fn().mockResolvedValue(Buffer.from("fake-screenshot")),
    fill: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
  };

  const mockContext = {
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn().mockResolvedValue(undefined),
  };

  const mockBrowser = {
    newContext: vi.fn().mockResolvedValue(mockContext),
    close: vi.fn().mockResolvedValue(undefined),
  };

  return {
    chromium: {
      launch: vi.fn().mockResolvedValue(mockBrowser),
    },
    __mockPage: mockPage,
    __mockContext: mockContext,
    __mockBrowser: mockBrowser,
  };
});

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

describe("BrowserManager", () => {
  let manager: BrowserManager;

  beforeEach(() => {
    manager = new BrowserManager();
    vi.clearAllMocks();
  });

  it("should launch browser with correct viewport", async () => {
    const config = getConfig({ viewport: { width: 1280, height: 720 } });
    await manager.launch(config);

    const { chromium } = await import("playwright");
    expect(chromium.launch).toHaveBeenCalledWith({ headless: true });

    const mockBrowser = (await import("playwright") as any).__mockBrowser;
    expect(mockBrowser.newContext).toHaveBeenCalledWith({
      viewport: { width: 1280, height: 720 },
    });
  });

  it("should capture screenshot", async () => {
    const config = getConfig();
    await manager.launch(config);

    const result = await manager.captureScreenshot("http://localhost:3000/", config);

    expect(result.screenshot).toBeInstanceOf(Buffer);
    expect(result.consoleErrors).toEqual([]);

    const mockPage = (await import("playwright") as any).__mockPage;
    expect(mockPage.goto).toHaveBeenCalledWith("http://localhost:3000/", expect.objectContaining({
      waitUntil: "networkidle",
    }));
    expect(mockPage.waitForTimeout).toHaveBeenCalledWith(1000);
    expect(mockPage.screenshot).toHaveBeenCalledWith({ fullPage: true });
  });

  it("should capture console errors when enabled", async () => {
    const config = getConfig({ captureConsoleErrors: true });
    await manager.launch(config);

    const mockPage = (await import("playwright") as any).__mockPage;

    // Get the handlers registered during launch
    const consoleHandler = mockPage.on.mock.calls.find(
      (call: any[]) => call[0] === "console",
    )?.[1];

    const pageErrorHandler = mockPage.on.mock.calls.find(
      (call: any[]) => call[0] === "pageerror",
    )?.[1];

    expect(consoleHandler).toBeDefined();
    expect(pageErrorHandler).toBeDefined();

    // Make goto trigger console errors (simulating errors during navigation)
    mockPage.goto.mockImplementation(async () => {
      consoleHandler({ type: () => "error", text: () => "Console error 1" });
      pageErrorHandler(new Error("Page error 1"));
    });

    const result = await manager.captureScreenshot("http://localhost:3000/", config);
    expect(result.consoleErrors).toContain("Console error 1");
    expect(result.consoleErrors).toContain("Error: Page error 1");

    // Reset goto mock
    mockPage.goto.mockResolvedValue(undefined);
  });

  it("should not register console listeners when disabled", async () => {
    const config = getConfig({ captureConsoleErrors: false });
    await manager.launch(config);

    const mockPage = (await import("playwright") as any).__mockPage;
    expect(mockPage.on).not.toHaveBeenCalled();
  });

  it("should handle auth flow", async () => {
    const config = getConfig({
      auth: {
        loginUrl: "/login",
        usernameSelector: "#email",
        passwordSelector: "#password",
        submitSelector: "button[type=submit]",
        username: "admin@test.com",
        password: "secretpass",
      },
    });

    await manager.launch(config);
    await manager.handleAuth(config);

    const mockPage = (await import("playwright") as any).__mockPage;
    expect(mockPage.goto).toHaveBeenCalledWith(
      "http://localhost:3000/login",
      expect.any(Object),
    );
    expect(mockPage.fill).toHaveBeenCalledWith("#email", "admin@test.com");
    expect(mockPage.fill).toHaveBeenCalledWith("#password", "secretpass");
    expect(mockPage.click).toHaveBeenCalledWith("button[type=submit]");
  });

  it("should resolve env var passwords", async () => {
    vi.stubEnv("TEST_PASSWORD", "env-secret-123");

    const config = getConfig({
      auth: {
        loginUrl: "/login",
        usernameSelector: "#email",
        passwordSelector: "#password",
        submitSelector: "button[type=submit]",
        username: "admin@test.com",
        password: "env.TEST_PASSWORD",
      },
    });

    await manager.launch(config);
    await manager.handleAuth(config);

    const mockPage = (await import("playwright") as any).__mockPage;
    expect(mockPage.fill).toHaveBeenCalledWith("#password", "env-secret-123");

    vi.unstubAllEnvs();
  });

  it("should handle auth with absolute loginUrl", async () => {
    const config = getConfig({
      auth: {
        loginUrl: "https://auth.example.com/login",
        usernameSelector: "#email",
        passwordSelector: "#password",
        submitSelector: "button",
        username: "user",
        password: "pass",
      },
    });

    await manager.launch(config);
    await manager.handleAuth(config);

    const mockPage = (await import("playwright") as any).__mockPage;
    expect(mockPage.goto).toHaveBeenCalledWith(
      "https://auth.example.com/login",
      expect.any(Object),
    );
  });

  it("should skip auth when no auth config", async () => {
    const config = getConfig();
    await manager.launch(config);
    await manager.handleAuth(config);

    const mockPage = (await import("playwright") as any).__mockPage;
    // goto should not be called for auth (only for screenshots)
    expect(mockPage.fill).not.toHaveBeenCalled();
  });

  it("should throw if captureScreenshot called before launch", async () => {
    const config = getConfig();
    await expect(
      manager.captureScreenshot("http://localhost:3000/", config),
    ).rejects.toThrow("Browser not launched");
  });

  it("should close browser cleanly", async () => {
    const config = getConfig();
    await manager.launch(config);
    await manager.close();

    const mocks = await import("playwright") as any;
    expect(mocks.__mockPage.close).toHaveBeenCalled();
    expect(mocks.__mockContext.close).toHaveBeenCalled();
    expect(mocks.__mockBrowser.close).toHaveBeenCalled();
  });

  it("should handle close when not launched", async () => {
    // Should not throw
    await manager.close();
  });
});
