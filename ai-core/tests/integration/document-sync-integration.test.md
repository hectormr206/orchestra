# Integration Tests: Document Sync

## Test Suite: Document Sync Automation

### Test 1: Post-Task Documentation Update

**Scenario:** Task completed successfully

**Expected Flow:**
```
Task Completed
    ↓
document-sync auto-invoked
    ↓
Updates:
├── NEXT_STEPS.md
│   ├── Mark [x] completed task
│   ├── Update metrics
│   └── Update timestamp
├── CHANGELOG.md
│   ├── Add entry to [Unreleased]
│   └── Categorize change
├── README.md
│   └── Update skill count if changed
└── DEBT-TRACKING.md
    └── Mark completed debt items
    ↓
Verification
├── All files valid
├── No broken links
└── Consistent data
    ↓
Report
└── Show changes made
```

**Validation:**
- ✅ All files updated
- ✅ No duplicates
- ✅ Consistent metrics
- ✅ Valid syntax

### Test 2: Commit-Based Documentation Update

**Scenario:** Commit with conventional message pushed

**Expected Flow:**
```
Commit: "feat: add OAuth2 support"
    ↓
document-sync detects commit
    ↓
Analyzes commit message
├── Type: feat → Added
├── Scope: OAuth2
└── Description: add support
    ↓
Updates CHANGELOG.md
```markdown
## [Unreleased]

### Added
- OAuth2 support for authentication
```
    ↓
Verifies not duplicate
    ↓
Result: CHANGELOG updated
```

**Validation:**
- ✅ Commit categorized correctly
- ✅ CHANGELOG entry added
- ✅ No duplicates
