---
name: llm-response-parsing
description: "Robust strategies for parsing and validating LLM responses. Code extraction, JSON parsing, incomplete code detection, and recovery strategies. Trigger: Parsing AI output, extracting code, validating LLM responses."
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    [
      "parse response",
      "extract code",
      "validate output",
      "JSON parse",
      "LLM output",
    ]
  tags: [ai, llm, parsing, validation, extraction]
---

# LLM Response Parsing

Robust strategies for extracting, validating, and sanitizing LLM outputs.

## When to Use

- Extracting code blocks from LLM responses
- Parsing JSON from mixed text/JSON outputs
- Detecting and handling incomplete/truncated code
- Validating syntax before using generated code
- Implementing retry strategies for invalid outputs

## Critical Patterns

> **ALWAYS**:
>
> - Attempt multiple extraction strategies (with fences, without, regex)
> - Validate extracted code for syntax completeness
> - Have fallback parsers for malformed outputs
> - Log raw responses for debugging failures
> - Sanitize outputs before execution

> **NEVER**:
>
> - Trust LLM output without validation
> - Assume code blocks are properly formatted
> - Execute extracted code without syntax checking
> - Discard failed responses without logging
> - Use simple regex for complex extraction

---

## Code Extraction Patterns

### Multi-Strategy Extractor

````typescript
interface ExtractionResult {
  code: string;
  language: string | null;
  method: "fenced" | "unfenced" | "full" | "markers";
  confidence: "high" | "medium" | "low";
}

function extractCode(response: string): ExtractionResult | null {
  // Strategy 1: Fenced code blocks (```language ... ```)
  const fencedResult = extractFencedCode(response);
  if (fencedResult) return { ...fencedResult, confidence: "high" };

  // Strategy 2: Custom markers (<CODE_START> ... <CODE_END>)
  const markerResult = extractMarkerCode(response);
  if (markerResult) return { ...markerResult, confidence: "high" };

  // Strategy 3: Unfenced code detection (heuristics)
  const unfencedResult = extractUnfencedCode(response);
  if (unfencedResult) return { ...unfencedResult, confidence: "medium" };

  // Strategy 4: Entire response is code (if starts with code patterns)
  const fullResult = extractFullAsCode(response);
  if (fullResult) return { ...fullResult, confidence: "low" };

  return null;
}
````

### Fenced Code Extraction

````typescript
function extractFencedCode(
  response: string,
): Omit<ExtractionResult, "confidence"> | null {
  // Match ```language\ncode\n``` pattern
  const fenceRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const matches = [...response.matchAll(fenceRegex)];

  if (matches.length === 0) return null;

  // If multiple blocks, prefer the longest or last one
  const bestMatch = matches.reduce((best, match) =>
    match[2].length > best[2].length ? match : best,
  );

  return {
    code: bestMatch[2].trim(),
    language: bestMatch[1] || null,
    method: "fenced",
  };
}
````

### Unfenced Code Detection

```typescript
function extractUnfencedCode(
  response: string,
): Omit<ExtractionResult, "confidence"> | null {
  const lines = response.split("\n");
  const codeLines: string[] = [];
  let inCode = false;

  // Patterns that indicate code
  const codeIndicators = [
    /^(import|export|const|let|var|function|class|interface|type)\s/,
    /^(def|class|from|import|async|await)\s/, // Python
    /^(func|package|import|type|struct)\s/, // Go
    /^\s*(if|for|while|switch|try|catch)\s*\(/,
    /^[a-zA-Z_]\w*\s*[=:]\s*/,
    /^\s*\/\/|^\s*#|^\s*\/\*/, // Comments
  ];

  // Patterns that indicate prose (not code)
  const proseIndicators = [
    /^(Here's|Here is|This|The|I'll|Let me|Note:|Remember:)/i,
    /^(You can|You should|Make sure|Don't forget)/i,
    /^\d+\.\s/, // Numbered list
  ];

  for (const line of lines) {
    const isCode = codeIndicators.some((p) => p.test(line));
    const isProse = proseIndicators.some((p) => p.test(line.trim()));

    if (isCode && !isProse) {
      inCode = true;
      codeLines.push(line);
    } else if (inCode && !isProse && line.trim()) {
      codeLines.push(line);
    } else if (inCode && isProse) {
      // End of code block
      break;
    }
  }

  if (codeLines.length < 3) return null;

  return {
    code: codeLines.join("\n").trim(),
    language: detectLanguage(codeLines.join("\n")),
    method: "unfenced",
  };
}
```

---

## JSON Parsing Patterns

### Robust JSON Extractor

```typescript
interface JsonExtractionResult<T> {
  data: T | null;
  rawJson: string | null;
  error: string | null;
  method: "direct" | "extracted" | "repaired" | "partial";
}

function extractJson<T>(response: string): JsonExtractionResult<T> {
  // Strategy 1: Direct parse (response is pure JSON)
  try {
    const data = JSON.parse(response.trim()) as T;
    return { data, rawJson: response.trim(), error: null, method: "direct" };
  } catch {
    /* Continue to next strategy */
  }

  // Strategy 2: Extract JSON from mixed content
  const extracted = extractJsonFromMixed(response);
  if (extracted) {
    try {
      const data = JSON.parse(extracted) as T;
      return { data, rawJson: extracted, error: null, method: "extracted" };
    } catch {
      /* Continue */
    }
  }

  // Strategy 3: Repair common JSON issues
  const repaired = repairJson(extracted || response);
  if (repaired) {
    try {
      const data = JSON.parse(repaired) as T;
      return { data, rawJson: repaired, error: null, method: "repaired" };
    } catch {
      /* Continue */
    }
  }

  // Strategy 4: Partial extraction
  const partial = extractPartialJson<T>(response);
  if (partial) {
    return {
      data: partial,
      rawJson: null,
      error: "Partial extraction",
      method: "partial",
    };
  }

  return {
    data: null,
    rawJson: null,
    error: "Failed all extraction methods",
    method: "direct",
  };
}
```

### Extract JSON from Mixed Content

````typescript
function extractJsonFromMixed(response: string): string | null {
  // Remove markdown JSON fence
  const jsonFenceMatch = response.match(/```json\n?([\s\S]*?)```/);
  if (jsonFenceMatch) return jsonFenceMatch[1].trim();

  // Find JSON object boundaries
  const objectStart = response.indexOf("{");
  const arrayStart = response.indexOf("[");

  let start = -1;
  let isObject = true;

  if (objectStart >= 0 && (arrayStart < 0 || objectStart < arrayStart)) {
    start = objectStart;
    isObject = true;
  } else if (arrayStart >= 0) {
    start = arrayStart;
    isObject = false;
  }

  if (start < 0) return null;

  // Find matching closing bracket
  const openChar = isObject ? "{" : "[";
  const closeChar = isObject ? "}" : "]";

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < response.length; i++) {
    const char = response[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === openChar) depth++;
      if (char === closeChar) depth--;
      if (depth === 0) {
        return response.slice(start, i + 1);
      }
    }
  }

  return null;
}
````

### Common JSON Repairs

```typescript
function repairJson(json: string): string | null {
  if (!json) return null;

  let repaired = json;

  // Remove trailing commas
  repaired = repaired.replace(/,\s*([\]}])/g, "$1");

  // Add missing closing brackets
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  repaired += "}".repeat(Math.max(0, openBraces - closeBraces));

  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;
  repaired += "]".repeat(Math.max(0, openBrackets - closeBrackets));

  // Fix unquoted keys (simple cases)
  repaired = repaired.replace(/(\{|\,)\s*([a-zA-Z_]\w*)\s*:/g, '$1"$2":');

  // Fix single quotes to double quotes
  repaired = repaired.replace(/'/g, '"');

  return repaired;
}
```

---

## Incomplete Code Detection

### Syntax Completeness Checker

```typescript
interface CompletenessResult {
  isComplete: boolean;
  issues: CompletionIssue[];
  fixable: boolean;
}

interface CompletionIssue {
  type:
    | "unclosed_brace"
    | "unclosed_paren"
    | "unclosed_bracket"
    | "unclosed_string"
    | "missing_return"
    | "truncated_function";
  position?: number;
  context?: string;
}

function checkCodeCompleteness(
  code: string,
  language: string,
): CompletenessResult {
  const issues: CompletionIssue[] = [];

  // Check bracket balance
  const bracketIssues = checkBracketBalance(code);
  issues.push(...bracketIssues);

  // Check string completion
  const stringIssues = checkStringCompletion(code);
  issues.push(...stringIssues);

  // Language-specific checks
  if (language === "typescript" || language === "javascript") {
    issues.push(...checkJsCompleteness(code));
  } else if (language === "python") {
    issues.push(...checkPythonCompleteness(code));
  }

  return {
    isComplete: issues.length === 0,
    issues,
    fixable: issues.every((i) =>
      ["unclosed_brace", "unclosed_paren", "unclosed_bracket"].includes(i.type),
    ),
  };
}
```

### Bracket Balance Checker

```typescript
function checkBracketBalance(code: string): CompletionIssue[] {
  const issues: CompletionIssue[] = [];
  const stack: { char: string; pos: number }[] = [];
  const pairs: Record<string, string> = { "{": "}", "(": ")", "[": "]" };
  const openers = Object.keys(pairs);
  const closers = Object.values(pairs);

  let inString = false;
  let stringChar = "";
  let escape = false;

  for (let i = 0; i < code.length; i++) {
    const char = code[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    // Track strings
    if ((char === '"' || char === "'" || char === "`") && !inString) {
      inString = true;
      stringChar = char;
      continue;
    }
    if (char === stringChar && inString) {
      inString = false;
      stringChar = "";
      continue;
    }

    if (inString) continue;

    // Track brackets
    if (openers.includes(char)) {
      stack.push({ char, pos: i });
    } else if (closers.includes(char)) {
      if (stack.length === 0 || pairs[stack[stack.length - 1].char] !== char) {
        issues.push({ type: "unclosed_brace", position: i, context: char });
      } else {
        stack.pop();
      }
    }
  }

  // Report unclosed brackets
  for (const unclosed of stack) {
    const type =
      unclosed.char === "{"
        ? "unclosed_brace"
        : unclosed.char === "("
          ? "unclosed_paren"
          : "unclosed_bracket";
    issues.push({ type, position: unclosed.pos, context: unclosed.char });
  }

  return issues;
}
```

### Auto-Fix Incomplete Code

```typescript
function attemptCodeFix(code: string, issues: CompletionIssue[]): string {
  let fixed = code;

  // Count and add missing closers
  const closerMap: Record<string, string> = {
    unclosed_brace: "}",
    unclosed_paren: ")",
    unclosed_bracket: "]",
  };

  for (const issue of issues.filter((i) => closerMap[i.type])) {
    fixed += "\n" + closerMap[issue.type];
  }

  return fixed;
}
```

---

## Language-Specific Validation

### TypeScript/JavaScript Validator

```typescript
async function validateTypeScript(code: string): Promise<ValidationResult> {
  try {
    // Use TypeScript compiler API
    const ts = await import("typescript");

    const result = ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
        strict: true,
        noEmit: true,
      },
      reportDiagnostics: true,
    });

    const errors =
      result.diagnostics?.filter(
        (d) => d.category === ts.DiagnosticCategory.Error,
      ) || [];

    return {
      valid: errors.length === 0,
      errors: errors.map((d) => ({
        line: d.file
          ? ts.getLineAndCharacterOfPosition(d.file, d.start!).line
          : 0,
        message: ts.flattenDiagnosticMessageText(d.messageText, "\n"),
      })),
    };
  } catch (e) {
    return { valid: false, errors: [{ line: 0, message: String(e) }] };
  }
}
```

### Python Validator

```python
import ast
from typing import NamedTuple

class ValidationResult(NamedTuple):
    valid: bool
    errors: list[dict]

def validate_python(code: str) -> ValidationResult:
    try:
        ast.parse(code)
        return ValidationResult(valid=True, errors=[])
    except SyntaxError as e:
        return ValidationResult(
            valid=False,
            errors=[{
                'line': e.lineno or 0,
                'message': e.msg or str(e),
                'offset': e.offset
            }]
        )
```

---

## Output Sanitization

### Clean LLM Response

```typescript
function sanitizeOutput(response: string): string {
  let clean = response;

  // Remove common LLM prefixes
  const prefixes = [
    /^Here('s| is) (the|your|an?) (code|implementation|solution)[:\s]*/i,
    /^(Sure|Certainly|Of course)[!,.\s]*(here('s| is))?[:\s]*/i,
    /^Let me (show|create|write|provide)[^:]*:\s*/i,
    /^I('ll| will) (create|write|implement)[^:]*:\s*/i,
  ];

  for (const prefix of prefixes) {
    clean = clean.replace(prefix, "");
  }

  // Remove common suffixes
  const suffixes = [
    /\n+(This|The) (code|implementation|function)[^.]*\.?\s*$/i,
    /\n+Let me know if[^.]*\.?\s*$/i,
    /\n+I hope this helps[^.]*\.?\s*$/i,
    /\n+Feel free to[^.]*\.?\s*$/i,
  ];

  for (const suffix of suffixes) {
    clean = clean.replace(suffix, "");
  }

  return clean.trim();
}
```

---

## Retry Strategies

### Intelligent Retry with Feedback

```typescript
interface RetryConfig {
  maxAttempts: number;
  extractors: ((response: string) => ExtractionResult | null)[];
  validators: ((code: string) => ValidationResult)[];
  promptEnhancer: (originalPrompt: string, errors: string[]) => string;
}

async function retryWithFeedback<T>(
  llm: LLMClient,
  prompt: string,
  config: RetryConfig,
): Promise<T | null> {
  let lastErrors: string[] = [];

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    // Enhance prompt with previous errors
    const enhancedPrompt =
      attempt > 0 ? config.promptEnhancer(prompt, lastErrors) : prompt;

    const response = await llm.complete(enhancedPrompt);

    // Try each extractor
    for (const extractor of config.extractors) {
      const extracted = extractor(response);
      if (!extracted) continue;

      // Validate
      const allValid = config.validators.every((v) => v(extracted.code).valid);
      if (allValid) {
        return extracted as T;
      }

      // Collect errors for retry
      lastErrors = config.validators
        .map((v) => v(extracted.code))
        .flatMap((r) => r.errors.map((e) => e.message));
    }

    // Progressive delay
    await sleep(1000 * Math.pow(2, attempt));
  }

  return null;
}
```

### Prompt Enhancement for Retries

```typescript
function enhancePromptWithErrors(original: string, errors: string[]): string {
  return `${original}

═══════════════════════════════════════════════════════════════
PREVIOUS ATTEMPT FAILED - PLEASE FIX THESE ISSUES:
═══════════════════════════════════════════════════════════════
${errors.map((e, i) => `${i + 1}. ${e}`).join("\n")}

CRITICAL: Your response MUST be syntactically valid code.
Ensure all brackets, braces, and parentheses are balanced.
`;
}
```

---

## Checklist

Before deploying LLM response parsing:

- [ ] Multiple extraction strategies implemented?
- [ ] JSON extraction handles markdown fences?
- [ ] Bracket balance checking enabled?
- [ ] Language-specific validation configured?
- [ ] Sanitization removes unwanted text?
- [ ] Retry strategy with error feedback?
- [ ] Raw responses logged for debugging?
- [ ] Fallback behavior defined?
- [ ] Partial extraction as last resort?
- [ ] Performance acceptable for real-time use?

---

## Related Skills

- `prompt-engineering` - Design prompts for better outputs
- `llm-orchestration` - Multi-LLM coordination
- `error-handling` - Graceful failure handling
- `testing` - Unit tests for parsers

---

## Commands

```bash
# Validate extracted code syntax
npx tsc --noEmit extracted-code.ts
python -m py_compile extracted-code.py

# Test JSON extraction
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "Invalid JSON"

# Log responses for debugging
export LLM_LOG_RESPONSES=true
```
