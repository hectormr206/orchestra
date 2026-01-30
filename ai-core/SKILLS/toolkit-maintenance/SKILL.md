---
name: toolkit-maintenance
description: >
  Internal guide for maintaining and releasing AI-Core, including the automated
  maintenance system, workflows, installer, and release processes.
  Trigger: Maintaining ai-core, updating workflows, releasing new versions.

license: Apache-2.0
metadata:
  author: ai-core
  version: "2.0"
  scope: [root]
  auto_invoke: ["Update ai-core", "maintain ai-core", "release ai-core", "update workflows"]
  tags: [maintenance, ai-core, workflows, release, automation]
---

## When to Use

- Working directly on the ai-core repository
- Updating maintenance workflows
- Releasing new versions of ai-core
- Modifying the installation script (run.sh)
- Debugging sync or update issues
- Adding new skills or subagents to ai-core

## Critical Patterns

> **ALWAYS**:
- Test `run.sh` locally before pushing changes
- Verify workflows have proper permissions
- Update CHANGELOG.md when making significant changes
- Use `link_or_copy` in setups to support Windows/Linux
- Follow the 8-step installation flow in run.sh
- Keep .projects-list updated with registered projects
- Test workflows with act or in a test repository first
- Document breaking changes in MAINTENANCE_PLAN.md

> **NEVER**:
- Hardcode user paths in scripts (use `$HOME` or relative paths)
- Commit secrets or tokens to the repo
- Skip testing workflows after modifications
- Change workflow permissions without understanding security implications
- Remove skills or subagents without deprecation
- Update dependencies without running full test suite
- Break backward compatibility without major version bump

## Architecture Overview

### 1. AI-Core Structure

```
ai-core/
├── run.sh                          # ⭐ Main installer (only script)
├── .projects-list                  # Registry of projects using ai-core
├── MAINTENANCE_PLAN.md             # Master maintenance plan
├── SCRIPTS_FINAL_STATE.md          # Simplification documentation
├── SYNC.md                         # Sync documentation
│
├── SKILLS/                         # 33 universal skills
│   ├── skill-authoring/           # How to create skills
│   ├── toolkit-maintenance/       # This file
│   ├── dependency-updates/        # Maintenance automation
│   ├── technical-debt/            # Debt tracking
│   ├── security-scanning/         # Security scans
│   └── [28 more skills...]
│
├── SUBAGENTS/                      # 28 agents
│   ├── workflow/
│   │   └── maintenance-coordinator.md
│   └── [27 more agents...]
│
└── .github/workflows/              # 9 automation workflows
    ├── notify-projects.yml         # Push model notifications
    ├── check-dependencies.yml      # Weekly dependency checks
    ├── security-scanning.yml       # Security scans
    ├── metrics.yml                 # Project metrics
    ├── weekly-report.yml           # Weekly reports
    ├── self-update.yml             # AI-Core self-updates
    ├── changelog.yml               # Auto-generate changelog
    ├── promote-skill.yml           # Skill promotion from projects
    └── receive-ai-core-updates.yml # Receive updates in projects
```

### 2. Installation Flow (run.sh)

**Entry point**: `run.sh` from within ai-core

**8 Steps**:
1. Detect parent directory
2. Create AGENTS.md, CLAUDE.md, GEMINI.md in project root
3. Create .cursorrules for Cursor Editor
4. Create .claude/ directory with skills and agents symlinks
5. Create .github/workflows/ directory
6. Copy maintenance workflows to project
7. Register project in ai-core/.projects-list
8. Display summary and next steps

**Usage**:
```bash
cd /path/to/project/ai-core
./run.sh
```

**Platform Support**:
- Linux/macOS: Uses symlinks (`ln -s`)
- Windows: Uses copies (`cp -r`) - auto-detected

### 3. Maintenance System (7 Workflows)

#### Automated Maintenance Schedule

| Day | Time (UTC) | Workflow | Purpose |
|-----|------------|----------|---------|
| Monday | 09:00 | check-dependencies.yml | Detect outdated/abandoned packages |
| Wednesday | 09:00 | security-scanning.yml | Security audits and vulnerability scans |
| Friday | 17:00 | weekly-report.yml | Generate weekly maintenance report |
| Sunday | 08:00 | self-update.yml | Update ai-core itself (main repo only) |
| Daily | 10:00 | metrics.yml | Collect project metrics |
| On push | - | notify-projects.yml | Notify projects of ai-core updates |
| On push | - | changelog.yml | Auto-generate CHANGELOG.md |

#### Workflow Descriptions

**notify-projects.yml**:
- Trigger: Push to main with changes in SKILLS/, SUBAGENTS/, run.sh, etc.
- Reads .projects-list
- Creates issue in each registered project
- Includes commit SHA and change summary

**check-dependencies.yml**:
- Trigger: Weekly (Monday 9 AM UTC)
- Runs npm audit, npm outdated
- Detects abandoned libraries (>180 days no commits)
- Creates/updates dependency health issue

**security-scanning.yml**:
- Trigger: Weekly (Wednesday 9 AM UTC)
- Runs npm audit, CodeQL, Trivy
- Scans for secrets in commit history
- Uploads SARIF to GitHub Security tab

**metrics.yml**:
- Trigger: Daily (10 AM UTC)
- Collects code coverage, technical debt metrics
- Analyzes dependency count and size
- Generates quality metrics dashboard

**weekly-report.yml**:
- Trigger: Weekly (Friday 5 PM UTC)
- Summarizes commits, issues, PRs
- Checks dependency status
- Lists technical debt items
- Provides recommendations

**self-update.yml**:
- Trigger: Weekly (Sunday 8 AM UTC)
- Only runs in ai-core main repo
- Pulls latest changes from remote
- Notifies registered projects via notify-projects.yml

**changelog.yml**:
- Trigger: Push to main
- Generates CHANGELOG.md
- Categorizes commits (feat, fix, docs, etc.)
- Commits changelog with [skip ci]

### 4. Propagation System (Push Model)

```
ai-core updated (push to main)
    ↓
notify-projects.yml triggered
    ↓
Reads .projects-list
    ↓
For each project:
  - Creates issue with update notification
  - Includes commit SHA and changes
    ↓
Project receives notification
    ↓
receive-ai-core-updates.yml runs
    ↓
Pulls ai-core changes
    ↓
Updates local files
```

## Common Tasks

### releasing-a-new-version

```bash
# 1. Update version
echo "v2.1.0" > .version

# 2. Update CHANGELOG.md
# (auto-generated by changelog.yml, but review it)

# 3. Create git tag
git tag -a v2.1.0 -m "Release v2.1.0: Add automated maintenance system"

# 4. Push tag
git push origin v2.1.0

# 5. Verify workflows run
# Check https://github.com/hectormr206/ai-core/actions
```

### testing-installer

```bash
# Create a test project
mkdir -p ../test-project
cd ../test-project
git init
echo "# Test Project" > README.md

# Clone and install ai-core
git clone https://github.com/hectormr206/ai-core.git ai-core
cd ai-core && ./run.sh

# Verify installation
cd ..
ls -la | grep -E "AGENTS.md|CLAUDE.md|GEMINI.md|.cursorrules"
ls -la .claude/
ls -la .github/workflows/

# Test in Windows (Git Bash)
# Should use copies instead of symlinks
```

### adding-new-skills

```bash
# 1. Use skill-authoring skill for guidance
# Or use the template from skill-authoring/SKILL.md

# 2. Create skill directory
mkdir -p ai-core/SKILLS/my-new-skill

# 3. Write SKILL.md following the template
cat > ai-core/SKILLS/my-new-skill/SKILL.md << 'EOF'
---
name: my-new-skill
description: >
  Short description of what this skill does.
  Trigger: when to invoke automatically.

license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke: ["Action triggering this skill"]
  tags: [category1, category2]
---

## When to Use
- Use case 1
- Use case 2

## Critical Patterns
> **ALWAYS**:
- Rule 1
- Rule 2

> **NEVER**:
- Anti-pattern 1
- Anti-pattern 2

## Commands
\`\`\`bash
command
\`\`\`

## Related Skills
- **related-skill**: Context
EOF

# 4. Validate skill
# Check YAML syntax
head -20 ai-core/SKILLS/my-new-skill/SKILL.md | yamllint

# Check required fields
grep -E "^name:|^description:|^license:|^metadata:" ai-core/SKILLS/my-new-skill/SKILL.md

# 5. Add to AGENTS.md
# In the appropriate category section

# 6. Test with LLM
# Start a conversation and verify the skill is invoked correctly

# 7. Commit and push
git add ai-core/SKILLS/my-new-skill/
git commit -m "feat: add my-new-skill skill"
git push

# 8. Verify notify-projects.yml runs
# And all registered projects get notified
```

### updating-workflows

```bash
# 1. Test workflow locally with act
brew install act
act -j <workflow-name>

# 2. Or test in a fork repository
git remote add fork https://github.com/your-username/ai-core-fork.git
git push fork main
# Check Actions tab in fork

# 3. Verify workflow permissions
# Check .github/workflows/<workflow>.yml:
# permissions:
#   contents: read
#   issues: write
#   pull-requests: write
#   etc.

# 4. Test with workflow_dispatch
gh workflow run <workflow-name>

# 5. Check logs
gh run list --workflow=<workflow-name>
gh run view <run-id>

# 6. Update to main
git checkout main
git merge <feature-branch>
git push
```

### registering-projects

```bash
# Projects are auto-registered by run.sh
# But can manually add to .projects-list:

# Format: owner/repo:branch
echo "myorg/myproject:main" >> ai-core/.projects-list

# Or with specific branch
echo "myorg/myproject:develop" >> ai-core/.projects-list

# Commit and push
git add .projects-list
git commit -m "chore: register myproject in ai-core"
git push

# Next time ai-core updates, myproject will receive a notification
```

### debugging-sync-issues

```bash
# 1. Check if project is registered
cat ai-core/.projects-list | grep myproject

# 2. Verify ai-core is up to date in the project
cd /path/to/project/ai-core
git status
git log -1

# 3. Check if receive-ai-core-updates.yml exists
cd /path/to/project
ls -la .github/workflows/receive-ai-core-updates.yml

# 4. Check workflow runs
gh run list --workflow=receive-ai-core-updates.yml
gh run view <run-id>

# 5. Check for permission errors
# Workflow needs these permissions:
# permissions:
#   contents: write
#   pull-requests: write

# 6. Manually trigger workflow
gh workflow run receive-ai-core-updates.yml
```

## Configuration Files

### .projects-list Format

```bash
# ai-core Projects Registry
# Format: owner/repo:branch
# One project per line

# Production projects
myorg/project-a:main
myorg/project-b:main

# Development projects
myorg/project-c:develop

# Forks (optional)
user/fork-of-project:main
```

### Workflow Permissions

Standard permissions for maintenance workflows:

```yaml
permissions:
  contents: read        # Read repository contents
  issues: write         # Create/update issues
  pull-requests: write  # Create/update PRs
  security-events: write # Upload security results
  actions: read         # List workflow runs
```

## Troubleshooting

### "Repository not found" in sync

**Cause**:
- Invalid repository format in .projects-list
- Private repo without PAT
- Fork without proper permissions

**Fix**:
```bash
# Verify format
cat .projects-list
# Should be: owner/repo:branch

# Add AI_CORE_PAT for private repos
# In ai-core repo Settings > Secrets > AI_CORE_PAT
# PAT needs repo scope and write access to target repos
```

### Symlink issues on Windows

**Cause**: Windows requires admin privileges for symlinks

**Fix**: Already handled in run.sh
```bash
# run.sh detects Windows and uses copies instead
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    USE_SYMLINKS=false
fi
```

### Workflow not triggering

**Cause**: Path filters don't match

**Fix**: Check workflow triggers
```yaml
on:
  push:
    paths:
      - 'SKILLS/**'
      - 'SUBAGENTS/**'
      - 'run.sh'
```

### Permission denied errors

**Cause**: Insufficient workflow permissions

**Fix**: Update permissions in workflow file
```yaml
permissions:
  contents: write
  pull-requests: write
```

## Release Checklist

Before releasing a new version:

- [ ] run.sh tested on Linux, macOS, and Windows
- [ ] All workflows tested with act or in test repo
- [ ] CHANGELOG.md reviewed and updated
- [ ] .version file updated
- [ ] MAINTENANCE_PLAN.md updated if needed
- [ ] New skills/subagents added to AGENTS.md
- [ ] Documentation updated (README.md, etc.)
- [ ] Test suite passes: `./tests/verify-tests.sh`
- [ ] Release notes prepared
- [ ] Git tag created
- [ ] Tag pushed to origin
- [ ] Verify workflows run successfully
- [ ] Projects receive notifications (check .projects-list)

## Related Skills

- **skill-authoring**: Creating new skills
- **ci-cd**: Workflow best practices
- **documentation**: Documentation standards
- **dependency-updates**: Keeping dependencies updated
- **testing**: Testing your changes

## Commands

```bash
# Test installer locally
cd ai-core && ./run.sh

# Validate all skills
for skill in SKILLS/*/SKILL.md; do
    echo "Checking $skill..."
    head -20 "$skill" | yamllint
done

# Test workflows with act
act -j check-dependencies
act -j notify-projects

# View workflow runs
gh run list --workflow=notify-projects.yml
gh run view <run-id>

# Manually trigger workflow
gh workflow run weekly-report.yml

# Check registered projects
cat .projects-list

# Create new release
git tag -a v2.0.0 -m "Release v2.0.0"
git push origin v2.0.0
```

---

## Examples

### Example 1: Creating a Maintenance Workflow

**User request:** "Automate dependency updates"

```yaml
# .github/workflows/dependencies.yml
name: Dependency Updates

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  workflow_dispatch:

jobs:
  update-dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Update npm dependencies
        run: |
          npm update
          npm audit fix
      
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          branch: deps/update-dependencies
          title: 'chore: update dependencies'
          body: 'Automated dependency update'
          commit-message: 'chore: update dependencies'
