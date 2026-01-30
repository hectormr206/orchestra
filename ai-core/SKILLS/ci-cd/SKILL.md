---
name: ci-cd
description: >
  CI/CD pipeline patterns: automated testing, deployment strategies,
  rollback plans, environment management.
  Trigger: When setting up pipelines, configuring deployments, or automating releases.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Setting up CI/CD pipelines"
    - "Configuring automated deployments"
    - "Planning release strategy"
allowed-tools: [Read,Edit,Write,Bash,Grep]
---

## When to Use

- Setting up GitHub Actions, GitLab CI, Jenkins
- Configuring automated deployments
- Planning rollback strategies
- Managing environment variables

---

## Critical Patterns

### > **ALWAYS**

1. **Pipeline Stages**
   ```
   lint → test → build → security-scan → deploy

   Example:
   ┌─────────────────────────────────────┐
   │ CI (every commit)                  │
   ├─────────────────────────────────────┤
   │ 1. Lint (ESLint, flake8)           │
   │ 2. Unit tests                      │
   │ 3. Integration tests               │
   │ 4. Build artifacts                 │
   │ 5. Security scan (SAST, dependencies)│
   └─────────────────────────────────────┘

   ┌─────────────────────────────────────┐
   │ CD (on merge to main)              │
   ├─────────────────────────────────────┤
   │ 1. Deploy to staging               │
   │ 2. Run E2E tests                    │
   │ 3. Manual approval (production)    │
   │ 4. Deploy to production             │
   │ 5. Smoke tests                      │
   │ 6. Rollback if failed               │
   └─────────────────────────────────────┘
   ```

2. **Environment Variables**
   ```yaml
   # NEVER commit secrets
   env:
     DATABASE_URL: ${{ secrets.DATABASE_URL }}
     API_KEY: ${{ secrets.API_KEY }}

   # Use different secrets per environment
     PRODUCTION_API_KEY: ${{ secrets.PROD_API_KEY }}
     STAGING_API_KEY: ${{ secrets.STAGING_API_KEY }}
   ```

3. **Deployment Strategies**
   | Strategy | Description | When to use |
   |----------|-------------|-------------|
   | **Blue-Green** | Two identical environments, switch traffic | Zero-downtime needed |
   | **Canary** | Roll out to subset of users | High-risk changes |
   | **Rolling** | Replace instances gradually | Large-scale systems |
   | **Feature Flags** | Release without showing users | A/B testing, gradual rollout |

4. **Rollback Plan**
   ```yaml
   # Always have automatic rollback
   deploy:
     on_failure: rollback_to_previous_version
     rollback_timeout: 5m

   # Manual trigger for rollback
   manual_rollback:
     trigger: manual
     steps:
       - run: kubectl rollout undo deployment/app
   ```

5. **Artifact Versioning**
   ```
   Build artifacts: 1.2.3-abc123de (version-commit)
   Docker images: myapp:v1.2.3-build.123
   Never use :latest in production
   ```

6. **Notifications**
   ```yaml
   on_success:
     notify: slack "#deployments"
   on_failure:
     notify: slack "#alerts", pagerduty
   ```

### > **NEVER**

1. **Don't skip tests for speed**
   ```yaml
   # WRONG
   - name: test
     run: npm test -- --skip-tests

   # RIGHT - parallel tests instead
   - name: test
     run: npm test -- --parallel
   ```

2. **Don't deploy directly to production**
   ```
   Always: dev → staging → production
   ```

3. **Don't hardcode credentials in pipeline**
   ```yaml
   # WRONG
   password: "hardcoded-password"

   # RIGHT
   password: ${{ secrets.DB_PASSWORD }}
   ```

---

## Pipeline Example (GitHub Actions)

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage
      - run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - run: npm audit --audit-level=moderate
      - uses: snyk/actions/node@master

  deploy-staging:
    needs: [test, security]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - run: npm run deploy:staging

  deploy-production:
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://app.example.com
    steps:
      - run: npm run deploy:production
```

---

## Commands

```bash
# Run pipeline locally
act -l  # List actions
act push  # Run all jobs

# Trigger deployment manually
gh workflow run deploy.yml --ref main

# View deployment status
gh run list --workflow=deploy.yml
```

---

## Resources

- **GitHub Actions Docs**: [docs.github.com/actions](https://docs.github.com/actions)
- **CI/CD Best Practices**: [www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment](https://www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment)
- **Deployment Strategies**: [martinfowler.com/bliki/CanaryRelease.html](https://martinfowler.com/bliki/CanaryRelease.html)

---

## Examples

### Example 1: Complete CI/CD Pipeline for Node.js Application

**User request:** "Create a CI/CD pipeline for a Node.js API"

**GitHub Actions workflow:**

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.x'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Job 1: Lint and Test
  test:
    name: Lint & Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm test --
          --coverage
          --ci
          --maxWorkers=2
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
      
      - name: Build
        run: npm run build

  # Job 2: Security Scan
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true

  # Job 3: Build and Push Docker Image
  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Job 4: Deploy to Production
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://api.example.com
    
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            docker pull ghcr.io/${{ github.repository }}:latest
            docker stop app || true
            docker rm app || true
            docker run -d --name app \
              -p 80:3000 \
              --env-file /etc/app/production.env \
              --restart unless-stopped \
              ghcr.io/${{ github.repository }}:latest
      
      - name: Health check
        run: |
          sleep 10
          curl -f https://api.example.com/health || exit 1
      
      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to production successful!'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

**Pipeline features:**
- ✅ Parallel jobs (test, security)
- ✅ Linting, type checking, testing
- ✅ Code coverage upload to Codecov
- ✅ Security scanning with Trivy
- ✅ Docker image building with caching
- ✅ Automated deployment to production
- ✅ Health checks after deployment
- ✅ Slack notifications
