You are an AI agent that brings the power of Gemini directly into the terminal. Your task is to analyze the current directory and generate a comprehensive GEMINI.md file to be used as instructional context for future interactions.

**Analysis Process:**

1.  **Initial Exploration:**
    *   Start by listing the files and directories to get a high-level overview of the structure.
    *   Read the README file (e.g., `README.md`, `README.txt`) if it exists. This is often the best place to start.

2.  **Iterative Deep Dive (up to 10 files):**
    *   Based on your initial findings, select a few files that seem most important (e.g., configuration files, main source files, documentation).
    *   Read them. As you learn more, refine your understanding and decide which files to read next. You don't need to decide all 10 files at once. Let your discoveries guide your exploration.

3.  **Identify Project Type:**
    *   **Code Project:** Look for clues like `package.json`, `requirements.txt`, `pom.xml`, `go.mod`, `Cargo.toml`, `build.gradle`, or a `src` directory. If you find them, this is likely a software project.
    *   **Non-Code Project:** If you don't find code-related files, this might be a directory for documentation, research papers, notes, or something else.

**GEMINI.md Content Generation:**

**For a Code Project:**

*   **Project Overview:** Write a clear and concise summary of the project's purpose, main technologies, and architecture.
*   **Building and Running:** Document the key commands for building, running, and testing the project. Infer these from the files you've read (e.g., `scripts` in `package.json`, `Makefile`, etc.). If you can't find explicit commands, provide a placeholder with a TODO.
*   **Development Conventions:** Describe any coding styles, testing practices, or contribution guidelines you can infer from the codebase.

**For a Non-Code Project:**

*   **Directory Overview:** Describe the purpose and contents of the directory. What is it for? What kind of information does it hold?
*   **Key Files:** List the most important files and briefly explain what they contain.
*   **Usage:** Explain how the contents of this directory are intended to be used.

**Final Output:**

Write the complete content to the `GEMINI.md` file. The output must be well-formatted Markdown.

# Orchestra

**Meta-Orchestrator for AI Development Tools**

Orchestra coordinates multiple AI CLI tools (Claude, Codex, Gemini, GLM) to complete complex development tasks through an intelligent multi-agent workflow.

```
                       ╔═╗ ╦═╗ ╔═╗ ╦ ╦ ╔═╗ ╔═╗ ╔╦╗ ╦═╗ ╔═╗
                       ║ ║ ╠╦╝ ║   ╠═╣ ║╣  ╚═╗  ║  ╠╦╝ ╠═╣
                       ╚═╝ ╩╚═ ╚═╝ ╩ ╩ ╚═╝ ╚═╝  ╩  ╩╚═ ╩ ╩
```

## Features

- **Multi-Agent Architecture**: Architect plans, Executor implements, Auditor reviews, Consultant assists
- **Adapter Fallback System**: Automatic failover between AI providers (Codex → Gemini → GLM)
- **Parallel Processing**: Process multiple files simultaneously
- **Pipeline Mode**: Execute and audit files in parallel streams
- **Watch Mode**: Auto-rerun on file changes
- **Plan Approval**: Review and edit plans before execution
- **Multi-Language Validation**: Python, JavaScript, TypeScript, Go, Rust, Java, and more
- **Git Integration**: Auto-commit generated files
- **GitHub Integration**: Create issues and PRs directly
- **Session Management**: Resume interrupted sessions, view history
- **Result Caching**: Skip re-execution of identical tasks
- **Notifications**: Desktop, Slack, and webhook notifications
- **TUI**: Beautiful terminal interface with React/Ink

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ai-core.git
cd ai-core/orchestra

# Install dependencies
npm install

# Build
npm run build

# Link globally (optional)
npm link
```

### Requirements

- Node.js 18+
- Python 3.8+ (for syntax validation)
- At least one AI CLI tool:
  - [Claude CLI](https://github.com/anthropics/claude-code)
  - [Codex CLI](https://github.com/openai/codex)
  - [Gemini CLI](https://github.com/google-gemini/gemini-cli)
  - [GLM CLI](https://docs.z.ai/devpack/tool/claude) (requires `ZAI_API_KEY`)

Verify your setup:

```bash
orchestra doctor
```

## Quick Start

```bash
# Start a new task
orchestra start "Create a REST API with Flask for user management"

# With automatic plan approval
orchestra start "Create a REST API" --auto

# Parallel file processing
orchestra start "Create a REST API" --auto --parallel

# Run tests after generation
orchestra start "Create a REST API" --auto --test

# Auto-commit changes
orchestra start "Create a REST API" --auto --commit
```

## Commands

### Core Commands

| Command                  | Description                    |
| ------------------------ | ------------------------------ |
| `orchestra start <task>` | Start a new orchestration task |
| `orchestra resume`       | Resume an interrupted session  |
| `orchestra status`       | Show current session status    |
| `orchestra plan`         | Display the current plan       |
| `orchestra clean`        | Clean the current session      |

### Execution Modes

```bash
# Standard mode
orchestra start "Create a CLI tool"

# Parallel mode (process files simultaneously)
orchestra start "Create a CLI tool" --parallel --concurrency 5

# Pipeline mode (execute and audit in parallel)
orchestra pipeline "Create a CLI tool"

# Watch mode (re-run on changes)
orchestra watch "Create a CLI tool"
```

### Analysis & Validation

```bash
# Dry run (analyze without executing)
orchestra dry-run "Create a REST API"
orchestra dry-run "Create a REST API" --json

# Validate generated files
orchestra validate
```

### Session Management

```bash
# View session history
orchestra history
orchestra history --limit 20
orchestra history --status completed
orchestra history --search "API"
orchestra history --stats

# Load session details
orchestra history --load abc123

# Delete a session
orchestra history --delete abc123

# Export current session
orchestra export
orchestra export --format markdown
orchestra export --format json
orchestra export --output ./reports
```

### GitHub Integration

```bash
# Create issue from audit results
orchestra github --issue

# Create PR with generated files
orchestra github --pr
orchestra github --pr --branch feature/new-api
```

### Cache Management

```bash
# List cached results
orchestra cache --list

# View cache statistics
orchestra cache --stats

# Clear cache
orchestra cache --clear
```

### Notifications

```bash
# Test desktop notification
orchestra notify --test

# Configure Slack webhook
orchestra notify --slack https://hooks.slack.com/...

# Configure generic webhook
orchestra notify --webhook https://your-server.com/webhook
```

### Configuration

```bash
# Create configuration file
orchestra init

# Check system status
orchestra doctor
```

### Terminal UI

```bash
# Open interactive TUI
orchestra tui

# Start TUI with a task
orchestra tui --task "Create a REST API"

# Auto-start the task
orchestra tui --task "Create a REST API" --auto
```

## Configuration

Create `.orchestrarc.json` in your project root:

```json
{
  "defaultTask": "",
  "languages": ["python", "javascript", "typescript"],
  "test": {
    "command": "npm test",
    "runAfterGeneration": false
  },
  "git": {
    "autoCommit": false,
    "commitMessageTemplate": "feat: {task}"
  },
  "execution": {
    "parallel": true,
    "maxConcurrency": 3,
    "maxIterations": 5
  },
  "prompts": {
    "architect": "Additional context for the architect...",
    "executor": "Additional context for the executor...",
    "auditor": "Additional context for the auditor..."
  }
}
```

Or use `orchestra init` to generate a default configuration.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        ORCHESTRA                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │ Architect│───▶│ Executor │───▶│ Auditor  │               │
│  │ (Codex)  │    │ (GLM)    │    │ (Gemini) │               │
│  └──────────┘    └──────────┘    └──────────┘               │
│       │              │               │                       │
│       │              ▼               │                       │
│       │        ┌──────────┐         │                       │
│       └───────▶│Consultant│◀────────┘                       │
│                │ (Codex)  │                                  │
│                └──────────┘                                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Adapters: Claude │ Codex │ Gemini │ GLM (with fallback)    │
└─────────────────────────────────────────────────────────────┘
```

### Agent Roles

| Agent          | Role                                                  | Default Adapter      |
| -------------- | ----------------------------------------------------- | -------------------- |
| **Architect**  | Plans the implementation, defines files and structure | Codex → Gemini → GLM |
| **Executor**   | Implements the code based on the plan                 | GLM                  |
| **Auditor**    | Reviews code quality, security, and completeness      | Gemini → GLM         |
| **Consultant** | Assists with complex issues and edge cases            | Codex → Gemini → GLM |

### Workflow

1. **Planning Phase**: Architect analyzes the task and creates a detailed plan
2. **Approval Phase**: User reviews and approves the plan (or auto-approve)
3. **Execution Phase**: Executor implements each file in the plan
4. **Validation Phase**: Syntax validation for each file
5. **Audit Phase**: Auditor reviews all generated code
6. **Iteration**: If issues found, Executor fixes them (max iterations configurable)

## TUI (Terminal User Interface)

Orchestra includes a beautiful terminal UI built with React/Ink:

```bash
orchestra tui
```

### TUI Features

- **Dashboard**: Quick stats, main menu, keyboard shortcuts
- **Task Input**: Enter new tasks with options
- **Execution View**: Live progress, file status, logs
- **Plan Review**: View, approve, reject, or edit plans
- **History**: Browse past sessions
- **Settings**: Configure options
- **Doctor**: System health check

### Keyboard Shortcuts

| Key     | Action         |
| ------- | -------------- |
| `n`     | New task       |
| `r`     | Resume session |
| `h`     | History        |
| `s`     | Settings       |
| `q`     | Quit           |
| `↑/↓`   | Navigate       |
| `Enter` | Select         |
| `Esc`   | Back/Cancel    |

## Environment Variables

| Variable            | Description                |
| ------------------- | -------------------------- |
| `ZAI_API_KEY`       | API key for GLM adapter    |
| `OPENAI_API_KEY`    | API key for Codex adapter  |
| `GEMINI_API_KEY`    | API key for Gemini adapter |
| `ANTHROPIC_API_KEY` | API key for Claude adapter |

## File Structure

```
.orchestra/
├── session-state.json    # Current session state
├── plan.md               # Generated plan
├── audit-result.json     # Audit results
├── cache/                # Result cache
├── history/              # Session history
├── exports/              # Exported sessions
└── notifications.json    # Notification config
```

## Examples

### Create a REST API

```bash
orchestra start "Create a REST API with Express.js for a todo app with CRUD operations"
```

### Add Authentication

```bash
orchestra start "Add JWT authentication to the existing Express API" --auto
```

### Create Tests

```bash
orchestra start "Create unit tests for all API endpoints using Jest" --auto --test
```

### Refactor Code

```bash
orchestra start "Refactor the user controller to use async/await and add error handling" --auto
```

### Create Full Project

```bash
orchestra start "Create a complete React + Node.js todo application with:
- Backend: Express.js REST API
- Frontend: React with hooks
- Database: SQLite with Prisma
- Authentication: JWT
- Tests: Jest for backend, React Testing Library for frontend" --auto --parallel
```

## Troubleshooting

### Common Issues

**"Raw mode is not supported"**

- This occurs when running the TUI in a non-interactive terminal
- Solution: Run `orchestra tui` in a real terminal (not piped or in CI)

**"Claude CLI not found"**

- Install Claude CLI: `npm install -g @anthropic/claude-cli`
- Or use another adapter by configuring fallbacks

**"ZAI_API_KEY not configured"**

- Set the environment variable: `export ZAI_API_KEY=your-key`
- Or add it to your `.env` file

**"Syntax validation failed"**

- Ensure you have the required language runtimes installed
- Python: `python3 --version`
- Node.js: `node --version`

### Debug Mode

```bash
# Enable verbose logging
DEBUG=orchestra:* orchestra start "Create an API"
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with AI, for AI-assisted development.