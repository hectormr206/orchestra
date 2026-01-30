---
name: dependency-updates
description: >
  Automated dependency update management following industry best practices.
  Includes safe update flow, rollback automation, abandoned library detection,
  and multi-language support. Trigger: Updating dependencies, checking package health.

license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke: ["Update dependencies", "npm install", "add package", "upgrade package"]
  tags: [dependencies, maintenance, automation, security, npm]
---

## When to Use

- Adding, updating, or removing dependencies
- Checking for outdated packages
- Replacing abandoned libraries
- Resolving dependency conflicts
- Optimizing dependency size

## Critical Patterns

> **ALWAYS**:
- Use the 10-step update flow for any dependency changes
- Create a branch before updating
- Run full test suite (unit + integration + E2E)
- Verify build succeeds
- Create backup files before updating
- Test rollback procedure
- Review changelog for major/minor updates
- Update lockfile (package-lock.json, yarn.lock)
- Document reason for each dependency

> **NEVER**:
- Update dependencies on main branch
- Skip testing after updates
- Update to major versions without impact analysis
- Remove dependencies without verifying usage
- Ignore peer dependency warnings
- Commit sensitive data in .env files
- Use npm install with sudo

## Update Flow (10 Steps)

### Step 1: Detection
```bash
# Check for outdated packages
npm outdated
npx npm-check-updates

# Get detailed info
npx npm-check-updates --format group
```

### Step 2: Impact Analysis
```bash
# Get version diff
npx npm-check-updates --json greatest

# Check what changed
npm view <package> versions --json
npm view <package> time

# Review breaking changes
npm view <package>@<version> | grep -A 20 "BREAKING"
```

### Step 3: Create Branch
```bash
# Create feature branch
git checkout -b feat/dependency-updates-$(date +%Y%m%d)

# Or for specific package
git checkout -b feat/update-<package-name>-to-<version>
```

### Step 4: Backup & Update
```bash
# Create backups
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup

# Update ALL dependencies
npx npm-check-updates -u
npm install

# Or update specific package
npm install <package>@<version>
```

### Step 5: Full Testing
```bash
# Run complete test suite
npm test -- --coverage
npm run test:integration
npm run test:e2e
npm run build
npm run lint

# ALL must pass before continuing
```

### Step 6: Functional Verification
```bash
# Smoke tests
npm run start || npm run dev

# Health checks
curl -f http://localhost:3000/health || exit 1

# Verify critical functionality
npm run test:smoke
```

### Step 7: Create PR (if tests pass)
```bash
# Only create PR if ALL tests pass
gh pr create \
  --title "chore: update dependencies" \
  --body "## Updated Packages

- package@old → package@new
- package2@old → package@new

## Tests
- ✅ Unit tests passing
- ✅ Integration tests passing
- ✅ E2E tests passing
- ✅ Build successful
- ✅ Lint clean

## Changelog
[Include relevant changelog entries]
"
```

### Step 8: Manual Review
- Review the diff
- Check for breaking changes
- Verify test results
- Approve or request changes

### Step 9: Merge (after approval)
```bash
# Only merge after manual approval
git checkout main
git merge feat/dependency-updates-$(date +%Y%m%d)
```

### Step 10: Cleanup
```bash
# Delete branch
git branch -d feat/dependency-updates-$(date +%Y%m%d)

# Remove backups
rm package.json.backup package-lock.json.backup
```

## Rollback Automation

```bash
# Add this to package.json scripts
"scripts": {
  "preupdate": "cp package.json package.json.backup && cp package-lock.json package-lock.json.backup",
  "postupdate": "npm run test || (cp package.json.backup package.json && cp package-lock.json.backup package-lock.json && npm ci && git branch -D $(git branch --show-current))"
}
```

### Rollback Function
```bash
rollback_on_failure() {
    echo "❌ Tests failed. Rolling back..."

    # Restore backups
    cp package.json.backup package.json
    cp package-lock.json.backup package-lock.json

    # Reinstall exact versions
    npm ci

    # Create issue with failure report
    gh issue create \
      --title "❌ Dependency Update Failed" \
      --body "## Update Failed

**Branch**: $(git branch --show-current)
**Commit**: $(git rev-parse HEAD)

## Error
\`\`\`
$(npm test 2>&1)
\`\`\`

## Next Steps
1. Review error logs
2. Fix compatibility issues
3. Retry update
"

    # Delete failed branch
    git checkout main
    git branch -D $(git branch --show-current)

    exit 1
}
```

## Abandoned Library Detection

### Industry Standards
- **Last commit**: 90-180 days (GitHub best practice)
- **Last release**: 180-365 days (npm standard)
- **Open issues**: >50 without response
- **Weekly downloads**: <1000 (low adoption)

### Detection Script
```bash
check_abandoned() {
    local package=$1

    # Get package info
    PKG_INFO=$(npm view "$package" --json)
    REPO_URL=$(echo "$PKG_INFO" | jq -r '.repository.url // ""')

    # Check last release
    LAST_RELEASE=$(echo "$PKG_INFO" | jq -r '.time | .[-1]')
    DAYS_SINCE_RELEASE=$(( ($(date +%s) - $(date -d "$LAST_RELEASE" +%s)) / 86400 ))

    # Check GitHub repo
    if [ -n "$REPO_URL" ]; then
        LAST_COMMIT=$(curl -s "https://api.github.com/repos/$REPO_URL/commits?per_page=1" | jq -r '.[0].commit.committer.date')
        DAYS_SINCE_COMMIT=$(( ($(date +%s) - $(date -d "$LAST_COMMIT" +%s)) / 86400 ))
        OPEN_ISSUES=$(curl -s "https://api.github.com/repos/$REPO_URL" | jq -r '.open_issues_count')
    fi

    # Classify
    if [ $DAYS_SINCE_COMMIT -gt 180 ] && [ $OPEN_ISSUES -gt 50 ]; then
        echo "🔴 CRÍTICO - ABANDONADO: $package"
        echo "   Last commit: $DAYS_SINCE_COMMIT days"
        echo "   Open issues: $OPEN_ISSUES"
    elif [ $DAYS_SINCE_COMMIT -gt 90 ] && [ $OPEN_ISSUES -gt 100 ]; then
        echo "🟡 ALERTA - ESTANCADO: $package"
        echo "   Last commit: $DAYS_SINCE_COMMIT days"
        echo "   Open issues: $OPEN_ISSUES"
    elif [ $DAYS_SINCE_RELEASE -gt 365 ]; then
        echo "⚠️  RIESGO: $package (no release in $DAYS_SINCE_RELEASE days)"
    fi
}
```

### Finding Alternatives
```bash
# Search for alternatives
npm search <keyword>

# Check similar packages
npx npms-cli search <keyword>

# Verify package health
npx npm-check-updates --filter <package>
npm view <package> --json | jq '{homepage, repository, license, maintainers}'
```

## Multi-Language Support

### JavaScript/Node.js (npm)
```bash
npm outdated
npx npm-check-updates -u
npm install
npm audit fix
```

### Python (pip)
```bash
pip list --outdated
pip-install-update -U
pip-audit
```

### Rust (Cargo)
```bash
cargo outdated
cargo update
cargo audit
```

### Go (go)
```bash
go list -u -m all
go get -u ./...
go mod tidy
```

### Ruby (Bundler)
```bash
bundle outdated
bundle update
bundle-audit check --update
```

## Dependency Best Practices

### Version Ranges
```json
{
  "dependencies": {
    "critical-lib": "^1.2.3",    // Patch updates auto
    "stable-lib": "~1.2.3",      // Minor updates auto
    "bleeding-edge": "latest",    // NOT RECOMMENDED
    "exact": "1.2.3",             // Exact version
    "range": ">=1.2.3 <2.0.0"     // Custom range
  }
}
```

### Security
```bash
# Always check for vulnerabilities
npm audit
npm audit fix

# Fix critical vulnerabilities immediately
npm audit fix --force

# Review security advisories
npm view <package> --json | jq '.bugs, .homepage'
```

### Performance
```bash
# Check bundle size
npx cost-of-modules

# Find duplicates
npx depcheck

# Analyze tree
npm ls --depth=0
```

## Monorepo Considerations

```bash
# Lerna (JavaScript monorepos)
npx lerna update

# Nx monorepos
npx nx show projects

# Yarn Workspaces
yarn upgrade-interactive --latest
```

## Example Commands

```bash
# Check all dependencies
npm outdated && npm audit

# Update specific package
npm install package@latest

# Update all (following 10-step flow)
npx npm-check-updates -u && npm install && npm test

# Find abandoned libraries
for pkg in $(npm ls --depth=0 | grep -o '[a-z0-9-]*@[0-9.]*' | cut -d@ -f1); do
    check_abandoned "$pkg"
done

# Check bundle size
npx cost-of-modules
```

## Related Skills

- **security**: Vulnerability scanning, secure dependency practices
- **technical-debt**: Debt tracking and prioritization
- **testing**: Ensuring updates don't break functionality
- **ci-cd**: Automating updates in pipelines

---

## Examples

### Example 1: Automated Dependency Update Workflow

**User request:** "Set up automated dependency updates for Python project"

```yaml
# .github/workflows/dependency-updates.yml
name: Dependency Updates

on:
  schedule:
    - cron: '0 0 * * 1'  # Every Monday at midnight
  workflow_dispatch:

jobs:
  dependabot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Dependabot
        uses: dependabot/dependabot-core-action@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          branch: 'dependabot-updates'
      
      - name: Create PR if updates available
        if: steps.dependabot.outputs.has_updates == 'true'
        uses: peter-evans/create-pull-request@v5
        with:
          branch: dependabot-updates
          title: ' chore: Update dependencies'
          body: |
            Automated dependency update by Dependabot
            
            Changes:
            - Updated Python packages
            - Updated pip requirements
            
            Please review and test before merging.
