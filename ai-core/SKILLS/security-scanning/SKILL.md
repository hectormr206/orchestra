---
name: security-scanning
description: >
  Automated security scanning and vulnerability management.
  Includes dependency scanning, code analysis, secrets detection, and compliance checking.
  Trigger: Security scans, vulnerability checks, security audits.

license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke: ["Security scan", "vulnerability check", "security audit", "CVE check"]
  tags: [security, vulnerabilities, scanning, compliance, automation]
---

## When to Use

- Running security audits
- Checking for vulnerabilities
- Scanning for leaked secrets
- Verifying compliance
- Reviewing security alerts
- Before deploying to production

## Critical Patterns

> **ALWAYS**:
- Scan dependencies before every deployment
- Check for secrets in commit history
- Review and address CRITICAL vulnerabilities within 24h
- Keep security tools updated
- Scan all environments (dev, staging, prod)
- Document security findings
- Follow security SLAs (CRITICAL: 24h, HIGH: 7 days, MEDIUM: 30 days)
- Use automated scanning in CI/CD pipelines

> **NEVER**:
- Commit credentials or API keys
- Ignore security warnings
- Use deprecated/vulnerable libraries
- Disable security scanners
- Share security reports publicly
- Deploy without security clearance
- Store secrets in code

## Security Scanning Tools

### 1. Dependency Vulnerability Scanning

#### npm audit (JavaScript/Node.js)
```bash
# Run security audit
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Force fix (may break changes)
npm audit fix --force

# Generate JSON report
npm audit --json > audit-report.json

# Check only production dependencies
npm audit --production

# Check specific package
npm audit audit-level=moderate
```

#### Safety (Python)
```bash
# Check Python dependencies
pip install safety
safety check

# Generate JSON report
safety check --json > safety-report.json

# Check requirements.txt
safety check -r requirements.txt
```

#### Cargo audit (Rust)
```bash
# Install cargo-audit
cargo install cargo-audit

# Check for vulnerabilities
cargo audit

# Generate JSON report
cargo audit --json > audit-report.json
```

#### Snyk (Multi-language)
```bash
# Install Snyk
npm install -g snyk

# Authenticate
snyk auth

# Test for vulnerabilities
snyk test

# Monitor dependencies
snyk monitor

# Generate report
snyk test --json > snyk-report.json
```

### 2. Static Application Security Testing (SAST)

#### CodeQL (GitHub)
```yaml
# .github/workflows/codeql.yml
name: CodeQL Analysis
on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: javascript, python
      - uses: github/codeql-action/analyze@v3
```

#### Semgrep
```bash
# Install Semgrep
pip install semgrep

# Run security scans
semgrep --config=auto .

# Generate JSON report
semgrep --json --output=report.json .

# Custom rules
semgrep --config=security-rules.yaml .
```

#### ESLint Security Plugin
```bash
# Install
npm install --save-dev eslint-plugin-security

# Run
npx eslint --plugin security src/

# Configuration
{
  "plugins": ["security"],
  "extends": ["plugin:security/recommended"]
}
```

### 3. Secrets Detection

#### GitLeaks
```bash
# Install GitLeaks
brew install gitleaks

# Scan repository
gitleaks detect --source . --report-path gitleaks-report.json

# Scan commit history
gitleaks detect --source . --log-opts="--all"

# Custom configuration
gitleaks detect --config gitleaks-config.toml
```

#### Trivy
```bash
# Scan filesystem
trivy fs .

# Scan container image
trivy image node:20

# Generate SARIF report
trivy fs --format sarif --output trivy-results.sarif .
```

#### Custom Secret Scanner
```bash
#!/bin/bash
# scan-secrets.sh

PATTERNS=(
  "password\s*=\s*['\"][^'\"]+['\"]"
  "api[_-]?key\s*=\s*['\"][^'\"]+['\"]"
  "secret[_-]?key\s*=\s*['\"][^'\"]+['\"]"
  "token\s*=\s*['\"][^'\"]+['\"]"
  "aws[_-]?access[_-]?key[_-]?id"
  "private[_-]?key"
  "sk_live_[a-zA-Z0-9]{24,}"
  "ghp_[a-zA-Z0-9]{36,}"
)

for pattern in "${PATTERNS[@]}"; do
  git log -p --all -S "$pattern" | grep -i "$pattern" && echo "⚠️  Found: $pattern"
done
```

### 4. Infrastructure Scanning

#### Terraform Security Scan
```bash
# Check Terraform configs
terraform fmt -check
terraform init
terraform validate

# Security scanning with tfsec
brew install tfsec
tfsec .

# Generate JSON report
tfsec --format json --output tfsec-report.json .
```

#### Kubernetes Security Scan
```bash
# Scan K8s manifests
kubectl apply --dry-run=server -f deployment.yaml

# Use kube-score
kube-score score deployment.yaml

# Use KubeSec
curl -X POST --data-binary @deployment.yaml https://kubesec.io/scan
```

#### Docker Security Scan
```bash
# Scan Docker image
docker scan myapp:latest

# Use Trivy
trivy image myapp:latest

# Build with security scanning
docker build --security-opt=no-new-privileges .
```

## Security Scanning Workflow

### 1. Pre-Commit Scanning
```bash
# .git/hooks/pre-commit
#!/bin/bash
npm audit --production || exit 1
npm run lint || exit 1
npm run test || exit 1
```

### 2. CI/CD Pipeline Scanning
```yaml
# .github/workflows/security-scan.yml
name: Security Scanning

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 9 * * 1'  # Weekly

jobs:
  security-scan:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      # Dependency scanning
      - name: npm audit
        run: npm audit --production
        continue-on-error: true

      # SAST scanning
      - name: CodeQL Analysis
        uses: github/codeql-action/analyze@v3

      # Secrets scanning
      - name: Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      # Upload results
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
```

### 3. Weekly Security Scanning
```bash
#!/bin/bash
# weekly-security-scan.sh

echo "### 🔒 Weekly Security Scan" > security-report.md
echo "" >> security-report.md

# 1. Dependency vulnerabilities
echo "## Dependencies" >> security-report.md
npm audit --json > audit.json
CRITICAL=$(cat audit.json | jq '.vulnerabilities | map(select(.severity == "critical")) | length')
echo "- Critical: $CRITICAL" >> security-report.md

# 2. Secrets detection
echo "## Secrets" >> security-report.md
gitleaks detect --source . --report-path gitleaks.json
if [ -s gitleaks.json ]; then
  echo "⚠️  Potential secrets found" >> security-report.md
fi

# 3. Code security issues
echo "## Code Security" >> security-report.md
semgrep --json --output=semgrep.json .
ISSUES=$(cat semgrep.json | jq '.results | length')
echo "- Issues found: $ISSUES" >> security-report.md

# 4. Infrastructure security
echo "## Infrastructure" >> security-report.md
tfsec . --format json --output=tfsec.json
INFRA_ISSUES=$(cat tfsec.json | jq 'length')
echo "- Terraform issues: $INFRA_ISSUES" >> security-report.md

# 5. Generate summary
echo "" >> security-report.md
echo "## Summary" >> security-report.md
echo "- Total vulnerabilities: $((CRITICAL + ISSUES + INFRA_ISSUES))" >> security-report.md
```

## Security SLAs (Service Level Agreements)

| Severity | Response Time | Examples |
|----------|---------------|----------|
| 🔴 CRITICAL | 24 hours | CVE with exploit, secrets leaked, auth bypass |
| 🟠 HIGH | 7 days | SQL injection possible, XSS vulnerability |
| 🟡 MEDIUM | 30 days | Outdated crypto, missing headers |
| 🟢 LOW | 90 days | Minor config issues, dev-only warnings |

## Common Vulnerabilities

### OWASP Top 10

#### 1. Broken Access Control
```javascript
// ❌ VULNERABLE
app.get('/admin/:userId', (req, res) => {
  const userId = req.params.userId
  res.send(getAdminData(userId))  // No auth check
})

// ✅ SECURE
app.get('/admin/:userId', authenticate, isAdmin, (req, res) => {
  if (req.user.id !== req.params.userId) return 403
  res.send(getAdminData(userId))
})
```

#### 2. Cryptographic Failures
```javascript
// ❌ VULNERABLE
const hash = crypto.createHash('md5').update(password).digest('hex')

// ✅ SECURE
const hash = await bcrypt.hash(password, 12)
```

#### 3. Injection (SQL, NoSQL, Command)
```javascript
// ❌ VULNERABLE
db.query(`SELECT * FROM users WHERE id = ${userId}`)

// ✅ SECURE
db.query('SELECT * FROM users WHERE id = ?', [userId])
```

#### 4. Insecure Design
```javascript
// ❌ VULNERABLE
// No rate limiting on auth endpoint
app.post('/login', loginHandler)

// ✅ SECURE
const rateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 })
app.post('/login', rateLimit, loginHandler)
```

#### 5. Security Misconfiguration
```javascript
// ❌ VULNERABLE
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

// ✅ SECURE
app.use(helmet())  // Security headers
app.use(express.urlencoded({ extended: false }))
```

#### 6. Vulnerable Components
```bash
# Check for vulnerable dependencies
npm audit

# Update to secure versions
npm update
```

#### 7. Authentication Failures
```javascript
// ❌ VULNERABLE
// Allows weak passwords
if (password.length < 6) throw Error('Too short')

// ✅ SECURE
const zxcvbn = require('zxcvbn')
if (zxcvbn(password).score < 3) throw Error('Too weak')
```

## Incident Response

### Security Incident Workflow

```bash
# 1. Detect
# Automated alert received from security scan

# 2. Assess severity
SEVERITY=$(determine_severity "$ALERT")
echo "Severity: $SEVERITY"

# 3. Containment
if [ "$SEVERITY" == "CRITICAL" ]; then
  # Disable affected feature
  kubectl scale deployment MyApp --replicas=0
fi

# 4. Remediation
# Apply patch or workaround
git apply security-patch.patch
kubectl apply -f deployment.yaml

# 5. Recovery
# Restore normal operations
kubectl scale deployment MyApp --replicas=3

# 6. Post-incident review
# Create incident report
gh issue create \
  --title "Security Incident: $ALERT" \
  --body "## Timeline
...
## Root Cause
...
## Resolution
...
## Prevention
..."
```

## Commands

```bash
# Full security scan
npm audit && npm audit fix && gitleaks detect --source . && semgrep --config=auto .

# Quick dependency check
npm outdated

# Check for secrets
git log -p --all -S "password" | grep "password"

# Scan Docker image
trivy image myapp:latest

# Scan Terraform
tfsec .

# Generate security report
snyk test --json > security-report.json
```

## Related Skills

- **security**: Comprehensive security patterns
- **dependency-updates**: Vulnerable dependency updates
- **ci-cd**: Automated security scanning in pipelines
- **infrastructure**: Secure infrastructure practices

---

## Examples

### Example 1: GitHub Actions Security Workflow

```yaml
# .github/workflows/security-scan.yml
name: Security Scanning

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 6 * * 1'  # Every Monday at 6 AM

jobs:
  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
  
  codeql-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript, python
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
  
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Scan for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          extra_args: --only-verified
