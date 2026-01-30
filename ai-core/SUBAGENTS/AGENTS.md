# AI-Core Project Instructions

> **Instrucciones universales** para asistentes de IA (OpenAI Codex, Google Antigravity, etc.)
> Este archivo provee contexto del proyecto y reglas para todos los agentes.

---

## Working Agreements

### Development Workflow

1. **Always run tests** before committing code
   ```bash
   npm test  # Node.js
   pytest   # Python
   ```

2. **Use the ai-core SKILLS** when implementing features
   - Security: `ai-core/SKILLS/security/SKILL.md`
   - Testing: `ai-core/SKILLS/testing/SKILL.md`
   - Frontend: `ai-core/SKILLS/frontend/SKILL.md`
   - Backend: `ai-core/SKILLS/backend/SKILL.md`

3. **Follow existing patterns** in the codebase
   - Code style (linting/formatting rules)
   - File organization
   - Naming conventions

4. **Never commit secrets** or sensitive data
   - Use environment variables
   - Add `.env` to `.gitignore`

### Code Quality Standards

- **Linting**: Run linter before committing
  ```bash
  npm run lint  # Node.js
  flake8 .     # Python
  ```

- **Type Safety**: Use TypeScript or type hints
  ```bash
  npm run type-check  # TypeScript
  mypy .              # Python
  ```

- **Test Coverage**: Maintain >80% coverage
  ```bash
  npm run test:coverage
  pytest --cov=src
  ```

### Security Requirements

- **Input Validation**: Always validate on both client AND server
- **SQL Queries**: Use parameterized queries (never concatenate)
- **Passwords**: Always hash with bcrypt/argon2
- **Authentication**: Use JWT + refresh tokens or OAuth2 + PKCE
- **APIs**: Implement rate limiting and CORS properly

Refer to: `ai-core/SKILLS/security/SKILL.md`

---

## Specialized Subagents

This project includes the following specialized subagents from ai-core:

### 🛡️ AI-Core Guardian (CRITICAL)
- **When to use**: ALWAYS ACTIVE - Guardian of production readiness
- **Role**: Maintains zero technical debt, 100% coverage, stability
- **Skills**: Enterprise governance, quality assurance, debt elimination
- **Priority**: CRITICAL - Auto-invoked on all changes
- **Reference**: `.claude/agents/ai-core-guardian.md` or `ai-core/SUBAGENTS/universal/ai-core-guardian.md`

### Security Specialist
- **When to use**: Implementing auth, handling user input, managing secrets
- **Skills**: OWASP Top 10, Zero Trust, OAuth2, Passkeys, input validation
- **Reference**: `.claude/agents/security-specialist.md` or `ai-core/SUBAGENTS/universal/security-specialist.md`

### Frontend Specialist
- **When to use**: Building UI components, state management, a11y
- **Skills**: React/Vue/Angular, component patterns, WCAG 2.1, performance
- **Reference**: `.claude/agents/frontend-specialist.md`

### Backend Specialist
- **When to use**: Creating APIs, validation, error handling
- **Skills**: REST/GraphQL, validation, rate limiting, pagination
- **Reference**: `.claude/agents/backend-specialist.md`

### MCP Specialist
- **When to use**: Building MCP servers/clients, exposing tools/resources/prompts
- **Skills**: Model Context Protocol, STDIO/HTTP transports, OAuth 2.1 authorization
- **Reference**: `.claude/agents/mcp-specialist.md` or `ai-core/SUBAGENTS/universal/mcp-specialist.md`

### llms.txt Specialist
- **When to use**: Creating /llms.txt files, LLM-friendly documentation
- **Skills**: llms.txt specification, parsing, XML context generation, LLM testing
- **Reference**: `.claude/agents/llms-txt-specialist.md` or `ai-core/SUBAGENTS/universal/llms-txt-specialist.md`

### Testing Specialist
- **When to use**: Writing tests, improving coverage, TDD
- **Skills**: Unit/integration/E2E tests, mocking, test coverage
- **Reference**: `.claude/agents/testing-specialist.md`

### Code Reviewer
- **When to use**: Reviewing PRs, conducting audits, checking quality
- **Skills**: Security review, performance review, code quality
- **Reference**: `.claude/agents/code-reviewer.md`

---

## Available AI-Core Skills

The ai-core toolkit includes 30+ specialized skills:

### Core Development
- `security` - OWASP Top 10, Zero Trust, auth, secrets
- `testing` - Test Pyramid, TDD, mocks, E2E
- `frontend` - Components, state management, a11y
- `backend` - REST/GraphQL, validation, error handling
- `mobile` - iOS, Android, React Native, offline-first
- `pwa` - Service Workers, Web App Manifest, caching
- `wasm` - WebAssembly, Rust/C++ compilation, JS interop
- `mcp` - Model Context Protocol, servers/clients, tools/resources/prompts
- `llms-txt` - llms.txt standard, LLM-friendly website documentation
- `database` - Schema design, indexing, migrations
- `api-design` - Versioning, docs, rate limiting

### DevOps & Infrastructure
- `git-workflow` - Commits, branching, PRs
- `ci-cd` - Pipelines, testing, deployment
- `infrastructure` - Terraform, Kubernetes, Docker
- `disaster-recovery` - RPO/RTO, backups, failover
- `finops` - Cloud cost optimization

### Observability & Reliability
- `observability` - Distributed tracing, metrics, SLIs/SLOs
- `logging` - Structured logs, correlation IDs
- `error-handling` - Retries, circuit breakers
- `performance` - Caching, lazy loading, profiling
- `scalability` - Horizontal scaling, load balancing

### Enterprise & Compliance
- `compliance` - GDPR, HIPAA, SOC 2, PCI-DSS
- `audit-logging` - Immutable audit trails
- `accessibility` - WCAG 2.1, ADA compliance
- `i18n` - Multi-language, RTL support

### Architecture & Design
- `architecture` - Microservices, DDD, CQRS
- `documentation` - README, API docs, ADRs
- `dependency-management` - SBOM, vulnerability scanning
- `realtime` - WebSockets, SSE, live sync

### AI & Data
- `ai-ml` - LLM APIs, RAG, vector DBs, MLOps
- `data-analytics` - ETL/ELT, BI dashboards

### Developer Experience
- `code-quality` - Linting, formatting, pre-commit hooks
- `developer-experience` - Dev containers, onboarding
- `feature-flags` - A/B testing, gradual rollouts

**Location**: `ai-core/SKILLS/{skill-name}/SKILL.md`

---

## Project-Specific Configuration

### Technology Stack

[Configure based on your project]

Example:
```
Frontend: React + TypeScript + Vite
Backend: Node.js + Express + TypeScript
Database: PostgreSQL + Prisma ORM
Testing: Jest + React Testing Library + Playwright
CI/CD: GitHub Actions
```

### Environment Variables

```bash
# Required environment variables
DATABASE_URL=
JWT_SECRET=
API_KEY=

# Optional
REDIS_URL=
SMTP_HOST=
SMTP_USER=
```

### Directory Structure

```
/                          # Project root
├── ai-core/               # ai-core toolkit (this directory)
├── frontend/              # Frontend code
├── backend/               # Backend code
├── database/              # Schema and migrations
├── tests/                 # Test suites
├── .claude/               # Claude Code agents
└── AGENTS.md              # This file
```

---

## Common Tasks

### Adding a New Feature

1. **Plan**: Check relevant ai-core SKILLS first
   ```bash
   # Example: Adding authentication
   cat ai-core/SKILLS/security/SKILL.md
   ```

2. **Implement**: Follow patterns from SKILLS
   - Use recommended libraries
   - Follow security best practices
   - Write tests as you code (TDD)

3. **Test**: Ensure high coverage
   ```bash
   npm run test:coverage
   ```

4. **Document**: Update README and API docs

### Fixing a Bug

1. **Reproduce**: Write a failing test first
2. **Fix**: Make minimal changes to fix the issue
3. **Verify**: Ensure test passes and no regressions
4. **Review**: Run code reviewer agent

### Conducting a Code Review

Invoke the code-reviewer subagent:
```
@code-reviewer Review my changes
```

Or manually check:
- Security vulnerabilities
- Performance issues
- Test coverage
- Code quality
- Documentation

---

## Customization

To customize these instructions for your project:

1. Update the "Technology Stack" section
2. Add project-specific working agreements
3. Include project-specific commands
4. Add any custom subagents or skills

---

## Integration with AI Platforms

### OpenAI Codex
This file (`AGENTS.md`) is automatically loaded by Codex.
Place it in: `~/.codex/AGENTS.md` (global) or project root (project-specific)

### Google Antigravity
This file provides rules for Antigravity agents.
Place it in: Project root as `AGENTS.md`

### Cursor Editor
Rename to `.cursorrules` for Cursor-specific instructions

### Other AI Coding Assistants
Most AI coding assistants will pick up this file automatically
when placed in the project root.

---

## Additional Resources

- [ai-core README](../README.md)
- [SKILLS Documentation](../SKILLS/)
- [SUBAGENTS Documentation](./README.md)
- [Platform-Specific Configuration](./PLATFORMS.md)

---

**Version**: 1.0.0
**Last Updated**: 2024-01-22
**License**: Apache-2.0

---

**EOF**
