# AGENTS.md

This file provides guidance to AI Core when working with code in this repository.

---

## Project Overview

**AI-Core** is a universal toolkit of **45 skills** and **3 subagents** that provides enterprise-ready patterns for full-stack development. It syncs automatically to multiple dependent projects (pivotforge, vellum, el_buen_esposo, OmniForge, orchestra).

**Status**: 100% Production Ready | **Technical Debt**: 0 items | **Test Coverage**: 100%

---

## Common Commands

```bash
# Run all tests
bash tests/run-all-tests.sh

# Run specific test suite
bash tests/run-all-tests.sh --suite integration
bash tests/run-all-tests.sh --suite unit
bash tests/run-all-tests.sh --suite validation

# Validate all skills
bash tests/validate-skills.sh

# Validate a single skill
bash tests/validate-skills.sh security

# Run with verbose output
bash tests/run-all-tests.sh --verbose

# Generate JUnit XML reports
bash tests/run-all-tests.sh --xml-output ./reports

# Installation (when ai-core is cloned into another project)
cd ai-core && rm -rf .git && ./run.sh
```

---

## Architecture

```
ai-core/
├── SKILLS/                    # 45 universal skills (YAML frontmatter + Markdown)
│   └── {skill-name}/
│       └── SKILL.md           # Each skill follows this structure
├── SUBAGENTS/universal/       # 3 specialized agents
│   ├── master-orchestrator.md # Central coordinator for all requests
│   ├── actor-critic-learner.md # RL-based orchestration optimization
│   └── permission-gatekeeper.md # Safety validation layer
├── tests/
│   ├── run-all-tests.sh       # Main test runner
│   ├── validate-skills.sh     # Skill structure validation
│   └── integration/           # Integration test suites
├── docs/adr/                   # 8 Architecture Decision Records
├── templates/                  # Templates for AGENTS.md, CLAUDE.md, etc.
└── .github/workflows/         # 11 automated workflows (sync, metrics, security)
```

### Key Patterns

1. **Master Orchestrator Flow**: User Request → Intent Analysis → Safety Check → Resource Selection → Execution
2. **Skill Structure**: YAML frontmatter (name, description, license, metadata) + Markdown documentation
3. **Multi-Platform Support**: Symlinks to SKILLS/ and SUBAGENTS/ for Claude, Cursor, Gemini, Antigravity, Codex, OpenCode

---

## Critical Rules

### Zero Tolerance for Technical Debt

- No TODOs or FIXMEs left for later
- Remove redundant code immediately
- All new code MUST have tests

### File Creation Rules

**Before creating ANY .md file:**

1. Check if similar file exists
2. Prefer updating existing files:
   - Progress/achievements → `CHANGELOG.md`
   - Guides → `TUTORIAL.md`
   - Architecture → `ARCHITECTURE.md`
3. **Forbidden patterns** (require explicit approval): `PROGRESS-*.md`, `*REPORT.md`, `*ACHIEVEMENT*.md`, `*TASKS*.md`
4. **Allowed without asking**: `SKILLS/*/SKILL.md`, `tests/*.test.md`, `docs/adr/*.md`

### Skill Changes Must Be Retrocompatible

Changes to SKILLS/ affect 5+ dependent projects. Always consider multi-project impact.

---

## Dangerous Mode Protection

**Always active, even with `--dangerously-skip-permissions`:**

```bash
# FORBIDDEN without explicit user confirmation:
git push --force, git reset --hard, git clean -fd
rm -rf /, rm -rf *, dd if=/dev/zero
DROP DATABASE, TRUNCATE TABLE, DELETE without WHERE
terraform destroy -auto-approve, kubectl delete namespace
chmod 777, systemctl stop critical-services
```

When in doubt, use AskUserQuestion tool.

---

## Skill Auto-Invocation

Invoke the corresponding skill BEFORE performing these actions:

| Action                       | Skill                  |
| ---------------------------- | ---------------------- |
| Authentication/authorization | `security`             |
| Writing tests                | `testing`              |
| UI components                | `frontend`             |
| API endpoints                | `backend`              |
| Database schema/queries      | `database`             |
| Git commits/PRs              | `git-workflow`         |
| CI/CD pipelines              | `ci-cd`                |
| Monitoring/alerting          | `observability`        |
| GDPR/HIPAA/PCI-DSS           | `compliance`           |
| LLM APIs/RAG                 | `ai-ml`                |
| **Destructive operations**   | `dangerous-mode-guard` |

Full list of 45 skills in `SKILLS/` directory.

---

## Reading Order

```
1. CLAUDE.md          ← This file (always first)
2. AGENTS.md          ← Project-specific guide
3. SKILLS/{skill}/    ← Universal patterns as needed
4. SUBAGENTS/         ← Specialized agents as needed
```

---

## Learning System (Optional)

AI-Core includes an Actor-Critic RL system for orchestration optimization:

```bash
# Enable experience collection
export AI_CORE_LEARNING_MODE=shadow

# Train policy (when ready)
python -m learning.train --data data/experience_buffer/

# Deploy learned policy (10% learned / 90% rules)
export AI_CORE_LEARNING_MODE=ab_test
```

Modes: `disabled` (default) → `shadow` → `ab_test` → `production`
