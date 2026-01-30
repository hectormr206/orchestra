---
name: prompt-engineering
description: "Best practices for crafting effective prompts for LLMs. Covers SCTE structure, anti-patterns, enforcement techniques, and model-specific considerations for Claude, Gemini, and GLM. Trigger: Creating prompts for AI, optimizing LLM responses, debugging poor outputs."
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    ["prompt", "LLM", "AI generation", "output format", "chain-of-thought"]
  tags: [ai, llm, prompts, optimization, formatting]
---

# Prompt Engineering

Best practices for creating effective, consistent prompts that produce high-quality LLM outputs.

## When to Use

- Creating prompts for code generation, review, or documentation
- Debugging prompts that produce poor, incomplete, or inconsistent outputs
- Optimizing prompts for specific models (Claude, Gemini, GLM)
- Designing multi-step or chain-of-thought workflows
- Enforcing specific output formats (JSON, code, markdown)

## Critical Patterns

> **ALWAYS**:
>
> - Include explicit output format examples
> - Use visual separators for distinct sections
> - Place format rules at the END of the prompt
> - Provide ✅/❌ examples for ambiguous requirements
> - Test prompts with edge cases before production

> **NEVER**:
>
> - Use vague instructions ("do something good")
> - Assume the model understands implicit requirements
> - Mix multiple unrelated tasks in one prompt
> - Rely on model's "common sense" for formatting
> - Skip examples for complex output structures

---

## Prompt Structure Pattern

### The SCTE Framework

```
┌─────────────────────────────────────────────────────────────┐
│  S - SYSTEM      │ Role, personality, constraints          │
├─────────────────────────────────────────────────────────────┤
│  C - CONTEXT     │ Background info, examples, domain       │
├─────────────────────────────────────────────────────────────┤
│  T - TASK        │ What to do, step-by-step if needed      │
├─────────────────────────────────────────────────────────────┤
│  E - ENFORCEMENT │ Output format, validation rules         │
└─────────────────────────────────────────────────────────────┘
```

### ✅ Good: Complete SCTE Prompt

```typescript
const prompt = `
═══════════════════════════════════════════════════════════════
SYSTEM
═══════════════════════════════════════════════════════════════
You are a senior TypeScript developer. You write clean, typed,
production-ready code. Never use 'any' type.

═══════════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════════
Project uses: React 18, TypeScript 5, Zustand for state.
Existing pattern for API calls:

\`\`\`typescript
const response = await api.get<User>('/users/:id');
\`\`\`

═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════
Create a custom hook 'useUser' that:
1. Fetches user by ID
2. Handles loading and error states
3. Caches result in Zustand store

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════
Return ONLY the code. No explanations. No markdown fences.
Start directly with: export function useUser
`;
```

### ❌ Bad: Vague Prompt

```typescript
// ANTI-PATTERN: Missing structure, vague requirements
const badPrompt = `
Create a hook for fetching users. Make it good and handle errors.
Use TypeScript.
`;
// Result: Inconsistent output, may include explanations, wrong patterns
```

---

## Anti-Patterns to Avoid

### 1. Meta-Descriptions

**Problem**: LLM describes what should exist instead of generating it.

```
❌ Output: "This file should contain a function that validates..."
❌ Output: "The implementation would include error handling for..."
✅ Output: export function validateUser(data: UserInput): ValidationResult {
```

**Fix**: Add explicit instruction:

```
Generate the actual implementation, not a description.
Start your response with the code directly.
Do NOT explain what the code should do - just write it.
```

### 2. Incomplete Outputs

**Problem**: Code is truncated mid-function.

```typescript
// ❌ Truncated output
export function processData(items: Item[]) {
  return items.map(item => {
    const result = transform(item);
    // Response ends here...
```

**Fix**: Add completion enforcement:

```
CRITICAL: Your response must be syntactically complete.
- All opened braces { must have closing braces }
- All functions must have return statements
- All imports must be at the top

If output would be too long, implement a simpler version
that is COMPLETE rather than a complex version that is INCOMPLETE.
```

### 3. Unwanted Explanations

**Problem**: Code wrapped in explanations.

````
❌ Output: "Here's the implementation:
```typescript
// code here
````

Let me explain what this does..."

✅ Output: // Just the code, nothing else

```

**Fix**:

```

Return ONLY the code.

- No "Here's the implementation"
- No "Let me explain"
- No markdown code fences
- No text before or after the code

```

---

## Enforcement Techniques

### Visual Separators

Use consistent separators to clearly delineate sections:

```

═══════════════════════════════════════════════════════════════
SECTION HEADER (major section)
═══════════════════════════════════════════════════════════════

───────────────────────────────────────────────────────────────
Subsection (minor section)
───────────────────────────────────────────────────────────────

```

### Explicit Examples

Always show what you want AND what you don't want:

```

OUTPUT EXAMPLES:

✅ CORRECT:
{
"status": "success",
"data": { "userId": 123 }
}

❌ INCORRECT:
Here's the JSON response:

```json
{ "status": "success" }
```

The above is wrong because it includes explanation text.

```

### End-of-Prompt Rules

Place critical format rules at the END (recency bias):

```

[... main prompt content ...]

═══════════════════════════════════════════════════════════════
CRITICAL RULES (READ LAST, FOLLOW STRICTLY)
═══════════════════════════════════════════════════════════════

1. Output ONLY code, no explanations
2. Use TypeScript strict mode
3. All functions must be exported
4. Include JSDoc for public functions
5. Start response with: export

````

---

## Model-Specific Considerations

### Claude/Codex
- Excellent instruction following
- Responds well to role-playing ("You are a senior engineer...")
- Benefits from explicit constraints
- Can handle complex multi-step tasks

```typescript
// Claude-optimized prompt structure
const claudePrompt = `
You are a meticulous code reviewer. Your task is to:
1. Identify bugs
2. Suggest improvements
3. Rate code quality (1-10)

Constraints:
- Be specific, cite line numbers
- Prioritize security issues
- Use bullet points for each finding
`;
````

### Gemini

- Balanced creativity and structure
- May need stronger format enforcement
- Good at multi-modal tasks
- Benefits from examples over rules

```typescript
// Gemini-optimized: More examples, less abstract rules
const geminiPrompt = `
Generate a React component like this example:

EXAMPLE INPUT: "Button with loading state"
EXAMPLE OUTPUT:
export function Button({ loading, onClick, children }: ButtonProps) {
  return (
    <button disabled={loading} onClick={onClick}>
      {loading ? <Spinner /> : children}
    </button>
  );
}

NOW YOUR TASK: "${userRequest}"
`;
```

### GLM 4.7

- Needs more explicit examples
- May generate Chinese comments (add "Use English only")
- Better with concrete patterns than abstract instructions
- Benefits from few-shot examples

```typescript
// GLM-optimized: Explicit examples, language enforcement
const glmPrompt = `
LANGUAGE: English only. No Chinese characters.

EXAMPLE 1:
Input: Create a sum function
Output:
function sum(a: number, b: number): number {
  return a + b;
}

EXAMPLE 2:
Input: Create a multiply function
Output:
function multiply(a: number, b: number): number {
  return a * b;
}

YOUR TASK:
Input: ${userRequest}
Output:
`;
```

---

## Task-Specific Patterns

### Code Generation

```typescript
const codeGenPrompt = `
ROLE: Senior ${language} developer

CONTEXT:
- Project: ${projectDescription}
- Existing patterns: ${existingCode}
- Dependencies: ${dependencies}

TASK: ${taskDescription}

REQUIREMENTS:
- Type-safe (no 'any')
- Include error handling
- Add JSDoc comments
- Follow existing patterns

OUTPUT: Code only. Start with: ${expectedFirstLine}
`;
```

### Code Review/Auditing

```typescript
const reviewPrompt = `
ROLE: Security-focused code auditor

CODE TO REVIEW:
\`\`\`${language}
${codeToReview}
\`\`\`

ANALYZE FOR:
1. Security vulnerabilities (CRITICAL)
2. Performance issues (HIGH)
3. Code quality (MEDIUM)
4. Style consistency (LOW)

OUTPUT FORMAT:
## Findings

### [SEVERITY] Title
- **Line**: X
- **Issue**: Description
- **Fix**: Suggested solution

## Summary
- Critical: X issues
- Approved: YES/NO
`;
```

### Documentation Generation

```typescript
const docsPrompt = `
Generate documentation for this code:

\`\`\`${language}
${code}
\`\`\`

OUTPUT FORMAT:
# Function Name

## Description
[One paragraph explaining purpose]

## Parameters
| Name | Type | Description |
|------|------|-------------|

## Returns
[Return type and meaning]

## Example
\`\`\`${language}
[Usage example]
\`\`\`

## Errors
[Possible exceptions/errors]
`;
```

---

## Chain-of-Thought Prompting

For complex reasoning tasks:

```typescript
const cotPrompt = `
TASK: ${complexTask}

APPROACH:
Think through this step-by-step:

Step 1: Understand the requirements
- What is being asked?
- What are the constraints?

Step 2: Design the solution
- What components are needed?
- How do they interact?

Step 3: Implement
- Write the code following the design

Step 4: Validate
- Does it meet all requirements?
- Are there edge cases?

NOW EXECUTE EACH STEP:
`;
```

---

## Output Format Enforcement

### JSON Output

```typescript
const jsonPrompt = `
${taskDescription}

OUTPUT: Valid JSON only. No markdown. No explanation.

SCHEMA:
{
  "status": "success" | "error",
  "data": { ... },
  "errors": string[] | null
}

START YOUR RESPONSE WITH: {
`;
```

### Code with Markers

```typescript
const markerPrompt = `
${taskDescription}

OUTPUT FORMAT:
<CODE_START>
[your implementation here]
<CODE_END>

Include ONLY the markers and code. Nothing else.
`;
```

---

## Checklist

Before using a prompt in production:

- [ ] Has clear SYSTEM role definition?
- [ ] Includes relevant CONTEXT?
- [ ] TASK is specific and unambiguous?
- [ ] OUTPUT format is explicitly defined?
- [ ] Uses visual separators for sections?
- [ ] Includes ✅/❌ examples for ambiguous parts?
- [ ] Critical rules placed at END?
- [ ] Tested with edge cases?
- [ ] Model-specific optimizations applied?
- [ ] Anti-patterns explicitly forbidden?

---

## Related Skills

- `llm-response-parsing` - Parsing LLM outputs robustly
- `llm-orchestration` - Coordinating multiple LLMs
- `error-handling` - Handling API failures
- `testing` - Testing prompt effectiveness

---

## Commands

```bash
# Test prompt with different models
echo "$PROMPT" | llm -m claude-3
echo "$PROMPT" | llm -m gemini-pro
echo "$PROMPT" | llm -m glm-4

# A/B test prompts
./scripts/ab-test-prompts.sh prompt-a.txt prompt-b.txt --samples 10
```
