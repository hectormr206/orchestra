---
name: error-handling
description: >
  Error handling patterns: graceful degradation, retries, circuit breakers,
  fallback strategies, error recovery.
  Trigger: When implementing error handling, retries, or failure recovery.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Implementing error handling"
    - "Adding retry logic"
    - "Planning failure recovery"
allowed-tools: [Read,Edit,Write]
---

## When to Use

- Implementing try/catch blocks
- Adding retry logic for external APIs
- Designing circuit breakers
- Planning graceful degradation

---

## Critical Patterns

### > **ALWAYS**

1. **Structured Error Responses**
   ```json
   {
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Email is required",
       "details": {"field": "email"},
       "request_id": "abc-123",
       "timestamp": "2024-01-15T10:30:00Z"
     }
   }
   ```

2. **Retry with Exponential Backoff**
   ```python
   import time

   def retry_with_backoff(func, max_retries=3):
       for attempt in range(max_retries):
           try:
               return func()
           except RetryableError as e:
               if attempt == max_retries - 1:
                   raise
               wait = 2 ** attempt  # 1s, 2s, 4s
               time.sleep(wait)
   ```

3. **Circuit Breaker Pattern**
   ```python
   class CircuitBreaker:
       def __init__(self, failure_threshold=5, timeout=60):
           self.failure_count = 0
           self.failure_threshold = failure_threshold
           self.timeout = timeout
           self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN

       def call(self, func):
           if self.state == 'OPEN':
               if time.time() - self.last_failure > self.timeout:
                   self.state = 'HALF_OPEN'
               else:
               raise CircuitOpenError()

           try:
               result = func()
               if self.state == 'HALF_OPEN':
                   self.state = 'CLOSED'
                   self.failure_count = 0
               return result
           except Exception:
               self.failure_count += 1
               self.last_failure = time.time()
               if self.failure_count >= self.failure_threshold:
                   self.state = 'OPEN'
               raise
   ```

4. **Graceful Degradation**
   ```python
   def get_user_recommendations(user_id):
       try:
           recommendations = ml_service.get_recommendations(user_id)
       except MLServiceUnavailable:
           # Fallback to popularity-based recommendations
           recommendations = get_popular_items()
       except Exception:
           # Ultimate fallback: empty list
           recommendations = []
       return recommendations
   ```

5. **Contextual Error Logging**
   ```python
   try:
       process_payment(user_id, amount)
   except PaymentError as e:
       logger.error("Payment failed", extra={
           "user_id": user_id,
           "amount": amount,
           "error": str(e),
           "traceback": traceback.format_exc()
       })
       raise
   ```

6. **Define Custom Error Types**
   ```python
   class PaymentError(Exception):
       pass

   class InsufficientFundsError(PaymentError):
       pass

   class PaymentGatewayError(PaymentError):
       pass
   ```

### > **NEVER**

1. **Don't catch generic Exception**
   ```python
   # WRONG - catches everything, including SystemExit
   try:
       risky_operation()
   except Exception:
       pass

   # RIGHT - catch specific exceptions
   try:
       risky_operation()
   except (ValueError, KeyError) as e:
       logger.error("Specific error", error=str(e))
   ```

2. **Don't swallow errors silently**
   ```python
   # WRONG
   try:
       save_to_db()
   except:
       pass

   # RIGHT - log and re-raise
   try:
       save_to_db()
   except DatabaseError as e:
       logger.error("Failed to save", error=str(e))
       raise
   ```

3. **Don't expose internal errors to clients**
   ```python
   # WRONG - exposes stack trace
   try:
       query_database()
   except Exception as e:
       return {"error": str(e)}  # Shows SQL error

   # RIGHT - generic message
   try:
       query_database()
   except DatabaseError:
       logger.exception("Database error")
       return {"error": "Internal error"}, 500
   ```

---

## Fallback Strategies

| Strategy | When to Use | Example |
|----------|-------------|---------|
| **Retry** | Transient failures | Network timeouts |
| **Cache** | Service slow | Expensive calculations |
| **Default** | Service down | Recommendation engine |
| **Queue** | Service overloaded | Email sending |
| **Circuit Breaker** | Cascading failures | Downstream service |

---

## Error Response Codes

| Code | Usage | Retryable |
|------|-------|-----------|
| 400 | Bad Request | No |
| 401 | Unauthorized | No (fix auth first) |
| 403 | Forbidden | No |
| 404 | Not Found | No |
| 409 | Conflict | No |
| 429 | Rate Limited | Yes (after Retry-After) |
| 500 | Server Error | Yes |
| 503 | Service Unavailable | Yes |

---

## Resources

- **Circuit Breaker Pattern**: [martinfowler.com/bliki/CircuitBreaker.html](https://martinfowler.com/bliki/CircuitBreaker.html)
- **Retry Patterns**: [cloud.google.com/architecture/retry](https://cloud.google.com/architecture/retry)
- **Fault Tolerance**:://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/

---

## Examples

### Example 1: Implementing Retry with Exponential Backoff

**User request:** "Make HTTP API calls resilient to failures"

```python
import requests
import time
from typing import Optional, Any
from dataclasses import dataclass
from enum import Enum

class RetryStrategy(Enum):
    EXPONENTIAL_BACKOFF = "exponential_backoff"
    LINEAR_BACKOFF = "linear_backoff"
    IMMEDIATE = "immediate"

@dataclass
class RetryConfig:
    max_attempts: int = 3
    initial_delay: float = 1.0  # seconds
    max_delay: float = 60.0
    backoff_multiplier: float = 2.0
    retry_on: list = None
    strategy: RetryStrategy = RetryStrategy.EXPONENTIAL_BACKOFF

class ResilientHTTPClient:
    def __init__(self, config: RetryConfig = None):
        self.config = config or RetryConfig()
        if self.config.retry_on is None:
            self.config.retry_on = [500, 502, 503, 504]
    
    def request(self, method: str, url: str, **kwargs) -> Optional[dict]:
        last_exception = None
        
        for attempt in range(self.config.max_attempts):
            try:
                response = requests.request(method, url, **kwargs)
                
                # Check if status code should trigger retry
                if response.status_code in self.config.retry_on:
                    raise requests.HTTPError(
                        f"HTTP {response.status_code}",
                        response=response
                    )
                
                return response.json()
            
            except requests.exceptions.ConnectionError as e:
                last_exception = e
                print(f"Connection error (attempt {attempt + 1}): {e}")
            
            except requests.exceptions.Timeout as e:
                last_exception = e
                print(f"Timeout error (attempt {attempt + 1}): {e}")
            
            except requests.HTTPError as e:
                last_exception = e
                print(f"HTTP error (attempt {attempt + 1}): {e}")
            
            # Calculate delay before next retry
            if attempt < self.config.max_attempts - 1:
                delay = self._calculate_delay(attempt)
                print(f"Retrying in {delay:.2f} seconds...")
                time.sleep(delay)
        
        # All retries exhausted
        print(f"All {self.config.max_attempts} attempts failed")
        if last_exception:
            raise last_exception
        return None
    
    def _calculate_delay(self, attempt: int) -> float:
        if self.config.strategy == RetryStrategy.EXPONENTIAL_BACKOFF:
            delay = self.config.initial_delay * (
                self.config.backoff_multiplier ** attempt
            )
        elif self.config.strategy == RetryStrategy.LINEAR_BACKOFF:
            delay = self.config.initial_delay * (attempt + 1)
        else:  # IMMEDIATE
            delay = 0
        
        return min(delay, self.config.max_delay)

# Usage
client = ResilientHTTPClient(RetryConfig(
    max_attempts=5,
    initial_delay=1.0,
    backoff_multiplier=2.0,
    strategy=RetryStrategy.EXPONENTIAL_BACKOFF
))

try:
    response = client.request(
        "GET",
        "https://api.example.com/data",
        timeout=30
    )
    print("Success:", response)
except Exception as e:
    print("Failed after all retries:", e)
