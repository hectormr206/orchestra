# Orchestra CLI Tutorial

Complete step-by-step guide to using Orchestra for AI-powered development automation.

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Basic Usage](#basic-usage)
- [Configuration](#configuration)
- [Advanced Features](#advanced-features)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)

---

## Introduction

**Orchestra** is a meta-orchestrator that coordinates multiple AI agents (Claude, Codex, Gemini, GLM) to automate complex development tasks. It uses a multi-agent workflow:

```
Architect → Plan → Executor → Code → Auditor → Review → [Consultant if needed] → Done
```

### What Orchestra Can Do

- ✅ Generate features from natural language descriptions
- ✅ Refactor existing code automatically
- ✅ Add tests to untested code
- ✅ Fix bugs with AI-guided debugging
- ✅ Apply code patterns across projects
- ✅ Generate documentation from code
- ✅ Migrate between frameworks
- ✅ And much more...

---

## Installation

### Prerequisites

- Node.js 18+ installed
- Git installed
- API key for at least one AI provider (Zhipu AI, Anthropic, Google, or OpenAI)

### Step 1: Install Orchestra

```bash
# Global installation (recommended)
npm install -g @gama/orchestra

# Or use directly with npx
npx @gama/orchestra start "your task"
```

### Step 2: Configure API Keys

```bash
# Set Zhipu AI key (recommended - supports GLM 4.7)
export ZAI_API_KEY="your-zai-key-here"

# Or Anthropic Claude key
export ANTHROPIC_API_KEY="your-anthropic-key"

# Or Google Gemini key
export GEMINI_API_KEY="your-gemini-key"

# Or OpenAI key
export OPENAI_API_KEY="your-openai-key"
```

**Tip:** Add these to your `~/.bashrc` or `~/.zshrc` to persist across sessions.

### Step 3: Verify Installation

```bash
orchestra doctor
```

Expected output:
```
✓ Node.js: v20.0.0
✓ npm: 10.0.0
✓ Git: 2.40.0
✓ ZAI API Key: configured
✓ Orchestrator: ready
```

---

## Quick Start

### Your First Task

Let's create a simple REST API endpoint:

```bash
# Navigate to your project
cd my-project

# Run Orchestra
orchestra start "Add a GET /api/users endpoint that returns all users from a database"
```

### What Happens

1. **Planning Phase**: Architect agent analyzes your project and creates a plan
2. **Plan Review**: You'll see the plan and be asked to approve it
3. **Execution Phase**: Executor agent generates the code
4. **Audit Phase**: Auditor agent reviews the code for quality
5. **Testing**: Tests are run automatically (if configured)
6. **Completion**: Generated code is applied to your project

### Example Output

```
🎼 Orchestra CLI v0.4.0

🤵 Architect analyzing project...
   Framework detected: Express.js
   Language: TypeScript

📋 Generated Plan:

## Implementation Plan

### 1. Create User Route
- File: src/routes/users.ts
- Add GET /api/users endpoint
- Query users from database
- Return JSON response

### 2. Add Database Integration
- File: src/services/userService.ts
- Implement getAllUsers() function
- Handle database errors

### 3. Update App
- File: src/app.ts
- Register users router
- Add error handling

✨ Approve plan? (Y/n)
```

---

## Basic Usage

### Starting a New Task

```bash
orchestra start "your task description"
```

**Example tasks:**
- "Add authentication to the Express app using JWT"
- "Refactor all controllers to use async/await"
- "Add unit tests for the user service"
- "Create a Dockerfile for this Node.js application"

### Using the TUI (Terminal UI)

```bash
orchestra tui
```

The TUI provides:
- 📊 Dashboard with session statistics
- 📝 Task input with history
- ▶️ Real-time execution monitoring
- 📋 Plan review and editing
- 🕰️ Session history and details
- ⚙️ Configuration management

### Using the Web UI

Orchestra also includes a modern web interface for easier interaction:

```bash
# Terminal 1: Start the Orchestra server
orchestra server

# Terminal 2: Start the Web UI
orchestra web
```

The Web UI will be available at `http://localhost:3000` and provides:
- 🌐 **Dashboard**: Start and monitor orchestration tasks
- 📁 **Sessions**: View and manage active/completed sessions
- 🔌 **Plugins**: Browse and install plugins from marketplace
- ⚙️ **Settings**: Configure server connection and preferences
- 📡 **Real-time updates**: WebSocket integration for live monitoring
- 🌓 **Dark/Light theme**: Toggle between themes
- 📱 **Responsive design**: Works on desktop and mobile

**Web UI Options:**
```bash
# Custom port
orchestra web --port 4000

# Connect to remote server
orchestra web --server-url http://orchestra.example.com:8080

# Development mode with hot-reload
orchestra web --dev
```

**Note:** The Web UI requires the Orchestra server to be running. The server provides the REST API and WebSocket connections that the web interface uses.

### Resuming Interrupted Sessions

```bash
orchestra resume
```

This resumes the last interrupted orchestration session.

### Checking Status

```bash
orchestra status
```

Shows current session:
```
Session: abc123
Phase: executing
Progress: 2/5 files (40%)
Started: 2 minutes ago
```

---

## Configuration

### Creating Configuration File

```bash
orchestra init
```

Creates `.orchestrarc.json`:

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
  }
}
```

### Configuration Options

#### Execution

- **parallel**: Process files concurrently (default: `false`)
- **maxConcurrency**: Max concurrent files in parallel mode (default: `3`)
- **maxIterations**: Max audit iterations (default: `10`)
- **timeout**: Operation timeout in milliseconds (default: `300000`)

#### Testing

- **command**: Test command to run (default: auto-detected)
- **runAfterGeneration**: Run tests after code generation (default: `true`)
- **timeout**: Test timeout in milliseconds (default: `120000`)

#### Git

- **autoCommit**: Commit generated code automatically (default: `false`)
- **commitMessageTemplate**: Commit message template (default: `"feat: {task}"`)

#### TUI

- **autoApprove**: Auto-approve plans (default: `false`)
- **notifications**: Enable desktop notifications (default: `true`)
- **cacheEnabled**: Enable response caching (default: `true`)
- **maxRecoveryAttempts**: Max recovery attempts (default: `3`)
- **recoveryTimeoutMinutes**: Recovery timeout (default: `10`)
- **autoRevertOnFailure**: Revert changes on failed recovery (default: `true`)

---

## Advanced Features

### Pipeline Mode

Execute and audit simultaneously for faster feedback:

```bash
orchestra pipeline "Add error handling to all API endpoints"
```

### Watch Mode

Auto-reload on file changes:

```bash
orchestra watch "Add TypeScript types to all functions"
```

Edits files in real-time as you make changes.

### Dry Run Mode

Analyze without making changes:

```bash
orchestra dry-run "Refactor database queries"
```

Shows what would be done without modifying files.

### Using Specific AI Providers

```bash
# Use only Claude
orchestra start "Add tests" --adapter claude

# Use fallback chain
orchestra start "Add tests" --fallback codex,gemini,g lm
```

### Custom Prompts

Create custom prompts in `.orchestrarc.json`:

```json
{
  "customPrompts": {
    "architect": "You are a senior Python expert specializing in Django.",
    "executor": "Follow PEP 8 style guidelines. Use type hints everywhere.",
    "auditor": "Check for SQL injection vulnerabilities and proper error handling."
  }
}
```

---

## Common Workflows

### Workflow 1: Adding a New Feature

```bash
# 1. Start feature development
orchestra start "Add user authentication with JWT tokens"

# 2. Review the generated plan
# (Orchestra will prompt you to approve)

# 3. Monitor execution
# (Progress bars show real-time status)

# 4. Review generated code
# (Code is applied automatically)

# 5. Run tests
orchestra validate

# 6. Commit changes
git add .
git commit -m "feat: add JWT authentication"
```

### Workflow 2: Refactoring Code

```bash
# 1. Use dry-run to preview changes
orchestra dry-run "Convert callbacks to async/await"

# 2. If satisfied, execute
orchestra start "Convert callbacks to async/await"

# 3. Run tests to verify
npm test

# 4. Check for issues
orchestra status
```

### Workflow 3: Adding Tests

```bash
# 1. Add tests to untested code
orchestra start "Add unit tests for all functions in src/utils/"

# 2. Use parallel mode for speed
# (Edit .orchestrarc.json: set "parallel": true)

# 3. Verify test coverage
npm run test:coverage
```

### Workflow 4: Bug Fixing

```bash
# 1. Describe the bug
orchestra start "Fix the authentication bug where tokens expire too early"

# 2. Orchestra will:
#    - Analyze the code
#    - Identify the issue
#    - Propose a fix
#    - Apply the fix
#    - Run tests

# 3. Review the fix
git diff
```

### Workflow 5: Migration

```bash
# 1. Migrate between frameworks
orchestra start "Migrate from Express to Fastify"

# 2. Use TUI to monitor progress
orchestra tui

# 3. Run tests frequently during migration
npm test
```

---

## Using Plugins

### Installing Plugins

```bash
# Install from npm
orchestra plugin install express-plugin

# Install from local directory
orchestra plugin install ./my-plugin

# List installed plugins
orchestra plugin list
```

### Creating Custom Plugins

See [Plugin Development Guide](docs/guides/plugin-development.md) for detailed instructions.

### Example: Express Plugin

```bash
# Install Express.js plugin
orchestra plugin install @orchestra/express-plugin

# Now Orchestra will automatically:
# - Detect Express.js projects
# - Add Express-specific patterns to plans
# - Apply Express best practices
# - Use Express audit rules
```

---

## Integrations

### GitHub Integration

```bash
# Create GitHub issue from task
orchestra start "Add user profile page" --github-issue

# Create PR from changes
orchestra start "Fix login bug" --github-pr

# Link existing issue
orchestra start "Implement #123" --github-issue 123
```

### Jira Integration

```bash
# Create Jira ticket from audit findings
orchestra start "Fix security vulnerabilities" --jira-ticket

# Link existing ticket
orchestra start "Implement ORCH-123" --jira-ticket ORCH-123
```

### Slack Notifications

```bash
# Configure Slack webhook
orchestra notify --slack https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Now you'll get notifications for:
# - Task completion
# - Audit failures
# - Recovery mode activation
```

---

## Session Management

### View Session History

```bash
orchestra history
```

Output:
```
Recent Sessions:

1. abc123 - "Add JWT authentication" (completed) - 5 min ago
2. def456 - "Refactor controllers" (completed) - 1 hour ago
3. ghi789 - "Add unit tests" (failed) - 2 hours ago
```

### Export Session

```bash
# Export as Markdown
orchestra export abc123 --format markdown --output session.md

# Export as JSON
orchestra export abc123 --format json --output session.json

# Export as PDF
orchestra export abc123 --format pdf --output session.pdf
```

### View Session Details

```bash
orchestra show abc123
```

Shows full session details including:
- Task description
- Generated plan
- All files modified
- Audit results
- Test results
- Recovery attempts (if any)

---

## Troubleshooting

### Issue: "API key not found"

**Solution:**
```bash
# Set the API key
export ZAI_API_KEY="your-key"

# Verify
orchestra doctor
```

### Issue: "All adapters failed"

**Solution:**
```bash
# Check API key quota
curl https://api.zhipu.ai/v4/models -H "Authorization: Bearer $ZAI_API_KEY"

# Try a different adapter
orchestra start "task" --adapter claude
```

### Issue: "Recovery mode looping"

**Solution:**
```bash
# Edit .orchestrarc.json
{
  "tui": {
    "maxRecoveryAttempts": 5,
    "recoveryTimeoutMinutes": 20
  }
}
```

### Issue: "Tests failing after generation"

**Solution:**
```bash
# Run tests in verbose mode
npm test -- --verbose

# Check generated code
orchestra show <session-id>

# Revert changes if needed
orchestra clean
git checkout .
```

### Issue: "TUI not rendering correctly"

**Solution:**
```bash
# Ensure terminal supports UTF-8
export LANG=en_US.UTF-8

# Try without TUI
orchestra start "task" --no-tui
```

### Issue: "Plugin not loading"

**Solution:**
```bash
# Check plugin is installed
orchestra plugin list

# Verify plugin version
orchestra plugin info express-plugin

# Reinstall plugin
orchestra plugin install express-plugin --force
```

---

## Best Practices

### 1. Start Simple

Begin with small, well-defined tasks:

```bash
# Good
orchestra start "Add email validation function"

# Too broad
orchestra start "Build a complete e-commerce system"
```

### 2. Review Plans

Always review generated plans before approving:

```bash
# Edit plan if needed
orchestra plan edit

# Or use TUI for interactive editing
orchestra tui
```

### 3. Use Dry Run

Preview changes before executing:

```bash
orchestra dry-run "major refactoring"
```

### 4. Enable Git Auto-commit

Protect yourself with automatic commits:

```json
{
  "git": {
    "autoCommit": true,
    "commitMessageTemplate": "feat: {task}"
  }
}
```

### 5. Monitor Sessions

Keep track of what's been done:

```bash
orchestra history
orchestra show <session-id>
```

### 6. Use Parallel Mode for Large Tasks

Process multiple files concurrently:

```json
{
  "execution": {
    "parallel": true,
    "maxConcurrency": 5
  }
}
```

### 7. Configure Test Command

Ensure tests run correctly:

```json
{
  "test": {
    "command": "npm run test:unit",
    "runAfterGeneration": true
  }
}
```

---

## Next Steps

### Learn More

- 📖 [Orchestrator API](docs/api/orchestrator.md) - Programmatic usage
- 🔌 [Adapter Interface](docs/api/adapters.md) - Custom adapters
- 🛠️ [Plugin Development](docs/guides/plugin-development.md) - Create plugins
- 🧪 [Testing Guide](docs/guides/testing.md) - Testing patterns

### Join the Community

- 🐛 [Report Issues](https://github.com/gama/orchestra/issues)
- 💡 [Request Features](https://github.com/gama/orchestra/discussions)
- 📖 [Contribute](https://github.com/gama/orchestra/blob/main/CONTRIBUTING.md)

### Explore Examples

Check out the `examples/` directory for:
- REST API generation
- Database migrations
- Test generation
- Code refactoring
- Documentation generation

---

## Quick Reference

```bash
# Essential Commands
orchestra start "task"              # Start new task
orchestra tui                       # Launch Terminal UI
orchestra web                       # Launch Web UI (requires server)
orchestra server                    # Start Orchestra server
orchestra resume                    # Resume session
orchestra status                    # Show status
orchestra history                   # Show history
orchestra doctor                    # Check setup
orchestra init                      # Create config

# Advanced Commands
orchestra pipeline "task"           # Pipeline mode
orchestra watch "task"              # Watch mode
orchestra dry-run "task"            # Dry run
orchestra validate                  # Validate syntax
orchestra export <id>               # Export session
orchestra clean                     # Clean session

# Plugin Commands
orchestra plugin install <name>     # Install plugin
orchestra plugin list               # List plugins
orchestra plugin info <name>        # Plugin info

# Integration Commands
orchestra notify --slack <url>      # Configure Slack
orchestra github --issue            # Create GitHub issue

# Server & Web UI Commands
orchestra server --port 8080        # Start server on custom port
orchestra web --port 3000           # Start Web UI on custom port
orchestra remote start "task"       # Remote CLI via WebSocket
```

---

**Happy Orchestrating!** 🎼

For more help, see [GitHub Issues](https://github.com/gama/orchestra/issues) or join our community discussions.
