# Adapter Interface

Documentation for the `Adapter` interface - unified interface for all AI providers.

## Table of Contents

- [Overview](#overview)
- [Interface Definition](#interface-definition)
- [Implementing a Custom Adapter](#implementing-a-custom-adapter)
- [Built-in Adapters](#built-in-adapters)
- [Examples](#examples)

---

## Overview

The `Adapter` interface provides a unified abstraction layer over different AI providers (Claude, Gemini, GLM, etc.). This allows Orchestra to switch providers seamlessly using fallback chains.

**Key Benefits:**
- Single interface for all providers
- Automatic fallback on errors
- Easy addition of new providers
- Consistent API across providers

---

## Interface Definition

```typescript
interface Adapter {
  /**
   * Check if the adapter is available (API key, connectivity, etc.)
   */
  isAvailable(): Promise<boolean>;

  /**
   * Execute a prompt and return the result
   */
  execute(options: ExecuteOptions): Promise<AgentResult>;

  /**
   * List available models for this adapter
   */
  listModels(): Promise<string[]>;

  /**
   * Check if a specific model is available
   */
  hasModel(model: string): Promise<boolean>;

  /**
   * Get adapter name
   */
  getName(): string;
}
```

### Execute Options

```typescript
interface ExecuteOptions {
  prompt: string;              // The prompt to send to the AI
  systemPrompt?: string;      // Optional system/instruction
  outputFile?: string;        // File to write response to
  sessionId?: string;         // Session identifier
  context?: string[];         // Additional context files
  maxTokens?: number;        // Max tokens in response
  temperature?: number;      // Temperature (0-1)
  timeout?: number;           // Request timeout in ms
}
```

### Agent Result

```typescript
interface AgentResult {
  content: string;            // The AI response
  success: boolean;           // True if execution succeeded
  error?: string;             // Error message if failed
  metadata?: {
    model?: string;           // Model used
    tokens?: {               // Token usage
      prompt: number;
      completion: number;
    };
    duration?: number;       // Execution time in ms
    usage?: Record<string, number>; // Additional usage stats
  };
}
```

---

## Implementing a Custom Adapter

To create a new adapter, implement the `Adapter` interface:

### Step 1: Create the Adapter Class

```typescript
// src/adapters/MyAdapter.ts

import type { Adapter, ExecuteOptions, AgentResult } from '../types.js';

export class MyAdapter implements Adapter {
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  constructor(options: { apiKey: string; apiUrl?: string; model?: string }) {
    this.apiKey = options.apiKey;
    this.apiUrl = options.apiUrl || 'https://api.example.com';
    this.model = options.model || 'my-model';
  }

  getName(): string {
    return 'MyAdapter';
  }

  async isAvailable(): Promise<boolean> {
    // Check API key exists and API is reachable
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.apiUrl}/check`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async execute(options: ExecuteOptions): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.apiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          prompt: options.prompt,
          system: options.systemPrompt,
          max_tokens: options.maxTokens || 2048,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        content: data.text,
        success: true,
        metadata: {
          model: this.model,
          duration: Date.now() - startTime,
          tokens: data.usage,
        },
      };
    } catch (error) {
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          duration: Date.now() - startTime,
        },
      };
    }
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.apiUrl}/models`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    const data = await response.json();
    return data.models.map((m: { id: string }) => m.id);
  }

  async hasModel(model: string): Promise<boolean> {
    const models = await this.listModels();
    return models.includes(model);
  }
}
```

### Step 2: Register the Adapter

```typescript
// src/adapters/index.ts

export { MyAdapter } from './MyAdapter.js';
```

### Step 3: Use in Configuration

```json
// .orchestrarc.json
{
  "agents": {
    "architect": ["MyAdapter"],
    "executor": ["MyAdapter"]
  }
}
```

---

## Built-in Adapters

### ClaudeAdapter (Anthropic Claude)

```typescript
import { ClaudeAdapter } from './adapters/ClaudeAdapter.js';

const adapter = new ClaudeAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022',
});

const result = await adapter.execute({
  prompt: 'Explain this code',
});
```

**Features:**
- Support for Claude 3.5 Sonnet and Claude Opus
- Streaming responses
- Image analysis support
- System prompts support

### GeminiAdapter (Google Gemini)

```typescript
import { GeminiAdapter } from './adapters/GeminiAdapter.js';

const adapter = new GeminiAdapter({
  apiKey: process.env.GEMINI_API_KEY,
});
```

**Features:**
- Gemini Pro and Ultra models
- Function calling support
- Multimodal capabilities

### GLMAdapter (Zhipu GLM-4)

```typescript
import { GLMAdapter } from './adapters/GLMAdapter.js';

const adapter = new GLMAdapter({
  apiKey: process.env.ZAI_API_KEY,
});
```

**Features:**
- GLM-4 and other models
- High performance for Chinese
- Cost-effective

### CodexAdapter (OpenAI GPT-5.2-Codex)

```typescript
import { CodexAdapter } from './adapters/CodexAdapter.js';

const adapter = new CodexAdapter();
```

**Features:**
- OpenAI GPT-5.2-Codex for algorithmic problems
- Surgical use for complex debugging
- Automatic CONTEXT_EXCEEDED handling with retry
- Rate limit detection (RATE_LIMIT_429)

### KimiAdapter (Moonshot Kimi k2.5)

```typescript
import { KimiAdapter } from './adapters/KimiAdapter.js';

const adapter = new KimiAdapter();
```

**Features:**
- Kimi k2.5 Agent Swarm capabilities
- 200K context window
- Bilingual error detection (English + Chinese)
- Automatic CONTEXT_EXCEEDED handling with retry
- Cost-effective for planning and fallback

**Error Detection:**
- Rate limit: `請求過於頻繁` (Chinese), `rate limit` (English)
- Context exceeded: `上下文過長` (Chinese), `context exceeded` (English)
- Supports timeout, API errors, and invalid responses

### FallbackAdapter

The `FallbackAdapter` manages automatic fallback between adapters:

```typescript
import { FallbackAdapter } from './adapters/FallbackAdapter.js';

const fallbackChain = [
  new ClaudeAdapter({ apiKey: '...' }),
  new GeminiAdapter({ apiKey: '...' }),
  new GLMAdapter({ apiKey: '...' }),
];

const adapter = new FallbackAdapter(fallbackChain);

const result = await adapter.execute({
  prompt: 'Generate code',
});
```

**Behavior:**
- Tries adapters in order
- Automatically switches on failure
- Returns success if any adapter succeeds
- Logs fallbacks for monitoring

---

## Best Practices

### 1. Error Handling

Always handle potential errors:

```typescript
try {
  const result = await adapter.execute({ prompt: 'Test' });
  if (!result.success) {
    console.error('Adapter failed:', result.error);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### 2. Check Availability

Before using an adapter, verify it's available:

```typescript
if (!(await adapter.isAvailable())) {
  console.error('Adapter not available');
  process.exit(1);
}
```

### 3. Model Selection

Check if a model is supported before using it:

```typescript
if (await adapter.hasModel('claude-3-opus-20240229')) {
  // Use the model
} else {
  console.log('Model not available, using default');
}
```

### 4. Context Management

Pass relevant context for better results:

```typescript
const result = await adapter.execute({
  prompt: 'Add error handling',
  context: ['file1.ts', 'file2.ts'],
});
```

---

## Testing Adapters

When testing adapters, use mocks:

```typescript
vi.mock('../adapters/ClaudeAdapter.js');

import { ClaudeAdapter } from '../adapters/ClaudeAdapter.js';

const mockAdapter = {
  execute: vi.fn().mockResolvedValue({
    content: 'Mock response',
    success: true,
  }),
  isAvailable: vi.fn().mockResolvedValue(true),
  // ...
};
```

---

## Troubleshooting

### Common Issues

**Issue:** "API key not found"
- **Solution:** Ensure the API key environment variable is set

**Issue:** "Rate limit exceeded"
- **Solution:** Wait and retry, or use fallback adapter

**Issue:** "Model not found"
- **Solution:** Check available models with `listModels()`

**Issue:** "Timeout"
- **Solution:** Increase timeout in options or simplify prompt

---

## Context Compaction Helper

All adapters now include automatic context compaction when CONTEXT_EXCEEDED errors occur.

### Overview

The `contextCompaction.ts` module provides intelligent prompt reduction with 5 progressive strategies:

```typescript
import {
  compactPrompt,
  isContextExceededError,
  estimateTokens,
  wouldExceedContext
} from './adapters/contextCompaction.js';
```

### API Reference

#### `compactPrompt(prompt, targetReduction?)`

Compacts a prompt using multiple strategies to achieve target reduction.

**Parameters:**
- `prompt: string` - The original prompt text
- `targetReduction?: number` - Target reduction ratio (default: 0.5 = 50%)

**Returns:**
```typescript
interface CompactionResult {
  compactedPrompt: string;      // The compacted prompt
  originalLength: number;        // Original character count
  compactedLength: number;       // Compacted character count
  reductionPercent: number;      // Percentage reduced
}
```

**Example:**
```typescript
const result = compactPrompt(longPrompt, 0.6); // 60% reduction target

console.log(`Reduced from ${result.originalLength} to ${result.compactedLength} chars`);
console.log(`Reduction: ${result.reductionPercent}%`);
```

#### `isContextExceededError(output)`

Detects if an error message indicates context limit exceeded.

**Parameters:**
- `output: string` - Error message or output text

**Returns:** `boolean` - True if context limit error detected

**Supported patterns:**
- English: "context exceeded", "maximum context", "token limit", "prompt too long"
- Chinese: "上下文過長", "输入过长"

**Example:**
```typescript
if (isContextExceededError(stderr)) {
  const compacted = compactPrompt(originalPrompt);
  // Retry with compacted prompt
}
```

#### `estimateTokens(text)`

Estimates token count for a given text.

**Parameters:**
- `text: string` - Text to estimate

**Returns:** `number` - Estimated token count

**Note:** Uses approximation of 1 token ≈ 4 characters

**Example:**
```typescript
const tokens = estimateTokens(prompt);
console.log(`Estimated tokens: ${tokens}`);
```

#### `wouldExceedContext(text, maxTokens)`

Checks if text would exceed context limit using 80% safety margin.

**Parameters:**
- `text: string` - Text to check
- `maxTokens: number` - Maximum allowed tokens

**Returns:** `boolean` - True if would exceed safe limit (80% of max)

**Example:**
```typescript
if (wouldExceedContext(prompt, 128000)) {
  console.warn('Prompt may be too long, compacting...');
  const result = compactPrompt(prompt);
  // Use result.compactedPrompt
}
```

### Compaction Strategies

The compaction system applies 5 strategies in sequence:

1. **Whitespace Removal**
   - Collapses multiple spaces, tabs, newlines
   - Preserves code structure

2. **Repeated Phrase Detection**
   - Removes duplicate sentences
   - Deduplicates instructions

3. **Code Block Summarization**
   - Summarizes code blocks > 500 chars
   - Preserves signatures and key lines
   - Adds `... (code omitted for brevity) ...`

4. **Verbose Phrase Removal**
   - Strips common verbose patterns:
     - "Please note that"
     - "Make sure to"
     - "It's important to"
     - "Remember that"
     - "Don't forget to"

5. **Aggressive Summarization**
   - Ranks sentences by importance
   - Keeps only top N% most important
   - Preserves action-oriented content

### Automatic Retry Flow

All adapters implement automatic retry with compaction:

```typescript
async execute(options: ExecuteOptions, retryCount: number = 0): Promise<AgentResult> {
  // ... execute request ...

  if (isContextExceededError(stderr) || isContextExceededError(stdout)) {
    if (retryCount < 2) {
      console.warn(`⚠️  Context exceeded. Compacting prompt (attempt ${retryCount + 1}/2)...`);

      const compactionResult = compactPrompt(options.prompt);
      console.log(`📦 Prompt compacted: ${compactionResult.originalLength} → ${compactionResult.compactedLength} chars (${compactionResult.reductionPercent}% reduction)`);

      // Retry with compacted prompt
      return await this.execute({
        ...options,
        prompt: compactionResult.compactedPrompt
      }, retryCount + 1);
    } else {
      throw new Error('CONTEXT_EXCEEDED: Prompt too long even after compaction');
    }
  }
}
```

### Best Practices

1. **Proactive Checking**
   ```typescript
   // Check before sending
   if (wouldExceedContext(prompt, model.maxTokens)) {
     prompt = compactPrompt(prompt, 0.5).compactedPrompt;
   }
   ```

2. **Preserve Essential Info**
   ```typescript
   // For critical prompts, use lower reduction target
   const result = compactPrompt(criticalPrompt, 0.3); // Only 30% reduction
   ```

3. **Monitor Compaction**
   ```typescript
   const result = compactPrompt(prompt);
   if (result.reductionPercent < 40) {
     console.warn('Low reduction achieved, prompt may still be too long');
   }
   ```

4. **Test Compaction Quality**
   ```typescript
   // Verify essential keywords preserved
   const result = compactPrompt(prompt);
   expect(result.compactedPrompt).toContain('authentication');
   expect(result.compactedPrompt).toContain('validation');
   ```

---

## See Also

- [Orchestrator API](./orchestrator.md)
- [Types Reference](../types.ts)
- [Testing Guide](../guides/testing.md)
