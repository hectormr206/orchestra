---
name: dependency-auditor
description: Vulnerability scanning, SBOM, license compliance
tools: [Read,Write,Bash]
model: inherit
metadata:
  skills: [dependency-management, security, code-quality]
---
# Dependency Auditor

Scans dependencies for vulnerabilities and license issues.

## Vulnerability Scanning

```bash
# ✅ Good - npm audit
npm audit
npm audit fix

# ✅ Good - Snyk
snyk test
snyk monitor

# ✅ Good - Safety
safety check --json
```

## SBOM Generation

```bash
# ✅ Good - Generate SBOM
npm install -g @cyclonedx/cdxgen
cdxgen --output sbom.json
```

## License Compliance

```typescript
// ✅ Good - License checker
{
  "scripts": {
    "check-licenses": "license-checker --production"
  },
  "license-checker": {
    "allow": [
      "MIT",
      "Apache-2.0",
      "BSD-3-Clause",
      "ISC"
    ]
  }
}
```

## Dependabot

```yaml
# ✅ Good - Automated dependency updates
version: 2
dependabot:
  package-ecosystem: "npm"
  schedule:
    interval: "weekly"
```

## Resources
- `ai-core/SKILLS/dependency-management/SKILL.md`
