# AI-Core Testing - Quick Reference

Quick reference guide for running and understanding ai-core tests.

## Quick Start

```bash
# Run all tests
make test
# OR
./tests/run-all-tests.sh

# Run specific test suite
make test-integration
make test-unit
make test-validation

# Run with verbose output
make test-verbose

# Generate CI/CD reports
make test-ci
```

## Test Suites Overview

### Integration Tests (`tests/integration/`)

**Purpose**: Validate agent files and metadata

**Tests**:
- YAML frontmatter parsing
- Required fields validation
- Tools array validation
- Platform configuration
- Skills reference validation
- Agent type validation

**Count**: ~8 tests per agent file

**Run time**: Fast (< 1 second per agent)

### Unit Tests (`tests/unit/`)

**Purpose**: Test installation scripts in isolation

**Tests**:
- setup.sh functionality
- install-subagents.sh functionality
- Symlink vs copy logic
- Force flag behavior
- Idempotency
- Platform detection

**Count**: ~13 tests

**Run time**: Fast (~2-3 seconds)

### Validation Tests (`tests/validation/`)

**Purpose**: End-to-end installation validation

**Tests**:
- Clean installation
- Re-installation idempotency
- Force flag overwriting
- Copy vs symlink modes
- Platform-specific installations
- File structure validation
- Error handling

**Count**: ~13 tests

**Run time**: Medium (~5-10 seconds)

## Understanding Test Results

### Console Output

```
[TEST 1] Valid YAML frontmatter: security-specialist.md ... PASS
[TEST 2] Required fields present: security-specialist.md ... PASS
[TEST 3] Tools array valid: security-specialist.md ... PASS
...
```

- **PASS** - Test succeeded
- **FAIL** - Test failed (details shown)
- **SKIP** - Test skipped (e.g., wrong platform)

### Summary

```
════════════════════════════════════════════════════════════
TEST SUMMARY
════════════════════════════════════════════════════════════
Total tests:  42
Passed:       40
Failed:       2
════════════════════════════════════════════════════════════
```

Exit codes:
- `0` - All tests passed
- `1` - Some tests failed

## Common Commands

### Development Workflow

```bash
# During development - run quick tests
make test-quick

# Before committing - run all tests
make test

# Before pushing - run with verbose output
make test-verbose
```

### Debugging

```bash
# Run tests and keep artifacts
make test-debug

# Artifacts location:
# /tmp/ai-core-tests-*
# /tmp/ai-core-validation-*

# Check logs
cat tests/reports/integration_*.log
cat tests/reports/unit_*.log
cat tests/reports/validation_*.log
```

### CI/CD Integration

```bash
# Generate JUnit XML reports
make test-ci

# Reports location:
# tests/reports/xml/*.xml
```

## Test Files Reference

### Main Test Runner

- **File**: `tests/run-all-tests.sh`
- **Purpose**: Run all or specific test suites
- **Usage**: `./tests/run-all-tests.sh [options]`

### Integration Tests

- **File**: `tests/integration/agent-tests.test.sh`
- **Purpose**: Validate agent files
- **Tests**: YAML parsing, field validation, skill references
- **Direct usage**: `./tests/integration/agent-tests.test.sh`

### Unit Tests

- **File**: `tests/unit/install-scripts.test.sh`
- **Purpose**: Test installation scripts
- **Tests**: Script functionality, mocking, platform logic
- **Direct usage**: `./tests/unit/install-scripts.test.sh`

### Validation Tests

- **File**: `tests/validation/installation-validation.test.sh`
- **Purpose**: End-to-end installation testing
- **Tests**: Real installations in isolated environments
- **Direct usage**: `./tests/validation/installation-validation.test.sh`

## Environment Variables

```bash
# Specify ai-core path
export AI_CORE_PATH="/path/to/ai-core"

# Enable verbose output
export VERBOSE=true

# Keep test artifacts for debugging
export KEEP_TEST_ARTIFACTS=true

# Custom temporary directory
export TEST_TMP_DIR="/tmp/my-tests"
```

## Test Structure

```
tests/
├── integration/
│   └── agent-tests.test.sh       # Agent validation
├── unit/
│   └── install-scripts.test.sh   # Script unit tests
├── validation/
│   └── installation-validation.test.sh  # E2E tests
├── fixtures/
│   └── test-agent.md             # Test data
├── reports/                      # Test reports
│   ├── integration_*.log
│   ├── unit_*.log
│   ├── validation_*.log
│   └── xml/                      # JUnit XML (optional)
├── run-all-tests.sh              # Main runner
├── test.mk                       # Makefile
└── README.md                     # Full documentation
```

## Continuous Integration

### GitHub Actions

```yaml
- name: Run tests
  run: make test-ci

- name: Upload results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: test-results
    path: tests/reports/xml/*.xml
```

### GitLab CI

```yaml
test:
  script:
    - make test-ci
  artifacts:
    when: always
    reports:
      junit: tests/reports/xml/*.xml
```

### Travis CI

```yaml
script:
  - make test-ci

after_success:
  - echo "All tests passed!"

after_failure:
  - cat tests/reports/*.log
```

## Troubleshooting

### Permission Denied

```bash
chmod +x tests/**/*.test.sh
chmod +x tests/run-all-tests.sh
```

### Command Not Found

Install required tools:
```bash
# Ubuntu/Debian
sudo apt-get install bash grep sed awk find

# macOS
brew install bash grep gnu-sed gawk findutils
```

### Tests Fail on Windows

Use WSL or Git Bash:
```bash
# In WSL
bash ./tests/run-all-tests.sh

# In Git Bash
bash ./tests/run-all-tests.sh
```

### Slow Tests

Run quick tests during development:
```bash
make test-quick  # Only unit tests
```

## Test Coverage

Current coverage targets:

- **Agent files**: 100% of agents validated
- **Installation scripts**: All code paths tested
- **Platforms**: Linux, macOS, Windows (WSL)
- **Error handling**: All error paths tested

## Contributing Tests

When adding new features:

1. **Write tests first** (TDD)
2. **Add integration tests** for new agents
3. **Add unit tests** for new scripts
4. **Add validation tests** for new scenarios
5. **Update documentation**

### Test Template

```bash
#!/bin/bash
set -euo pipefail

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

test_start() {
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -ne "Test $TESTS_RUN: $1 ... "
}

test_pass() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "PASS"
}

test_fail() {
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "FAIL: $1"
}

# Your test
test_example() {
    test_start "Example test"
    if [[ condition ]]; then
        test_pass
    else
        test_fail "Reason"
    fi
}

main() {
    test_example
    echo "Total: $TESTS_RUN"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    [[ $TESTS_FAILED -eq 0 ]]
}

main "$@"
```

## Additional Resources

- **Full documentation**: `tests/README.md`
- **Test runner**: `./tests/run-all-tests.sh --help`
- **Makefile**: `make help` or `cat tests/test.mk`
- **Source code**: Check inline comments in test files

## Support

For issues:
1. Check `tests/README.md`
2. Run with `--verbose`
3. Check test logs in `tests/reports/`
4. Open an issue on GitHub
