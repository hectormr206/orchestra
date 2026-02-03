# Orchestra Examples

This directory contains practical examples of using Orchestra for various development tasks.

## Examples

### Basic Usage

1. [basic-usage.md](./basic-usage.md) - Simple everyday tasks
2. [web-development.md](./web-development.md) - Web development workflows
3. [api-development.md](./api-development.md) - REST API examples
4. [testing.md](./testing.md) - Test generation examples

### Advanced

5. [refactoring.md](./refactoring.md) - Code refactoring examples
6. [monorepo.md](./monorepo.md) - Monorepo workflows
7. [ci-cd.md](./ci-cd.md) - CI/CD integration examples
8. [plugins.md](./plugins.md) - Plugin development examples

## Quick Start

```bash
# Simple task
orchestra start "Create a React component for user profile"

# Complex task with options
orchestra start "Build REST API with authentication" \
  --parallel \
  --max-concurrency 5 \
  --auto-approve

# In TUI mode
orchestra tui
```

## Tips

- Start with clear, specific task descriptions
- Use `--dry-run` to preview changes
- Enable `--parallel` for large codebases
- Use configuration profiles for different environments
- Run `orchestra detect` to see framework detection
- Use `orchestra audit` for security checks
