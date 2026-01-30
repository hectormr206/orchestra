---
name: disaster-recovery
description: >
  Business continuity and disaster recovery: RPO/RTO, backup strategies,
  multi-region deployment, failover procedures, incident response playbooks.
  Trigger: When planning high availability or disaster recovery.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Planning disaster recovery"
    - "Implementing backups"
    - "Setting up multi-region deployment"
    - "Creating incident response procedures"
    - "Defining RTO/RPO requirements"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Planning disaster recovery strategy
- Implementing backup and restore procedures
- Setting up multi-region architecture
- Creating incident response playbooks
- Defining RPO/RTO for business continuity
- Conducting DR drills

---

## Critical Patterns

### > **ALWAYS**

1. **Define RPO and RTO first**
   ```
   ┌─────────────────────────────────────────────┐
   │ RPO (Recovery Point Objective)              │
   │ → Maximum acceptable data loss              │
   │ → "How much data can we afford to lose?"    │
   │                                             │
   │ RTO (Recovery Time Objective)               │
   │ → Maximum acceptable downtime               │
   │ → "How long can we be down?"                │
   └─────────────────────────────────────────────┘

   Example:
   RPO: 1 hour → Backups every hour
   RTO: 4 hours → Must recover within 4 hours
   ```

2. **Follow the 3-2-1 backup rule**
   ```
   3 copies of data
   2 different storage types
   1 offsite (different region/cloud)
   ```

3. **Test recovery regularly**
   - Monthly: Backup integrity verification
   - Quarterly: Full DR drill
   - Annually: Complete failover test

4. **Automate failover when possible**
   ```
   Manual failover: Human decides, human executes
   Semi-automatic: Human decides, system executes
   Automatic: System decides and executes

   Higher automation = Faster recovery
   BUT requires more testing
   ```

5. **Document everything**
   - Runbooks for every failure scenario
   - Contact lists (on-call, vendors, executives)
   - System dependencies
   - Recovery procedures

### > **NEVER**

1. **Assume backups work without testing**
2. **Store backups in same region as primary**
3. **Skip DR drills**
4. **Leave runbooks outdated**
5. **Have single points of failure in critical paths**

---

## RPO/RTO Matrix

| Business Impact | Typical RPO | Typical RTO | Solution |
|-----------------|-------------|-------------|----------|
| **Critical** | Near-zero | Minutes | Multi-region active-active |
| **High** | 1 hour | 1-4 hours | Hot standby, streaming replication |
| **Medium** | 4-24 hours | 4-24 hours | Warm standby, daily backups |
| **Low** | 24-72 hours | 24-72 hours | Cold standby, periodic backups |

---

## Backup Strategies

### Database Backup Types

```
┌─────────────────────────────────────────────┐
│ FULL BACKUP                                 │
│ → Complete copy of all data                 │
│ → Slowest, largest, simplest restore        │
│ → Weekly recommended                        │
├─────────────────────────────────────────────┤
│ INCREMENTAL BACKUP                          │
│ → Changes since last backup (any type)      │
│ → Fastest, smallest, complex restore        │
│ → Hourly/daily recommended                  │
├─────────────────────────────────────────────┤
│ DIFFERENTIAL BACKUP                         │
│ → Changes since last full backup            │
│ → Middle ground                             │
│ → Daily recommended                         │
├─────────────────────────────────────────────┤
│ CONTINUOUS (WAL/Binlog)                     │
│ → Stream of all changes                     │
│ → Point-in-time recovery                    │
│ → For critical systems                      │
└─────────────────────────────────────────────┘
```

### Backup Schedule Example

```yaml
backup_schedule:
  database:
    full:
      frequency: weekly
      day: sunday
      time: "02:00"
      retention: 4 weeks
    incremental:
      frequency: hourly
      retention: 7 days
    wal_archiving:
      enabled: true
      destination: s3://backups/wal/

  files:
    frequency: daily
    time: "03:00"
    retention: 30 days

  configuration:
    frequency: on_change
    retention: 90 days
    versioned: true
```

### PostgreSQL Backup Script

```bash
#!/bin/bash
# Automated PostgreSQL backup

set -euo pipefail

DB_NAME="production"
BACKUP_DIR="/backups"
S3_BUCKET="s3://company-backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup
pg_dump -Fc "$DB_NAME" > "$BACKUP_DIR/${DB_NAME}_${DATE}.dump"

# Verify backup integrity
pg_restore --list "$BACKUP_DIR/${DB_NAME}_${DATE}.dump" > /dev/null

# Upload to S3 with encryption
aws s3 cp "$BACKUP_DIR/${DB_NAME}_${DATE}.dump" \
    "$S3_BUCKET/${DB_NAME}_${DATE}.dump" \
    --sse aws:kms \
    --sse-kms-key-id alias/backup-key

# Clean old local backups
find "$BACKUP_DIR" -name "*.dump" -mtime +7 -delete

# Clean old S3 backups (handled by lifecycle policy)

# Log success
echo "$(date): Backup completed successfully" >> /var/log/backup.log

# Alert on failure (trap)
trap 'echo "BACKUP FAILED" | mail -s "Backup Alert" ops@company.com' ERR
```

---

## Multi-Region Architecture

### Active-Passive

```
┌─────────────────────────────────────────────┐
│                                             │
│  PRIMARY REGION           SECONDARY REGION  │
│  ┌─────────────┐         ┌─────────────┐   │
│  │   Active    │ ──────> │   Passive   │   │
│  │   (writes)  │  async  │   (standby) │   │
│  └─────────────┘  repl   └─────────────┘   │
│        ▲                                    │
│        │                                    │
│    All Traffic                              │
│                                             │
└─────────────────────────────────────────────┘

Failover: DNS switch to secondary
RTO: Minutes to hours
RPO: Depends on replication lag
```

### Active-Active

```
┌─────────────────────────────────────────────┐
│                                             │
│    REGION A               REGION B          │
│  ┌─────────────┐         ┌─────────────┐   │
│  │   Active    │ <─────> │   Active    │   │
│  │ (reads/wrt) │  sync   │ (reads/wrt) │   │
│  └─────────────┘  repl   └─────────────┘   │
│        ▲                       ▲            │
│        │                       │            │
│   Traffic (50%)           Traffic (50%)     │
│        └───────── DNS ─────────┘            │
│                                             │
└─────────────────────────────────────────────┘

No failover needed: Traffic shifts automatically
RTO: Near-zero
RPO: Near-zero
Complexity: High (conflict resolution)
```

### Multi-Region Database Options

| Solution | Type | RPO | RTO | Complexity |
|----------|------|-----|-----|------------|
| AWS RDS Multi-AZ | Active-Passive | ~0 | Minutes | Low |
| AWS Aurora Global | Active-Passive | Seconds | Minutes | Medium |
| CockroachDB | Active-Active | 0 | 0 | High |
| Spanner | Active-Active | 0 | 0 | High |
| PostgreSQL + Patroni | Active-Passive | Seconds | Minutes | Medium |

---

## Incident Response

### Incident Severity Levels

```
┌─────────────────────────────────────────────┐
│ SEV 1 - CRITICAL                            │
│ → Complete service outage                   │
│ → Data loss/breach                          │
│ → All hands on deck, page executives        │
├─────────────────────────────────────────────┤
│ SEV 2 - HIGH                                │
│ → Major feature unavailable                 │
│ → Significant user impact                   │
│ → Page on-call, notify leadership           │
├─────────────────────────────────────────────┤
│ SEV 3 - MEDIUM                              │
│ → Minor feature degraded                    │
│ → Limited user impact                       │
│ → On-call investigates, business hours      │
├─────────────────────────────────────────────┤
│ SEV 4 - LOW                                 │
│ → Cosmetic issues                           │
│ → No user impact                            │
│ → Normal ticket queue                       │
└─────────────────────────────────────────────┘
```

### Incident Response Process

```
┌─────────────────────────────────────────────┐
│ 1. DETECT                                   │
│    → Monitoring alert triggers              │
│    → User report received                   │
├─────────────────────────────────────────────┤
│ 2. TRIAGE                                   │
│    → Assess severity                        │
│    → Assign incident commander              │
│    → Create incident channel                │
├─────────────────────────────────────────────┤
│ 3. MITIGATE                                 │
│    → Stop the bleeding                      │
│    → Rollback if needed                     │
│    → Communicate status                     │
├─────────────────────────────────────────────┤
│ 4. RESOLVE                                  │
│    → Fix root cause                         │
│    → Verify fix                             │
│    → Update status page                     │
├─────────────────────────────────────────────┤
│ 5. POSTMORTEM                               │
│    → Blameless review                       │
│    → Document timeline                      │
│    → Create action items                    │
└─────────────────────────────────────────────┘
```

### Incident Commander Checklist

```markdown
## Incident Commander Checklist

### Immediately
- [ ] Acknowledge the alert
- [ ] Create incident Slack channel: #incident-YYYYMMDD-brief
- [ ] Page additional help if needed
- [ ] Assign roles: IC, Scribe, Comms

### First 15 minutes
- [ ] Assess user impact
- [ ] Determine severity level
- [ ] Start incident doc
- [ ] Post initial status update

### During Incident
- [ ] Coordinate investigation
- [ ] Make rollback/failover decisions
- [ ] Update status page every 30 min
- [ ] Keep leadership informed (SEV1/2)

### Resolution
- [ ] Verify service restored
- [ ] Post final status update
- [ ] Schedule postmortem (within 48h)
- [ ] Thank the team
```

---

## Postmortem Template

```markdown
# Incident Postmortem: [Brief Title]

## Summary
**Date**: YYYY-MM-DD
**Duration**: X hours Y minutes
**Severity**: SEV-X
**Impact**: [Users affected, revenue impact, etc.]

## Timeline (All times UTC)
| Time | Event |
|------|-------|
| 14:00 | Monitoring alert triggered |
| 14:05 | On-call acknowledged |
| 14:15 | Root cause identified |
| 14:30 | Mitigation applied |
| 14:45 | Service restored |

## Root Cause
[Detailed technical explanation]

## Impact
- X users affected
- Y transactions failed
- $Z revenue impact

## What Went Well
- Fast detection (5 minutes)
- Clear runbooks
- Good team coordination

## What Went Poorly
- Rollback took too long
- Missing monitoring for X
- Unclear escalation path

## Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| Add monitoring for X | @engineer | YYYY-MM-DD |
| Update runbook | @oncall | YYYY-MM-DD |
| Implement circuit breaker | @team | YYYY-MM-DD |

## Lessons Learned
[Key takeaways for the organization]
```

---

## Failover Procedures

### Database Failover (PostgreSQL with Patroni)

```bash
#!/bin/bash
# Manual failover procedure

# 1. Check current cluster status
patronictl -c /etc/patroni/config.yml list

# 2. Verify replica is caught up
patronictl -c /etc/patroni/config.yml show-config

# 3. Initiate failover
patronictl -c /etc/patroni/config.yml switchover --master primary --candidate replica1

# 4. Verify new primary
patronictl -c /etc/patroni/config.yml list

# 5. Update connection strings (if not using DNS/proxy)
# Application config points to new primary
```

### Application Failover

```yaml
# Kubernetes deployment with pod disruption budget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: api

---
# Multi-region failover with external-dns
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    external-dns.alpha.kubernetes.io/hostname: api.example.com
    external-dns.alpha.kubernetes.io/ttl: "60"
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
```

---

## DR Testing Checklist

### Monthly
```
[ ] Verify backup integrity (restore to test environment)
[ ] Check backup completion logs
[ ] Verify offsite backup replication
[ ] Test monitoring and alerting
```

### Quarterly
```
[ ] Full restore drill (database + files)
[ ] Failover test to secondary region
[ ] Runbook review and update
[ ] Contact list verification
```

### Annually
```
[ ] Complete DR simulation (unannounced)
[ ] Third-party DR audit
[ ] Update DR documentation
[ ] Executive tabletop exercise
```

---

## Chaos Engineering

### Principles

```
┌─────────────────────────────────────────────┐
│ CHAOS ENGINEERING PRINCIPLES                │
├─────────────────────────────────────────────┤
│ 1. Hypothesize steady state behavior        │
│ 2. Vary real-world events                   │
│ 3. Run experiments in production            │
│ 4. Automate to run continuously             │
│ 5. Minimize blast radius                    │
└─────────────────────────────────────────────┘
```

### Chaos Experiments

```yaml
# Chaos Monkey configuration
chaos_experiments:
  - name: pod_failure
    target: random_pod
    namespace: production
    frequency: daily

  - name: network_latency
    target: service_mesh
    latency: 500ms
    percentage: 10%
    duration: 5m

  - name: zone_failure
    target: availability_zone
    frequency: monthly
    requires_approval: true
```

---

## Commands

```bash
# PostgreSQL backup
pg_dump -Fc database > backup.dump
pg_restore -d database backup.dump

# Verify backup
pg_restore --list backup.dump

# AWS RDS snapshot
aws rds create-db-snapshot \
    --db-instance-identifier prod-db \
    --db-snapshot-identifier prod-db-$(date +%Y%m%d)

# Kubernetes failover
kubectl config use-context dr-region
kubectl scale deployment api --replicas=3

# Check replication lag (PostgreSQL)
SELECT client_addr, state, sent_lsn, write_lsn,
       pg_wal_lsn_diff(sent_lsn, write_lsn) as lag_bytes
FROM pg_stat_replication;

# DNS failover (Route53)
aws route53 change-resource-record-sets \
    --hosted-zone-id ZONE_ID \
    --change-batch file://failover-change.json
```

---

## Resources

- **AWS DR Whitepaper**: [aws.amazon.com/whitepapers](https://aws.amazon.com/whitepapers/)
- **Google SRE Book**: [sre.google/books](https://sre.google/books/)
- **Chaos Engineering**: [principlesofchaos.org](https://principlesofchaos.org/)
- **PagerDuty Incident Response**: [response.pagerduty.com](https://response.pagerduty.com/)

---

## Examples

### Example 1: PostgreSQL Disaster Recovery Plan

**User request:** "Create a disaster recovery plan for PostgreSQL database"

```bash
#!/bin/bash
# PostgreSQL Disaster Recovery Script

# Configuration
PG_HOST="production-db.example.com"
PG_PORT=5432
PG_DATABASE="app_db"
BACKUP_DIR="/backups/postgresql"
RETENTION_DAYS=30
S3_BUCKET="s3://company-backups/postgres"

# 1. Create backup
create_backup() {
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"
    
    echo "Creating backup: $BACKUP_FILE"
    
    pg_dump -h $PG_HOST -U postgres -d $PG_DATABASE | \
        gzip > $BACKUP_FILE
    
    # Upload to S3
    aws s3 cp $BACKUP_FILE $S3_BUCKET/
    
    # Record backup metadata
    echo "$DATE,$BACKUP_FILE,$(stat -f%z "$BACKUP_FILE")" >> $BACKUP_DIR/backups.log
    
    echo "Backup completed: $BACKUP_FILE"
}

# 2. Restore from backup
restore_backup() {
    BACKUP_FILE=$1
    
    if [ -z "$BACKUP_FILE" ]; then
        echo "Usage: restore_backup <backup_file>"
        exit 1
    fi
    
    echo "Restoring from: $BACKUP_FILE"
    
    # Download from S3 if not local
    if [ ! -f "$BACKUP_FILE" ]; then
        aws s3 cp $S3_BUCKET/$(basename $BACKUP_FILE) $BACKUP_FILE
    fi
    
    # Stop application
    systemctl stop app-service
    
    # Restore database
    gunzip -c $BACKUP_FILE | \
        psql -h $PG_HOST -U postgres -d $PG_DATABASE
    
    # Start application
    systemctl start app-service
    
    echo "Restore completed"
}

# 3. Test backup integrity
test_backup() {
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.sql.gz | head -1)
    
    echo "Testing backup: $LATEST_BACKUP"
    
    # Create test database
    createdb -h $PG_HOST -U postgres test_restore
    
    # Restore to test database
    gunzip -c $LATEST_BACKUP | \
        psql -h $PG_HOST -U postgres -d test_restore
    
    # Run integrity checks
    psql -h $PG_HOST -U postgres -d test_restore << 'SQL'
        SELECT COUNT(*) FROM users;
        SELECT COUNT(*) FROM orders;
SQL
    
    # Drop test database
    dropdb -h $PG_HOST -U postgres test_restore
    
    echo "Backup test passed"
}

# 4. Clean old backups
cleanup_old_backups() {
    echo "Cleaning up backups older than $RETENTION_DAYS days"
    
    find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # Also clean from S3
    aws s3 ls $S3_BUCKET/ | \
        grep " PRE " -v | \
        awk '{print $4}' | \
        while read file; do
            file_date=$(echo $file | grep -oP '\d{8}_\d{6}')
            file_timestamp=$(date -d "${file_date:0:8} ${file_date:9:2}:${file_date:11:2}:${file_date:14:2}" +%s)
            cutoff_timestamp=$(date -d "$RETENTION_DAYS days ago" +%s)
            
            if [ $file_timestamp -lt $cutoff_timestamp ]; then
                aws s3 rm "$S3_BUCKET/$file"
            fi
        done
    
    echo "Cleanup completed"
}

# Main
case "$1" in
    backup)
        create_backup
        ;;
    restore)
        restore_backup $2
        ;;
    test)
        test_backup
        ;;
    cleanup)
        cleanup_old_backups
        ;;
    *)
        echo "Usage: $0 {backup|restore|test|cleanup}"
        exit 1
        ;;
esac
