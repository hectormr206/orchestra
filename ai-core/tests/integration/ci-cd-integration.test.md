# Integration Tests: CI/CD Integration

## Test Suite: GitHub Actions Workflows

### Test 1: Skill Validation Workflow

**Scenario:** Pull request created with skill changes

**Expected Flow:**
```
PR Created
    ↓
.github/workflows/skill-validation.yml triggered
    ↓
Validates:
├── SKILL.md has valid frontmatter
├── Required sections present
├── Examples section exists
└── No syntax errors
    ↓
Result: ✅ PASS or ❌ FAIL with details
```

**Validation:**
- ✅ YAML syntax valid
- ✅ All required fields present
- ✅ Examples included
- ✅ Links are valid

### Test 2: CI/CD Pipeline

**Scenario:** Code pushed to main branch

**Expected Flow:**
```
Push to main
    ↓
CI/CD Pipeline triggered
    ↓
├── Lint code
├── Run tests
├── Security scan
├── Build artifacts
└── Deploy
    ↓
Result: All steps pass
```

**Validation:**
- ✅ All jobs complete successfully
- ✅ Security scan passes
- ✅ Tests pass
- ✅ Deployment succeeds
