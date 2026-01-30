---
name: audit-logging
description: >
  Enterprise audit logging: who did what, when, where. Immutable audit trails,
  compliance reporting, forensics, tamper-proof logs, retention policies.
  Trigger: When implementing audit trails or compliance logging.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Implementing audit trails"
    - "Logging user actions"
    - "Compliance reporting"
    - "Security incident investigation"
    - "Tracking data changes"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Implementing compliance requirements (SOX, HIPAA, PCI-DSS)
- Tracking user actions for security
- Creating immutable audit trails
- Investigating security incidents
- Implementing data change tracking

---

## Critical Patterns

### > **ALWAYS**

1. **Log the 5 W's**
   ```
   ┌─────────────────────────────────────────────┐
   │ EVERY AUDIT LOG MUST CAPTURE:              │
   │                                             │
   │ WHO    → User ID, role, IP address         │
   │ WHAT   → Action performed, resource type   │
   │ WHEN   → Timestamp (UTC, ISO 8601)         │
   │ WHERE  → System, service, endpoint         │
   │ WHY    → Business context (if available)   │
   │ RESULT → Success/failure, error code       │
   └─────────────────────────────────────────────┘
   ```

2. **Make logs immutable**
   ```python
   # Use append-only storage
   # Hash chain for tamper detection
   # Write-once policies (S3 Object Lock, WORM storage)

   def create_audit_log(event: AuditEvent) -> str:
       previous_hash = get_latest_hash()

       log_entry = {
           "id": str(uuid.uuid4()),
           "timestamp": datetime.utcnow().isoformat() + "Z",
           "event": event.dict(),
           "previous_hash": previous_hash,
       }

       # Create hash chain
       log_entry["hash"] = hashlib.sha256(
           json.dumps(log_entry, sort_keys=True).encode()
       ).hexdigest()

       # Store in append-only storage
       await immutable_storage.append(log_entry)

       return log_entry["id"]
   ```

3. **Use structured format**
   ```json
   {
     "id": "550e8400-e29b-41d4-a716-446655440000",
     "timestamp": "2024-01-15T14:30:00.000Z",
     "version": "1.0",
     "event": {
       "type": "USER_ACTION",
       "action": "UPDATE",
       "category": "DATA_MODIFICATION"
     },
     "actor": {
       "id": "user_123",
       "type": "USER",
       "email": "user@example.com",
       "ip_address": "192.168.1.100",
       "user_agent": "Mozilla/5.0...",
       "session_id": "sess_abc123"
     },
     "resource": {
       "type": "CUSTOMER_RECORD",
       "id": "cust_456",
       "name": "Customer Profile"
     },
     "context": {
       "service": "customer-api",
       "environment": "production",
       "correlation_id": "req_xyz789",
       "request_path": "/api/v1/customers/456"
     },
     "changes": {
       "before": { "email": "old@example.com" },
       "after": { "email": "new@example.com" },
       "fields_modified": ["email"]
     },
     "result": {
       "status": "SUCCESS",
       "status_code": 200
     },
     "metadata": {
       "reason": "Customer requested email change",
       "ticket_id": "SUPPORT-1234"
     }
   }
   ```

4. **Separate audit logs from application logs**
   ```
   Application Logs → Debugging, monitoring
   Audit Logs       → Compliance, forensics

   Different:
   - Storage (audit needs immutable)
   - Retention (audit often 7+ years)
   - Access (audit needs strict controls)
   - Format (audit needs legal standards)
   ```

5. **Protect audit logs**
   ```
   ┌─────────────────────────────────────────────┐
   │ AUDIT LOG SECURITY                          │
   │                                             │
   │ ✓ Encrypt at rest and in transit           │
   │ ✓ Separate storage from application        │
   │ ✓ Restrict access (principle of least)     │
   │ ✓ Log access to audit logs (meta-audit)    │
   │ ✓ Tamper detection (hash chains, signing)  │
   │ ✓ Offsite backup                           │
   └─────────────────────────────────────────────┘
   ```

### > **NEVER**

1. **Log sensitive data in plain text**
   ```python
   # WRONG
   audit_log({"action": "login", "password": user.password})

   # RIGHT - redact/mask sensitive fields
   audit_log({
       "action": "login",
       "password": "[REDACTED]",
       "credit_card": "****-****-****-1234"
   })
   ```

2. **Allow audit log deletion**
3. **Skip logging for "minor" actions**
4. **Use client-provided timestamps**
5. **Store audit logs in the same DB as application data**

---

## Events to Audit

### High Priority (MUST audit)

| Category | Events |
|----------|--------|
| **Authentication** | Login, logout, MFA, password change, session creation |
| **Authorization** | Permission changes, role assignments, access denied |
| **Data Access** | Read/export of sensitive data, bulk queries |
| **Data Modification** | Create, update, delete of business data |
| **Admin Actions** | User management, config changes, deployments |
| **Security** | Failed logins, suspicious activity, policy violations |

### Medium Priority (SHOULD audit)

| Category | Events |
|----------|--------|
| **User Actions** | Profile updates, preferences, consent changes |
| **Business Operations** | Orders, transactions, approvals |
| **Integration** | API calls, webhook events, data sync |
| **System** | Startup, shutdown, errors |

---

## Database Schema

### PostgreSQL Implementation

```sql
-- Audit log table (append-only)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version VARCHAR(10) NOT NULL DEFAULT '1.0',

    -- Event details
    event_type VARCHAR(50) NOT NULL,
    event_action VARCHAR(50) NOT NULL,
    event_category VARCHAR(50) NOT NULL,

    -- Actor (who)
    actor_id VARCHAR(255),
    actor_type VARCHAR(50) NOT NULL,
    actor_email VARCHAR(255),
    actor_ip INET,
    actor_user_agent TEXT,
    actor_session_id VARCHAR(255),

    -- Resource (what)
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    resource_name VARCHAR(255),

    -- Context (where)
    service VARCHAR(100) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    correlation_id VARCHAR(255),
    request_path VARCHAR(500),

    -- Changes
    changes_before JSONB,
    changes_after JSONB,
    fields_modified TEXT[],

    -- Result
    result_status VARCHAR(50) NOT NULL,
    result_status_code INT,
    result_error_message TEXT,

    -- Metadata
    metadata JSONB,

    -- Integrity
    previous_hash VARCHAR(64),
    hash VARCHAR(64) NOT NULL,

    -- Prevent modification
    CONSTRAINT no_update CHECK (TRUE)
);

-- Indexes for common queries
CREATE INDEX idx_audit_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX idx_audit_actor ON audit_logs (actor_id, timestamp DESC);
CREATE INDEX idx_audit_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_correlation ON audit_logs (correlation_id);
CREATE INDEX idx_audit_event_type ON audit_logs (event_type, event_action);

-- Prevent DELETE and UPDATE
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Partitioning for performance (by month)
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

---

## Implementation Examples

### Python Audit Logger

```python
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any
import hashlib
import json
import uuid

@dataclass
class AuditEvent:
    event_type: str
    action: str
    category: str
    actor_id: str
    actor_type: str
    resource_type: str
    resource_id: Optional[str] = None
    changes_before: Optional[Dict] = None
    changes_after: Optional[Dict] = None
    metadata: Optional[Dict] = None
    result_status: str = "SUCCESS"

class AuditLogger:
    def __init__(self, service_name: str, environment: str):
        self.service = service_name
        self.environment = environment
        self._previous_hash = None

    def _compute_hash(self, data: Dict) -> str:
        """Compute SHA-256 hash of log entry"""
        return hashlib.sha256(
            json.dumps(data, sort_keys=True, default=str).encode()
        ).hexdigest()

    def _redact_sensitive(self, data: Dict) -> Dict:
        """Redact sensitive fields"""
        sensitive_fields = ['password', 'ssn', 'credit_card', 'api_key']
        redacted = {}
        for key, value in data.items():
            if any(sf in key.lower() for sf in sensitive_fields):
                redacted[key] = '[REDACTED]'
            elif isinstance(value, dict):
                redacted[key] = self._redact_sensitive(value)
            else:
                redacted[key] = value
        return redacted

    async def log(
        self,
        event: AuditEvent,
        request: Optional[Any] = None,
        correlation_id: Optional[str] = None
    ) -> str:
        """Create immutable audit log entry"""

        log_entry = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "version": "1.0",
            "event": {
                "type": event.event_type,
                "action": event.action,
                "category": event.category
            },
            "actor": {
                "id": event.actor_id,
                "type": event.actor_type,
                "ip_address": getattr(request, 'client_ip', None),
                "user_agent": getattr(request, 'user_agent', None),
            },
            "resource": {
                "type": event.resource_type,
                "id": event.resource_id,
            },
            "context": {
                "service": self.service,
                "environment": self.environment,
                "correlation_id": correlation_id,
            },
            "result": {
                "status": event.result_status,
            },
            "previous_hash": self._previous_hash,
        }

        # Add changes with redaction
        if event.changes_before:
            log_entry["changes"] = {
                "before": self._redact_sensitive(event.changes_before),
                "after": self._redact_sensitive(event.changes_after or {}),
            }

        if event.metadata:
            log_entry["metadata"] = self._redact_sensitive(event.metadata)

        # Compute hash
        log_entry["hash"] = self._compute_hash(log_entry)
        self._previous_hash = log_entry["hash"]

        # Store
        await self._store(log_entry)

        return log_entry["id"]

    async def _store(self, log_entry: Dict):
        """Store in immutable storage"""
        # Implementation depends on storage backend
        # Could be: PostgreSQL, S3 with Object Lock, Azure Immutable Blob, etc.
        pass

# Usage
audit = AuditLogger("customer-api", "production")

await audit.log(
    AuditEvent(
        event_type="USER_ACTION",
        action="UPDATE",
        category="DATA_MODIFICATION",
        actor_id="user_123",
        actor_type="USER",
        resource_type="CUSTOMER_RECORD",
        resource_id="cust_456",
        changes_before={"email": "old@example.com"},
        changes_after={"email": "new@example.com"},
        metadata={"reason": "Customer request", "ticket": "SUPPORT-123"}
    ),
    request=current_request,
    correlation_id=get_correlation_id()
)
```

### Middleware for Automatic Auditing

```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class AuditMiddleware(BaseHTTPMiddleware):
    """Automatically audit all API requests"""

    AUDIT_METHODS = {'POST', 'PUT', 'PATCH', 'DELETE'}
    SKIP_PATHS = {'/health', '/metrics', '/ready'}

    async def dispatch(self, request: Request, call_next):
        # Skip non-auditable requests
        if request.method not in self.AUDIT_METHODS:
            return await call_next(request)

        if request.url.path in self.SKIP_PATHS:
            return await call_next(request)

        # Capture request data before processing
        correlation_id = request.headers.get('X-Correlation-ID', str(uuid.uuid4()))
        request_body = await self._get_request_body(request)

        # Process request
        response = await call_next(request)

        # Create audit log
        await audit.log(
            AuditEvent(
                event_type="API_REQUEST",
                action=request.method,
                category="API_ACCESS",
                actor_id=getattr(request.state, 'user_id', 'anonymous'),
                actor_type="USER" if hasattr(request.state, 'user_id') else "SYSTEM",
                resource_type=self._extract_resource_type(request.url.path),
                resource_id=self._extract_resource_id(request.url.path),
                result_status="SUCCESS" if response.status_code < 400 else "FAILURE",
                metadata={
                    "request_body_hash": self._hash_body(request_body),
                    "response_status": response.status_code
                }
            ),
            request=request,
            correlation_id=correlation_id
        )

        return response
```

---

## Compliance Requirements

### SOX (Sarbanes-Oxley)

```
REQUIRED AUDIT EVENTS:
□ Financial data access
□ Financial data modifications
□ User access changes
□ System configuration changes
□ Report generation

RETENTION: 7 years
CONTROLS: Segregation of duties, change management
```

### HIPAA

```
REQUIRED AUDIT EVENTS:
□ PHI access (read)
□ PHI modifications
□ User authentication
□ Permission changes
□ Data exports

RETENTION: 6 years
CONTROLS: Access controls, audit reviews
```

### PCI-DSS

```
REQUIRED AUDIT EVENTS:
□ Cardholder data access
□ Authentication attempts
□ Privileged actions
□ System clock changes
□ Audit log access

RETENTION: 1 year online, 1 year archive
REVIEW: Daily log review required
```

---

## Querying Audit Logs

### Common Queries

```sql
-- User activity report
SELECT
    timestamp,
    event_type,
    event_action,
    resource_type,
    resource_id,
    result_status
FROM audit_logs
WHERE actor_id = 'user_123'
  AND timestamp >= NOW() - INTERVAL '30 days'
ORDER BY timestamp DESC;

-- Failed operations
SELECT
    timestamp,
    actor_id,
    event_action,
    resource_type,
    result_error_message
FROM audit_logs
WHERE result_status = 'FAILURE'
  AND timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Data access report (for compliance)
SELECT
    DATE(timestamp) as date,
    actor_id,
    COUNT(*) as access_count,
    COUNT(DISTINCT resource_id) as unique_resources
FROM audit_logs
WHERE event_type = 'DATA_ACCESS'
  AND resource_type = 'CUSTOMER_RECORD'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), actor_id
ORDER BY date, access_count DESC;

-- Suspicious activity
SELECT
    actor_id,
    actor_ip,
    COUNT(*) as failed_attempts,
    COUNT(DISTINCT actor_ip) as unique_ips
FROM audit_logs
WHERE event_type = 'AUTHENTICATION'
  AND result_status = 'FAILURE'
  AND timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY actor_id, actor_ip
HAVING COUNT(*) > 5;

-- Chain integrity verification
SELECT
    id,
    timestamp,
    hash,
    previous_hash,
    LAG(hash) OVER (ORDER BY timestamp) as expected_previous_hash,
    CASE
        WHEN previous_hash = LAG(hash) OVER (ORDER BY timestamp)
        THEN 'VALID'
        ELSE 'TAMPERED'
    END as integrity_status
FROM audit_logs
ORDER BY timestamp;
```

---

## Storage Solutions

| Solution | Immutability | Compliance | Cost |
|----------|--------------|------------|------|
| **AWS S3 + Object Lock** | WORM compliant | SEC 17a-4 | Low |
| **Azure Immutable Blob** | Legal hold, time-based | SEC, FINRA | Low |
| **PostgreSQL + Triggers** | Soft immutability | Application-level | Medium |
| **Amazon QLDB** | Cryptographic | Built-in integrity | High |
| **Splunk** | Enterprise audit | SOX, HIPAA | High |

---

## Commands

```bash
# Query recent audit logs
psql -c "SELECT * FROM audit_logs WHERE timestamp > NOW() - INTERVAL '1 hour'"

# Export audit logs for compliance
psql -c "COPY (SELECT * FROM audit_logs WHERE timestamp BETWEEN '2024-01-01' AND '2024-01-31') TO '/tmp/audit_jan_2024.csv' WITH CSV HEADER"

# Verify chain integrity
psql -c "SELECT COUNT(*) as tampered FROM (SELECT *, LAG(hash) OVER (ORDER BY timestamp) as prev FROM audit_logs) t WHERE previous_hash != prev"

# Archive old logs
aws s3 cp audit_logs_2023.csv s3://audit-archive/ --storage-class GLACIER
```

---

## Resources

- **NIST SP 800-92**: [Guide to Computer Security Log Management](https://csrc.nist.gov/publications/detail/sp/800-92/final)
- **OWASP Logging**: [owasp.org/cheat-sheets/Logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- **CIS Controls**: [cisecurity.org](https://www.cisecurity.org/controls)

---

## Examples

### Example 1: Implementing Immutable Audit Logs

**User request:** "Create an audit logging system for a financial application"

**Implementation:**

```python
from datetime import datetime
from hashlib import sha256
import json

class AuditLogger:
    def __init__(self, db_session):
        self.db = db_session
    
    async def log_event(self, event: dict):
        """Record an immutable audit event"""
        # Get previous hash for chain integrity
        previous = await self.db.execute(
            "SELECT hash FROM audit_logs ORDER BY timestamp DESC LIMIT 1"
        )
        previous_hash = previous.scalar() or ""
        
        # Create event record
        record = {
            "timestamp": datetime.utcnow().isoformat(),
            "actor": event["actor"],  # user_id or system
            "action": event["action"],  # what was done
            "resource": event["resource"],  # what was affected
            "ip_address": event.get("ip_address"),
            "user_agent": event.get("user_agent"),
            "changes": event.get("changes", {}),  # before/after
            "reason": event.get("reason"),  # why it was done
            "previous_hash": previous_hash
        }
        
        # Calculate hash for this record
        record["hash"] = sha256(
            json.dumps(record, sort_keys=True).encode()
        ).hexdigest()
        
        # Insert into database
        await self.db.execute(
            """INSERT INTO audit_logs 
               (timestamp, actor, action, resource, ip_address, 
                user_agent, changes, reason, previous_hash, hash)
               VALUES (:timestamp, :actor, :action, :resource, 
                       :ip_address, :user_agent, :changes, :reason,
                       :previous_hash, :hash)""",
            record
        )
    
    async def verify_integrity(self):
        """Check if audit log chain has been tampered"""
        records = await self.db.execute(
            "SELECT * FROM audit_logs ORDER BY timestamp ASC"
        )
        
        for i, record in enumerate(records[1:], 1):
            expected_hash = sha256(
                json.dumps(records[i-1], sort_keys=True).encode()
            ).hexdigest()
            
            if record["previous_hash"] != expected_hash:
                raise Exception(
                    f"Chain broken at record {record['id']}"
                )
        
        return True

# Usage
logger = AuditLogger(db_session)

# Log sensitive action
await logger.log_event({
    "actor": "user_123",
    "action": "DELETE",
    "resource": "/api/users/456",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "changes": {
        "before": {"status": "active", "email": "user@example.com"},
        "after": {"status": "deleted"}
    },
    "reason": "User requested account deletion per GDPR"
})
```

**Features:**
- ✅ Immutable records with cryptographic hash chain
- ✅ Tamper detection with previous_hash linking
- ✅ Complete before/after state capture
- ✅ Compliance with GDPR, HIPAA audit requirements
- ✅ IP and user agent tracking
