# Orchestra CLI - User Guide

Complete guide for using Orchestra, the AI-powered meta-orchestrator for development tasks.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [CLI Reference](#cli-reference)
5. [Configuration](#configuration)
6. [Integration Guide](#integration-guide)
7. [Plugin Development](#plugin-development)
8. [TUI Guide](#tui-guide)
9. [Advanced Topics](#advanced-topics)
10. [Troubleshooting](#troubleshooting)

---

## Installation

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Git (optional, for auto-commit)
- API key for AI providers (ZAI_API_KEY or equivalents)

### Install from npm

```bash
npm install -g @ai-core/orchestra
```

### Install from source

```bash
git clone https://github.com/your-repo/orchestra.git
cd orchestra
npm install
npm run build
npm link
```

### Verify Installation

```bash
orchestra --version
orchestra doctor
```

---

## Quick Start

### Basic Usage

```bash
# Start a new task
orchestra start "Create a REST API for user management with TypeScript"

# Run with auto-approval
orchestra start "Add unit tests for auth module" --auto-approve

# Run in parallel mode
orchestra start "Refactor database layer" --parallel --max-concurrency 5

# Use TUI mode
orchestra tui
```

### Common Workflows

#### 1. Generate Code from Description

```bash
orchestra start "Create a React component for user profile with TypeScript"
```

#### 2. Debug and Fix Issues

```bash
orchestra start "Fix the authentication bug in login form"
```

#### 3. Add Tests

```bash
orchestra start "Add comprehensive unit tests for payment module"
```

#### 4. Refactor Code

```bash
orchestra start "Refactor the API layer to use async/await"
```

---

## Core Concepts

### Multi-Agent Architecture

Orchestra uses a multi-agent system with specialized roles:

1. **Architect Agent** - Creates implementation plan
2. **Executor Agent** - Generates code
3. **Auditor Agent** - Reviews code quality
4. **Consultant Agent** - Helps with complex problems

### Agent Workflow

```
┌─────────────┐
│   User      │
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Architect  │ ← Creates plan
│  (Codex)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Executor   │ ← Generates code
│  (GLM 4.7)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Auditor   │ ← Reviews code
│  (Gemini)   │
└──────┬──────┘
       │
  ┌───┴───┐
  ▼       ▼
Pass    Fail
  │       │
  ▼       ▼
Done   Consultant
         (Optional fixes)
```

### Execution Modes

#### Sequential Mode (default)
Agents run one after another. Best for:
- Simple tasks
- Debugging
- Learning

#### Parallel Mode
Multiple files processed concurrently. Best for:
- Large codebases
- Independent modules
- Time-critical tasks

#### Pipeline Mode
Execution and auditing happen simultaneously. Best for:
- Fast iteration
- CI/CD environments
- Experienced users

#### Watch Mode
Auto-reload on file changes. Best for:
- Interactive development
- Rapid prototyping

---

## CLI Reference

### Main Commands

#### `orchestra start <task>`
Begin a new orchestration task.

```bash
orchestra start "Create user authentication system"
```

**Options:**
- `--auto-approve` - Skip plan approval
- `--parallel` - Enable parallel processing
- `--max-concurrency <n>` - Set max concurrent operations (default: 3)
- `--no-tests` - Skip running tests
- `--no-commit` - Skip git commit
- `--dry-run` - Analyze without executing
- `--profile <name>` - Use configuration profile

#### `orchestra resume`
Resume an interrupted session.

```bash
orchestra resume --parallel
```

**Options:**
- `--force` - Resume even if warnings exist
- `--clean` - Start fresh instead of resuming

#### `orchestra pipeline <task>`
Execute in pipeline mode (execution + audit simultaneously).

```bash
orchestra pipeline "Add error handling to API layer"
```

#### `orchestra watch <task>`
Run in watch mode with auto-reload.

```bash
orchestra watch "Implement caching layer" --debounce 1000
```

**Options:**
- `--debounce <ms>` - Debounce time for reload (default: 5000)

#### `orchestra tui`
Launch Terminal User Interface.

```bash
orchestra tui --auto-approve
```

### Management Commands

#### `orchestra status`
Show current session status.

```bash
orchestra status
```

#### `orchestra plan`
View current execution plan.

```bash
orchestra plan
```

#### `orchestra history`
Show session history.

```bash
orchestra history --limit 10 --status completed
```

**Options:**
- `--limit <n>` - Number of sessions to show
- `--status <status>` - Filter by status
- `--search <query>` - Search in task descriptions

#### `orchestra clean`
Clear session data.

```bash
orchestra clean --force
```

#### `orchestra doctor`
Verify setup and dependencies.

```bash
orchestra doctor
```

#### `orchestra validate`
Validate syntax of generated code.

```bash
orchestra validate --language typescript
```

### Integration Commands

#### `orchestra audit`
Run security audit on the project.

```bash
orchestra audit --fail high
```

**Options:**
- `-d, --dependencies` - Check for vulnerable dependencies
- `-s, --secrets` - Scan for leaked secrets
- `-c, --code` - Check code security
- `-o, --owasp` - Check OWASP Top 10 compliance
- `-f, --fail <level>` - Fail level (critical|high|medium|low)
- `-o, --output <format>` - Output format (text|markdown|json)

#### `orchestra export [session-id]`
Export session data to various formats.

```bash
orchestra export --format html --output report.html
```

**Options:**
- `-f, --format <format>` - Export format (html|markdown|json)
- `-o, --output <path>` - Output file path
- `--include-logs` - Include execution logs
- `--include-metadata` - Include session metadata

#### `orchestra ci <action>`
CI/CD workflow management.

```bash
orchestra ci setup --platform github
orchestra ci validate --workflow .github/workflows/orchestra.yml
orchestra ci add --workflow .github/workflows/ci.yml
orchestra ci list
```

#### `orchestra jira <action>`
Jira integration.

```bash
orchestra jira create --summary "Fix bug" --description "Critical issue"
orchestra jira update --issue PROJ-123 --summary "Updated summary"
orchestra jira transition --issue PROJ-123 --transition "Done"
```

#### `orchestra notify`
Send test notification (requires SLACK_WEBHOOK_URL or DISCORD_WEBHOOK_URL).

```bash
orchestra notify --message "Test from Orchestra"
```

#### `orchestra detect`
Detect project framework and technology stack.

```bash
orchestra detect --json
```

#### `orchestra prompt-optimize [prompt]`
Analyze and optimize prompts.

```bash
echo "Create REST API" | orchestra prompt-optimize
```

### Plugin Commands

#### `orchestra plugin <action>`
Plugin management.

```bash
orchestra plugin list
orchestra plugin load --path ./my-plugin
orchestra plugin unload --name my-plugin
orchestra plugin enable --name my-plugin
orchestra plugin disable --name my-plugin
orchestra plugin create --name my-awesome-plugin
orchestra plugin info --name my-plugin
```

#### `orchestra hooks`
List available plugin hooks.

```bash
orchestra hooks
```

### Utility Commands

#### `orchestra profiler`
Performance profiling and optimization.

```bash
orchestra profiler --memory
orchestra profiler --baseline
orchestra profiler --compare
orchestra profiler --start "operation-name"
orchestra profiler --end "operation-name"
```

#### `orchestra profile`
Configuration profile management.

```bash
orchestra profile list
orchestra profile show production
orchestra profile apply production
orchestra profile create my-profile --inherit production
orchestra profile delete old-profile
```

#### `orchestra recover [session-id]`
Session recovery.

```bash
orchestra recover --list
orchestra recover
orchestra recover --clear
```

---

## Configuration

### Configuration File

Create `.orchestrarc.json` in your project root:

```json
{
  "execution": {
    "parallel": true,
    "maxConcurrency": 3,
    "maxIterations": 10,
    "timeout": 300000
  },
  "test": {
    "command": "npm test",
    "runAfterGeneration": true,
    "timeout": 120000
  },
  "git": {
    "autoCommit": true,
    "commitMessageTemplate": "feat: {task}"
  },
  "languages": ["typescript", "javascript"],
  "tui": {
    "autoApprove": false,
    "notifications": true,
    "cacheEnabled": true,
    "maxRecoveryAttempts": 3,
    "recoveryTimeoutMinutes": 10,
    "autoRevertOnFailure": true
  },
  "agents": {
    "architect": ["Claude (Opus 4.5)", "Gemini", "Claude (GLM 4.7)"],
    "executor": ["Claude (GLM 4.7)", "Gemini", "Claude (Opus 4.5)"],
    "auditor": ["Gemini", "Claude (GLM 4.7)", "Claude (Opus 4.5)"],
    "consultant": ["Claude (Opus 4.5)", "Gemini", "Claude (GLM 4.7)"]
  }
}
```

### Environment Variables

```bash
# API Keys
ZAI_API_KEY=your_api_key_here
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Jira Integration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your_api_token
JIRA_PROJECT_KEY=PROJ

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Redis Cache
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_password
REDIS_DEFAULT_TTL=3600

# Development
NODE_ENV=development
ORCHESTRA_LOG_LEVEL=debug
ORCHESTRA_PROFILE=development
```

### Configuration Profiles

Predefined profiles:

- **development** - Default for local development
- **production** - Strict settings for production
- **ci** - Auto-approval for CI/CD
- **fast** - Minimal validation for speed
- **thorough** - Maximum validation
- **minimal** - Resource-efficient

```bash
# Use profile
orchestra start "Task" --profile production

# Or set via environment
ORCHESTRA_PROFILE=production orchestra start "Task"
```

---

## Integration Guide

### CI/CD Integration

#### GitHub Actions

```bash
orchestra ci setup --platform github
```

This creates `.github/workflows/orchestra.yml`:

```yaml
name: Orchestra
on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  orchestra:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run Orchestra
        run: npx orchestra start "Review and validate code changes"
      - name: Run tests
        run: npm test
      - name: Run linting
        run: npm run lint
```

### Jira Integration

Set up environment variables:

```bash
export JIRA_BASE_URL="https://your-domain.atlassian.net"
export JIRA_EMAIL="your-email@company.com"
export JIRA_API_TOKEN="your-api-token"
export JIRA_PROJECT_KEY="PROJ"
```

Create Jira issues from Orchestra:

```bash
# Creates issue on failure
orchestra start "Fix critical bug"

# Always create issue
orchestra start "New feature" --create-jira always
```

### Notifications

Configure Slack:

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Test notification
orchestra notify --message "Orchestra is working!"
```

Configure Discord:

```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR/WEBHOOK/URL"

# Test notification
orchestra notify --discord --message "Hello Discord!"
```

---

## Plugin Development

### Plugin Structure

```
my-plugin/
├── orchestra.json      # Plugin manifest
├── index.js            # Plugin code
└── package.json        # NPM package
```

### Plugin Manifest

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My awesome Orchestra plugin",
  "author": "Your Name",
  "license": "MIT",
  "main": "index.js",
  "orchestraVersion": ">=0.1.0",
  "hooks": {
    "before-execute": "beforeExecute",
    "after-execute": "afterExecute"
  }
}
```

### Plugin Code

```javascript
// index.js

export async function beforeExecute(context) {
  console.log('Task:', context.task);
  console.log('Phase:', context.phase);

  // Return result
  return {
    success: true,
    data: { /* optional data */ }
  };
}

export async function afterExecute(context) {
  console.log('Execution complete');

  return {
    success: true
  };
}

// Optional lifecycle hooks
export async function init() {
  console.log('Plugin initialized');
}

export async function destroy() {
  console.log('Plugin destroyed');
}
```

### Available Hooks

- `before-init` - Before Orchestra initializes
- `after-init` - After Orchestra initializes
- `before-plan` - Before creating plan
- `after-plan` - After plan is created
- `before-execute` - Before executing code
- `after-execute` - After executing code
- `before-audit` - Before auditing code
- `after-audit` - After auditing code
- `before-recovery` - Before recovery mode
- `after-recovery` - After recovery mode
- `before-test` - Before running tests
- `after-test` - After running tests
- `before-commit` - Before git commit
- `after-commit` - After git commit
- `on-complete` - When task completes successfully
- `on-error` - When an error occurs
- `on-file-change` - In watch mode when file changes

### Creating a Plugin

```bash
# Create plugin scaffold
orchestra plugin create --name my-awesome-plugin

# This creates:
# .orchestra/plugins/my-awesome-plugin/
#   ├── orchestra.json
#   ├── index.js
#   └── package.json

# Edit the plugin
cd .orchestra/plugins/my-awesome-plugin
# Edit orchestra.json and index.js

# Load the plugin
orchestra plugin load --path .orchestra/plugins/my-awesome-plugin

# Enable the plugin
orchestra plugin enable --name my-awesome-plugin

# Check plugin status
orchestra plugin list
```

---

## TUI Guide

### Starting the TUI

```bash
orchestra tui
```

### Keyboard Shortcuts

#### Global
- `q` - Quit
- `?` - Show help
- `Ctrl+C` - Cancel

#### Navigation
- `↑/k` - Up
- `↓/j` - Down
- `g` - Go to top
- `G` - Go to bottom
- `/` - Search

#### Lists
- `Enter` - Open item
- `Escape` - Go back

### Screens

#### Dashboard
- Overview of current session
- Quick actions
- Recent sessions

#### Execution
- Real-time progress
- Live logs
- File status

#### History
- Browse past sessions
- View session details
- Reuse session configurations

#### Settings
- Configure Orchestra
- Set preferences
- Manage profiles

#### Advanced Settings
- Fine-tune parameters
- Agent preferences
- Recovery options

---

## Advanced Topics

### Monorepo Support

Orchestra automatically detects and works with monorepos:

**Supported:**
- npm/yarn workspaces
- pnpm workspaces
- Turborepo
- Nx
- Lerna

```bash
# Detect monorepo
orchestra detect

# Orchestra will automatically:
# - Detect packages
# - Build affected packages only
# - Run tests for changed packages
# - Handle workspace dependencies
```

### Security Auditing

```bash
# Full security audit
orchestra audit

# Check specific areas
orchestra audit --dependencies --secrets --fail high

# Export audit report
orchestra audit --output report.json --format json
```

### Session Recovery

```bash
# List recovery points
orchestra recover --list

# Auto-recover crashed sessions
orchestra recover

# Recover specific session
orchestra recover orch-1234567890-abc123

# Clear all recovery points
orchestra recover --clear
```

### Performance Profiling

```bash
# Show current memory usage
orchestra profiler --memory

# Set baseline
orchestra profiler --baseline

# Compare with baseline
orchestra profiler --compare

# Profile an operation
orchestra profiler --start "agent-execution"
# ... do work ...
orchestra profiler --end "agent-execution"
```

### Framework Detection

```bash
orchestra detect
```

Output:
```
Project Detection Results
=========================

Language: typescript
Package Manager: npm
Test Framework: vitest
Build Tool: vite
TypeScript: Yes
Monorepo: No

Frameworks:
  - React (frontend)
  - Express (backend)

Recommendations:
  Agent Preference: Claude (Opus 4.5), Gemini, Claude (GLM 4.7)
  Max Concurrency: 3
  Use Cache: Yes
  Test Command: npm test
  Build Command: npm run build
  Lint Command: npm run lint
```

---

## Troubleshooting

### Common Issues

#### "No API key found"

```bash
# Set ZAI_API_KEY
export ZAI_API_KEY="your_api_key"

# Or add to .envrc or .env
echo 'export ZAI_API_KEY="your_api_key"' >> ~/.bashrc
source ~/.bashrc
```

#### "Module not found" errors

```bash
# Rebuild from source
cd orchestra
npm install
npm run build
npm link
```

#### "Recovery mode loop"

Recovery mode is stuck in a loop. Try:

```bash
# Clear session and recovery points
orchestra clean --force
orchestra recover --clear

# Then retry
orchestra start "Your task"
```

#### "Agent timeout"

Increase timeout in `.orchestrarc.json`:

```json
{
  "execution": {
    "timeout": 600000  // 10 minutes
  }
}
```

### Debug Mode

Enable debug logging:

```bash
export ORCHESTRA_LOG_LEVEL=debug
orchestra start "Task"
```

### Getting Help

```bash
# Command help
orchestra start --help

# General help
orchestra --help

# Check setup
orchestra doctor

# View logs
# Logs are in .orchestra/logs/
```

### Reporting Issues

Report issues at: https://github.com/your-repo/orchestra/issues

Include:
- Orchestra version (`orchestra --version`)
- Node version (`node --version`)
- OS and version
- Error messages
- Steps to reproduce

---

## Best Practices

### 1. Start Simple

Begin with clear, focused tasks:

```bash
# Good
orchestra start "Add login form with email and password fields"

# Too vague
orchestra start "Make it better"
```

### 2. Use Configuration Profiles

```bash
# Development
export ORCHESTRA_PROFILE=development

# Production
export ORCHESTRA_PROFILE=production

# CI/CD
export ORCHESTRA_PROFILE=ci
```

### 3. Enable Auto-Approval for CI/CD

```bash
orchestra start "Task" --auto-approve
```

### 4. Run Security Audits Regularly

```bash
orchestra audit
```

### 5. Use Session Recovery

```bash
# After crashes
orchestra recover

# Then resume
orchestra resume
```

### 6. Monitor Performance

```bash
orchestra profiler --baseline
# ... work ...
orchestra profiler --compare
```

### 7. Leverage Plugins

Create plugins for:
- Custom code generation patterns
- Team-specific conventions
- Integration with internal tools
- Custom notifications

---

## Next Steps

- Read [ROADMAP.md](./ROADMAP.md) for planned features
- Check [SCALING.md](./SCALING.md) for scaling guide
- Explore [examples/](./examples/) for sample workflows
- Contribute plugins to the community

---

**Version:** 0.2.0
**Last Updated:** 2025-01-31
**License:** MIT
