---
name: finops
description: >
  FinOps and cloud cost optimization: cost monitoring, resource right-sizing,
  reserved instances, spot instances, budget alerts, cost allocation.
  Trigger: When optimizing cloud costs or implementing FinOps practices.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Optimizing cloud costs"
    - "Setting up cost monitoring"
    - "Implementing budget alerts"
    - "Right-sizing resources"
    - "Analyzing cloud spend"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Analyzing and reducing cloud costs
- Setting up cost monitoring and alerts
- Right-sizing compute resources
- Implementing reserved/spot instances
- Creating cost allocation reports
- Building FinOps culture

---

## Critical Patterns

### > **ALWAYS**

1. **Tag all resources**
   ```hcl
   # Terraform: Mandatory tags
   locals {
     required_tags = {
       Environment  = var.environment
       Project      = var.project_name
       Team         = var.team
       CostCenter   = var.cost_center
       ManagedBy    = "terraform"
       Owner        = var.owner_email
     }
   }

   resource "aws_instance" "example" {
     # ... configuration ...

     tags = merge(local.required_tags, {
       Name = "my-instance"
     })
   }
   ```

2. **Set budget alerts**
   ```hcl
   # AWS Budget
   resource "aws_budgets_budget" "monthly" {
     name         = "monthly-budget"
     budget_type  = "COST"
     limit_amount = "10000"
     limit_unit   = "USD"
     time_unit    = "MONTHLY"

     notification {
       comparison_operator       = "GREATER_THAN"
       threshold                 = 80
       threshold_type            = "PERCENTAGE"
       notification_type         = "FORECASTED"
       subscriber_email_addresses = ["finance@company.com", "devops@company.com"]
     }

     notification {
       comparison_operator       = "GREATER_THAN"
       threshold                 = 100
       threshold_type            = "PERCENTAGE"
       notification_type         = "ACTUAL"
       subscriber_email_addresses = ["finance@company.com", "devops@company.com"]
     }
   }
   ```

3. **Review costs regularly**
   ```
   ┌─────────────────────────────────────────────┐
   │ COST REVIEW CADENCE                         │
   ├─────────────────────────────────────────────┤
   │ Daily   → Anomaly detection alerts          │
   │ Weekly  → Team cost review                  │
   │ Monthly → Department cost review            │
   │ Quarterly → Optimization initiatives        │
   │ Annually → Reserved instance planning       │
   └─────────────────────────────────────────────┘
   ```

4. **Implement auto-scaling**
   ```yaml
   # Kubernetes HPA
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: api
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: api
     minReplicas: 2
     maxReplicas: 20
     metrics:
       - type: Resource
         resource:
           name: cpu
           target:
             type: Utilization
             averageUtilization: 70
     behavior:
       scaleDown:
         stabilizationWindowSeconds: 300
   ```

5. **Use appropriate storage tiers**
   ```
   STORAGE TIERING:

   Hot (Frequent access)
   ├── SSD/gp3 for databases
   └── S3 Standard for active data

   Warm (Infrequent access)
   ├── HDD/st1 for logs
   └── S3 Infrequent Access

   Cold (Archive)
   ├── S3 Glacier Instant Retrieval
   └── S3 Glacier Deep Archive
   ```

### > **NEVER**

1. **Leave unused resources running**
2. **Skip resource tagging**
3. **Over-provision "just in case"**
4. **Ignore cost anomalies**
5. **Use on-demand for predictable workloads**

---

## Cost Optimization Strategies

### Compute Optimization

```
┌─────────────────────────────────────────────┐
│ COMPUTE COST HIERARCHY                      │
├─────────────────────────────────────────────┤
│ MOST EXPENSIVE                              │
│ ↓ On-Demand Instances                       │
│ ↓ Savings Plans (1-3 year)                  │
│ ↓ Reserved Instances (1-3 year)             │
│ ↓ Spot Instances (up to 90% off)            │
│ LEAST EXPENSIVE                             │
│                                             │
│ STRATEGY:                                   │
│ - Base load: Reserved/Savings Plans         │
│ - Variable load: Auto-scaling + Spot        │
│ - Burst: On-Demand                          │
└─────────────────────────────────────────────┘
```

### Right-Sizing

```python
# AWS right-sizing recommendations
import boto3

ce = boto3.client('ce')

response = ce.get_rightsizing_recommendation(
    Service='AmazonEC2',
    Configuration={
        'RecommendationTarget': 'SAME_INSTANCE_FAMILY',
        'BenefitsConsidered': True
    }
)

for rec in response['RightsizingRecommendations']:
    current = rec['CurrentInstance']
    target = rec['ModifyRecommendationDetail']['TargetInstances'][0]

    print(f"""
    Instance: {current['ResourceId']}
    Current: {current['InstanceType']} (${current['MonthlyCost']}/mo)
    Recommended: {target['InstanceType']} (${target['EstimatedMonthlyCost']}/mo)
    Savings: ${current['MonthlyCost'] - target['EstimatedMonthlyCost']}/mo
    """)
```

### Spot Instances

```hcl
# AWS Spot Fleet
resource "aws_spot_fleet_request" "workers" {
  iam_fleet_role  = aws_iam_role.spot_fleet.arn
  target_capacity = 10
  valid_until     = "2024-12-31T23:59:59Z"

  # Maintain target capacity
  allocation_strategy = "lowestPrice"

  # Diversify across instance types
  launch_specification {
    instance_type     = "c5.xlarge"
    ami               = data.aws_ami.worker.id
    spot_price        = "0.10"  # Max price
    availability_zone = "us-east-1a"
  }

  launch_specification {
    instance_type     = "c5a.xlarge"
    ami               = data.aws_ami.worker.id
    spot_price        = "0.10"
    availability_zone = "us-east-1b"
  }

  launch_specification {
    instance_type     = "c6i.xlarge"
    ami               = data.aws_ami.worker.id
    spot_price        = "0.10"
    availability_zone = "us-east-1c"
  }
}
```

### Kubernetes Cost Optimization

```yaml
# Request/Limit optimization
resources:
  requests:
    memory: "256Mi"   # Based on actual usage (p50)
    cpu: "100m"
  limits:
    memory: "512Mi"   # Based on peak usage (p99)
    cpu: "500m"

# Pod disruption budget for spot
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: api

# Spot node pools (GKE)
# node_pools:
#   - name: spot-pool
#     preemptible: true
#     initial_node_count: 3
```

---

## Cost Monitoring

### AWS Cost Explorer Query

```python
import boto3
from datetime import datetime, timedelta

ce = boto3.client('ce')

def get_cost_by_service(start_date, end_date):
    response = ce.get_cost_and_usage(
        TimePeriod={
            'Start': start_date,
            'End': end_date
        },
        Granularity='MONTHLY',
        Metrics=['BlendedCost', 'UnblendedCost', 'UsageQuantity'],
        GroupBy=[
            {'Type': 'DIMENSION', 'Key': 'SERVICE'}
        ]
    )

    costs = []
    for result in response['ResultsByTime']:
        for group in result['Groups']:
            costs.append({
                'service': group['Keys'][0],
                'cost': float(group['Metrics']['BlendedCost']['Amount'])
            })

    return sorted(costs, key=lambda x: x['cost'], reverse=True)

# Get last month's costs
today = datetime.now()
first_of_month = today.replace(day=1)
last_month_start = (first_of_month - timedelta(days=1)).replace(day=1)

costs = get_cost_by_service(
    last_month_start.strftime('%Y-%m-%d'),
    first_of_month.strftime('%Y-%m-%d')
)

for item in costs[:10]:
    print(f"{item['service']}: ${item['cost']:.2f}")
```

### Cost Anomaly Detection

```python
# AWS Cost Anomaly Detection
resource "aws_ce_anomaly_monitor" "service" {
  name              = "service-anomaly-monitor"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

resource "aws_ce_anomaly_subscription" "alerts" {
  name      = "cost-anomaly-alerts"
  frequency = "IMMEDIATE"

  monitor_arn_list = [
    aws_ce_anomaly_monitor.service.arn
  ]

  subscriber {
    type    = "EMAIL"
    address = "finops@company.com"
  }

  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      match_options = ["GREATER_THAN_OR_EQUAL"]
      values        = ["100"]  # Alert if anomaly > $100
    }
  }
}
```

---

## Cost Allocation

### Tagging Strategy

```
┌─────────────────────────────────────────────┐
│ TAGGING TAXONOMY                            │
├─────────────────────────────────────────────┤
│ BUSINESS TAGS (Cost allocation)             │
│ ├── CostCenter: finance-123                 │
│ ├── Project: mobile-app                     │
│ ├── Team: platform                          │
│ └── Customer: acme-corp (for dedicated)     │
│                                             │
│ TECHNICAL TAGS (Operations)                 │
│ ├── Environment: production                 │
│ ├── ManagedBy: terraform                    │
│ └── Application: api-gateway                │
│                                             │
│ COMPLIANCE TAGS (Governance)                │
│ ├── DataClassification: confidential        │
│ ├── Compliance: pci-dss                     │
│ └── Owner: team@company.com                 │
└─────────────────────────────────────────────┘
```

### Enforce Tagging (AWS)

```json
// SCP to require tags
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RequireTags",
      "Effect": "Deny",
      "Action": [
        "ec2:RunInstances",
        "rds:CreateDBInstance",
        "s3:CreateBucket"
      ],
      "Resource": "*",
      "Condition": {
        "Null": {
          "aws:RequestTag/CostCenter": "true",
          "aws:RequestTag/Environment": "true",
          "aws:RequestTag/Team": "true"
        }
      }
    }
  ]
}
```

---

## Reserved Instances / Savings Plans

### Analysis

```python
def analyze_ri_coverage():
    """Analyze Reserved Instance coverage and recommendations"""

    ce = boto3.client('ce')

    # Get RI coverage
    coverage = ce.get_reservation_coverage(
        TimePeriod={
            'Start': '2024-01-01',
            'End': '2024-01-31'
        },
        Granularity='MONTHLY',
        GroupBy=[
            {'Type': 'DIMENSION', 'Key': 'INSTANCE_TYPE'}
        ]
    )

    # Get RI recommendations
    recommendations = ce.get_reservation_purchase_recommendation(
        Service='Amazon Elastic Compute Cloud - Compute',
        LookbackPeriodInDays='SIXTY_DAYS',
        TermInYears='ONE_YEAR',
        PaymentOption='PARTIAL_UPFRONT'
    )

    return {
        'coverage': coverage,
        'recommendations': recommendations
    }
```

### Savings Plan vs Reserved Instances

| Feature | Savings Plans | Reserved Instances |
|---------|--------------|-------------------|
| Flexibility | High (any instance) | Low (specific instance) |
| Discount | Up to 72% | Up to 75% |
| Commitment | $ per hour | Instance capacity |
| Recommended | General use | Stable workloads |

---

## Unused Resource Detection

### Find Idle Resources

```python
import boto3
from datetime import datetime, timedelta

def find_idle_ec2_instances():
    """Find EC2 instances with low CPU utilization"""

    ec2 = boto3.client('ec2')
    cloudwatch = boto3.client('cloudwatch')

    instances = ec2.describe_instances(
        Filters=[{'Name': 'instance-state-name', 'Values': ['running']}]
    )

    idle_instances = []

    for reservation in instances['Reservations']:
        for instance in reservation['Instances']:
            instance_id = instance['InstanceId']

            # Get average CPU over last 7 days
            response = cloudwatch.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName='CPUUtilization',
                Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
                StartTime=datetime.utcnow() - timedelta(days=7),
                EndTime=datetime.utcnow(),
                Period=86400,
                Statistics=['Average']
            )

            if response['Datapoints']:
                avg_cpu = sum(dp['Average'] for dp in response['Datapoints']) / len(response['Datapoints'])

                if avg_cpu < 5:  # Less than 5% CPU
                    idle_instances.append({
                        'instance_id': instance_id,
                        'instance_type': instance['InstanceType'],
                        'avg_cpu': avg_cpu
                    })

    return idle_instances

def find_unattached_ebs_volumes():
    """Find EBS volumes not attached to any instance"""

    ec2 = boto3.client('ec2')

    volumes = ec2.describe_volumes(
        Filters=[{'Name': 'status', 'Values': ['available']}]
    )

    return [{
        'volume_id': v['VolumeId'],
        'size_gb': v['Size'],
        'volume_type': v['VolumeType'],
        'created': v['CreateTime']
    } for v in volumes['Volumes']]

def find_unused_elastic_ips():
    """Find Elastic IPs not associated with instances"""

    ec2 = boto3.client('ec2')

    addresses = ec2.describe_addresses()

    return [
        addr for addr in addresses['Addresses']
        if 'InstanceId' not in addr and 'NetworkInterfaceId' not in addr
    ]
```

---

## Cost Dashboard

### Grafana Dashboard (Prometheus Metrics)

```yaml
# Cost metrics exporter
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cost-exporter
spec:
  template:
    spec:
      containers:
        - name: exporter
          image: company/cost-exporter:latest
          env:
            - name: AWS_REGION
              value: us-east-1
          ports:
            - containerPort: 9090

---
# Prometheus scrape config
scrape_configs:
  - job_name: 'cost-metrics'
    static_configs:
      - targets: ['cost-exporter:9090']
```

### Key Metrics

```
COST METRICS TO TRACK:

Daily
├── Total spend
├── Spend by service
├── Spend by team/project
└── Anomaly alerts

Efficiency
├── Reserved instance utilization
├── Savings plan utilization
├── Spot instance coverage
└── Resource utilization (CPU, memory)

Trends
├── Month-over-month change
├── Cost per customer
├── Cost per transaction
└── Unit economics
```

---

## Automation

### Scheduled Shutdown (Non-Prod)

```python
# Lambda function to stop non-prod instances
import boto3

def lambda_handler(event, context):
    ec2 = boto3.client('ec2')

    # Find non-production instances
    instances = ec2.describe_instances(
        Filters=[
            {'Name': 'tag:Environment', 'Values': ['development', 'staging']},
            {'Name': 'instance-state-name', 'Values': ['running']}
        ]
    )

    instance_ids = [
        i['InstanceId']
        for r in instances['Reservations']
        for i in r['Instances']
    ]

    if instance_ids:
        ec2.stop_instances(InstanceIds=instance_ids)
        print(f"Stopped {len(instance_ids)} instances")

    return {'stopped': len(instance_ids)}
```

### Cleanup Old Resources

```bash
#!/bin/bash
# cleanup-old-resources.sh

# Delete snapshots older than 30 days
aws ec2 describe-snapshots --owner-ids self --query "Snapshots[?StartTime<='$(date -d '-30 days' '+%Y-%m-%d')'].SnapshotId" --output text | \
  xargs -I {} aws ec2 delete-snapshot --snapshot-id {}

# Delete unattached volumes
aws ec2 describe-volumes --filters Name=status,Values=available --query "Volumes[].VolumeId" --output text | \
  xargs -I {} aws ec2 delete-volume --volume-id {}

# Release unused Elastic IPs
aws ec2 describe-addresses --query "Addresses[?AssociationId==null].AllocationId" --output text | \
  xargs -I {} aws ec2 release-address --allocation-id {}
```

---

## Commands

```bash
# AWS Cost Explorer CLI
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost

# Get RI recommendations
aws ce get-reservation-purchase-recommendation \
  --service "Amazon Elastic Compute Cloud - Compute" \
  --lookback-period-in-days SIXTY_DAYS

# List untagged resources
aws resourcegroupstaggingapi get-resources \
  --resource-type-filters ec2:instance \
  --tags-per-page 100 | jq '.ResourceTagMappingList[] | select(.Tags | length == 0)'

# Infracost for Terraform
infracost breakdown --path .
infracost diff --path . --compare-to infracost-base.json
```

---

## Resources

- **AWS Cost Management**: [aws.amazon.com/aws-cost-management](https://aws.amazon.com/aws-cost-management/)
- **FinOps Foundation**: [finops.org](https://www.finops.org/)
- **Infracost**: [infracost.io](https://www.infracost.io/)
- **Kubecost**: [kubecost.com](https://www.kubecost.com/)
- **Cloud Custodian**: [cloudcustodian.io](https://cloudcustodian.io/)

---

## Examples

### Example 1: AWS Cost Optimization

**User request:** "Optimize AWS costs for our production environment"

```bash
#!/bin/bash
# AWS Cost Optimization Script

# 1. Identify idle resources
echo "Checking for idle EC2 instances..."
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[].Instances[].[InstanceId,Tags[?Key==`Name`].Value|[0],State.Name]' \
  --output table

# 2. Check for unattached EBS volumes
echo "Checking for unattached EBS volumes..."
aws ec2 describe-volumes \
  --filters "Name=status,Values=available" \
  --query 'Volumes[].[VolumeId,Size,State]' \
  --output table

# 3. Review S3 bucket sizes
echo "Checking S3 bucket sizes..."
for bucket in $(aws s3 ls | awk '{print $3}'); do
  size=$(aws s3 ls s3://$bucket --recursive --summarize | grep "Total Size" | awk '{print $3}')
  echo "$bucket: $size bytes"
done

# 4. Enable S3 lifecycle policies for old data
aws s3api put-bucket-lifecycle-configuration \
  --bucket my-bucket \
  --lifecycle-configuration '{
    "Rules": [{
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "Prefix": "",
      "NoncurrentVersionExpiration": {"NoncurrentDays": 30}
    }]
  }'

# 5. Purchase reserved instances for long-running instances
echo "Checking candidates for Reserved Instances..."
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[].Instances[].[InstanceId,InstanceType,LaunchTime]' \
  --output table
