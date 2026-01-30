---
name: dependency-management
description: >
  Secure dependency management: SBOM, vulnerability scanning, license compliance,
  supply chain security, dependency updates, lock files, version pinning.
  Trigger: When managing dependencies or securing the supply chain.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Adding or updating dependencies"
    - "Auditing dependencies for vulnerabilities"
    - "Checking license compliance"
    - "Generating SBOM"
    - "Securing supply chain"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Adding new dependencies
- Updating existing dependencies
- Auditing for security vulnerabilities
- Ensuring license compliance
- Generating Software Bill of Materials (SBOM)
- Implementing supply chain security

---

## Critical Patterns

### > **ALWAYS**

1. **Use lock files**
   ```
   ┌─────────────────────────────────────────────┐
   │ LOCK FILES ARE MANDATORY                    │
   │                                             │
   │ npm        → package-lock.json              │
   │ yarn       → yarn.lock                      │
   │ pnpm       → pnpm-lock.yaml                 │
   │ pip        → requirements.txt (pinned)      │
   │ poetry     → poetry.lock                    │
   │ go         → go.sum                         │
   │ cargo      → Cargo.lock                     │
   │ composer   → composer.lock                  │
   │                                             │
   │ COMMIT lock files to version control!       │
   └─────────────────────────────────────────────┘
   ```

2. **Pin dependency versions**
   ```json
   // WRONG: Allows any compatible version
   {
     "dependencies": {
       "lodash": "^4.17.0",
       "express": "~4.18.0"
     }
   }

   // RIGHT: Exact versions in lock file
   // Use ranges in package.json but verify lock
   {
     "dependencies": {
       "lodash": "4.17.21",
       "express": "4.18.2"
     }
   }
   ```

3. **Scan for vulnerabilities regularly**
   ```bash
   # Run in CI/CD pipeline
   npm audit --audit-level=high
   pip-audit
   safety check
   snyk test
   trivy fs .
   ```

4. **Generate and maintain SBOM**
   ```bash
   # CycloneDX format (recommended)
   npx @cyclonedx/cyclonedx-npm --output-file sbom.json

   # SPDX format
   syft . -o spdx-json > sbom.spdx.json
   ```

5. **Review before adding dependencies**
   ```
   BEFORE ADDING A DEPENDENCY, CHECK:

   □ Is it actively maintained? (last commit < 6 months)
   □ Does it have good security track record?
   □ How many dependencies does it pull in?
   □ What license does it use?
   □ How many weekly downloads?
   □ Is there a lighter alternative?
   □ Can you implement it yourself?
   ```

### > **NEVER**

1. **Ignore vulnerability warnings**
2. **Use deprecated packages**
3. **Install from untrusted sources**
4. **Commit secrets in dependencies**
5. **Allow arbitrary code execution in install scripts**
6. **Use * or latest as version**

---

## Vulnerability Management

### Severity Levels

| Level | CVSS Score | Action |
|-------|------------|--------|
| **Critical** | 9.0-10.0 | Fix immediately (24h) |
| **High** | 7.0-8.9 | Fix within 7 days |
| **Medium** | 4.0-6.9 | Fix within 30 days |
| **Low** | 0.1-3.9 | Fix within 90 days |

### CI/CD Integration

```yaml
# .github/workflows/security.yml
name: Dependency Security

on:
  push:
    paths:
      - '**/package.json'
      - '**/package-lock.json'
      - '**/requirements.txt'
      - '**/poetry.lock'
  schedule:
    - cron: '0 9 * * 1'  # Weekly Monday 9am

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Node.js
      - name: npm audit
        run: npm audit --audit-level=high
        continue-on-error: true

      # Python
      - name: pip-audit
        run: |
          pip install pip-audit
          pip-audit -r requirements.txt

      # Multi-language scanner
      - name: Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'

      # Snyk (requires SNYK_TOKEN)
      - name: Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Automated Updates

```yaml
# .github/dependabot.yml
version: 2
updates:
  # npm
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    groups:
      production-dependencies:
        patterns:
          - "*"
        exclude-patterns:
          - "@types/*"
          - "eslint*"
          - "prettier*"
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]

  # Python
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"

  # Docker
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## License Compliance

### License Categories

```
┌─────────────────────────────────────────────┐
│ PERMISSIVE (Generally safe)                 │
│ MIT, BSD, Apache 2.0, ISC, Unlicense        │
│ → Can use in proprietary software           │
├─────────────────────────────────────────────┤
│ WEAK COPYLEFT (Use with care)               │
│ LGPL, MPL, EPL                              │
│ → Must share modifications to library       │
├─────────────────────────────────────────────┤
│ STRONG COPYLEFT (Consult legal)             │
│ GPL, AGPL                                   │
│ → May require open-sourcing your code       │
├─────────────────────────────────────────────┤
│ PROPRIETARY / UNKNOWN                       │
│ Custom, No license                          │
│ → Cannot use without explicit permission    │
└─────────────────────────────────────────────┘
```

### License Scanning

```bash
# Node.js
npx license-checker --production --summary
npx license-checker --production --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC"

# Python
pip-licenses --allow-only="MIT License;Apache Software License;BSD License"

# Go
go-licenses check ./...

# Multi-language
fossa analyze
```

### License Policy File

```yaml
# .fossa.yml
version: 3
targets:
  analyze:
    - type: npm
      path: ./frontend
    - type: pip
      path: ./backend

policies:
  allow:
    - MIT
    - Apache-2.0
    - BSD-2-Clause
    - BSD-3-Clause
    - ISC

  deny:
    - GPL-2.0
    - GPL-3.0
    - AGPL-3.0

  flag:
    - LGPL-2.1
    - LGPL-3.0
    - MPL-2.0
```

---

## Software Bill of Materials (SBOM)

### Why SBOM?

```
┌─────────────────────────────────────────────┐
│ SBOM REQUIREMENTS                           │
│                                             │
│ US Executive Order 14028 (2021)             │
│ → Federal software must have SBOM           │
│                                             │
│ EU Cyber Resilience Act (2024)              │
│ → All digital products need SBOM            │
│                                             │
│ BENEFITS:                                   │
│ ✓ Fast vulnerability response               │
│ ✓ License compliance verification           │
│ ✓ Supply chain transparency                 │
│ ✓ Audit requirements                        │
└─────────────────────────────────────────────┘
```

### SBOM Formats

| Format | Description | Use Case |
|--------|-------------|----------|
| **CycloneDX** | OWASP standard | Security focus |
| **SPDX** | Linux Foundation | License focus |
| **SWID** | ISO standard | Enterprise/gov |

### Generating SBOM

```bash
# Using Syft (multi-language)
syft . -o cyclonedx-json > sbom.cyclonedx.json
syft . -o spdx-json > sbom.spdx.json

# Using CycloneDX tools
# Node.js
npx @cyclonedx/cyclonedx-npm --output-file sbom.json

# Python
cyclonedx-py -r requirements.txt -o sbom.json

# Go
cyclonedx-gomod app > sbom.json

# Docker image
syft myimage:latest -o cyclonedx-json > sbom.json
```

### SBOM in CI/CD

```yaml
# .github/workflows/sbom.yml
name: Generate SBOM

on:
  release:
    types: [published]

jobs:
  sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          format: cyclonedx-json
          output-file: sbom.cyclonedx.json

      - name: Upload SBOM as release asset
        uses: softprops/action-gh-release@v1
        with:
          files: sbom.cyclonedx.json
```

---

## Supply Chain Security

### Attack Vectors

```
┌─────────────────────────────────────────────┐
│ SUPPLY CHAIN ATTACK VECTORS                 │
├─────────────────────────────────────────────┤
│ 1. Typosquatting                            │
│    → lodahs instead of lodash               │
│                                             │
│ 2. Dependency confusion                     │
│    → Internal package name on public npm    │
│                                             │
│ 3. Compromised maintainer                   │
│    → Malicious update pushed               │
│                                             │
│ 4. Install scripts                          │
│    → Code runs during npm install           │
│                                             │
│ 5. Abandoned packages                       │
│    → Taken over by attacker                 │
└─────────────────────────────────────────────┘
```

### Protection Measures

```bash
# 1. Use npm provenance (npm 9.5+)
npm publish --provenance

# 2. Verify package signatures
npm audit signatures

# 3. Disable install scripts
npm config set ignore-scripts true

# 4. Use private registry
npm config set registry https://registry.company.com

# 5. Pin dependencies with exact versions
npm config set save-exact true
```

### Private Registry Configuration

```yaml
# .npmrc
# Use private registry for @company scope
@company:registry=https://npm.company.com/
//npm.company.com/:_authToken=${NPM_TOKEN}

# Fallback to public npm for others
registry=https://registry.npmjs.org/
```

```ini
# pip.conf
[global]
index-url = https://pypi.company.com/simple/
extra-index-url = https://pypi.org/simple/
trusted-host = pypi.company.com
```

---

## Dependency Update Strategy

### Update Categories

```
SECURITY UPDATES
→ Apply immediately (automated)
→ No breaking changes expected

PATCH UPDATES (x.x.PATCH)
→ Apply weekly (automated)
→ Bug fixes only

MINOR UPDATES (x.MINOR.x)
→ Apply monthly (semi-automated)
→ New features, backward compatible

MAJOR UPDATES (MAJOR.x.x)
→ Apply quarterly (manual review)
→ Breaking changes expected
```

### Update Workflow

```yaml
# renovate.json (Renovate Bot)
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:base"],
  "schedule": ["before 9am on monday"],
  "timezone": "America/New_York",
  "packageRules": [
    {
      "matchUpdateTypes": ["patch", "pin", "digest"],
      "automerge": true,
      "automergeType": "branch"
    },
    {
      "matchUpdateTypes": ["minor"],
      "automerge": true,
      "automergeType": "pr",
      "requiredStatusChecks": ["test", "lint"]
    },
    {
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "labels": ["breaking-change"]
    },
    {
      "matchPackagePatterns": ["eslint", "prettier", "@types/*"],
      "groupName": "dev dependencies",
      "automerge": true
    }
  ],
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"]
  }
}
```

---

## Minimal Dependencies

### Principles

```
┌─────────────────────────────────────────────┐
│ DEPENDENCY MINIMIZATION                     │
├─────────────────────────────────────────────┤
│ 1. Do you really need it?                   │
│    → Can you write 20 lines instead?        │
│                                             │
│ 2. Check transitive dependencies            │
│    → Small package with 100 deps = bad      │
│                                             │
│ 3. Use native APIs when possible            │
│    → fetch() instead of axios               │
│    → Date.toISOString() instead of moment   │
│                                             │
│ 4. Bundle only what you use                 │
│    → Tree-shaking, code splitting           │
│                                             │
│ 5. Evaluate alternatives                    │
│    → dayjs vs moment (2KB vs 67KB)          │
│    → date-fns (modular)                     │
└─────────────────────────────────────────────┘
```

### Analyzing Dependencies

```bash
# Node.js - analyze bundle size
npx source-map-explorer dist/bundle.js

# Node.js - find unused dependencies
npx depcheck

# Node.js - why is this package here?
npm explain package-name
npm ls package-name

# Python - dependency tree
pipdeptree

# Go - dependency graph
go mod graph
```

---

## Commands

```bash
# Audit vulnerabilities
npm audit
pip-audit
safety check
snyk test
trivy fs .

# Update dependencies
npm update
npm outdated
pip list --outdated
pip-compile --upgrade

# License checking
npx license-checker --production
pip-licenses

# Generate SBOM
syft . -o cyclonedx-json
npx @cyclonedx/cyclonedx-npm

# Clean unused
npx depcheck
pip-autoremove

# Verify integrity
npm audit signatures
pip hash -a sha256 package.whl
```

---

## Resources

- **OWASP Dependency-Check**: [owasp.org/dependency-check](https://owasp.org/www-project-dependency-check/)
- **Snyk**: [snyk.io](https://snyk.io/)
- **SBOM**: [ntia.gov/sbom](https://www.ntia.gov/sbom)
- **CycloneDX**: [cyclonedx.org](https://cyclonedx.org/)
- **SPDX**: [spdx.dev](https://spdx.dev/)
- **Renovate**: [docs.renovatebot.com](https://docs.renovatebot.com/)

---

## Examples

### Example 1: Setting Up SBOM Generation

**User request:** "Generate SBOM for our Node.js application"

```bash
# 1. Install CycloneDX tool
npm install -g @cyclonedx/cyclonedx-cli

# 2. Generate SBOM from package-lock.json
cyclonedx-node --output-file sbom.json --format json

# 3. Verify SBOM
cat sbom.json | jq '.components | length'

# 4. Add to CI/CD pipeline
# .github/workflows/sbom.yml
name: Generate SBOM

on:
  push:
    branches: [main]
  pull_request:

jobs:
  sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Generate SBOM
        run: |
          npm install
          npx @cyclonedx/cyclonedx-cli \
            --input-file package-lock.json \
            --output-file sbom.json \
            --format json
      
      - name: Upload SBOM artifact
        uses: actions/upload-artifact@v3
        with:
          name: sbom
          path: sbom.json
      
      - name: Check for vulnerabilities
        run: |
          npm audit --json > audit-report.json
          cat audit-report.json | jq '.vulnerabilities'
