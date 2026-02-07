/**
 * Observer Prompts - Templates for visual and output validation
 *
 * Builds prompts for the Vision model to analyze screenshots (web mode)
 * and for text analysis of command output (output mode).
 * Generates fix prompts for the Executor when issues are found.
 */

import type { VisualValidationResult, VisualIssue, ObserverResult } from "../types.js";

/** Command result from OutputObserver */
export interface CommandResultForPrompt {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  duration: number;
}

/**
 * Build prompt for visual validation of a screenshot
 */
export function buildVisualValidationPrompt(
  planContent: string,
  route: string,
  consoleErrors: string[],
): string {
  const consoleSection =
    consoleErrors.length > 0
      ? `Browser Console Errors:\n${consoleErrors.map((e) => `- ${e}`).join("\n")}`
      : "Browser Console Errors: None";

  return `You are a UI/UX quality inspector analyzing a web application screenshot.

CONTEXT:
- Implementation Plan (summary): ${planContent.substring(0, 2000)}
- Current Route: ${route}
- ${consoleSection}

INSTRUCTIONS:
Analyze the screenshot and respond with a JSON object. Do NOT include any text outside the JSON.

{
  "status": "APPROVED" or "NEEDS_WORK",
  "issues": [
    {
      "severity": "critical" or "major" or "minor",
      "category": "layout" or "styling" or "content" or "accessibility" or "console_error" or "rendering",
      "description": "What is wrong",
      "suggestion": "How to fix it",
      "region": "top-left, center, bottom-right, etc."
    }
  ],
  "summary": "Brief overall assessment"
}

EVALUATION CRITERIA:
1. Layout: Elements properly aligned, no overlapping, responsive structure
2. Styling: Colors consistent, fonts readable, no broken CSS
3. Content: No placeholder text ("Lorem ipsum", "undefined", "null"), no missing data
4. Accessibility: Sufficient contrast, readable text sizes (min 12px)
5. Console Errors: Any JavaScript errors or failed network requests are issues
6. Rendering: No blank sections, images loading, no broken components

RULES:
- If the page looks functional and well-designed: status = "APPROVED"
- If there are critical rendering issues or visible errors: status = "NEEDS_WORK"
- Minor issues alone should not block approval
- Console errors with severity "error" always count as issues
- Respond ONLY with the JSON object`;
}

/**
 * Build prompt for the Executor to fix visual issues
 */
export function buildVisualFixPrompt(
  observerResult: ObserverResult,
  planContent: string,
): string {
  const issuesList = observerResult.validations
    .filter((v) => v.status === "NEEDS_WORK")
    .flatMap((v) =>
      v.issues.map(
        (issue) =>
          `- [${issue.severity.toUpperCase()}] ${issue.category}: ${issue.description}\n  Route: ${v.route}\n  Suggestion: ${issue.suggestion}${issue.region ? `\n  Region: ${issue.region}` : ""}`,
      ),
    )
    .join("\n\n");

  const consoleErrors = observerResult.validations
    .flatMap((v) => v.consoleErrors)
    .filter((e) => e.length > 0);

  const consoleSection =
    consoleErrors.length > 0
      ? `\n\nConsole Errors:\n${consoleErrors.map((e) => `- ${e}`).join("\n")}`
      : "";

  return `The Observer found visual issues in the generated code. Fix them.

VISUAL ISSUES REPORT:
${issuesList}${consoleSection}

Screenshots saved in: ${observerResult.screenshotDir}

PLAN CONTEXT:
${planContent.substring(0, 2000)}

INSTRUCTIONS:
1. Fix CSS/styling issues for layout and styling problems
2. Fix component rendering logic for rendering issues
3. Fix data handling for content issues (missing data, undefined values)
4. Fix JavaScript errors causing console errors
5. Do NOT change test files or configuration
6. Apply fixes directly to the affected source files`;
}

/**
 * Parse the vision model's response into a VisualValidationResult
 *
 * Follows the same robust parsing pattern as parseAuditResponse in auditor.ts
 */
export function parseVisualValidationResponse(
  response: string,
  route: string,
  screenshotPath: string,
  consoleErrors: string[],
): VisualValidationResult {
  let jsonStr = response;

  // Extract from markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  // Find JSON object
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonStr = objectMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);

    const issues: VisualIssue[] = Array.isArray(parsed.issues)
      ? parsed.issues.map((issue: any) => ({
          severity: issue.severity || "major",
          category: issue.category || "rendering",
          description: issue.description || "Unknown issue",
          suggestion: issue.suggestion || "Review manually",
          region: issue.region,
        }))
      : [];

    // Add console errors as issues if not already included
    for (const error of consoleErrors) {
      const hasConsoleIssue = issues.some(
        (i) => i.category === "console_error" && i.description.includes(error.substring(0, 50)),
      );
      if (!hasConsoleIssue) {
        issues.push({
          severity: "major",
          category: "console_error",
          description: `Browser console error: ${error}`,
          suggestion: "Fix the JavaScript error in the source code",
        });
      }
    }

    return {
      status: parsed.status === "APPROVED" ? "APPROVED" : "NEEDS_WORK",
      route,
      screenshotPath,
      issues,
      consoleErrors,
      summary: parsed.summary || "No summary provided",
    };
  } catch {
    // If parsing fails, assume NEEDS_WORK with the raw response as summary
    const issues: VisualIssue[] = consoleErrors.map((error) => ({
      severity: "major" as const,
      category: "console_error" as const,
      description: `Browser console error: ${error}`,
      suggestion: "Fix the JavaScript error in the source code",
    }));

    return {
      status: "NEEDS_WORK",
      route,
      screenshotPath,
      issues: issues.length > 0
        ? issues
        : [{
            severity: "major",
            category: "rendering",
            description: "Could not parse vision model response",
            suggestion: "Review screenshot manually",
          }],
      consoleErrors,
      summary: `Vision model response could not be parsed: ${response.substring(0, 200)}`,
    };
  }
}

// =============================================================================
// Output Mode - Command output validation (CLI, API, Database)
// =============================================================================

/**
 * Build prompt for analyzing command output (non-web apps)
 */
export function buildOutputValidationPrompt(
  planContent: string,
  command: string,
  result: CommandResultForPrompt,
): string {
  const stdoutPreview = result.stdout.substring(0, 3000) || "(empty)";
  const stderrPreview = result.stderr.substring(0, 1000) || "(empty)";

  return `You are a software quality inspector analyzing command output.

CONTEXT:
- Implementation Plan (summary): ${planContent.substring(0, 2000)}
- Command: ${command}
- Exit Code: ${result.exitCode}
- Duration: ${result.duration}ms

STDOUT:
${stdoutPreview}

STDERR:
${stderrPreview}

INSTRUCTIONS:
Analyze the command output and respond with a JSON object. Do NOT include any text outside the JSON.

{
  "status": "APPROVED" or "NEEDS_WORK",
  "issues": [
    {
      "severity": "critical" or "major" or "minor",
      "category": "output_error" or "runtime_error" or "content",
      "description": "What is wrong",
      "suggestion": "How to fix it"
    }
  ],
  "summary": "Brief overall assessment"
}

EVALUATION CRITERIA:
1. Exit Code: Non-zero exit codes indicate errors
2. Stderr: Error messages, stack traces, or warnings in stderr
3. Stdout: Expected output matches what the plan describes
4. Runtime Errors: Crashes, exceptions, unhandled rejections
5. Missing Output: Expected data or responses not present
6. Unexpected Output: Error messages, "undefined", "null", "NaN" in output

RULES:
- If exit code is 0 and output looks correct: status = "APPROVED"
- If exit code is non-zero or stderr has errors: status = "NEEDS_WORK"
- Stack traces or unhandled exceptions are always "critical"
- Missing expected output is "major"
- Warnings in stderr alone are "minor"
- Respond ONLY with the JSON object`;
}

/**
 * Parse the output validation response
 */
export function parseOutputValidationResponse(
  response: string,
  command: string,
  outputPath: string,
  stderrLines: string[],
): VisualValidationResult {
  let jsonStr = response;

  // Extract from markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  // Find JSON object
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonStr = objectMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);

    const issues: VisualIssue[] = Array.isArray(parsed.issues)
      ? parsed.issues.map((issue: any) => ({
          severity: issue.severity || "major",
          category: issue.category || "output_error",
          description: issue.description || "Unknown issue",
          suggestion: issue.suggestion || "Review output manually",
          region: issue.region,
        }))
      : [];

    // Add stderr lines as issues if not already included
    for (const line of stderrLines) {
      if (line.trim().length === 0) continue;
      const hasIssue = issues.some(
        (i) => i.description.includes(line.substring(0, 50)),
      );
      if (!hasIssue && (line.toLowerCase().includes("error") || line.toLowerCase().includes("exception"))) {
        issues.push({
          severity: "major",
          category: "runtime_error",
          description: "Stderr: " + line.substring(0, 200),
          suggestion: "Fix the error in the source code",
        });
      }
    }

    return {
      status: parsed.status === "APPROVED" ? "APPROVED" : "NEEDS_WORK",
      route: command,
      screenshotPath: outputPath,
      issues,
      consoleErrors: stderrLines,
      summary: parsed.summary || "No summary provided",
    };
  } catch {
    return {
      status: "NEEDS_WORK",
      route: command,
      screenshotPath: outputPath,
      issues: stderrLines
        .filter((l) => l.trim().length > 0)
        .map((line) => ({
          severity: "major" as const,
          category: "runtime_error" as const,
          description: "Stderr: " + line.substring(0, 200),
          suggestion: "Fix the error in the source code",
        })),
      consoleErrors: stderrLines,
      summary: "Could not parse analysis response: " + response.substring(0, 200),
    };
  }
}

/**
 * Build prompt for the Executor to fix output-related issues
 */
export function buildOutputFixPrompt(
  observerResult: ObserverResult,
  planContent: string,
): string {
  const issuesList = observerResult.validations
    .filter((v) => v.status === "NEEDS_WORK")
    .flatMap((v) =>
      v.issues.map(
        (issue) =>
          `- [${issue.severity.toUpperCase()}] ${issue.category}: ${issue.description}\n  Command: ${v.route}\n  Suggestion: ${issue.suggestion}`,
      ),
    )
    .join("\n\n");

  const stderrErrors = observerResult.validations
    .flatMap((v) => v.consoleErrors)
    .filter((e) => e.length > 0);

  const stderrSection =
    stderrErrors.length > 0
      ? "\n\nStderr Output:\n" + stderrErrors.map((e) => "- " + e).join("\n")
      : "";

  return `The Observer found issues when running commands on the generated code. Fix them.

OUTPUT ISSUES REPORT:
${issuesList}${stderrSection}

Output logs saved in: ${observerResult.screenshotDir}

PLAN CONTEXT:
${planContent.substring(0, 2000)}

INSTRUCTIONS:
1. Fix runtime errors (crashes, exceptions, unhandled rejections)
2. Fix logic errors that produce incorrect output
3. Fix missing functionality that causes commands to fail
4. Ensure all imports and dependencies are correct
5. Do NOT change test files or configuration
6. Apply fixes directly to the affected source files`;
}
