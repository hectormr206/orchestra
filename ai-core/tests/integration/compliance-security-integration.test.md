# Integration Tests: Compliance + Security

## Test Suite: Enterprise Compliance Integration

### Test 1: GDPR Compliance Flow

**Scenario:** "Make user data handling GDPR compliant"

**Expected Flow:**
```
1. compliance skill
   └── GDPR requirements
      ├── Data portability (export)
      ├── Right to erasure (delete)
      ├── Consent management
      ├── Data breach notification
      └── Audit logging

2. security skill
   └── Implement security
      ├── Data encryption at rest
      ├── Data encryption in transit
      ├── Access control
      └── PII detection

3. audit-logging skill
   └── Log all data access
      ├── Who accessed data
      ├── When accessed
      ├── What data accessed
      └── Immutable logs

4. backend skill
   └── API endpoints
      ├── GET /privacy/export (export)
      ├── DELETE /privacy/delete (erase)
      ├── POST /privacy/consent (consent)
      └── GET /privacy/consents (list)
```

**Validation:**
- ✅ All GDPR rights implemented
- ✅ Data encrypted
- ✅ All access logged
- ✅ Audit trail complete

### Test 2: HIPAA Compliance Flow

**Scenario:** "Handle health data (PHI) securely"

**Expected Flow:**
```
1. compliance skill
   └── HIPAA requirements
      ├── PHI protection
      ├── Access logging
      ├── Business associate agreements
      └── Security safeguards

2. security skill
   └── Implement safeguards
      ├── Encryption (AES-256)
      ├── Access controls (RBAC)
      ├── Audit trails
      └── Minimum necessary standard

3. audit-logging skill
   └── Comprehensive logging
      ├── All PHI access logged
      ├── User authentication
      ├── Data modifications
      └── Exports/disclosures

4. backend skill
   └── Secure endpoints
      ├── PHI data encrypted
      ├── Role-based access
      ├── Audit logs
      └── BAA tracking
```

**Validation:**
- ✅ PHI encrypted
- ✅ Access controlled
- ✅ Complete audit trail
- ✅ HIPAA compliant
