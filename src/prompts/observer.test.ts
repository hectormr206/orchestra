import { describe, it, expect } from "vitest";
import {
  buildVisualValidationPrompt,
  buildVisualFixPrompt,
  parseVisualValidationResponse,
} from "./observer.js";
import type { ObserverResult } from "../types.js";

describe("buildVisualValidationPrompt", () => {
  it("should include plan content, route, and no console errors", () => {
    const prompt = buildVisualValidationPrompt(
      "Build a landing page with hero section",
      "/",
      [],
    );

    expect(prompt).toContain("landing page");
    expect(prompt).toContain("/");
    expect(prompt).toContain("Console Errors: None");
    expect(prompt).toContain("APPROVED");
    expect(prompt).toContain("NEEDS_WORK");
  });

  it("should include console errors when present", () => {
    const prompt = buildVisualValidationPrompt(
      "Plan",
      "/dashboard",
      ["TypeError: Cannot read property 'map' of undefined", "Failed to fetch /api/data"],
    );

    expect(prompt).toContain("TypeError: Cannot read property");
    expect(prompt).toContain("Failed to fetch");
    expect(prompt).toContain("/dashboard");
  });

  it("should truncate very long plan content", () => {
    const longPlan = "A".repeat(5000);
    const prompt = buildVisualValidationPrompt(longPlan, "/", []);

    // Should be truncated to 2000 chars of plan content
    expect(prompt.length).toBeLessThan(longPlan.length + 1000);
  });
});

describe("buildVisualFixPrompt", () => {
  it("should include issues from observer result", () => {
    const result: ObserverResult = {
      success: false,
      validations: [
        {
          status: "NEEDS_WORK",
          route: "/",
          screenshotPath: ".orchestra/screenshots/index.png",
          issues: [
            {
              severity: "critical",
              category: "layout",
              description: "Header overlapping content",
              suggestion: "Add margin-top to main content area",
              region: "top-center",
            },
          ],
          consoleErrors: ["Uncaught Error: hydration mismatch"],
          summary: "Layout issues detected",
        },
      ],
      totalIssues: 1,
      duration: 5000,
      screenshotDir: ".orchestra/screenshots",
    };

    const prompt = buildVisualFixPrompt(result, "Build a landing page");

    expect(prompt).toContain("Header overlapping content");
    expect(prompt).toContain("Add margin-top");
    expect(prompt).toContain("CRITICAL");
    expect(prompt).toContain("layout");
    expect(prompt).toContain("hydration mismatch");
    expect(prompt).toContain(".orchestra/screenshots");
  });

  it("should handle multiple routes with issues", () => {
    const result: ObserverResult = {
      success: false,
      validations: [
        {
          status: "NEEDS_WORK",
          route: "/",
          screenshotPath: "s1.png",
          issues: [{ severity: "major", category: "styling", description: "Wrong color", suggestion: "Fix CSS" }],
          consoleErrors: [],
          summary: "Color issue",
        },
        {
          status: "NEEDS_WORK",
          route: "/about",
          screenshotPath: "s2.png",
          issues: [{ severity: "minor", category: "content", description: "Placeholder text", suggestion: "Replace text" }],
          consoleErrors: [],
          summary: "Content issue",
        },
      ],
      totalIssues: 2,
      duration: 8000,
      screenshotDir: ".orchestra/screenshots",
    };

    const prompt = buildVisualFixPrompt(result, "Plan");

    expect(prompt).toContain("Wrong color");
    expect(prompt).toContain("Placeholder text");
    expect(prompt).toContain("/about");
  });

  it("should skip APPROVED routes", () => {
    const result: ObserverResult = {
      success: false,
      validations: [
        {
          status: "APPROVED",
          route: "/",
          screenshotPath: "s1.png",
          issues: [],
          consoleErrors: [],
          summary: "Looks good",
        },
        {
          status: "NEEDS_WORK",
          route: "/settings",
          screenshotPath: "s2.png",
          issues: [{ severity: "major", category: "rendering", description: "Blank page", suggestion: "Check component" }],
          consoleErrors: [],
          summary: "Rendering issue",
        },
      ],
      totalIssues: 1,
      duration: 6000,
      screenshotDir: ".orchestra/screenshots",
    };

    const prompt = buildVisualFixPrompt(result, "Plan");

    expect(prompt).toContain("Blank page");
    expect(prompt).not.toContain("Looks good");
  });
});

describe("parseVisualValidationResponse", () => {
  it("should parse valid JSON response", () => {
    const response = JSON.stringify({
      status: "APPROVED",
      issues: [],
      summary: "Page looks great",
    });

    const result = parseVisualValidationResponse(response, "/", "screenshot.png", []);

    expect(result.status).toBe("APPROVED");
    expect(result.issues).toHaveLength(0);
    expect(result.route).toBe("/");
    expect(result.screenshotPath).toBe("screenshot.png");
    expect(result.summary).toBe("Page looks great");
  });

  it("should parse JSON wrapped in markdown code blocks", () => {
    const response = '```json\n{"status":"NEEDS_WORK","issues":[{"severity":"major","category":"layout","description":"Overlap","suggestion":"Fix CSS"}],"summary":"Issues found"}\n```';

    const result = parseVisualValidationResponse(response, "/test", "s.png", []);

    expect(result.status).toBe("NEEDS_WORK");
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].description).toBe("Overlap");
  });

  it("should handle malformed JSON gracefully", () => {
    const response = "This is not JSON at all, just plain text analysis.";

    const result = parseVisualValidationResponse(response, "/", "s.png", []);

    expect(result.status).toBe("NEEDS_WORK");
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.summary).toContain("could not be parsed");
  });

  it("should add console errors as issues", () => {
    const response = JSON.stringify({
      status: "NEEDS_WORK",
      issues: [{ severity: "major", category: "styling", description: "Bad colors", suggestion: "Fix" }],
      summary: "Issues",
    });

    const consoleErrors = ["TypeError: foo is not a function"];

    const result = parseVisualValidationResponse(response, "/", "s.png", consoleErrors);

    expect(result.consoleErrors).toHaveLength(1);
    // Should have the original issue plus the console error issue
    const consoleIssues = result.issues.filter((i) => i.category === "console_error");
    expect(consoleIssues.length).toBeGreaterThan(0);
    expect(consoleIssues[0].description).toContain("TypeError");
  });

  it("should not duplicate console errors already in issues", () => {
    const response = JSON.stringify({
      status: "NEEDS_WORK",
      issues: [
        {
          severity: "major",
          category: "console_error",
          description: "Browser console error: TypeError: foo is not a function",
          suggestion: "Fix the error",
        },
      ],
      summary: "Console error",
    });

    const consoleErrors = ["TypeError: foo is not a function"];

    const result = parseVisualValidationResponse(response, "/", "s.png", consoleErrors);

    const consoleIssues = result.issues.filter((i) => i.category === "console_error");
    expect(consoleIssues).toHaveLength(1); // No duplicate
  });

  it("should default missing issue fields", () => {
    const response = JSON.stringify({
      status: "NEEDS_WORK",
      issues: [{ description: "Something wrong" }],
      summary: "Issues",
    });

    const result = parseVisualValidationResponse(response, "/", "s.png", []);

    expect(result.issues[0].severity).toBe("major");
    expect(result.issues[0].category).toBe("rendering");
    expect(result.issues[0].suggestion).toBe("Review manually");
  });

  it("should handle console errors when JSON parsing fails", () => {
    const response = "not json";
    const consoleErrors = ["Error 1", "Error 2"];

    const result = parseVisualValidationResponse(response, "/", "s.png", consoleErrors);

    expect(result.status).toBe("NEEDS_WORK");
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0].category).toBe("console_error");
    expect(result.issues[1].category).toBe("console_error");
  });
});
