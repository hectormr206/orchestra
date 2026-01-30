---
name: developer-experience
description: >
  Developer experience (DX) patterns: local development, dev containers,
  onboarding, tooling, documentation, debugging, productivity.
  Trigger: When setting up development environment or improving DX.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Setting up local development"
    - "Creating dev containers"
    - "Writing onboarding documentation"
    - "Improving developer productivity"
    - "Setting up debugging tools"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Setting up a new project
- Onboarding new team members
- Improving local development experience
- Creating reproducible development environments
- Documenting development workflows

---

## Critical Patterns

### > **ALWAYS**

1. **One-command setup**
   ```bash
   # README.md should include:
   git clone https://github.com/company/project
   cd project
   make setup  # or ./setup.sh or npm run setup

   # That's it. Developer is ready.
   ```

2. **Document prerequisites clearly**
   ```markdown
   ## Prerequisites

   - Node.js 20+ (`node --version`)
   - Docker Desktop (`docker --version`)
   - PostgreSQL 15+ (or use Docker)

   ### macOS
   ```bash
   brew install node@20 docker postgresql@15
   ```

   ### Ubuntu/Debian
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install nodejs docker.io postgresql-15
   ```
   ```

3. **Use environment templates**
   ```bash
   # .env.example (committed to git)
   DATABASE_URL=postgresql://localhost:5432/myapp_dev
   REDIS_URL=redis://localhost:6379
   API_KEY=your_api_key_here
   DEBUG=true

   # Setup script copies to .env
   cp .env.example .env
   ```

4. **Provide seed data**
   ```bash
   # Quick data setup for development
   npm run db:seed

   # Creates:
   # - Admin user (admin@example.com / password)
   # - Sample data for testing
   # - Test fixtures
   ```

5. **Document common tasks**
   ```makefile
   # Makefile
   .PHONY: help setup dev test lint clean

   help:           ## Show this help
       @grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

   setup:          ## Initial project setup
       npm install
       cp -n .env.example .env || true
       npm run db:migrate
       npm run db:seed

   dev:            ## Start development server
       npm run dev

   test:           ## Run tests
       npm test

   lint:           ## Run linters
       npm run lint

   clean:          ## Clean build artifacts
       rm -rf dist node_modules
   ```

### > **NEVER**

1. **Require manual multi-step setup**
2. **Assume tools are installed**
3. **Hardcode local paths**
4. **Skip documentation for "obvious" things**
5. **Leave secrets in example configs**

---

## Dev Containers

### VS Code Dev Container

```json
// .devcontainer/devcontainer.json
{
  "name": "Project Dev Container",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",

  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    },
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss",
        "prisma.prisma"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode"
      }
    }
  },

  "forwardPorts": [3000, 5432, 6379],

  "postCreateCommand": "npm install && npm run db:migrate",

  "remoteUser": "node"
}
```

```yaml
# .devcontainer/docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: ..
      dockerfile: .devcontainer/Dockerfile
    volumes:
      - ..:/workspace:cached
      - node_modules:/workspace/node_modules
    command: sleep infinity
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: myapp_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  node_modules:
  postgres_data:
```

### GitHub Codespaces

```json
// .devcontainer/devcontainer.json (Codespaces optimized)
{
  "name": "Codespaces",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",

  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },

  "postCreateCommand": ".devcontainer/setup.sh",

  "portsAttributes": {
    "3000": {
      "label": "App",
      "onAutoForward": "openPreview"
    }
  },

  "secrets": {
    "API_KEY": {
      "description": "API key for external service"
    }
  }
}
```

---

## Local Development

### Docker Compose for Services

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER:-dev}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-dev}
      POSTGRES_DB: ${DB_NAME:-myapp_dev}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:worker\"",
    "dev:worker": "tsx watch src/worker.ts",

    "build": "next build",
    "start": "next start",

    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset --force",

    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",

    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",

    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",

    "setup": "npm install && npm run docker:up && npm run db:migrate && npm run db:seed"
  }
}
```

---

## Onboarding Documentation

### README Template

```markdown
# Project Name

Brief description of what this project does.

## Quick Start

```bash
# Clone and setup (< 5 minutes)
git clone https://github.com/company/project
cd project
make setup
make dev
```

Open http://localhost:3000

## Prerequisites

- Node.js 20+
- Docker Desktop
- Git

## Development

### Running the app

```bash
make dev          # Start development server
make test         # Run tests
make lint         # Run linters
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `API_KEY` | External API key | Required |

### Project Structure

```
src/
├── app/           # Next.js pages
├── components/    # React components
├── lib/           # Utilities
├── server/        # API routes
└── types/         # TypeScript types
```

### Common Tasks

| Task | Command |
|------|---------|
| Add migration | `npm run db:migrate` |
| Open DB GUI | `npm run db:studio` |
| Run single test | `npm test -- path/to/test` |

## Troubleshooting

### Port already in use
```bash
lsof -i :3000
kill -9 <PID>
```

### Database connection failed
```bash
make docker:up
# Wait 10 seconds, then retry
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)
```

### CONTRIBUTING.md Template

```markdown
# Contributing

## Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit with conventional commits: `git commit -m "feat: add feature"`
6. Push and create a PR

## Code Style

- We use Prettier for formatting (runs on save)
- ESLint for linting (runs on commit)
- TypeScript strict mode

## Commit Messages

We follow [Conventional Commits](https://conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure CI passes
4. Request review from maintainers
```

---

## Debugging

### VS Code Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal",
      "env": {
        "DEBUG": "app:*"
      }
    },
    {
      "name": "Debug Current Test",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${relativeFile}"],
      "console": "integratedTerminal"
    },
    {
      "name": "Attach to Process",
      "type": "node",
      "request": "attach",
      "port": 9229
    }
  ]
}
```

### VS Code Tasks

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Dev Server",
      "type": "npm",
      "script": "dev",
      "isBackground": true,
      "problemMatcher": {
        "pattern": {
          "regexp": "^$"
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "Starting...",
          "endsPattern": "Ready on"
        }
      }
    },
    {
      "label": "Docker Up",
      "type": "shell",
      "command": "docker-compose up -d",
      "presentation": {
        "reveal": "silent"
      }
    }
  ]
}
```

---

## Productivity Tools

### Recommended VS Code Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    // Essential
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",

    // DX
    "usernamehw.errorlens",
    "streetsidesoftware.code-spell-checker",
    "gruntfuggly.todo-tree",
    "mikestead.dotenv",

    // Git
    "eamodio.gitlens",
    "mhutchie.git-graph",

    // Database
    "prisma.prisma",
    "cweijan.vscode-database-client2",

    // API
    "humao.rest-client",
    "rangav.vscode-thunder-client"
  ]
}
```

### Workspace Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },

  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,

  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/dist": true
  },

  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true
  },

  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

---

## Environment Management

### direnv for Auto-loading

```bash
# .envrc
source_env_if_exists .env.local
export PATH=$PWD/node_modules/.bin:$PATH
layout node
```

### nvm/fnm for Node Version

```
# .nvmrc
20
```

```bash
# Auto-switch on directory change (add to .zshrc)
autoload -U add-zsh-hook
load-nvmrc() {
  if [ -f .nvmrc ]; then
    nvm use
  fi
}
add-zsh-hook chpwd load-nvmrc
```

---

## Commands

```bash
# Project setup
make setup
npm run setup

# Development
make dev
npm run dev

# Database
npm run db:migrate
npm run db:seed
npm run db:studio

# Docker services
docker-compose up -d
docker-compose logs -f
docker-compose down -v

# Testing
npm test
npm run test:watch
npm run test:coverage
```

---

## Resources

- **Dev Containers**: [containers.dev](https://containers.dev/)
- **GitHub Codespaces**: [docs.github.com/codespaces](https://docs.github.com/en/codespaces)
- **direnv**: [direnv.net](https://direnv.net/)
- **Make**: [makefiletutorial.com](https://makefiletutorial.com/)

---

## Examples

### Example 1: Dev Container Configuration

**User request:** "Set up dev container for Node.js project"

```json
// .devcontainer/devcontainer.json
{
  "name": "Node.js Development",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:20",
  
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "lts"
    },
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-typescript-next"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode"
      }
    }
  },
  
  "postCreateCommand": "npm install && npm run setup",
  
  "portsAttributes": {
    "3000": {
      "label": "Application",
      "onAutoForward": "openPreview"
    }
  },
  
  "mounts": [
    "source=${localWorkspaceFolderBasename}-node_modules,target=${containerWorkspaceFolder}/node_modules,type=volume"
  ]
}
