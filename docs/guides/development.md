# Development Guide

Guide for contributing to Orchestra CLI development.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Adding Features](#adding-features)
- [Submitting Changes](#submitting-changes)

---

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- TypeScript knowledge
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/gama/ai-core.git
cd orchestra

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev
```

### Project Structure

```
orchestra/
├── src/
│   ├── adapters/           # AI provider adapters
│   ├── cli/                # CLI commands
│   ├── orchestrator/       # Core orchestration engine
│   ├── prompts/            # Agent prompts
│   ├── tui/                 # Terminal UI (React + Ink)
│   ├── utils/               # Utility functions
│   └── types.ts             # TypeScript types
├── tests/                   # Test files
├── docs/                    # Documentation
└── .orchestra/             # Runtime state directory

```

---

## Coding Standards

### TypeScript

- Use strict mode (already enabled)
- Provide explicit types (no `any` unless necessary)
- Use `interface` for object shapes, `type` for unions/primitives
- Prefer `const` over `let`
- Use arrow functions for callbacks

```typescript
// Good
interface UserConfig {
  name: string;
  email: string;
}

const getUser = (id: string): User => ({
  id,
  name: "",
  email: "",
});

// Bad
const getUser = (id: any) => any;
```

### File Naming

- TypeScript: `.ts` extension
- React components: `.tsx` extension
- Tests: `.test.ts` extension
- Use kebab-case for file names: `my-component.ts`

### Code Style

- Indentation: 2 spaces
- Max line length: 100 characters (soft), 120 (hard)
- Semicolons: required
- Double quotes for strings

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Writing Tests

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { myFunction } from "./myModule.js";

describe("myFunction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return expected result", () => {
    const result = myFunction("input");
    expect(result).toBe("expected");
  });

  it("should handle errors gracefully", () => {
    expect(() => myFunction(null)).not.toThrow();
  });
});
```

### Test Coverage

- Aim for >80% coverage
- Test error cases, not just happy paths
- Mock external dependencies (API calls, file system)

---

## Adding Features

### 1. Adding a New CLI Command

Create command in `src/cli/index.ts`:

```typescript
program
  .command("mycommand <input>")
  .description("Description of command")
  .option("--opt, -o", "Option description")
  .action(async (input, options) => {
    // Implementation
    console.log(`Processing: ${input}`);
  });
```

### 2. Adding a New Utility

Create utility in `src/utils/`:

```typescript
/**
 * Utility function description
 */
export async function myUtility(input: string): Promise<string> {
  // Implementation
  return `Processed: ${input}`;
}
```

Export from `src/utils/index.ts`:

```typescript
export { myUtility } from "./myUtility.js";
```

### 3. Adding a New Adapter

Implement `Adapter` interface (see [Adapters API](../docs/api/adapters.md)):

```typescript
import type { Adapter, ExecuteOptions, AgentResult } from "../types.js";

export class MyAdapter implements Adapter {
  // Implement interface methods
}
```

### 4. Adding a New Plugin

Create plugin in `.orchestra/plugins/my-plugin/`:

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "main": "index.js",
  "orchestraVersion": ">=0.1.0",
  "hooks": {
    "before-plan": "enhancePlan"
  }
}
```

Implement hook functions in `index.js`:

```javascript
export async function enhancePlan(context) {
  // Enhance planning phase
  return { success: true };
}
```

---

## Git Workflow

### Branch Strategy

- `main` - Stable releases
- `dev` - Development branch
- Feature branches: `feature/feature-name`

### Commit Conventions

Use conventional commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
test: add tests
refactor: refactor code
perf: performance improvement
chore: maintenance
```

### Commit Process

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add my feature"

# 3. Push to remote
git push origin feature/my-feature

# 4. Create pull request
gh pr create --title "feat: add my feature"
```

---

## Debugging

### Running CLI in Development Mode

```bash
# Compile and run
npm run dev start "my task"

# Or use tsx directly
tsx src/cli/index.ts start "my task"
```

### Debugging TUI

```bash
npm run tui
```

### Viewing Logs

Orchestra uses structured logging. Logs are written to:

- Console (with colors/formatting)
- `.orchestra/logs/` directory (if enabled)

---

## Performance Considerations

### Async Operations

- Use `Promise.all()` for independent async operations
- Use `runWithConcurrency()` for parallel file processing
- Avoid blocking operations in hot paths

### Memory Management

- Stream large files instead of loading entirely
- Clear caches when not needed
- Use file streams for large file operations

---

## Common Patterns

### Error Handling

```typescript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error("Operation failed", { error });
  return { success: false, error: error.message };
}
```

### Configuration Loading

```typescript
import { configLoader } from "./utils/configLoader.js";

const config = configLoader.load();
const customConfig = config.customPrompts?.myPrompt;
```

### Session Persistence

```typescript
import { StateManager } from "./utils/StateManager.js";

const stateManager = new StateManager();
await stateManager.saveSession(sessionData);
```

---

## Code Review Checklist

Before submitting PR, verify:

- [ ] Tests pass locally (`npm test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No linting errors (`npm run lint`)
- [ ] Added tests for new functionality
- [ ] Updated documentation if needed
- [ ] Checked for breaking changes
- [ ] Performance impact is minimal

---

## Questions?

- Join discussions in [GitHub Issues](https://github.com/gama/ai-core/issues)
- Read [Architecture docs](../docs/architecture.md)
- Review existing code for patterns
- Check existing tests for examples

---

## See Also

- [Orchestrator API](./orchestrator.md)
- [Adapter Interface](./adapters.md)
- [Testing Guide](./testing.md)
