# Contributing to {{PROJECT_NAME}}

> Thank you for your interest in contributing to {{PROJECT_NAME}}! We welcome contributions from everyone.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Review Process](#review-process)

---

## 🤝 Code of Conduct

Please be respectful and constructive. We aim to maintain a welcoming and inclusive community.

- Use inclusive language
- Be respectful of differing viewpoints
- Gracefully accept constructive criticism
- Focus on what is best for the community

---

## 🚀 Getting Started

### Prerequisites

{{PREREQUISITES}}

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/{{PROJECT_NAME}}.git
cd {{PROJECT_NAME}}

# Install dependencies
{{INSTALL_DEPENDENCIES_CMD}}

# Create a branch
git checkout -b feature/your-feature-name

# Start development
{{DEV_START_COMMAND}}
```

### Development Tools

{{DEVELOPMENT_TOOLS}}

---

## 🔄 Development Workflow

### 1. Find an Issue

- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to claim it
- If no issue exists, create one first to discuss your idea

### 2. Create a Branch

```bash
# Branch naming convention
git checkout -b <type>/<short-description>

# Examples:
git checkout -b feature/user-authentication
git checkout -b fix/login-bug
git checkout -b docs/update-readme
```

**Branch Types:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### 3. Make Your Changes

{{MAKE_CHANGES_GUIDE}}

### 4. Test Your Changes

```bash
# Run linter
{{LINT_COMMAND}}

# Run tests
{{TEST_COMMAND}}

# Run with coverage
{{TEST_COVERAGE_COMMAND}}
```

### 5. Commit Your Changes

See [Commit Guidelines](#commit-guidelines) below.

### 6. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request via GitHub UI or CLI
gh pr create --title "feat: add user authentication" --body "Description"
```

---

## 📐 Coding Standards

### Code Style

We use {{LINTER}} for code formatting and linting.

```bash
# Check code style
{{LINT_CHECK_COMMAND}}

# Auto-fix issues
{{LINT_FIX_COMMAND}}
```

### Naming Conventions

{{NAMING_CONVENTIONS}}

### File Organization

{{FILE_ORGANIZATION}}

### Documentation

- Add JSDoc/TSDoc comments to functions
- Update README.md for user-facing changes
- Add comments to complex logic
- Keep documentation in sync with code

---

## 🧪 Testing Guidelines

### Test Structure

{{TEST_STRUCTURE}}

### Writing Tests

{{WRITING_TESTS}}

### Coverage Requirements

- **Minimum coverage**: {{COVERAGE_THRESHOLD}}%
- **New features**: 100% coverage required
- **Bug fixes**: Add regression tests

### Running Tests

```bash
# All tests
{{TEST_ALL_COMMAND}}

# Unit tests
{{TEST_UNIT_COMMAND}}

# Integration tests
{{TEST_INTEGRATION_COMMAND}}

# E2E tests
{{TEST_E2E_COMMAND}}

# Watch mode
{{TEST_WATCH_COMMAND}}
```

---

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Commit Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

```bash
# Feature
git commit -m "feat(auth): add OAuth2 login support"

# Bug fix
git commit -m "fix(api): resolve race condition in user creation"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api)!: change response format

BREAKING CHANGE: API responses now use camelCase instead of snake_case"
```

### Commit Message Best Practices

- Use the imperative mood ("add" not "added" or "adds")
- Limit the first line to 72 characters
- Reference issues in the body: "Closes #123"
- Explain **what** and **why**, not **how**

---

## 🔀 Pull Request Process

### PR Title

Use the same format as commit messages:

```
feat(auth): add OAuth2 login support
fix(api): resolve race condition in user creation
```

### PR Description Template

Use our PR template which includes:

- Summary of changes
- Type of change (feature/fix/refactor/etc.)
- Breaking changes (if any)
- Testing performed
- Screenshots (for UI changes)
- Related issues

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added to complex logic
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Coverage maintained or improved
- [ ] Only one commit (squash if needed)

### PR Size

Keep PRs small and focused:

- **Ideal**: 1-3 files, < 200 lines
- **Acceptable**: < 500 lines
- **Too large**: Consider splitting into multiple PRs

---

## 👀 Review Process

### Automated Checks

All PRs must pass:

- ✅ Linting
- ✅ Type checking
- ✅ All tests
- ✅ Coverage threshold
- ✅ Security scan
- ✅ Build successful

### Review Criteria

Maintainers will review for:

1. **Code Quality**: Clean, readable, maintainable code
2. **Functionality**: Does it solve the problem?
3. **Testing**: Adequate test coverage
4. **Documentation**: Docs updated
5. **Performance**: No performance regressions
6. **Security**: No security vulnerabilities
7. **Breaking Changes**: Properly documented

### Review Timeline

- Initial review: {{REVIEW_TIMELINE}}
- Follow-up reviews: {{FOLLOW_UP_TIMELINE}}
- Urgent fixes: Label as `priority: high`

### Addressing Feedback

- Make requested changes
- Respond to all comments
- Mark conversations as resolved
- Request re-review when ready

---

## 🏷️ Labels

### Priority Labels

- `priority: critical` - Production down, security issue
- `priority: high` - Important but not blocking
- `priority: medium` - Normal priority
- `priority: low` - Nice to have

### Status Labels

- `status: in progress` - Being worked on
- `status: ready for review` - Needs review
- `status: approved` - Approved to merge
- `status: changes requested` - Needs changes
- `status: blocked` - Blocked by something

### Type Labels

- `type: feature` - New feature
- `type: fix` - Bug fix
- `type: docs` - Documentation
- `type: refactor` - Refactoring
- `type: test` - Tests
- `type: chore` - Maintenance

---

## 🎯 Areas Looking for Help

{{AREAS_LOOKING_FOR_HELP}}

### Good First Issues

Search for issues labeled:
- `good first issue`
- `help wanted`
- `up-for-grabs`

---

## 📚 Additional Resources

- [Architecture Documentation]({{ARCHITECTURE_DOC_LINK}})
- [API Documentation]({{API_DOC_LINK}})
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)

---

## 💬 Getting Help

- **GitHub Issues**: Post questions with the `question` label
- **Discussions**: Use GitHub Discussions for general questions
- **Discord/Slack**: {{COMMUNITY_CHAT_URL}}
- **Email**: {{CONTACT_EMAIL}}

---

## 🎉 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Celebrated in our community

---

**Thank you for contributing to {{PROJECT_NAME}}! 🙏**

---

**EOF**
