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

### CodexAdapter (GitHub Copilot)

```typescript
import { CodexAdapter } from './adapters/CodexAdapter.js';

const adapter = new CodexAdapter({
  apiKey: process.env.GITHUB_TOKEN, // GitHub token
});
```

**Features:**
- OpenAI Codex models
- GitHub integration
- Good for code completion

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

## See Also

- [Orchestrator API](./orchestrator.md)
- [Types Reference](../types.ts)
- [Testing Guide](../guides/testing.md)
