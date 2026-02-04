# Orchestra CLI - Quick Start Guide

Get up and running with Orchestra in under 15 minutes.

## Prerequisites

- Node.js 18+ installed
- API key for at least one AI provider:
  - Zhipu AI (GLM): https://platform.zhipuai.ai/
  - Google Gemini: https://ai.google.dev/
  - Anthropic Claude: https://console.anthropic.com/

## Installation (2 minutes)

```bash
# Clone the repository
git clone https://github.com/ai-core/orchestra.git
cd orchestra

# Install dependencies
npm install

# Build the project
npm run build

# Verify installation
orchestra --version
```

## Configuration (3 minutes)

### Step 1: Set API Key

```bash
# Set Zhipu AI key (recommended for cost/performance)
export ZAI_API_KEY="your-api-key-here"

# Or set Gemini key
export GEMINI_API_KEY="your-api-key-here"

# Or set Claude key
export ANTHROPIC_API_KEY="your-api-key-here"
```

### Step 2: Initialize Project

```bash
# Create .orchestrarc.json in your project
orchestra init
```

This creates a default configuration file:

```json
{
  "execution": {
    "parallel": true,
    "maxConcurrency": 3,
    "maxIterations": 10
  },
  "git": {
    "autoCommit": true
  }
}
```

## Your First Task (5 minutes)

### Simple Task

```bash
orchestra start "Create a function to validate email addresses"
```

Orchestra will:
1. **Architect** - Create a plan
2. **Execute** - Generate the code
3. **Audit** - Review for quality
4. **Iterate** - Fix any issues (up to 10 times)

### Parallel Task

```bash
orchestra start "Create utility functions: capitalize, reverse, truncate strings"
```

Orchestra processes all 3 functions in parallel.

### Complex Task

```bash
orchestra start "Create a REST API with Express.js for user management"
```

Handles multi-file projects with dependencies.

## Using the TUI (3 minutes)

Launch the Terminal UI for a visual experience:

```bash
orchestra tui
```

**Navigation:**
- `Ctrl+N` - New task
- `Ctrl+H` - View history
- `Ctrl+S` - Settings
- `Ctrl+Q` - Quit
- `Tab` - Switch panels
- `Enter` - Select

## Common Workflows (2 minutes)

### Review Before Executing

```bash
# Plan only
orchestra start "Add user authentication" --plan-only

# Review the plan
orchestra plan

# Execute if satisfied
orchestra resume
```

### Dry Run

```bash
# Analyze without making changes
orchestra start "Refactor database layer" --dry-run
```

### View Session History

```bash
# List sessions
orchestra history

# View details
orchestra history show <session-id>

# Export session
orchestra export <session-id> --format markdown
```

## Next Steps

1. **Read the [Tutorial](TUTORIAL.md)** - Comprehensive guide
2. **Check [Examples](examples/)** - 11+ code examples
3. **Explore [Guides](docs/guides/)** - Development, testing, performance
4. **Configure Adapters** - Set up fallback chains for reliability

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `API key not found` | Set `ZAI_API_KEY` environment variable |
| Tests failing | Run `orchestra doctor` to check setup |
| Slow execution | Enable parallel mode in `.orchestrarc.json` |
| Import errors | Run `npm run build` to compile TypeScript |

## Getting Help

```bash
# Check system status
orchestra doctor

# View all commands
orchestra --help

# Get help for specific command
orchestra start --help
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ZAI_API_KEY` | Zhipu AI key (GLM 4.7) | Yes* |
| `GEMINI_API_KEY` | Google Gemini key | Optional |
| `ANTHROPIC_API_KEY` | Anthropic Claude key | Optional |
| `ORCHESTRA_DEBUG` | Enable debug logs | Optional |

*At least one API key is required

## Tips

1. **Start with GLM** - Fastest and most cost-effective
2. **Use parallel mode** - For 3+ files
3. **Enable auto-commit** - Track all changes in git
4. **Review plans** - Use `--plan-only` for complex tasks
5. **Check history** - Learn from previous sessions

---

**You're ready! Start building with Orchestra:**

```bash
orchestra start "Your first task here"
```

For more details, see [TUTORIAL.md](TUTORIAL.md) or [examples/](examples/).
