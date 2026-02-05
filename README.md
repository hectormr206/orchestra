# Orchestra 🎼

**Orchestra** is a Meta-Orchestrator for AI development tools that coordinates multiple AI agents (Claude, Codex, Gemini, GLM) to perform complex development tasks through intelligent task automation.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)]()

---

## Features

- 🤖 **Multi-Agent Orchestration** - Coordinates Architect, Executor, Auditor, and Consultant agents
- 🔄 **Automatic Fallback** - Seamless provider switching (Codex → Gemini → GLM)
- 🎨 **Dual Interface** - Both CLI and TUI (Terminal User Interface) modes
- 🔍 **Syntax Validation** - Multi-language support (Python, TypeScript, JavaScript, Go, Rust)
- 🧪 **Test Integration** - Auto-detection of test frameworks (pytest, jest, vitest, go test, cargo test)
- 💾 **Session Persistence** - Resume interrupted sessions with full state recovery
- ⚡ **Parallel Execution** - Concurrent file processing with configurable workers
- 🔧 **Recovery Mode** - Automatic error recovery with iterative fixes
- 📊 **Performance Metrics** - Built-in telemetry and monitoring
- 🎯 **Pipeline Mode** - Execute and audit simultaneously for faster feedback

---

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/orchestra.git
cd orchestra

# Install dependencies
npm install

# Build project
npm run build

# Set up API keys
export ZAI_API_KEY="your-api-key"        # Required for GLM
export GEMINI_API_KEY="your-key"         # Optional
export OPENAI_API_KEY="your-key"         # Optional

# Initialize configuration
npm run start -- init
```

---

## Quick Start

### CLI Mode

```bash
# Start a new orchestration task
orchestra start "Add user authentication to the API"

# Resume interrupted session
orchestra resume

# Pipeline execution (faster feedback)
orchestra pipeline "Refactor database queries"

# Watch mode (auto-reload on changes)
orchestra watch "Implement search feature"

# Dry-run (analyze without execution)
orchestra dry-run "Optimize performance"

# View current status
orchestra status

# View execution plan
orchestra plan

# View session history
orchestra history
```

### TUI Mode

```bash
# Launch Terminal User Interface
npm run tui
# or
orchestra tui
```

The TUI provides:
- 📊 **Dashboard** - Real-time overview and metrics
- ⚙️ **Execution Screen** - Live progress tracking
- 📝 **Plan Review** - Approve/edit execution plans
- 📈 **Metrics View** - Performance analytics
- 🔧 **Settings** - Configuration management
- 📜 **History** - Session history browser

---

## Architecture

### Agent Workflow

```
User Request
    ↓
Architect (Codex → Gemini → GLM 4.7)
    → Creates implementation plan
    ↓
[Plan Approval]
    ↓
Executor (GLM 4.7)
    → Generates code
    ↓
Auditor (Gemini → GLM 4.7)
    → Reviews code quality
    ↓
[Issues Found?] → Consultant (Codex → Gemini → GLM 4.7)
    → Provides algorithmic guidance
    ↓
[Loop until approved or max iterations]
    ↓
[Optional] Tests (auto-detected framework)
    ↓
[Optional] Git commit (conventional commits)
```

### Directory Structure

```
src/
├── adapters/          # AI provider adapters (Codex, Gemini, GLM, etc.)
├── cli/               # CLI command definitions
├── orchestrator/      # Main orchestration engine
├── prompts/           # Agent prompt templates
├── tui/               # Terminal UI (React + Ink)
│   ├── screens/       # TUI screens
│   ├── components/    # UI components
│   └── hooks/         # React hooks
├── utils/             # Utilities (StateManager, validators, etc.)
├── plugins/           # Plugin system
├── server/            # HTTP/WebSocket server
├── client/            # Client SDK
├── marketplace/       # Plugin marketplace
└── web/               # Web UI (React + Vite)
```

---

## Configuration

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
  }
}
```

Generate default config:
```bash
orchestra init
```

---

## Commands

| Command | Description |
|---------|-------------|
| `start <task>` | Begin new orchestration |
| `resume` | Resume interrupted session |
| `pipeline <task>` | Pipeline execution mode |
| `watch <task>` | Watch mode with auto-reload |
| `status` | Show current session status |
| `plan` | View current execution plan |
| `clean` | Clear session data |
| `doctor` | Verify setup and dependencies |
| `validate` | Validate syntax of generated code |
| `init` | Create `.orchestrarc.json` config |
| `dry-run <task>` | Analyze without execution |
| `export` | Export session data |
| `history` | Show session history |
| `tui` | Launch Terminal UI |

---

## Execution Modes

### Sequential (Default)
Standard execution with one file at a time.

### Parallel
Process multiple files concurrently with configurable worker pool:
```json
{
  "execution": {
    "parallel": true,
    "maxConcurrency": 3
  }
}
```

### Pipeline
Execute and audit simultaneously for faster feedback:
```bash
orchestra pipeline "your task"
```

### Watch
Auto-reload on file changes with debouncing:
```bash
orchestra watch "your task"
```

---

## Recovery Mode

When the normal audit loop fails, Orchestra automatically enters Recovery Mode:

1. ✅ Validates syntax with language-specific parsers
2. ✅ Detects incomplete code blocks
3. ✅ Iterates up to `maxRecoveryAttempts` (default: 3)
4. ✅ Auto-reverts changes if recovery fails (configurable)
5. ✅ Timeout controlled by `recoveryTimeout` (default: 10 min)

Configure in `.orchestrarc.json`:
```json
{
  "tui": {
    "maxRecoveryAttempts": 5,
    "recoveryTimeoutMinutes": 15,
    "autoRevertOnFailure": true
  }
}
```

---

## Supported Languages

Orchestra validates syntax for:

- **Python** - Uses AST parser
- **JavaScript** - Uses Acorn parser
- **TypeScript** - Uses TypeScript compiler API
- **Go** - Uses go fmt validation
- **Rust** - Uses rustc --parse-only
- **JSON** - JSON.parse validation
- **YAML** - YAML parser validation

Auto-detection based on file extension.

---

## Development

```bash
# Compile TypeScript
npm run build

# Run in development mode
npm run dev

# Start TUI
npm run tui

# Run tests
npm test

# Test with coverage
npm run test:coverage

# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

---

## Test Frameworks

Orchestra auto-detects and runs tests using:

- **Python**: pytest, unittest
- **JavaScript/TypeScript**: jest, vitest
- **Go**: go test
- **Rust**: cargo test

Override with `test.command` in config.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ZAI_API_KEY` | ✅ Yes | API key for Zhipu AI (GLM) |
| `GEMINI_API_KEY` | Optional | Google Gemini API key |
| `OPENAI_API_KEY` | Optional | OpenAI API key (Codex) |

---

## AI-Core Integration

Orchestra integrates with [ai-core](./ai-core/) for universal development patterns:

- 📖 **Central Reference**: `ai-core/SUBAGENTS/AGENTS.md`
- 🛠️ **45+ Skills**: Domain-specific patterns (testing, security, frontend, etc.)
- 🤖 **Specialized Subagents**: security-specialist, frontend-specialist, etc.

See [CLAUDE.md](./CLAUDE.md) for complete integration details.

---

## Project Status

**Status**: Development
**Test Coverage**: Target 100%
**Tech Stack**: TypeScript + React (Ink) + Node.js

See [ROADMAP.md](./ROADMAP.md) for upcoming features and milestones.

---

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Claude Code specific guidance
- [AGENTS.md](./AGENTS.md) - AI agent rules and ai-core integration
- [QUICKSTART.md](./QUICKSTART.md) - Getting started guide
- [TUTORIAL.md](./TUTORIAL.md) - Comprehensive tutorial
- [USER_GUIDE.md](./docs/USAGE_GUIDE.md) - Detailed usage guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture documentation
- [SCALING.md](./SCALING.md) - Scaling guidelines

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Troubleshooting

### Adapter Failures
- Verify `ZAI_API_KEY` is set correctly
- Check API quota and rate limits
- Verify network connectivity

### Recovery Mode Looping
- Increase `maxRecoveryAttempts` in config
- Increase `recoveryTimeout` for complex code
- Review and adjust agent prompts

### State Corruption
- Run `orchestra clean` to reset session
- Delete `.orchestra/` directory manually
- Use `orchestra resume` to continue from last checkpoint

---

**Built with ❤️ for efficient AI-powered development**
