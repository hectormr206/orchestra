---
name: code-quality
description: >
  Code quality patterns: linting, formatting, static analysis, code review,
  SonarQube, pre-commit hooks, coding standards, technical debt management.
  Trigger: When setting up code quality tools or reviewing code.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Setting up linting or formatting"
    - "Configuring pre-commit hooks"
    - "Reviewing code quality"
    - "Setting up static analysis"
    - "Managing technical debt"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Setting up a new project
- Configuring linting and formatting
- Setting up pre-commit hooks
- Integrating static analysis tools
- Establishing code review guidelines
- Managing technical debt

---

## Critical Patterns

### > **ALWAYS**

1. **Automate formatting**
   ```json
   // package.json
   {
     "scripts": {
       "format": "prettier --write .",
       "format:check": "prettier --check .",
       "lint": "eslint . --ext .ts,.tsx",
       "lint:fix": "eslint . --ext .ts,.tsx --fix"
     }
   }
   ```

2. **Use pre-commit hooks**
   ```yaml
   # .pre-commit-config.yaml
   repos:
     - repo: https://github.com/pre-commit/pre-commit-hooks
       rev: v4.5.0
       hooks:
         - id: trailing-whitespace
         - id: end-of-file-fixer
         - id: check-yaml
         - id: check-json
         - id: check-added-large-files

     - repo: https://github.com/pre-commit/mirrors-prettier
       rev: v3.1.0
       hooks:
         - id: prettier

     - repo: https://github.com/pre-commit/mirrors-eslint
       rev: v8.56.0
       hooks:
         - id: eslint
           additional_dependencies:
             - eslint@8.56.0
             - typescript
             - '@typescript-eslint/parser'
             - '@typescript-eslint/eslint-plugin'
   ```

3. **Fail CI on quality issues**
   ```yaml
   # .github/workflows/quality.yml
   name: Code Quality

   on: [push, pull_request]

   jobs:
     quality:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'

         - run: npm ci

         - name: Check formatting
           run: npm run format:check

         - name: Lint
           run: npm run lint

         - name: Type check
           run: npm run typecheck

         - name: Run tests
           run: npm test
   ```

4. **Document coding standards**
   ```markdown
   # Coding Standards

   ## Naming Conventions
   - `camelCase` for variables and functions
   - `PascalCase` for classes and components
   - `UPPER_SNAKE_CASE` for constants
   - `kebab-case` for files

   ## File Organization
   - One component per file
   - Co-locate tests with source
   - Group by feature, not type
   ```

5. **Track and manage technical debt**
   ```
   // EXAMPLE: Bad code patterns to avoid
   // EXAMPLE: // TODO: Refactor this - complexity too high
   // EXAMPLE: // FIXME: Race condition under high load
   // EXAMPLE: // HACK: Workaround for library bug #123
   // @deprecated Use newFunction instead

   Track in issue tracker with labels:
   - tech-debt
   - refactor
   - cleanup
   ```

### > **NEVER**

1. **Commit code that doesn't pass linting**
2. **Disable rules project-wide without justification**
3. **Skip code review for "small" changes**
4. **Let technical debt accumulate without tracking**
5. **Mix formatting styles in the same project**

---

## Linting Configuration

### ESLint (TypeScript)

```javascript
// eslint.config.js (ESLint 9+ flat config)
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',

      // React
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.js'],
  }
);
```

### Python (Ruff)

```toml
# pyproject.toml
[tool.ruff]
target-version = "py311"
line-length = 100

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # Pyflakes
    "I",    # isort
    "B",    # flake8-bugbear
    "C4",   # flake8-comprehensions
    "UP",   # pyupgrade
    "S",    # flake8-bandit (security)
    "T20",  # flake8-print
    "SIM",  # flake8-simplify
]
ignore = [
    "E501",  # line too long (handled by formatter)
]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S101"]  # Allow assert in tests

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
```

### Go (golangci-lint)

```yaml
# .golangci.yml
linters:
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck
    - unused
    - gofmt
    - goimports
    - misspell
    - unconvert
    - gosec
    - prealloc

linters-settings:
  errcheck:
    check-type-assertions: true
  govet:
    check-shadowing: true
  gofmt:
    simplify: true

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - errcheck
```

---

## Formatting Configuration

### Prettier (JavaScript/TypeScript)

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

```
// .prettierignore
node_modules
dist
coverage
*.min.js
package-lock.json
```

### EditorConfig (Universal)

```ini
# .editorconfig
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.py]
indent_size = 4

[Makefile]
indent_style = tab
```

---

## Static Analysis

### SonarQube Configuration

```properties
# sonar-project.properties
sonar.projectKey=my-project
sonar.projectName=My Project
sonar.projectVersion=1.0

sonar.sources=src
sonar.tests=tests
sonar.exclusions=**/node_modules/**,**/dist/**

sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.testExecutionReportPaths=test-report.xml

# Quality gate thresholds
sonar.qualitygate.wait=true
```

### GitHub Actions Integration

```yaml
# .github/workflows/sonar.yml
name: SonarCloud

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  sonarcloud:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npm test -- --coverage

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### Quality Metrics

```
┌─────────────────────────────────────────────┐
│ KEY QUALITY METRICS                         │
├─────────────────────────────────────────────┤
│ Code Coverage         → 80%+ recommended    │
│ Duplications          → <3% of lines        │
│ Cognitive Complexity  → <15 per function    │
│ Cyclomatic Complexity → <10 per function    │
│ Technical Debt Ratio  → <5%                 │
│ Security Hotspots     → 0 (review all)      │
│ Code Smells           → Address regularly   │
└─────────────────────────────────────────────┘
```

---

## Code Review Guidelines

### Checklist for Reviewers

```markdown
## Code Review Checklist

### Functionality
- [ ] Does it work as intended?
- [ ] Are edge cases handled?
- [ ] Is error handling appropriate?

### Code Quality
- [ ] Is the code readable and self-documenting?
- [ ] Are names meaningful and consistent?
- [ ] Is there any duplication that should be extracted?
- [ ] Is the code testable?

### Security
- [ ] Is input validated?
- [ ] Are there any injection vulnerabilities?
- [ ] Is sensitive data handled securely?

### Performance
- [ ] Are there any obvious performance issues?
- [ ] Is caching used appropriately?
- [ ] Are database queries optimized?

### Testing
- [ ] Are tests included?
- [ ] Do tests cover the happy path and edge cases?
- [ ] Are tests readable and maintainable?

### Documentation
- [ ] Is complex logic documented?
- [ ] Are public APIs documented?
- [ ] Is the README updated if needed?
```

### Review Etiquette

```
DO:
✓ Be kind and constructive
✓ Ask questions instead of making demands
✓ Explain the "why" behind suggestions
✓ Praise good code
✓ Focus on the code, not the person
✓ Use suggestions feature for optional changes

DON'T:
✗ Be condescending
✗ Make personal attacks
✗ Nitpick formatting (automate it)
✗ Block for subjective style preferences
✗ Leave reviews hanging for days
```

### Review Comments

```javascript
// GOOD comments:
// "Consider using optional chaining here to avoid the null check"
// "This could throw if `user` is undefined - should we handle that?"
// "Nice refactor! This is much cleaner than before."

// BAD comments:
// "This is wrong"
// "Why would you do it this way?"
// "..."
```

---

## Pre-commit Hooks

### Husky + lint-staged (Node.js)

```json
// package.json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
npm run lint-staged

# .husky/commit-msg
npx commitlint --edit $1
```

### Commitlint

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci', 'build']
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 72]
  }
};
```

---

## Technical Debt Management

### Tracking Debt

```yaml
# .github/ISSUE_TEMPLATE/tech-debt.yml
name: Technical Debt
description: Track technical debt items
labels: ["tech-debt"]
body:
  - type: dropdown
    id: type
    attributes:
      label: Type of Debt
      options:
        - Code smell
        - Missing tests
        - Outdated dependency
        - Performance issue
        - Security vulnerability
        - Documentation
        - Architecture

  - type: dropdown
    id: priority
    attributes:
      label: Priority
      options:
        - High (blocking)
        - Medium (should fix)
        - Low (nice to have)

  - type: textarea
    id: description
    attributes:
      label: Description
      description: What is the technical debt?

  - type: textarea
    id: impact
    attributes:
      label: Impact
      description: How does this affect development?

  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: How should this be fixed?
```

### Debt Paydown Strategy

```
┌─────────────────────────────────────────────┐
│ TECHNICAL DEBT STRATEGY                     │
├─────────────────────────────────────────────┤
│ 1. Boy Scout Rule                           │
│    → Leave code cleaner than you found it   │
│                                             │
│ 2. 20% Rule                                 │
│    → Dedicate 20% of sprint to debt         │
│                                             │
│ 3. Debt Sprints                             │
│    → Occasional sprints focused on cleanup  │
│                                             │
│ 4. Track in Backlog                         │
│    → Make debt visible to stakeholders      │
│                                             │
│ 5. Prevent New Debt                         │
│    → Definition of Done includes quality    │
└─────────────────────────────────────────────┘
```

---

## Complexity Analysis

### Cyclomatic Complexity

```python
# High complexity (bad)
def process_order(order):
    if order.status == 'pending':
        if order.payment_verified:
            if order.items_in_stock:
                if order.shipping_address:
                    if order.total > 0:
                        # Process...
                        pass

# Refactored (good)
def process_order(order):
    validation_errors = validate_order(order)
    if validation_errors:
        return OrderResult.error(validation_errors)

    return fulfill_order(order)

def validate_order(order):
    validators = [
        (lambda o: o.status == 'pending', 'Invalid status'),
        (lambda o: o.payment_verified, 'Payment not verified'),
        (lambda o: o.items_in_stock, 'Items not in stock'),
        (lambda o: o.shipping_address, 'Missing shipping address'),
        (lambda o: o.total > 0, 'Invalid total'),
    ]
    return [msg for check, msg in validators if not check(order)]
```

---

## Commands

```bash
# Linting
npm run lint
npx eslint . --ext .ts,.tsx --fix
ruff check . --fix
golangci-lint run

# Formatting
npm run format
npx prettier --write .
ruff format .
gofmt -w .

# Pre-commit
pre-commit install
pre-commit run --all-files

# Complexity analysis
npx eslint . --rule 'complexity: ["error", 10]'
radon cc src/ -a -s

# Find technical debt markers (shell example)
# EXAMPLE: grep -rn "TODO\|FIXME\|HACK" --include="*.ts" src/
```

---

## Resources

- **ESLint**: [eslint.org](https://eslint.org/)
- **Prettier**: [prettier.io](https://prettier.io/)
- **SonarQube**: [sonarqube.org](https://www.sonarqube.org/)
- **Pre-commit**: [pre-commit.com](https://pre-commit.com/)
- **Ruff**: [docs.astral.sh/ruff](https://docs.astral.sh/ruff/)

---

## Examples

### Example 1: Setting Up Pre-commit Hooks

**User request:** "Configure pre-commit hooks for a TypeScript project"

**Implementation:**

```bash
# 1. Install pre-commit
pip install pre-commit
npm install -D husk lint-staged

# 2. Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'CONFIG'
repos:
  # General hooks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: check-merge-conflict
      - id: debug-statements

  # TypeScript/JavaScript
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        types: [file]
        files: \.(ts|tsx|js|jsx)$
        additional_dependencies:
          - eslint@8.56.0
          - '@typescript-eslint/eslint-plugin'
          - '@typescript-eslint/parser'

  # Prettier
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        types_or: [javascript, jsx, ts, tsx, yaml, json]
        exclude: ^package-lock\.json$

  # TypeScript type checking
  - repo: local
    hooks:
      - id: tsc
        name: TypeScript type check
        entry: npx tsc --noEmit
        language: system
        types: [ts, tsx]
        pass_filenames: false

  # Tests
  - repo: local
    hooks:
      - id: jest
        name: Run tests
        entry: npm test --
        language: system
        pass_filenames: false
CONFIG

# 3. Install hooks
pre-commit install

# 4. Optional: Run on all files
pre-commit run --all-files
```

**package.json configuration:**

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,yaml,yml,md}": [
      "prettier --write"
    ]
  },
  "scripts": {
    "prepare": "husky install",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "type-check": "tsc --noEmit"
  }
}
```

**ESLint configuration (.eslintrc.js):**

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'  # Must be last to override other configs
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index',
          'unknown'
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' }
      }
    ]
  }
};
```
