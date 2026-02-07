/**
 * Browser Manager - Playwright wrapper for screenshot capture
 *
 * Dynamically imports Playwright to keep it as an optional dependency.
 * Handles browser lifecycle, navigation, screenshot capture, and auth flows.
 */

import type { ObserverConfig } from "../types.js";

export interface ScreenshotResult {
  screenshot: Buffer;
  consoleErrors: string[];
}

export class BrowserManager {
  // Using 'any' for Playwright types since it's an optional dependency
  private browser: any = null;
  private context: any = null;
  private page: any = null;
  private consoleErrors: string[] = [];

  async launch(config: ObserverConfig): Promise<void> {
    try {
      // Dynamic import - Playwright is an optional dependency
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const moduleName = "playwright";
      const pw: any = await import(/* webpackIgnore: true */ moduleName);
      const { chromium } = pw;
      this.browser = await chromium.launch({ headless: true });
      this.context = await this.browser.newContext({
        viewport: config.viewport,
      });
      this.page = await this.context.newPage();

      if (config.captureConsoleErrors) {
        this.page.on("console", (msg: any) => {
          if (msg.type() === "error") {
            this.consoleErrors.push(msg.text());
          }
        });

        this.page.on("pageerror", (error: any) => {
          this.consoleErrors.push(String(error));
        });
      }
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("Cannot find module") ||
          err.message.includes("Cannot find package"))
      ) {
        throw new Error(
          "Playwright not installed. Run: npx playwright install chromium",
        );
      }
      throw err;
    }
  }

  async captureScreenshot(
    url: string,
    config: ObserverConfig,
  ): Promise<ScreenshotResult> {
    if (!this.page) {
      throw new Error("Browser not launched. Call launch() first.");
    }

    // Reset console errors for this navigation
    this.consoleErrors = [];

    try {
      await this.page.goto(url, {
        waitUntil: "networkidle",
        timeout: config.renderWaitMs * 3,
      });
    } catch {
      // networkidle timeout is acceptable - page may have long-polling
      // Fall through to wait and capture
    }

    // Wait for rendering to stabilize
    await this.page.waitForTimeout(config.renderWaitMs);

    const screenshot = await this.page.screenshot({ fullPage: true });

    return {
      screenshot,
      consoleErrors: [...this.consoleErrors],
    };
  }

  async handleAuth(config: ObserverConfig): Promise<void> {
    if (!this.page || !config.auth) {
      return;
    }

    const auth = config.auth;
    const loginUrl = auth.loginUrl.startsWith("http")
      ? auth.loginUrl
      : `${config.appUrl}${auth.loginUrl}`;

    await this.page.goto(loginUrl, {
      waitUntil: "networkidle",
      timeout: 15000,
    });

    // Fill credentials
    await this.page.fill(auth.usernameSelector, auth.username);

    // Resolve password - support "env.VAR_NAME" references
    let password = auth.password;
    if (password.startsWith("env.")) {
      const envVar = password.slice(4);
      password = process.env[envVar] || "";
    }
    await this.page.fill(auth.passwordSelector, password);

    // Submit
    await this.page.click(auth.submitSelector);

    // Wait for navigation after login
    await this.page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
      // Timeout acceptable - some apps use SPA routing
    });
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close().catch(() => {});
      this.page = null;
    }
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }
}
