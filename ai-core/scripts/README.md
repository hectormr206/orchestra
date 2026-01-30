# Scripts - AI-Core Maintenance

Utility scripts for maintaining AI-Core and preventing file clutter.

---

## 📁 Available Scripts

### 1. check-redundant-files.sh

**Purpose:** Detect potentially redundant .md files in the project root.

**Usage:**
```bash
./scripts/check-redundant-files.sh
```

**What it checks:**
- Files with forbidden patterns (PROGRESS-, REPORT, ACHIEVEMENT, etc.)
- Total count of .md files (warns if >15)
- Files not modified in >6 months

**Output example:**
```
🔍 Checking for Potentially Redundant .md Files
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking root directory:
  ⚠️  PROGRESS-REPORT.md (contains: PROGRESS-)

Checking total .md files in root:
  Total: 20 files
  ⚠️  Consider consolidating files (>15 is too many)

💡 Recommendations:
   - Consolidate into CHANGELOG.md (for progress/achievements)
   - Consolidate into TUTORIAL.md (for guides)
```

---

## 🔧 Git Hooks

### pre-commit

**Location:** `.git/hooks/pre-commit`

**Purpose:** Automatically check for redundant files before each commit.

**How it works:**
1. Runs automatically when you run `git commit`
2. Checks if any .md files being committed match forbidden patterns
3. Prompts you to confirm if potentially redundant files are found

**Usage:**
```bash
# Normal commit (hook runs automatically)
git add .
git commit -m "Add new skill"

# Bypass the hook if needed
git commit --no-verify -m "Force commit"
```

**Patterns it checks:**
- `PROGRESS-` → Use `CHANGELOG.md`
- `*REPORT*` → Use `CHANGELOG.md` or don't create
- `ACHIEVEMENT` → Use `CHANGELOG.md`
- `TASKS-` → Use `CHANGELOG.md`
- `PROPOSAL*` → Use ADRs in `docs/adr/`
- `*FINAL*` → Use `CHANGELOG.md`

**Allowed files (exceptions):**
- `DEBT-TRACKING.md`
- `MAINTENANCE_PLAN.md`

---

## 🚀 Quick Start

### 1. Install the pre-commit hook (already done)

```bash
# The hook is already installed at .git/hooks/pre-commit
# To reinstall if needed:
cp .git/hooks/pre-commit .git/hooks/pre-commit.bak
# Then re-run the setup
```

### 2. Check for redundant files manually

```bash
./scripts/check-redundant-files.sh
```

### 3. Regular maintenance (recommended: monthly)

```bash
# Run the check script
./scripts/check-redundant-files.sh

# Review and consolidate any found files
# Example: mv PROGRESS-REPORT.md archive/
```

---

## 📖 Related Documentation

- **LLM-FILE-CREATION-GUIDELINES.md** - Complete guide on preventing file clutter
- **LLM-EXAMPLES.md** - Practical examples of file consolidation
- **CLAUDE.md** - LLM instructions including file creation rules

---

## 🎯 Best Practices

### 1. Before creating new .md files

```bash
# Check if similar file exists
ls -1 *.md | grep -i "keyword"

# Ask: Can I use an existing file instead?
- Progress/achievements → CHANGELOG.md
- Guides/tutorials → TUTORIAL.md
- Architecture → ARCHITECTURE.md
- Proposals → docs/adr/*.md
```

### 2. When committing

```bash
# The pre-commit hook will warn you
# If you see a warning, consider:
# 1. Consolidating the file
# 2. Moving to archive/
# 3. Not committing it at all
```

### 3. Regular cleanup

```bash
# Run monthly
./scripts/check-redundant-files.sh

# Review obsolete files
find . -name "*.md" -mtime +180

# Consolidate or archive as needed
```

---

## 🛠️ Troubleshooting

### Hook not running?

```bash
# Check if hook is executable
ls -l .git/hooks/pre-commit

# Make executable if needed
chmod +x .git/hooks/pre-commit
```

### Bypass the hook temporarily?

```bash
git commit --no-verify -m "Your message"
```

### Script permission denied?

```bash
chmod +x scripts/check-redundant-files.sh
```

---

**Last updated:** 2025-01-24
