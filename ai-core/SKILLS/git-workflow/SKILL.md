---
name: git-workflow
description: >
  Git best practices: conventional commits, branching strategies, PR templates,
  code review standards, conflict resolution.
  Trigger: When committing code, creating PRs, reviewing code, or resolving merge conflicts.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Writing commit messages"
    - "Creating pull requests"
    - "Reviewing code"
    - "Resolving merge conflicts"
allowed-tools: [Read,Edit,Write,Bash,Grep]
---

## When to Use

- Writing commit messages
- Creating/merging branches
- Submitting pull requests
- Reviewing code
- Resolving conflicts

---

## Critical Patterns

### > **ALWAYS**

1. **Conventional Commits**
   ```
   <type>[optional scope]: <description>

   [optional body]

   [optional footer(s)]

   Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build

   Examples:
   feat(auth): add OAuth2 login
   fix(api): handle null response from user service
   docs(readme): update installation instructions
   test(users): add integration tests for signup
   ```

2. **Branch naming**
   ```
   feature/add-user-dashboard
   bugfix/login-validation-error
   hotfix/security-patch-2024
   release/v1.2.0
   ```

3. **Branch Protection Rules**
   - Require PR approval
   - Require status checks to pass
   - Require up-to-date branch
   - Block force pushes
   - Restrict who can push to main

4. **Meaningful PR titles**
   ```
   feat: add user authentication (conventional commit style)
   Fix: Login fails when email contains + sign
   ```

5. **Fill PR template completely**
   ```markdown
   ## Context
   <!-- Why this change -->

   ## Description
   <!-- What was changed -->

   ## Testing
   <!-- How it was tested -->

   ## Checklist
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] No breaking changes (or list them)
   ```

6. **Keep PRs small**
   - < 400 lines of code ideal
   - Single logical change
   - One reviewer can understand quickly

7. **Code Review Guidelines**
   - Be respectful and constructive
   - Explain WHY, not just WHAT
   - Approve if "good enough to ship"
   - Request changes for blocking issues only

### > **NEVER**

1. **Don't commit directly to main**
   ```bash
   # WRONG
   git checkout main
   git commit -am "hotfix"

   # RIGHT
   git checkout -b hotfix/urgent-patch
   # ... work ...
   git checkout main
   git merge hotfix/urgent-patch
   ```

2. **Don't commit secrets**
   ```bash
   # Pre-commit hook to prevent
   git diff --staged | grep -i "password\|secret\|api_key"
   ```

3. **Don't merge without review**
   - Even your own code needs review

4. **Don't leave WIP commits**
   ```bash
   # BEFORE merging
   git rebase -i HEAD~3
   # Squash "wip", "fix typo", "another fix" into one
   ```

---

## Branching Strategies

### Feature Branch Workflow (Most Common)
```
main
  ↑
  └── feature/add-login (PR)
  ↑
  └── feature/add-signup (PR)
```

### GitFlow (For releases)
```
main (production)
  ↑
develop
  ↑
  ├── feature/new-ui
  ├── feature/api-v2
  └── hotfix/security-patch
```

### Trunk-Based Development (For large teams)
```
main (always deployable)
  ├── feature/auth (short-lived, < 1 day)
  ├── feature/payments (feature flags)
  └── feature/dashboard
```

---

## Git Commands Reference

```bash
# Interactive rebase (clean up commits)
git rebase -i HEAD~3

# Cherry-pick specific commit
git cherry-pick abc123

# Stash changes temporarily
git stash push -m "work in progress"

# Resolve conflicts using merge tool
git mergetool

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Change last commit message
git commit --amend

# Sync with remote
git fetch --prune && git pull --rebase
```

---

## Resources

- **Conventional Commits**: [conventionalcommits.org](https://www.conventionalcommits.org)
- **GitHub Flow**: [guides.github.com/introduction/flow](https://guides.github.com/introduction/flow)
- **Git Cheatsheet**: [education.github.com/git-cheat-sheet-education-pdf](https://education.github.com/git-cheat-sheet-education-pdf)

---

## Examples

### Example 1: Commit Message Following Conventional Commits

**User request:** "Commit changes for a new feature"

```bash
# Format: <type>(<scope>): <subject>

# Feature
git commit -m "feat(auth): add OAuth2 Google login"

# Bug fix
git commit -m "fix(api): resolve race condition in order creation"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Refactoring
git commit -m "refactor(database): extract query builder to separate module"

# Performance
git commit -m "perf(cache): implement Redis caching for user sessions"

# Test
git commit -m "test(auth): add tests for password reset flow"

# Build
git commit -m "build(ci): add GitHub Actions workflow for deployment"

# Revert
git commit -m "revert: feat(auth): remove OAuth2 (caused issues)"

# Multi-line commit
git commit -m "feat(user): add profile picture upload

- Add multipart/form-data support
- Implement image validation and resizing
- Add tests for upload endpoint

Closes #123"
