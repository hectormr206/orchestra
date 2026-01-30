---
name: logging
description: >
  Structured logging patterns: log levels, correlation IDs, log aggregation,
   monitoring and alerting.
  Trigger: When adding logging, setting up monitoring, or debugging production issues.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Adding logging"
    - "Setting up monitoring"
    - "Debugging production issues"
allowed-tools: [Read,Edit,Write,Grep]
---

## When to Use

- Adding logging to functions
- Setting up log aggregation (ELK, CloudWatch, etc.)
- Debugging production issues
- Creating alerts

---

## Critical Patterns

### > **ALWAYS**

1. **Structured Logging**
   ```python
   # WRONG - unstructured
   logger.info("User logged in: " + user.email)

   # RIGHT - structured (JSON)
   logger.info("User logged in", extra={
       "user_id": user.id,
       "email": user.email,
       "ip": request.remote_addr,
       "timestamp": datetime.now().isoformat()
   })
   ```

2. **Log Levels**
   ```
   CRITICAL: System failure, requires immediate action
   ERROR:    Error occurred, but system continues
   WARNING:  Unexpected condition, not an error
   INFO:     Normal operation (key events)
   DEBUG:    Detailed info for debugging
   ```

3. **Correlation IDs**
   ```python
   import uuid

   middleware = [
       (CorrelationIDMiddleware, {
           'generator': lambda: str(uuid.uuid4()),
           'header': 'X-Correlation-ID'
       })
   ]

   # All logs include correlation_id
   logger.info("Processing request", extra={
       "correlation_id": request.correlation_id,
       "user_id": user.id
   })
   ```

4. **Sanitize Sensitive Data**
   ```python
   # WRONG - logs password
   logger.info(f"User login: {email}:{password}")

   # RIGHT - redacts password
   logger.info("User login", extra={
       "email": email,
       "password": "[REDACTED]"
   })
   ```

5. **Context in Logs**
   ```python
   logger.error("Payment failed", extra={
       "user_id": user.id,
       "amount": amount,
       "payment_method": "stripe",
       "error_code": error.code,
       "traceback": traceback.format_exc()
   })
   ```

6. **Log Aggregation**
   ```
   App → JSON Logs → Centralized Log Store (ELK, Loki, CloudWatch)
                           ↓
                      Search & Analyze
   ```

### > **NEVER**

1. **Don't log in production at DEBUG level**
   - Too noisy, expensive
   - Use DEBUG only in development

2. **Don't log sensitive data**
   ```
   NEVER log:
   - Passwords
   - Credit card numbers
   - API keys
   - Personal health information (PHI)
   - Session tokens
   ```

3. **Don't use print() for logging**
   ```python
   # WRONG - goes to stdout, not structured
   print("Error occurred")

   # RIGHT - goes to log system with levels
   logger.error("Error occurred")
   ```

4. **Don't ignore errors in logs**
   ```python
   # WRONG - error logged but not raised
   try:
       save_user(user)
   except Exception as e:
       logger.error("Failed to save user", error=str(e))
       # execution continues

   # RIGHT - log and raise
   try:
       save_user(user)
   except Exception as e:
       logger.error("Failed to save user", error=str(e))
       raise
   ```

---

## Logging Configuration (Python)

```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno
        }
        if hasattr(record, 'extra'):
            log_data.update(record.extra)
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        return json.dumps(log_data)

logging.basicConfig(
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ],
    format='%(message)s'  # For JSON formatter
)

logger = logging.getLogger(__name__)
logger.handlers[0].setFormatter(JSONFormatter())
```

---

## Monitoring & Alerting

```
Logs → Metrics → Alerts → Response

Key Metrics to Track:
- Error rate (errors per minute)
- Response time (p50, p95, p99)
- Request rate (requests per second)
- CPU/Memory usage
- Database connection pool

Alert Examples:
- ERROR logs > 10/minute → Page on-call
- p95 latency > 1s → Warning
- 500 errors > 1% → Critical
```

---

## Resources

- **Structured Logging Best Practices**: [www.brandur.org/origins](https://www.brandur.org/origins)
- **Twelve-Factor App: Logs**: [12factor.net/logs](https://12factor.net/logs)
- **Logging Best Practices**: [martinfowler.com/articles/monitoring-logging.html](https://martinfowler.com/articles/monitoring-logging.html)

---

## Examples

### Example 1: Structured Logging in Python

```python
import structlog
import logging

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Usage
def process_payment(user_id: str, amount: float):
    logger.info(
        "payment_started",
        user_id=user_id,
        amount=amount,
        payment_method="stripe"
    )
    
    try:
        result = stripe.PaymentIntent.create(
            amount=int(amount * 100),
            currency="usd"
        )
        
        logger.info(
            "payment_completed",
            user_id=user_id,
            payment_id=result.id,
            amount=amount
        )
        return result
        
    except stripe.error.CardError as e:
        logger.error(
            "payment_failed",
            user_id=user_id,
            amount=amount,
            error_code=e.code,
            error_message=str(e),
            exc_info=True
        )
        raise
```
