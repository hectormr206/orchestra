# AI-Core Project Templates

> Production-ready templates for scaffolding new projects with ai-core.

---

## 📋 Overview

These templates are used by the `project-scaffolder` subagent to create new projects with best practices built-in. All templates include:

- ✅ Comprehensive documentation structure
- ✅ CI/CD pipeline configurations
- ✅ Issue and PR templates
- ✅ Contributing guidelines
- ✅ Project configuration

---

## 📁 Template Structure

```
templates/
├── .ai-core/
│   └── config.yml                # Project configuration with placeholders
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md         # Bug report template
│   │   └── feature_request.md    # Feature request template
│   ├── PULL_REQUEST_TEMPLATE.md  # PR template
│   └── workflows/
│       └── ci.yml                # CI/CD pipeline template
├── CONTRIBUTING.md               # Contributing guidelines template
├── PROJECT.md                    # Main project README template
└── README.md                     # This file
```

---

## 🚀 Usage

### Using the project-scaffolder Subagent

```bash
# From your project directory
cd /path/to/new/project

# Invoke the project-scaffolder
/project-scaffolder Create a new SaaS application with React + Node.js + PostgreSQL
```

The subagent will:
1. Read these templates
2. Replace placeholders with your project details
3. Generate all necessary files
4. Set up the project structure

### Manual Usage

You can also manually use these templates:

```bash
# Copy templates to your project
cp -r ai-core/SUBAGENTS/templates/* /path/to/project/

# Replace placeholders
find /path/to/project -type f -exec sed -i 's/{{PROJECT_NAME}}/MyProject/g' {} \;
```

---

## 🎨 Placeholders

All templates use `{{PLACEHOLDER_NAME}}` format. Common placeholders:

### Project Information

- `{{PROJECT_NAME}}` - Project name
- `{{PROJECT_DESCRIPTION}}` - Short description
- `{{PROJECT_BADGES}}` - CI/CD badges
- `{{REPOSITORY_URL}}` - Git repository URL

### Tech Stack

- `{{FRONTEND_FRAMEWORK}}` - Frontend framework (React, Vue, etc.)
- `{{BACKEND_FRAMEWORK}}` - Backend framework (Node.js, Django, etc.)
- `{{DATABASE}}` - Database (PostgreSQL, MongoDB, etc.)
- `{{INFRASTRUCTURE}}` - Cloud provider (AWS, GCP, Azure)

### Configuration

- `{{MAIN_BRANCH}}` - Main branch name (main, master)
- `{{NODE_VERSION}}` - Node.js version
- `{{PACKAGE_MANAGER}}` - npm, yarn, pnpm
- `{{COVERAGE_THRESHOLD}}` - Minimum test coverage percentage

### Commands

- `{{INSTALL_COMMANDS}}` - Install dependencies
- `{{RUN_COMMANDS}}` - Run the project
- `{{TEST_COMMANDS}}` - Run tests
- `{{BUILD_COMMAND}}` - Build project
- `{{LINT_COMMAND}}` - Run linter

### Compliance

- `{{GDPR_COMPLIANCE}}` - GDPR compliance (true/false)
- `{{HIPAA_COMPLIANCE}}` - HIPAA compliance (true/false)
- `{{SOC2_COMPLIANCE}}` - SOC 2 compliance (true/false)
- `{{PCI_DSS_COMPLIANCE}}` - PCI-DSS compliance (true/false)

### Metadata

- `{{TIMESTAMP}}` - Creation timestamp
- `{{LICENSE_NAME}}` - License name
- `{{AUTHOR}}` - Author name

---

## 📝 Template Files

### 1. `.ai-core/config.yml`

Project configuration file. Used by ai-core to:

- Configure sync settings
- Enable/disable subagents
- Set up CI/CD integration
- Configure compliance standards
- Set testing thresholds

### 2. `PROJECT.md`

Main project README. Includes:

- Project overview
- Quick start guide
- Architecture description
- Development setup
- Testing instructions
- Deployment guide
- Contributing guide

### 3. `.github/PULL_REQUEST_TEMPLATE.md`

PR template that ensures:

- Clear description of changes
- Checklist for quality
- Testing information
- Breaking changes documentation
- Related issues linkage

### 4. `.github/ISSUE_TEMPLATE/bug_report.md`

Bug report template that collects:

- Bug description
- Reproduction steps
- Environment information
- Screenshots/logs
- Expected vs actual behavior

### 5. `.github/ISSUE_TEMPLATE/feature_request.md`

Feature request template that includes:

- Feature description
- Problem statement
- Proposed solution
- Use cases
- Alternatives considered
- Acceptance criteria

### 6. `.github/workflows/ci.yml`

CI/CD pipeline that runs:

- Linting
- Type checking
- Unit tests
- Integration tests
- Build verification
- Security scans
- Quality gates

### 7. `CONTRIBUTING.md`

Contributing guidelines with:

- Code of conduct
- Development workflow
- Coding standards
- Testing guidelines
- Commit conventions
- PR process
- Review process

---

## 🛠️ Customization

### Adding Custom Placeholders

Add your own placeholders to any template:

```markdown
{{MY_CUSTOM_PLACEHOLDER}}
```

Then replace them when scaffolding:

```bash
find . -type f -exec sed -i 's/{{MY_CUSTOM_PLACEHOLDER}}/MyValue/g' {} \;
```

### Modifying Templates

1. Fork ai-core
2. Edit templates in `SUBAGENTS/templates/`
3. Test with project-scaffolder
4. Submit PR to ai-core

---

## 📚 Best Practices

### When Using Templates

1. **Replace all placeholders** - Don't leave `{{PLACEHOLDER}}` in final files
2. **Customize for your project** - Adjust to fit your specific needs
3. **Keep templates updated** - Sync with ai-core regularly
4. **Document customizations** - Note any deviations from templates

### When Contributing Templates

1. **Keep them generic** - Templates should work for many projects
2. **Use clear placeholders** - Make placeholder names self-explanatory
3. **Include examples** - Show how to use each template
4. **Test thoroughly** - Ensure templates work end-to-end
5. **Document changes** - Update README when modifying templates

---

## 🔄 Versioning

Templates are versioned with ai-core. Current version: **1.0.0**

### Changelog

#### 1.0.0 (Initial Release)

- ✅ Basic project scaffolding templates
- ✅ GitHub templates (issues, PRs)
- ✅ CI/CD pipeline template
- ✅ Contributing guidelines
- ✅ Project configuration

---

## 🤝 Contributing

To add new templates or improve existing ones:

1. Read [CONTRIBUTING.md](../../CONTRIBUTING.md)
2. Create template in appropriate directory
3. Test with project-scaffolder
4. Submit PR

---

## 📄 License

Apache-2.0 - See [LICENSE](../../LICENSE)

---

**EOF**
