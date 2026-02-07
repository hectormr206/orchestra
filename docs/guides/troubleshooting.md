# Troubleshooting Guide

This guide covers common issues and solutions when using Orchestra CLI.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Configuration Problems](#configuration-problems)
3. [Adapter Issues](#adapter-issues)
4. [Performance Problems](#performance-problems)
5. [Test Failures](#test-failures)
6. [TUI Issues](#tui-issues)
7. [Git Integration Issues](#git-integration-issues)
8. [Recovery Mode Looping](#recovery-mode-looping)

---

## Installation Issues

### Error: Cannot find module 'orchestra'

**Symptoms**: `orchestra: command not found` or module not found errors.

**Solutions**:

1. **Local installation**:

   ```bash
   npm install
   npm run build
   npm link
   ```

2. **Global installation**:

   ```bash
   npm install -g .
   ```

3. **Use npx** (always uses latest version):
   ```bash
   npx orchestra start "your task"
   ```

### Error: TypeScript compilation fails

**Symptoms**: Build errors after running `npm run build`.

**Solutions**:

1. **Clear build cache**:

   ```bash
   rm -rf dist
   npm run build
   ```

2. **Check TypeScript version**:

   ```bash
   npm list typescript
   # Should be >= 5.0
   ```

3. **Verify tsconfig.json**:
   ```bash
   npx tsc --showConfig
   ```

---

## Configuration Problems

### Error: .orchestrarc.json not found

**Symptoms**: Config loading fails.

**Solutions**:

1. **Create default config**:

   ```bash
   orchestra init
   ```

2. **Create manually**:
   ```json
   {
     "execution": {
       "parallel": true,
       "maxConcurrency": 3
     }
   }
   ```

### Invalid configuration value

**Symptoms**: "Invalid config" error on startup.

**Solutions**:

1. **Validate config schema**:

   ```bash
   orchestra doctor
   ```

2. **Common fixes**:
   - `maxConcurrency` must be >= 1
   - `maxIterations` must be >= 1
   - `timeout` must be in milliseconds (>= 1000)

---

## Adapter Issues

### Error: API key not found

**Symptoms**: Adapter fails with "missing API key" error.

**Solutions**:

1. **Set environment variables**:

   ```bash
   export ZAI_API_KEY="your-key"
   export GEMINI_API_KEY="your-key"
   export OPENAI_API_KEY="your-key"
   ```

2. **Use .env file**:

   ```bash
   # .env
   ZAI_API_KEY=your-key
   GEMINI_API_KEY=your-key
   ```

3. **Verify key is set**:
   ```bash
   orchestra doctor
   ```

### Error: Rate limit exceeded

**Symptoms**: Adapter fails with 429 error.

**Solutions**:

1. **Wait and retry**:
   - Automatic retry with exponential backoff is built-in
   - Consider upgrading API tier

2. **Switch adapter**:

   ```json
   {
     "adapters": {
       "architect": ["gemini", "glm", "codex"]
     }
   }
   ```

3. **Reduce concurrency**:
   ```json
   {
     "execution": {
       "maxConcurrency": 1
     }
   }
   ```

### Error: Adapter timeout

**Symptoms**: Request takes too long and times out.

**Solutions**:

1. **Increase timeout**:

   ```json
   {
     "execution": {
       "timeout": 120000
     }
   }
   ```

2. **Enable streaming** (when available):
   ```json
   {
     "adapters": {
       "streaming": true
     }
   }
   ```

---

## Performance Problems

### Slow execution

**Symptoms**: Tasks take longer than expected.

**Solutions**:

1. **Run performance profile**:

   ```bash
   clinic doctor -- node dist/cli/index.js start "test task"
   ```

2. **Enable parallel execution**:

   ```json
   {
     "execution": {
       "parallel": true,
       "maxConcurrency": 3
     }
   }
   ```

3. **Enable caching**:

   ```json
   {
     "cache": {
       "enabled": true,
       "ttl": 3600000
     }
   }
   ```

4. **Check adapter performance**:
   - GLM 4.7: Fast, cost-effective
   - Gemini: Balanced
   - Claude Opus 4.5: Best quality, slower

### High memory usage

**Symptoms**: Process consumes > 500MB RAM.

**Solutions**:

1. **Clear cache**:

   ```bash
   orchestra cache clear
   ```

2. **Reduce checkpoint history**:

   ```json
   {
     "recovery": {
       "maxCheckpoints": 5
     }
   }
   ```

3. **Clean session data**:
   ```bash
   orchestra clean
   ```

---

## Test Failures

### Error: Tests timing out

**Symptoms**: Tests fail with timeout error.

**Solutions**:

1. **Increase test timeout**:

   ```typescript
   it("slow test", async () => {
     // test code
   }, 10000); // 10 second timeout
   ```

2. **Use proper mocks**:

   ```typescript
   vi.mock("./adapter", () => ({
     Adapter: vi.fn().mockResolvedValue({ data: "mock" }),
   }));
   ```

3. **Run tests with increased timeout**:
   ```bash
   vitest --testTimeout=10000
   ```

### Error: Mock not working

**Symptoms**: Real code is executed instead of mock.

**Solutions**:

1. **Mock before import**:

   ```typescript
   vi.mock('./module', () => ({ ... }));

   import { function } from './module';
   ```

2. **Use vi.mocked()**:

   ```typescript
   const mockedFn = vi.mocked(adapter.execute);
   ```

3. **Clear mocks between tests**:
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
   });
   ```

---

## TUI Issues

### Error: TUI not rendering correctly

**Symptoms**: Display is garbled or unresponsive.

**Solutions**:

1. **Check terminal compatibility**:
   - Use modern terminal (VS Code, iTerm2, Windows Terminal)
   - Avoid legacy terminals (cmd.exe on Windows)

2. **Increase terminal size**:
   - Minimum: 80x24 characters
   - Recommended: 120x40 characters

3. **Reset TUI state**:
   ```bash
   orchestra clean
   orchestra tui
   ```

### Error: Keyboard shortcuts not working

**Symptoms**: Keys don't trigger expected actions.

**Solutions**:

1. **Check terminal settings**:
   - Ensure "Alt" key is passed through
   - Disable conflicting terminal shortcuts

2. **Use alternative keys**:
   - `Ctrl+C` - Quit
   - `Ctrl+N` - New task
   - `Ctrl+H` - History
   - `Ctrl+S` - Settings

---

## Git Integration Issues

### Error: Auto-commit fails

**Symptoms**: Git commit fails after successful orchestration.

**Solutions**:

1. **Check git config**:

   ```bash
   git config user.name
   git config user.email
   ```

2. **Configure git**:

   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

3. **Disable auto-commit**:
   ```json
   {
     "git": {
       "autoCommit": false
     }
   }
   ```

### Error: GitHub integration fails

**Symptoms**: `gh` CLI commands fail.

**Solutions**:

1. **Install gh CLI**:

   ```bash
   # macOS
   brew install gh

   # Linux
   curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
   ```

2. **Authenticate**:

   ```bash
   gh auth login
   ```

3. **Verify authentication**:
   ```bash
   gh auth status
   ```

---

## Recovery Mode Looping

### Error: Recovery mode won't converge

**Symptoms**: Auditor keeps rejecting fixes, Recovery Mode loops.

**Solutions**:

1. **Increase max iterations**:

   ```json
   {
     "execution": {
       "maxIterations": 15
     }
   }
   ```

2. **Increase recovery timeout**:

   ```json
   {
     "recovery": {
       "timeout": 600000
     }
   }
   ```

3. **Check auditor prompts**:
   - May be too strict
   - Consider custom rules in `.orchestra/rules/`

4. **Enable partial recovery**:

   ```json
   {
     "recovery": {
       "autoRevertOnFailure": false
     }
   }
   ```

5. **Manual intervention**:
   ```bash
   orchestra plan
   # Review and edit plan
   orchestra resume
   ```

---

## Getting Help

If none of these solutions work:

1. **Run diagnostics**:

   ```bash
   orchestra doctor
   ```

2. **Check logs**:

   ```bash
   cat .orchestra/session.json
   ```

3. **Enable debug mode**:

   ```bash
   ORCHESTRA_DEBUG=1 orchestra start "your task"
   ```

4. **Report issues**:
   - GitHub: https://github.com/orchestra/issues
   - Include: OS, Node version, error message, config

---

## See Also

- [Development Guide](development.md)
- [Testing Guide](testing.md)
- [Performance Guide](performance.md)
- [API Documentation](../api/README.md)
