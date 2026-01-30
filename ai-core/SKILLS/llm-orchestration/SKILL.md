---
name: llm-orchestration
description: "Patterns for coordinating multiple LLMs with resilience. Adapter pattern, fallback chains, rate limiting, and cost-aware routing. Trigger: Multi-LLM systems, API failover, rate limit handling, provider switching."
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    ["orchestrate", "multi-LLM", "fallback", "rate limit", "provider"]
  tags: [ai, llm, orchestration, failover, resilience]
---

# LLM Orchestration

Patterns for coordinating multiple LLM providers with resilience and efficiency.

## When to Use

- Building systems that use multiple LLM providers
- Implementing automatic failover when providers fail
- Managing rate limits across different APIs
- Optimizing costs by routing to cheaper providers
- Handling context windows and token budgets

## Critical Patterns

> **ALWAYS**:
>
> - Implement unified adapter interface for all providers
> - Configure fallback chains for critical operations
> - Monitor rate limits proactively (not just reactively)
> - Log all provider switches for debugging
> - Implement circuit breakers to prevent cascade failures

> **NEVER**:
>
> - Hardcode provider-specific logic in business code
> - Ignore rate limit headers from responses
> - Retry indefinitely without backoff
> - Mix provider configurations in code
> - Assume all providers have same capabilities

---

## Adapter Pattern

### Unified LLM Interface

```typescript
interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  latencyMs: number;
}

interface LLMConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

interface LLMAdapter {
  name: string;
  complete(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse>;
  countTokens(text: string): number;
  maxContextWindow: number;
  isAvailable(): Promise<boolean>;
}
```

### Provider Implementations

```typescript
// Claude Adapter
class ClaudeAdapter implements LLMAdapter {
  name = "claude";
  maxContextWindow = 200000;

  async complete(
    messages: LLMMessage[],
    config: LLMConfig,
  ): Promise<LLMResponse> {
    const start = Date.now();
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: config.model || "claude-3-5-sonnet-20241022",
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature ?? 0.7,
      messages: this.formatMessages(messages),
    });

    return {
      content:
        response.content[0].type === "text" ? response.content[0].text : "",
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model: response.model,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  countTokens(text: string): number {
    // Anthropic tokenizer approximation
    return Math.ceil(text.length / 3.5);
  }

  async isAvailable(): Promise<boolean> {
    try {
      await fetch("https://api.anthropic.com/v1/messages", { method: "HEAD" });
      return true;
    } catch {
      return false;
    }
  }
}

// Gemini Adapter
class GeminiAdapter implements LLMAdapter {
  name = "gemini";
  maxContextWindow = 1000000;

  async complete(
    messages: LLMMessage[],
    config: LLMConfig,
  ): Promise<LLMResponse> {
    const start = Date.now();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: config.model || "gemini-1.5-pro",
    });

    const chat = model.startChat({
      history: this.formatHistory(messages.slice(0, -1)),
    });

    const result = await chat.sendMessage(
      messages[messages.length - 1].content,
    );

    return {
      content: result.response.text(),
      usage: {
        promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
        completionTokens:
          result.response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
      },
      model: config.model || "gemini-1.5-pro",
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  async isAvailable(): Promise<boolean> {
    try {
      await fetch("https://generativelanguage.googleapis.com/", {
        method: "HEAD",
      });
      return true;
    } catch {
      return false;
    }
  }
}
```

---

## Fallback Chains

### Fallback Manager

```typescript
interface FallbackConfig {
  providers: string[];
  retryableErrors: number[]; // HTTP status codes
  maxRetriesPerProvider: number;
  onFallback?: (from: string, to: string, error: Error) => void;
}

class FallbackManager {
  private adapters: Map<string, LLMAdapter> = new Map();
  private config: FallbackConfig;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(adapters: LLMAdapter[], config: FallbackConfig) {
    for (const adapter of adapters) {
      this.adapters.set(adapter.name, adapter);
      this.circuitBreakers.set(
        adapter.name,
        new CircuitBreaker({
          failureThreshold: 5,
          resetTimeout: 60000,
        }),
      );
    }
    this.config = config;
  }

  async complete(
    messages: LLMMessage[],
    config: LLMConfig,
  ): Promise<LLMResponse> {
    const errors: Error[] = [];

    for (const providerName of this.config.providers) {
      const adapter = this.adapters.get(providerName);
      const circuitBreaker = this.circuitBreakers.get(providerName);

      if (!adapter || !circuitBreaker) continue;

      // Skip if circuit is open
      if (circuitBreaker.isOpen()) {
        console.log(`Circuit open for ${providerName}, skipping`);
        continue;
      }

      try {
        const response = await this.tryProvider(adapter, messages, config);
        circuitBreaker.recordSuccess();
        return response;
      } catch (error) {
        circuitBreaker.recordFailure();
        errors.push(error as Error);

        const nextProvider =
          this.config.providers[
            this.config.providers.indexOf(providerName) + 1
          ];

        if (nextProvider) {
          this.config.onFallback?.(providerName, nextProvider, error as Error);
        }
      }
    }

    throw new AggregateError(errors, "All providers failed");
  }

  private async tryProvider(
    adapter: LLMAdapter,
    messages: LLMMessage[],
    config: LLMConfig,
  ): Promise<LLMResponse> {
    let lastError: Error | null = null;

    for (let i = 0; i < this.config.maxRetriesPerProvider; i++) {
      try {
        return await adapter.complete(messages, config);
      } catch (error) {
        lastError = error as Error;

        // Check if retryable
        const status = (error as any).status || (error as any).statusCode;
        if (!this.config.retryableErrors.includes(status)) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = Math.min(
          1000 * Math.pow(2, i) + Math.random() * 1000,
          30000,
        );
        await sleep(delay);
      }
    }

    throw lastError;
  }
}
```

### Rate Limit Detection

```typescript
interface RateLimitInfo {
  isRateLimited: boolean;
  retryAfter: number | null; // seconds
  remaining: number | null;
  reset: Date | null;
}

function detectRateLimit(response: Response | Error): RateLimitInfo {
  // From response headers
  if (response instanceof Response) {
    const retryAfter = response.headers.get("retry-after");
    const remaining = response.headers.get("x-ratelimit-remaining");
    const reset = response.headers.get("x-ratelimit-reset");

    return {
      isRateLimited: response.status === 429,
      retryAfter: retryAfter ? parseInt(retryAfter) : null,
      remaining: remaining ? parseInt(remaining) : null,
      reset: reset ? new Date(parseInt(reset) * 1000) : null,
    };
  }

  // From error
  const error = response as any;
  if (error.status === 429 || error.code === "rate_limit_exceeded") {
    return {
      isRateLimited: true,
      retryAfter: error.retryAfter || 60,
      remaining: 0,
      reset: null,
    };
  }

  return {
    isRateLimited: false,
    retryAfter: null,
    remaining: null,
    reset: null,
  };
}
```

---

## Circuit Breaker Pattern

```typescript
type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenRequests: number;
}

class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private lastFailure: Date | null = null;
  private halfOpenSuccesses = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  isOpen(): boolean {
    if (this.state === "closed") return false;

    if (this.state === "open") {
      // Check if reset timeout has passed
      const now = Date.now();
      const timeSinceFailure = now - (this.lastFailure?.getTime() || 0);

      if (timeSinceFailure >= this.config.resetTimeout) {
        this.state = "half-open";
        this.halfOpenSuccesses = 0;
        return false;
      }
      return true;
    }

    return false; // half-open allows requests
  }

  recordSuccess(): void {
    if (this.state === "half-open") {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.config.halfOpenRequests) {
        this.state = "closed";
        this.failures = 0;
      }
    } else {
      this.failures = 0;
    }
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailure = new Date();

    if (this.failures >= this.config.failureThreshold) {
      this.state = "open";
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
```

---

## Token Management

### Context Window Manager

```typescript
interface ContextConfig {
  maxTokens: number;
  reserveForResponse: number;
  truncationStrategy: "start" | "end" | "middle" | "smart";
}

class ContextManager {
  private config: ContextConfig;
  private tokenCounter: (text: string) => number;

  constructor(config: ContextConfig, tokenCounter: (text: string) => number) {
    this.config = config;
    this.tokenCounter = tokenCounter;
  }

  fitToContext(messages: LLMMessage[]): LLMMessage[] {
    const maxAllowed = this.config.maxTokens - this.config.reserveForResponse;
    let totalTokens = this.countMessages(messages);

    if (totalTokens <= maxAllowed) {
      return messages;
    }

    switch (this.config.truncationStrategy) {
      case "start":
        return this.truncateFromStart(messages, maxAllowed);
      case "end":
        return this.truncateFromEnd(messages, maxAllowed);
      case "middle":
        return this.truncateMiddle(messages, maxAllowed);
      case "smart":
        return this.smartTruncate(messages, maxAllowed);
      default:
        return messages;
    }
  }

  private truncateFromStart(
    messages: LLMMessage[],
    maxTokens: number,
  ): LLMMessage[] {
    // Keep system message, truncate oldest messages
    const result: LLMMessage[] = [];
    let tokens = 0;

    // Always keep first system message if present
    if (messages[0]?.role === "system") {
      result.push(messages[0]);
      tokens += this.tokenCounter(messages[0].content);
    }

    // Add messages from end until we hit limit
    for (let i = messages.length - 1; i >= (result.length ? 1 : 0); i--) {
      const msgTokens = this.tokenCounter(messages[i].content);
      if (tokens + msgTokens > maxTokens) break;
      result.unshift(messages[i]);
      tokens += msgTokens;
    }

    return result;
  }

  private smartTruncate(
    messages: LLMMessage[],
    maxTokens: number,
  ): LLMMessage[] {
    // Keep: system, last N user messages, last assistant response
    const system = messages.find((m) => m.role === "system");
    const lastUser = messages.filter((m) => m.role === "user").slice(-3);
    const lastAssistant = messages
      .filter((m) => m.role === "assistant")
      .slice(-1);

    const result = [...(system ? [system] : []), ...lastUser, ...lastAssistant];

    return this.truncateFromStart(result, maxTokens);
  }

  private countMessages(messages: LLMMessage[]): number {
    return messages.reduce((sum, m) => sum + this.tokenCounter(m.content), 0);
  }
}
```

---

## Cost-Aware Routing

```typescript
interface ProviderPricing {
  provider: string;
  inputCostPer1k: number;
  outputCostPer1k: number;
  capabilities: string[];
  maxContext: number;
}

class CostAwareRouter {
  private providers: ProviderPricing[];
  private adapters: Map<string, LLMAdapter>;

  constructor(providers: ProviderPricing[], adapters: LLMAdapter[]) {
    this.providers = providers.sort(
      (a, b) => a.inputCostPer1k - b.inputCostPer1k,
    );
    this.adapters = new Map(adapters.map((a) => [a.name, a]));
  }

  selectProvider(requirements: {
    estimatedInputTokens: number;
    estimatedOutputTokens: number;
    requiredCapabilities?: string[];
    maxBudget?: number;
  }): LLMAdapter | null {
    const {
      estimatedInputTokens,
      estimatedOutputTokens,
      requiredCapabilities,
      maxBudget,
    } = requirements;

    for (const provider of this.providers) {
      // Check capabilities
      if (
        requiredCapabilities?.some((c) => !provider.capabilities.includes(c))
      ) {
        continue;
      }

      // Check context window
      if (estimatedInputTokens > provider.maxContext) {
        continue;
      }

      // Check budget
      const estimatedCost =
        (estimatedInputTokens / 1000) * provider.inputCostPer1k +
        (estimatedOutputTokens / 1000) * provider.outputCostPer1k;

      if (maxBudget && estimatedCost > maxBudget) {
        continue;
      }

      const adapter = this.adapters.get(provider.provider);
      if (adapter) return adapter;
    }

    return null;
  }
}

// Example configuration
const providers: ProviderPricing[] = [
  {
    provider: "glm",
    inputCostPer1k: 0.001,
    outputCostPer1k: 0.002,
    capabilities: ["text"],
    maxContext: 128000,
  },
  {
    provider: "gemini",
    inputCostPer1k: 0.00025,
    outputCostPer1k: 0.0005,
    capabilities: ["text", "vision"],
    maxContext: 1000000,
  },
  {
    provider: "claude",
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    capabilities: ["text", "vision", "code"],
    maxContext: 200000,
  },
];
```

---

## Health Monitoring

```typescript
interface HealthStatus {
  provider: string;
  healthy: boolean;
  latencyMs: number | null;
  lastCheck: Date;
  consecutiveFailures: number;
}

class HealthMonitor {
  private statuses: Map<string, HealthStatus> = new Map();
  private adapters: LLMAdapter[];
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(adapters: LLMAdapter[]) {
    this.adapters = adapters;
  }

  start(intervalMs: number = 30000): void {
    this.checkInterval = setInterval(() => this.checkAll(), intervalMs);
    this.checkAll(); // Initial check
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  async checkAll(): Promise<void> {
    await Promise.all(this.adapters.map((a) => this.checkProvider(a)));
  }

  private async checkProvider(adapter: LLMAdapter): Promise<void> {
    const start = Date.now();
    const current = this.statuses.get(adapter.name);

    try {
      const available = await adapter.isAvailable();
      this.statuses.set(adapter.name, {
        provider: adapter.name,
        healthy: available,
        latencyMs: Date.now() - start,
        lastCheck: new Date(),
        consecutiveFailures: available
          ? 0
          : (current?.consecutiveFailures || 0) + 1,
      });
    } catch {
      this.statuses.set(adapter.name, {
        provider: adapter.name,
        healthy: false,
        latencyMs: null,
        lastCheck: new Date(),
        consecutiveFailures: (current?.consecutiveFailures || 0) + 1,
      });
    }
  }

  getHealthyProviders(): string[] {
    return Array.from(this.statuses.values())
      .filter((s) => s.healthy)
      .map((s) => s.provider);
  }
}
```

---

## Checklist

Before deploying LLM orchestration:

- [ ] Unified adapter interface for all providers?
- [ ] Fallback chain configured with priorities?
- [ ] Rate limit detection from headers?
- [ ] Circuit breakers to prevent cascade failures?
- [ ] Token counting for context management?
- [ ] Cost tracking and budget limits?
- [ ] Health monitoring with periodic checks?
- [ ] Logging for provider switches?
- [ ] Graceful degradation when all fail?
- [ ] Metrics collection for optimization?

---

## Related Skills

- `prompt-engineering` - Optimize prompts for each provider
- `llm-response-parsing` - Parse responses from different providers
- `error-handling` - Handle provider-specific errors
- `observability` - Monitor orchestration performance

---

## Commands

```bash
# Test provider availability
curl -I https://api.anthropic.com/v1/messages
curl -I https://generativelanguage.googleapis.com/

# Monitor rate limits
watch -n 5 'curl -s -I "$API_URL" | grep -i ratelimit'

# Check circuit breaker states
curl localhost:3000/health/providers
```
