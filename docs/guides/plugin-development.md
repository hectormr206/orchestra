# Plugin Development Guide

Guide for creating custom plugins to extend Orchestra functionality.

## Table of Contents

- [Overview](#overview)
- [Plugin Architecture](#plugin-architecture)
- [Creating a Plugin](#creating-a-plugin)
- [Hooks Reference](#hooks-reference)
- [Plugin Configuration](#plugin-configuration)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Testing Plugins](#testing-plugins)
- [Publishing Plugins](#publishing-plugins)

---

## Overview

Orchestra's plugin system allows you to extend functionality without modifying the core codebase. Plugins can:
- Enhance planning with framework-specific context
- Add custom validation rules
- Modify generated code
- Integrate with external services
- Add new CLI commands

**Key Benefits:**
- Non-invasive customization
- Shareable extensions
- Versioned dependencies
- Automatic discovery and loading

---

## Plugin Architecture

### Plugin Structure

```
.my-plugin/
├── package.json              # Plugin manifest
├── index.ts                  # Main plugin file
├── hooks/
│   ├── before-plan.ts       # Plan enhancement
│   ├── after-plan.ts        # Plan modification
│   ├── before-execute.ts    # Pre-execution validation
│   ├── after-execute.ts     # Code modification
│   ├── before-audit.ts      # Custom audit rules
│   ├── after-audit.ts       # Audit result handling
│   └── on-error.ts          # Error handling
└── README.md                 # Plugin documentation
```

### Plugin Discovery

Plugins are discovered in:
1. `.orchestra/plugins/` - Project-specific plugins
2. `~/.orchestra/plugins/` - User-level plugins
3. `node_modules/orchestra-plugin-*/` - Installed npm packages

---

## Creating a Plugin

### Step 1: Initialize Plugin

```bash
# Using CLI
orchestra plugin create my-plugin

# Or manually
mkdir .orchestra/plugins/my-plugin
cd .orchestra/plugins/my-plugin
npm init -y
```

### Step 2: Create package.json

```json
{
  "name": "orchestra-plugin-my-plugin",
  "version": "1.0.0",
  "description": "My custom Orchestra plugin",
  "main": "index.ts",
  "keywords": ["orchestra-plugin"],
  "orchestra": {
    "version": ">=0.4.0",
    "hooks": {
      "before-plan": "./hooks/before-plan.js",
      "before-execute": "./hooks/before-execute.js"
    }
  },
  "dependencies": {
    "@types/node": "^20.0.0"
  }
}
```

### Step 3: Implement Hooks

Create hooks in the `hooks/` directory:

```typescript
// hooks/before-plan.ts
import type { PlanContext, PlanHookResult } from '../../src/plugins/types.js';

export async function beforePlan(context: PlanContext): Promise<PlanHookResult> {
  const { task, workspace, config } = context;

  // Enhance context with custom information
  const enhancements = {
    framework: detectFramework(workspace),
    customRules: loadCustomRules(config),
  };

  return {
    success: true,
    context: {
      ...context,
      enhancements,
    },
  };
}
```

---

## Hooks Reference

### before-plan

Called before the Architect agent creates the plan.

**Use Cases:**
- Add framework-specific context
- Enforce architectural patterns
- Load project conventions

**Parameters:**
```typescript
interface PlanContext {
  task: string;                // User task description
  workspace: string;           // Workspace directory
  config: OrchestraConfig;     // Orchestra configuration
  sessionId: string;           // Session ID
}

interface PlanHookResult {
  success: boolean;
  context?: Partial<PlanContext>;
  error?: string;
  skip?: boolean;              // Skip planning phase
}
```

**Example:**
```typescript
export async function beforePlan(context: PlanContext): Promise<PlanHookResult> {
  // Add Express.js specific context
  if (detectExpress(context.workspace)) {
    return {
      success: true,
      context: {
        ...context,
        framework: 'express',
        patterns: [
          'Use middleware for cross-cutting concerns',
          'Separate routes from controllers',
          'Follow MVC pattern',
        ],
      },
    };
  }

  return { success: true };
}
```

### after-plan

Called after the plan is generated but before user approval.

**Use Cases:**
- Validate plan completeness
- Add additional steps
- Format plan for review

**Parameters:**
```typescript
interface AfterPlanContext extends PlanContext {
  plan: string;                // Generated plan
}

interface AfterPlanResult {
  success: boolean;
  plan?: string;               // Modified plan
  error?: string;
}
```

### before-execute

Called before code generation for each file.

**Use Cases:**
- Validate file doesn't violate rules
- Add file-specific context
- Skip certain files

**Parameters:**
```typescript
interface ExecuteContext {
  file: string;                // File path
  plan: string;                // Full execution plan
  workspace: string;
  config: OrchestraConfig;
}

interface ExecuteHookResult {
  success: boolean;
  skip?: boolean;              // Skip this file
  error?: string;
  context?: Record<string, unknown>;
}
```

**Example:**
```typescript
export async function beforeExecute(context: ExecuteContext): Promise<ExecuteHookResult> {
  // Prevent modification of sensitive files
  const sensitiveFiles = ['.env', 'config/secrets.ts', 'credentials.json'];

  if (sensitiveFiles.some(f => context.file.includes(f))) {
    return {
      success: false,
      skip: true,
      error: `Cannot modify sensitive file: ${context.file}`,
    };
  }

  return { success: true };
}
```

### after-execute

Called after code is generated for a file.

**Use Cases:**
- Format generated code
- Add custom imports
- Enforce coding standards
- Insert security headers

**Parameters:**
```typescript
interface AfterExecuteContext extends ExecuteContext {
  code: string;                // Generated code
}

interface AfterExecuteResult {
  success: boolean;
  code?: string;               // Modified code
  error?: string;
}
```

**Example:**
```typescript
export async function afterExecute(context: AfterExecuteContext): Promise<AfterExecuteResult> {
  let code = context.code;

  // Add copyright header
  const header = `/**
 * Copyright (c) ${new Date().getFullYear()} My Company
 * All rights reserved
 */

`;

  // Enforce import order
  code = organizeImports(code);

  // Add TypeScript strict mode
  if (context.file.endsWith('.ts')) {
    code = code.replace(
      `'use strict';`,
      `'use strict';\n\n// @ts-check\n`
    );
  }

  return { success: true, code };
}
```

### before-audit

Called before auditing generated code.

**Use Cases:**
- Add custom audit rules
- Filter audit criteria
- Skip audit for certain files

**Parameters:**
```typescript
interface AuditContext {
  file: string;
  code: string;
  workspace: string;
  config: OrchestraConfig;
}

interface AuditHookResult {
  success: boolean;
  skip?: boolean;
  customRules?: AuditRule[];
  error?: string;
}

interface AuditRule {
  name: string;
  description: string;
  check: (code: string) => { passed: boolean; message?: string };
}
```

**Example:**
```typescript
export async function beforeAudit(context: AuditContext): Promise<AuditHookResult> {
  const customRules: AuditRule[] = [
    {
      name: 'no-console-log',
      description: 'No console.log statements in production code',
      check: (code: string) => {
        const hasConsoleLog = /console\.log\(/.test(code);
        return {
          passed: !hasConsoleLog,
          message: hasConsoleLog ? 'Remove console.log statements' : undefined,
        };
      },
    },
    {
      name: 'require-jsdoc',
      description: 'All functions must have JSDoc comments',
      check: (code: string) => {
        const functions = code.match(/function\s+\w+/g) || [];
        const jsdocComments = code.match(/\/\*\*[\s\S]*?\*\//g) || [];
        return {
          passed: jsdocComments.length >= functions.length,
          message: 'Add JSDoc comments to all functions',
        };
      },
    },
  ];

  return { success: true, customRules };
}
```

### after-audit

Called after audit completes.

**Use Cases:**
- Process audit results
- Add additional checks
- Modify audit outcome

**Parameters:**
```typescript
interface AfterAuditContext extends AuditContext {
  auditResult: {
    approved: boolean;
    issues: string[];
    suggestions: string[];
  };
}

interface AfterAuditResult {
  success: boolean;
  auditResult?: {
    approved?: boolean;
    issues?: string[];
    suggestions?: string[];
  };
  error?: string;
}
```

### on-error

Called when any error occurs during orchestration.

**Use Cases:**
- Custom error logging
- Error recovery
- Notifications (Slack, email)

**Parameters:**
```typescript
interface ErrorContext {
  phase: 'planning' | 'executing' | 'auditing' | 'recovery';
  error: Error;
  file?: string;
  workspace: string;
  sessionId: string;
}

interface ErrorHookResult {
  success: boolean;
  handled?: boolean;           // Error was handled
  recovery?: string;           // Recovery action
  error?: string;
}
```

**Example:**
```typescript
export async function onError(context: ErrorContext): Promise<ErrorHookResult> {
  // Log to external service
  await logToSentry(context.error);

  // Send Slack notification
  if (context.phase === 'auditing') {
    await sendSlackNotification({
      channel: '#orchestra-errors',
      message: `Audit failed for ${context.file}: ${context.error.message}`,
    });
  }

  return { success: true, handled: true };
}
```

---

## Plugin Configuration

### Orchestra Configuration

Configure plugins in `.orchestrarc.json`:

```json
{
  "plugins": {
    "enabled": ["express-plugin", "fastapi-plugin"],
    "disabled": [],
    "settings": {
      "express-plugin": {
        "strict": true,
        "requireTypescript": true
      }
    }
  }
}
```

### Plugin Metadata

Plugins can define metadata in `package.json`:

```json
{
  "orchestra": {
    "version": ">=0.4.0",
    "hooks": {
      "before-plan": "./hooks/before-plan.js",
      "before-audit": "./hooks/before-audit.js"
    },
    "settings": {
      "priority": 100,
      "category": "framework"
    }
  }
}
```

---

## Examples

### Express.js Plugin

```typescript
// index.ts
export const metadata = {
  name: 'express-plugin',
  version: '1.0.0',
  description: 'Express.js framework support',
};

// hooks/before-plan.ts
export async function beforePlan(context: PlanContext) {
  if (!detectExpress(context.workspace)) {
    return { success: true };
  }

  return {
    success: true,
    context: {
      ...context,
      framework: 'express',
      patterns: [
        'Use middleware for auth, logging, error handling',
        'Define routes in separate files',
        'Use dependency injection',
        'Implement proper error middleware',
      ],
      auditRules: [
        'Check for async/await in route handlers',
        'Validate input with express-validator',
        'Use helmet for security headers',
      ],
    },
  };
}
```

### FastAPI Plugin

```typescript
// hooks/before-audit.ts
export async function beforeAudit(context: AuditContext) {
  const customRules: AuditRule[] = [
    {
      name: 'fastapi-dependency-injection',
      description: 'Use Depends() for dependencies',
      check: (code: string) => {
        const hasDepends = /Depends\(/.test(code);
        return {
          passed: hasDepends,
          message: 'Use Depends() for dependency injection',
        };
      },
    },
    {
      name: 'pydantic-models',
      description: 'Use Pydantic models for request/response',
      check: (code: string) => {
        const hasPydantic = /BaseModel|@validator/.test(code);
        return {
          passed: hasPydantic,
          message: 'Define Pydantic models for validation',
        };
      },
    },
  ];

  return { success: true, customRules };
}
```

### Security Plugin

```typescript
// hooks/after-execute.ts
export async function afterExecute(context: AfterExecuteContext) {
  let code = context.code;

  // Add security headers for Express
  if (context.file.includes('express') && code.includes('app.use(')) {
    code += `\n\n// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS }));
`;
  }

  // Add input validation
  if (context.file.includes('route')) {
    code = code.replace(
      /(async \w+\([^)]*\))/,
      '$1, { body, params, query }'
    );
  }

  return { success: true, code };
}
```

---

## Best Practices

### 1. Keep Hooks Focused

Each hook should do one thing well:

```typescript
// Good
export async function beforePlan(context: PlanContext) {
  return {
    success: true,
    context: {
      ...context,
      framework: detectFramework(context.workspace),
    },
  };
}

// Bad - too many responsibilities
export async function beforePlan(context: PlanContext) {
  const framework = detectFramework(context.workspace);
  const deps = installDependencies(framework);
  const tests = generateTests(framework);
  const docs = writeDocs(framework);
  // ... too much happening
}
```

### 2. Return Early on Errors

```typescript
export async function beforeExecute(context: ExecuteContext) {
  // Validate inputs
  if (!context.file) {
    return {
      success: false,
      error: 'File path is required',
    };
  }

  // Check file exists
  if (!fs.existsSync(context.file)) {
    return {
      success: false,
      error: `File not found: ${context.file}`,
    };
  }

  // Main logic
  return { success: true };
}
```

### 3. Use Type Safety

```typescript
import type { PlanContext, PlanHookResult } from '../../src/plugins/types.js';

export async function beforePlan(context: PlanContext): Promise<PlanHookResult> {
  // TypeScript provides autocomplete and type checking
  return {
    success: true,
    context: {
      ...context,
      customData: { /* typed object */ },
    },
  };
}
```

### 4. Handle Errors Gracefully

```typescript
export async function afterExecute(context: AfterExecuteContext) {
  try {
    const modified = modifyCode(context.code);
    return { success: true, code: modified };
  } catch (error) {
    // Return original code on error
    return {
      success: true,
      code: context.code,
      error: `Plugin warning: ${error.message}`,
    };
  }
}
```

### 5. Document Your Hooks

```typescript
/**
 * Adds Express.js-specific middleware patterns to the plan
 *
 * @param context - Plan generation context
 * @returns Enhanced context with Express patterns
 *
 * @example
 * const result = await beforePlan({
 *   task: 'Add user auth',
 *   workspace: '/my-project',
 *   config: { ... },
 *   sessionId: 'abc123'
 * });
 */
export async function beforePlan(context: PlanContext): Promise<PlanHookResult> {
  // ...
}
```

---

## Testing Plugins

### Unit Tests

```typescript
// hooks/before-plan.test.ts
import { describe, it, expect, vi } from 'vitest';
import { beforePlan } from './before-plan.js';

describe('beforePlan hook', () => {
  it('should detect Express framework', async () => {
    const context = {
      task: 'Add user route',
      workspace: '/test/project',
      config: {},
      sessionId: 'test-123',
    };

    // Mock fs.existsSync to return true for express files
    vi.mock('fs', () => ({
      existsSync: vi.fn((path: string) => path.includes('express')),
    }));

    const result = await beforePlan(context);

    expect(result.success).toBe(true);
    expect(result.context?.framework).toBe('express');
  });

  it('should return original context when Express not found', async () => {
    const context = {
      task: 'Add user route',
      workspace: '/test/project',
      config: {},
      sessionId: 'test-123',
    };

    const result = await beforePlan(context);

    expect(result.success).toBe(true);
    expect(result.context?.framework).toBeUndefined();
  });
});
```

### Integration Tests

```typescript
// tests/integration/plugin.test.ts
import { describe, it, expect } from 'vitest';
import { PluginManager } from '../../src/plugins/PluginManager.js';

describe('Plugin Integration', () => {
  it('should load and execute plugin hooks', async () => {
    const manager = new PluginManager();

    await manager.loadPlugin('.orchestra/plugins/express-plugin');

    const result = await manager.executeHook('before-plan', {
      task: 'Add auth',
      workspace: '/test',
      config: {},
      sessionId: 'test',
    });

    expect(result.success).toBe(true);
    expect(result.context?.framework).toBe('express');
  });
});
```

---

## Publishing Plugins

### NPM Package

1. **Package your plugin:**

```bash
cd .orchestra/plugins/my-plugin
npm pack
```

2. **Publish to npm:**

```bash
npm publish --access public
```

3. **Install in other projects:**

```bash
npm install orchestra-plugin-my-plugin
orchestra plugin install my-plugin
```

### Private Plugin Registry

For private plugins:

```bash
# Create private registry
npm config set registry https://npm.yourcompany.com

# Publish privately
npm publish

# Install in project
npm install --registry=https://npm.yourcompany.com orchestra-plugin-my-plugin
```

---

## See Also

- [Orchestrator API](../api/orchestrator.md)
- [Adapter Interface](../api/adapters.md)
- [Development Guide](./development.md)
- [Testing Guide](./testing.md)
