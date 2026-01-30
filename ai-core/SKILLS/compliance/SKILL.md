---
name: compliance
description: >
  Regulatory compliance patterns for enterprise: GDPR, HIPAA, SOC 2, PCI-DSS,
  ISO 27001, CCPA, LGPD. Data privacy, retention policies, audit requirements.
  Trigger: When handling PII, health data, payments, or enterprise clients.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Handling personal data (PII)"
    - "Processing health records"
    - "Implementing payment systems"
    - "Working with enterprise clients"
    - "Data retention or deletion"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Building systems that handle personal data
- Working with healthcare data (HIPAA)
- Processing credit card payments (PCI-DSS)
- Serving European users (GDPR)
- Serving California users (CCPA)
- Enterprise clients requiring SOC 2 / ISO 27001
- Government contracts (FedRAMP, NIST)

---

## Critical Patterns

### > **ALWAYS**

1. **Data Classification**
   - Identify ALL data types: PII, PHI, PCI, Confidential, Public
   - Document data flows (where it enters, travels, exits)
   - Maintain data inventory/catalog

2. **Consent Management**
   ```
   ┌─────────────────────────────────────────┐
   │ CONSENT MUST BE:                        │
   │ ✓ Freely given (no coercion)            │
   │ ✓ Specific (per purpose)                │
   │ ✓ Informed (clear language)             │
   │ ✓ Unambiguous (explicit action)         │
   │ ✓ Withdrawable (easy opt-out)           │
   └─────────────────────────────────────────┘
   ```

3. **Data Minimization**
   - Collect ONLY what you need
   - Retain ONLY as long as necessary
   - Delete when purpose is fulfilled

4. **Right to be Forgotten (GDPR Art. 17)**
   ```sql
   -- Soft delete with anonymization
   UPDATE users SET
     email = 'deleted_' || id || '@anonymized.local',
     name = 'Deleted User',
     phone = NULL,
     deleted_at = NOW(),
     deletion_reason = 'GDPR_REQUEST'
   WHERE id = $1;

   -- Also cascade to related tables
   -- Log the deletion for audit
   ```

5. **Data Subject Access Requests (DSAR)**
   - Respond within 30 days (GDPR) / 45 days (CCPA)
   - Provide data in portable format (JSON, CSV)
   - Include all data sources

6. **Encryption Requirements**
   - At rest: AES-256
   - In transit: TLS 1.2+ (prefer 1.3)
   - Key management: HSM or cloud KMS

### > **NEVER**

1. **Store sensitive data without encryption**
2. **Transfer PII without explicit consent**
3. **Retain data beyond legal requirements**
4. **Process children's data without parental consent (COPPA)**
5. **Share data with third parties without DPA**
6. **Ignore data breach notification requirements**

---

## Compliance Matrix

| Regulation | Region | Focus | Key Requirements |
|------------|--------|-------|------------------|
| **GDPR** | EU/EEA | Privacy | Consent, DSAR, DPO, 72h breach notice |
| **CCPA/CPRA** | California | Privacy | Opt-out, Do Not Sell, data access |
| **HIPAA** | USA | Health | PHI protection, BAA, audit logs |
| **PCI-DSS** | Global | Payments | Card data security, quarterly scans |
| **SOC 2** | Global | Security | Trust principles, annual audit |
| **ISO 27001** | Global | InfoSec | ISMS, risk assessment, controls |
| **LGPD** | Brazil | Privacy | Similar to GDPR |
| **FedRAMP** | USA Gov | Cloud | Authorization, continuous monitoring |
| **NIST 800-53** | USA | Security | Security controls framework |

---

## GDPR Quick Reference

### Legal Bases for Processing

```
┌────────────────────────────────────────────┐
│ 1. Consent         → User explicitly agrees│
│ 2. Contract        → Necessary for service │
│ 3. Legal obligation→ Law requires it       │
│ 4. Vital interests → Life/death situation  │
│ 5. Public task     → Government function   │
│ 6. Legitimate int. → Business need (risky) │
└────────────────────────────────────────────┘
```

### Data Subject Rights

| Right | Implementation |
|-------|----------------|
| Access | Export all user data on request |
| Rectification | Allow users to correct their data |
| Erasure | Delete on request (with exceptions) |
| Portability | Provide data in machine-readable format |
| Object | Stop processing on request |
| Restriction | Limit processing without deletion |

---

## HIPAA Requirements

### PHI (Protected Health Information)

```
┌─────────────────────────────────────────────┐
│ 18 HIPAA Identifiers (ALWAYS protect):     │
├─────────────────────────────────────────────┤
│ 1. Name               10. Account numbers  │
│ 2. Address            11. License numbers  │
│ 3. Dates (except yr)  12. Vehicle IDs      │
│ 4. Phone numbers      13. Device IDs       │
│ 5. Fax numbers        14. URLs             │
│ 6. Email addresses    15. IP addresses     │
│ 7. SSN                16. Biometrics       │
│ 8. Medical record #   17. Photos           │
│ 9. Health plan ID     18. Any unique ID    │
└─────────────────────────────────────────────┘
```

### HIPAA Safeguards

| Type | Requirements |
|------|--------------|
| **Administrative** | Risk analysis, workforce training, incident procedures |
| **Physical** | Facility access controls, workstation security |
| **Technical** | Access control, audit logs, encryption, integrity |

---

## PCI-DSS Requirements

### The 12 Requirements

```
BUILD SECURE NETWORK
  1. Install and maintain firewall
  2. Don't use vendor defaults for passwords

PROTECT CARDHOLDER DATA
  3. Protect stored cardholder data
  4. Encrypt transmission over public networks

MAINTAIN VULNERABILITY PROGRAM
  5. Use and update anti-virus
  6. Develop secure systems and apps

IMPLEMENT ACCESS CONTROL
  7. Restrict access by business need
  8. Unique IDs for each user
  9. Restrict physical access

MONITOR AND TEST
  10. Track all access to data/resources
  11. Regularly test security systems

MAINTAIN POLICY
  12. Security policy for all personnel
```

### PCI Data Handling

```
┌─────────────────────────────────────────────┐
│ NEVER store:                                │
│ ✗ Full magnetic stripe data                 │
│ ✗ CVV/CVC (after authorization)             │
│ ✗ PIN/PIN block                             │
│                                             │
│ CAN store (if encrypted):                   │
│ ✓ PAN (masked: ****-****-****-1234)         │
│ ✓ Cardholder name                           │
│ ✓ Expiration date                           │
│ ✓ Service code                              │
└─────────────────────────────────────────────┘
```

---

## SOC 2 Trust Principles

| Principle | Controls |
|-----------|----------|
| **Security** | Access control, encryption, firewalls, monitoring |
| **Availability** | Redundancy, DR, incident response, SLAs |
| **Processing Integrity** | QA, monitoring, error handling |
| **Confidentiality** | Encryption, access controls, classification |
| **Privacy** | Consent, notice, choice, access, disclosure |

---

## Data Retention Policies

```python
RETENTION_POLICIES = {
    # Business data
    "transactions": "7 years",      # Tax requirements
    "contracts": "contract_end + 6 years",
    "invoices": "7 years",

    # User data
    "account_data": "account_active + 30 days",
    "marketing_consent": "until_withdrawn",
    "support_tickets": "3 years",

    # Logs
    "access_logs": "1 year",
    "audit_logs": "7 years",        # SOC 2/compliance
    "error_logs": "90 days",

    # Health data (HIPAA)
    "medical_records": "6 years from last service",

    # Financial (PCI)
    "payment_logs": "1 year",
}
```

---

## Implementation Examples

### Privacy Policy Endpoints

```python
# Required endpoints for GDPR/CCPA compliance
@app.get("/privacy/export")
async def export_user_data(user_id: str):
    """DSAR: Export all user data"""
    data = await collect_all_user_data(user_id)
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": f"attachment; filename=user_data_{user_id}.json"}
    )

@app.post("/privacy/delete")
async def delete_user_data(user_id: str, reason: str):
    """Right to erasure"""
    await anonymize_user(user_id)
    await log_deletion(user_id, reason)
    return {"status": "deleted", "retention_log_id": log_id}

@app.get("/privacy/consent")
async def get_consent_status(user_id: str):
    """Get current consent preferences"""
    return await get_user_consents(user_id)

@app.post("/privacy/consent")
async def update_consent(user_id: str, consents: ConsentUpdate):
    """Update consent preferences"""
    await update_user_consents(user_id, consents)
    await log_consent_change(user_id, consents)
```

### Consent Database Schema

```sql
CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    consent_type VARCHAR(50) NOT NULL,  -- 'marketing', 'analytics', 'third_party'
    granted BOOLEAN NOT NULL DEFAULT false,
    granted_at TIMESTAMP,
    withdrawn_at TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    consent_version VARCHAR(20),  -- Track policy version
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, consent_type)
);

-- Audit trail for consent changes
CREATE TABLE consent_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    consent_type VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,  -- 'granted', 'withdrawn'
    old_value BOOLEAN,
    new_value BOOLEAN,
    ip_address INET,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## Breach Notification Requirements

| Regulation | Timeframe | Notify |
|------------|-----------|--------|
| GDPR | 72 hours | Supervisory authority + affected users |
| HIPAA | 60 days | HHS + affected individuals + media (if >500) |
| CCPA | "Most expedient time" | Attorney General + affected consumers |
| PCI-DSS | Immediately | Card brands + acquiring bank |

### Breach Response Checklist

```
□ Contain the breach (isolate affected systems)
□ Assess scope (what data, how many users)
□ Preserve evidence (forensic copies)
□ Notify legal/compliance team
□ Notify affected parties (per regulation)
□ Notify regulators (per timeframe)
□ Document everything
□ Remediate vulnerabilities
□ Post-incident review
```

---

## Third-Party Risk

### Data Processing Agreement (DPA) Requirements

```
EVERY third-party processor MUST have:
□ Written DPA in place
□ Security measures documented
□ Sub-processor list
□ Data deletion provisions
□ Audit rights
□ Breach notification clause
□ Data transfer mechanisms (for international)
```

---

## Commands

```bash
# Audit data access patterns
grep -r "SELECT.*FROM.*users" --include="*.py" --include="*.js"

# Find PII fields in code
grep -rE "(email|phone|ssn|address|dob|birth)" --include="*.py" --include="*.sql"

# Check for hardcoded sensitive data
grep -rE "(password|secret|key|token).*=" --include="*.py" --include="*.env"

# GDPR data export test
curl -X GET "https://api.example.com/privacy/export" -H "Authorization: Bearer $TOKEN"
```

---

## Resources

- **GDPR Full Text**: [gdpr-info.eu](https://gdpr-info.eu/)
- **CCPA Guide**: [oag.ca.gov/privacy/ccpa](https://oag.ca.gov/privacy/ccpa)
- **HIPAA**: [hhs.gov/hipaa](https://www.hhs.gov/hipaa/index.html)
- **PCI-DSS**: [pcisecuritystandards.org](https://www.pcisecuritystandards.org/)
- **SOC 2**: [aicpa.org/soc](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/sorhome.html)
- **ISO 27001**: [iso.org/iso-27001](https://www.iso.org/iso-27001-information-security.html)

---

## Examples

### Example 1: Implementing GDPR Compliance

**User request:** "Make our user management system GDPR compliant"

**Implementation:**

```python
from datetime import datetime, timedelta
from typing import List, Optional
import json
from sqlalchemy import Column, Integer, String, DateTime, Text

class GDPRCompliance:
    """GDPR compliance utilities"""
    
    @staticmethod
    async def export_user_data(user_id: int) -> dict:
        """
        GDPR Article 15: Right of access (data portability)
        User can request all their personal data
        """
        user_data = {
            "personal_info": await db.get_user(user_id),
            "orders": await db.get_orders(user_id),
            "payments": await db.get_payments(user_id),
            "activity_log": await db.get_activity_log(user_id),
            "consents": await db.get_consents(user_id),
            "export_date": datetime.utcnow().isoformat()
        }
        return user_data
    
    @staticmethod
    async def anonymize_user(user_id: int, reason: str):
        """
        GDPR Article 17: Right to erasure (right to be forgotten)
        Anonymize user data instead of hard delete for audit purposes
        """
        # Replace PII with anonymized values
        await db.users.update(user_id, {
            "email": f"deleted-{user_id}@anonymized.local",
            "name": "Deleted User",
            "phone": None,
            "address": None,
            "deleted_at": datetime.utcnow(),
            "deletion_reason": reason
        })
        
        # Anonymize related data
        await db.orders.filter(user_id=user_id).update({
            "customer_name": "Deleted User",
            "email": None
        })
    
    @staticmethod
    async def record_consent(user_id: int, consent_type: str, 
                            purpose: str, legal_basis: str):
        """
        GDPR Article 7: Conditions for consent
        Must record: what user consented to, when, and legal basis
        """
        await db.consents.insert({
            "user_id": user_id,
            "consent_type": consent_type,  # e.g., "marketing_emails"
            "purpose": purpose,  # e.g., "Send promotional offers"
            "legal_basis": legal_basis,  # e.g., "consent", "contract", "legal_obligation"
            "granted_at": datetime.utcnow(),
            "ip_address": request.remote_addr,
            "user_agent": request.user_agent,
            "withdrawn_at": None  # Set if user withdraws consent
        })
    
    @staticmethod
    async def check_consent(user_id: int, consent_type: str) -> bool:
        """Check if user has valid consent for a purpose"""
        consent = await db.consents.filter(
            user_id=user_id,
            consent_type=consent_type,
            withdrawn_at=None
        ).first()
        return consent is not None
    
    @staticmethod
    async def withdraw_consent(user_id: int, consent_type: str):
        """
        GDPR Article 7(3): Right to withdraw consent
        Must be as easy as giving consent
        """
        await db.consents.filter(
            user_id=user_id,
            consent_type=consent_type
        ).update({
            "withdrawn_at": datetime.utcnow()
        })
    
    @staticmethod
    async def data_breach_notification(breach_details: dict):
        """
        GDPR Article 33: Notification of personal data breach
        Must notify within 72 hours of becoming aware
        """
        # Record breach
        breach_id = await db.data_breaches.insert({
            "detected_at": datetime.utcnow(),
            "affected_users": breach_details["affected_users"],
            "data_types": breach_details["data_types"],  # email, name, etc.
            "severity": breach_details["severity"],  # high/medium/low
            "description": breach_details["description"],
            "mitigation": breach_details["mitigation"],
            "notified_authority_at": None,
            "notified_users_at": None
        })
        
        # Notify supervisory authority within 72 hours
        await notify_dpa(breach_details)
        await db.data_breaches.update(breach_id, {
            "notified_authority_at": datetime.utcnow()
        })
        
        # Notify affected users if high risk
        if breach_details["severity"] == "high":
            await notify_affected_users(breach_details)
            await db.data_breaches.update(breach_id, {
                "notified_users_at": datetime.utcnow()
            })

# API Endpoints for GDPR compliance
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/gdpr")

@router.post("/export-data/{user_id}")
async def export_user_data(user_id: int):
    """GDPR: User requests their data"""
    return await GDPRCompliance.export_user_data(user_id)

@router.delete("/delete-account/{user_id}")
async def delete_account(user_id: int, reason: str):
    """GDPR: Right to be forgotten"""
    await GDPRCompliance.anonymize_user(user_id, reason)
    return {"message": "Account deleted"}

@router.post("/consent/{user_id}")
async def grant_consent(
    user_id: int, 
    consent_type: str, 
    purpose: str
):
    """Record user consent"""
    await GDPRCompliance.record_consent(
        user_id, consent_type, purpose, legal_basis="consent"
    )
    return {"message": "Consent recorded"}

@router.delete("/consent/{user_id}/{consent_type}")
async def withdraw_consent(user_id: int, consent_type: str):
    """Withdraw consent"""
    await GDPRCompliance.withdraw_consent(user_id, consent_type)
    return {"message": "Consent withdrawn"}
```

**GDPR features implemented:**
- ✅ Right to access (data export)
- ✅ Right to erasure (account deletion)
- ✅ Consent management
- ✅ Consent withdrawal
- ✅ Data breach notification
- ✅ Audit trail of all consent changes
