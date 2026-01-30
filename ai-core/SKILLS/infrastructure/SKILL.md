---
name: infrastructure
description: >
  Infrastructure as Code patterns: Terraform, Kubernetes, Docker, GitOps.
  Cloud architecture, service mesh, container security, IaC best practices.
  Trigger: When provisioning infrastructure or managing cloud resources.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Writing Terraform/IaC code"
    - "Configuring Kubernetes resources"
    - "Building Docker images"
    - "Setting up cloud infrastructure"
    - "Implementing GitOps workflows"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Provisioning cloud infrastructure
- Writing Terraform/Pulumi/CloudFormation
- Configuring Kubernetes deployments
- Building and securing Docker images
- Implementing GitOps workflows
- Setting up service mesh

---

## Critical Patterns

### > **ALWAYS**

1. **Infrastructure as Code (IaC)**
   ```
   ┌─────────────────────────────────────────────┐
   │ IaC PRINCIPLES                              │
   │                                             │
   │ ✓ Version control ALL infrastructure        │
   │ ✓ Review changes via PR                     │
   │ ✓ Test before applying                      │
   │ ✓ Use modules for reusability               │
   │ ✓ Separate environments (dev/staging/prod)  │
   │ ✓ State management (remote, locked)         │
   └─────────────────────────────────────────────┘
   ```

2. **Immutable infrastructure**
   ```
   DON'T: SSH into servers and modify
   DO: Build new images, replace instances

   Benefits:
   - Reproducible environments
   - Easy rollback
   - No configuration drift
   ```

3. **Least privilege for all resources**
   ```hcl
   # Terraform: Specific IAM permissions
   resource "aws_iam_policy" "app_policy" {
     name = "app-minimal-permissions"
     policy = jsonencode({
       Version = "2012-10-17"
       Statement = [
         {
           Effect = "Allow"
           Action = [
             "s3:GetObject",
             "s3:PutObject"
           ]
           Resource = "arn:aws:s3:::my-bucket/*"
         }
       ]
     })
   }
   ```

4. **Tag everything**
   ```hcl
   locals {
     common_tags = {
       Environment = var.environment
       Project     = var.project_name
       ManagedBy   = "terraform"
       Owner       = var.team
       CostCenter  = var.cost_center
     }
   }
   ```

5. **Use private subnets for workloads**
   ```
   ┌─────────────────────────────────────────────┐
   │                   VPC                        │
   │  ┌──────────────┐  ┌──────────────────────┐ │
   │  │ Public Subnet│  │   Private Subnet     │ │
   │  │  - ALB       │  │  - App servers       │ │
   │  │  - NAT GW    │  │  - Databases         │ │
   │  │  - Bastion   │  │  - Internal services │ │
   │  └──────────────┘  └──────────────────────┘ │
   └─────────────────────────────────────────────┘
   ```

### > **NEVER**

1. **Hardcode secrets in IaC**
2. **Use default VPC for production**
3. **Allow 0.0.0.0/0 to sensitive ports**
4. **Skip state locking**
5. **Apply without plan review**
6. **Use latest tag for containers**

---

## Terraform Best Practices

### Project Structure

```
infrastructure/
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── eks/
│   └── rds/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   └── production/
└── shared/
    └── s3-backend/
```

### Remote State Configuration

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

### Module Example

```hcl
# modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.project}-vpc"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.project}-private-${count.index + 1}"
    Type = "private"
  })
}

# modules/vpc/variables.tf
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

# modules/vpc/outputs.tf
output "vpc_id" {
  value = aws_vpc.main.id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}
```

### Using Modules

```hcl
# environments/production/main.tf
module "vpc" {
  source = "../../modules/vpc"

  vpc_cidr             = "10.0.0.0/16"
  private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]

  common_tags = local.common_tags
}

module "eks" {
  source = "../../modules/eks"

  cluster_name   = "production"
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids

  common_tags = local.common_tags
}
```

---

## Kubernetes Best Practices

### Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels:
    app: api
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
        version: v1
    spec:
      # Security context
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000

      containers:
        - name: api
          image: company/api:v1.2.3  # Never use :latest

          # Resource limits (ALWAYS set)
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"

          # Probes
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10

          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5

          # Security
          securityContext:
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
            capabilities:
              drop:
                - ALL

          # Environment from secrets
          envFrom:
            - secretRef:
                name: api-secrets
            - configMapRef:
                name: api-config

          ports:
            - containerPort: 8080
              name: http

          volumeMounts:
            - name: tmp
              mountPath: /tmp

      volumes:
        - name: tmp
          emptyDir: {}

      # Pod disruption budget
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: api
                topologyKey: kubernetes.io/hostname
```

### Network Policies

```yaml
# Deny all by default
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress

---
# Allow specific traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
```

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
```

---

## Docker Best Practices

### Secure Dockerfile

```dockerfile
# Use specific version, not latest
FROM python:3.11-slim-bookworm AS builder

# Install dependencies in builder stage
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production image
FROM python:3.11-slim-bookworm

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy dependencies from builder
COPY --from=builder /root/.local /home/appuser/.local

# Copy application
WORKDIR /app
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

# Set PATH
ENV PATH=/home/appuser/.local/bin:$PATH

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Don't run as PID 1 (use tini or dumb-init)
ENTRYPOINT ["python", "-m", "app"]
```

### Multi-stage Build (Node.js)

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
RUN apk add --no-cache tini

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only necessary files
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

USER appuser
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
```

### Docker Security Scanning

```yaml
# .github/workflows/docker-security.yml
name: Docker Security

on:
  push:
    paths:
      - 'Dockerfile'
      - '.github/workflows/docker-security.yml'

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t app:${{ github.sha }} .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'app:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

---

## GitOps with ArgoCD

### Application Definition

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: api
  namespace: argocd
spec:
  project: default

  source:
    repoURL: https://github.com/company/k8s-manifests
    targetRevision: main
    path: apps/api/overlays/production

  destination:
    server: https://kubernetes.default.svc
    namespace: production

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### Kustomize Structure

```
apps/
└── api/
    ├── base/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   ├── configmap.yaml
    │   └── kustomization.yaml
    └── overlays/
        ├── development/
        │   ├── kustomization.yaml
        │   └── patches/
        │       └── replicas.yaml
        ├── staging/
        │   ├── kustomization.yaml
        │   └── patches/
        └── production/
            ├── kustomization.yaml
            └── patches/
                ├── replicas.yaml
                └── resources.yaml
```

---

## Service Mesh (Istio)

### Traffic Management

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: api
spec:
  hosts:
    - api
  http:
    - match:
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination:
            host: api
            subset: canary
    - route:
        - destination:
            host: api
            subset: stable
          weight: 95
        - destination:
            host: api
            subset: canary
          weight: 5

---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: api
spec:
  host: api
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: UPGRADE
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
  subsets:
    - name: stable
      labels:
        version: stable
    - name: canary
      labels:
        version: canary
```

---

## Commands

```bash
# Terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
terraform state list
terraform import aws_instance.example i-1234567890

# Kubernetes
kubectl apply -f manifest.yaml
kubectl get pods -n production
kubectl logs -f deployment/api -n production
kubectl rollout status deployment/api
kubectl rollout undo deployment/api

# Docker
docker build -t app:v1 .
docker scan app:v1
docker history app:v1
docker inspect app:v1

# ArgoCD
argocd app sync api
argocd app diff api
argocd app history api

# Helm
helm upgrade --install api ./charts/api -f values-prod.yaml
helm rollback api 1
```

---

## Resources

- **Terraform**: [terraform.io/docs](https://www.terraform.io/docs)
- **Kubernetes**: [kubernetes.io/docs](https://kubernetes.io/docs)
- **Docker Security**: [docs.docker.com/develop/security-best-practices](https://docs.docker.com/develop/security-best-practices/)
- **ArgoCD**: [argo-cd.readthedocs.io](https://argo-cd.readthedocs.io/)
- **Istio**: [istio.io/docs](https://istio.io/latest/docs/)

---

## Examples

### Example 1: Terraform Module for VPC

**User request:** "Create Terraform module for AWS VPC"

```hcl
# modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project}-${var.environment}-vpc"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.cidr_block, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project}-${var.environment}-public-${count.index + 1}"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project}-${var.environment}-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project}-${var.environment}-public-rt"
  }
}

# variables.tf
variable "project" {
  type        = string
  description = "Project name"
}

variable "environment" {
  type        = string
  description = "Environment name (dev/prod)"
}

variable "cidr_block" {
  type        = string
  description = "VPC CIDR block"
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones"
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}
