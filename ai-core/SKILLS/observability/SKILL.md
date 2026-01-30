---
name: observability
description: >
  Complete observability: distributed tracing, metrics, APM, alerting.
  SLIs/SLOs/SLAs, OpenTelemetry, Prometheus, Grafana, incident response.
  Trigger: When implementing monitoring, tracing, or defining service levels.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Implementing monitoring or alerting"
    - "Setting up distributed tracing"
    - "Defining SLIs, SLOs, or SLAs"
    - "Debugging production issues"
    - "Implementing health checks"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Setting up production monitoring
- Implementing distributed tracing
- Defining service level objectives
- Creating dashboards and alerts
- Debugging production issues
- Implementing health checks
- Capacity planning

---

## Critical Patterns

### > **ALWAYS**

1. **Three Pillars of Observability**
   ```
   ┌─────────────────────────────────────────────┐
   │         OBSERVABILITY PILLARS               │
   ├─────────────────────────────────────────────┤
   │                                             │
   │  LOGS         METRICS        TRACES         │
   │  ────         ───────        ──────         │
   │  What         How much       Where          │
   │  happened     /how fast      it happened    │
   │                                             │
   │  Events       Counters       Request flow   │
   │  Errors       Gauges         Latency        │
   │  Debug        Histograms     Dependencies   │
   │                                             │
   └─────────────────────────────────────────────┘
   ```

2. **Implement all health check types**
   ```python
   # Liveness: Is the app running?
   @app.get("/health/live")
   def liveness():
       return {"status": "alive"}

   # Readiness: Can the app serve traffic?
   @app.get("/health/ready")
   async def readiness():
       checks = {
           "database": await check_db(),
           "cache": await check_cache(),
           "external_api": await check_external_api()
       }
       all_healthy = all(checks.values())
       status_code = 200 if all_healthy else 503
       return JSONResponse(
           {"status": "ready" if all_healthy else "not_ready", "checks": checks},
           status_code=status_code
       )

   # Startup: Is the app done initializing?
   @app.get("/health/startup")
   def startup():
       return {"status": "started", "version": APP_VERSION}
   ```

3. **Use correlation IDs everywhere**
   ```python
   # Propagate trace context across services
   import uuid

   class CorrelationMiddleware:
       async def __call__(self, request, call_next):
           correlation_id = request.headers.get(
               "X-Correlation-ID",
               str(uuid.uuid4())
           )
           # Add to context for logging
           ctx.set("correlation_id", correlation_id)

           response = await call_next(request)
           response.headers["X-Correlation-ID"] = correlation_id
           return response
   ```

4. **Define SLIs before SLOs**
   ```
   SLI (Indicator) → SLO (Objective) → SLA (Agreement)

   Example:
   SLI: Request latency (p99)
   SLO: 99% of requests < 200ms
   SLA: Contractual commitment with penalties
   ```

5. **Alert on symptoms, not causes**
   ```
   GOOD ALERTS (Symptoms):
   ✓ Error rate > 1%
   ✓ Latency p99 > 500ms
   ✓ Success rate < 99.9%

   BAD ALERTS (Causes):
   ✗ CPU > 80%
   ✗ Memory > 90%
   ✗ Disk > 85%

   (Cause-based alerts → noisy, low signal)
   ```

### > **NEVER**

1. **Alert on every error**
2. **Skip trace context propagation**
3. **Use high-cardinality labels in metrics**
4. **Ignore metric aggregation costs**
5. **Create dashboards without clear purpose**

---

## SLI/SLO/SLA Framework

### Common SLIs

| Category | SLI | Measurement |
|----------|-----|-------------|
| **Availability** | Uptime | `successful_requests / total_requests` |
| **Latency** | Response time | `p50, p95, p99` percentiles |
| **Throughput** | Request rate | Requests per second |
| **Error Rate** | Failures | `errors / total_requests` |
| **Saturation** | Capacity | Queue depth, CPU utilization |

### SLO Examples

```yaml
# SLO Configuration
slos:
  - name: api_availability
    description: "API should be available"
    sli: success_rate
    target: 99.9%
    window: 30d

  - name: api_latency
    description: "API should be fast"
    sli: latency_p99
    target: 99%
    threshold: 200ms
    window: 30d

  - name: api_error_rate
    description: "Low error rate"
    sli: error_rate
    target: 99%
    threshold: 0.1%
    window: 30d
```

### Error Budget

```
Error Budget = 1 - SLO

Example:
SLO: 99.9% availability
Error Budget: 0.1% (43.8 minutes/month)

Spend budget on:
- Deployments
- Experiments
- Maintenance

If budget exhausted:
- Stop feature releases
- Focus on reliability
```

---

## OpenTelemetry Implementation

### Setup (Python)

```python
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter

# Initialize tracing
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

# Initialize metrics
metrics.set_meter_provider(MeterProvider())
meter = metrics.get_meter(__name__)

# Create instruments
request_counter = meter.create_counter(
    "http_requests_total",
    description="Total HTTP requests"
)

request_duration = meter.create_histogram(
    "http_request_duration_seconds",
    description="HTTP request duration"
)

# Export to OTLP collector
span_exporter = OTLPSpanExporter(endpoint="http://collector:4317")
metric_exporter = OTLPMetricExporter(endpoint="http://collector:4317")
```

### Instrumentation Example

```python
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

tracer = trace.get_tracer(__name__)

@app.get("/users/{user_id}")
async def get_user(user_id: str):
    with tracer.start_as_current_span("get_user") as span:
        # Add attributes
        span.set_attribute("user.id", user_id)

        try:
            # Database query (auto-instrumented or manual)
            with tracer.start_as_current_span("db.query"):
                user = await db.get_user(user_id)

            if not user:
                span.set_status(Status(StatusCode.ERROR, "User not found"))
                raise HTTPException(404, "User not found")

            # Record metrics
            request_counter.add(1, {"endpoint": "/users", "status": "success"})

            return user

        except Exception as e:
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))
            request_counter.add(1, {"endpoint": "/users", "status": "error"})
            raise
```

---

## Metrics Best Practices

### The RED Method (Request-driven)

```
R - Rate:     Requests per second
E - Errors:   Failed requests per second
D - Duration: Time per request (histogram)

USE FOR: Services, APIs, microservices
```

### The USE Method (Resource-driven)

```
U - Utilization: % time resource is busy
S - Saturation:  Queue length, backlog
E - Errors:      Error count

USE FOR: Infrastructure (CPU, memory, disk, network)
```

### Prometheus Metrics

```python
from prometheus_client import Counter, Histogram, Gauge

# Counter: Only goes up
http_requests = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

# Histogram: Distribution of values
request_latency = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint'],
    buckets=[.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10]
)

# Gauge: Can go up or down
active_connections = Gauge(
    'active_connections',
    'Number of active connections'
)

# Usage
@app.middleware("http")
async def metrics_middleware(request, call_next):
    start_time = time.time()
    response = await call_next(request)

    # Record metrics
    http_requests.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    request_latency.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(time.time() - start_time)

    return response
```

### Cardinality Warning

```
HIGH CARDINALITY = BAD
─────────────────────────
✗ user_id as label        (millions of values)
✗ request_id as label     (unique per request)
✗ email as label          (PII + high cardinality)

LOW CARDINALITY = GOOD
─────────────────────────
✓ endpoint (tens)
✓ status_code (5-10)
✓ method (GET, POST, etc.)
✓ region (few)
```

---

## Distributed Tracing

### Trace Propagation

```
Service A → Service B → Service C
    │           │           │
    └───────────┴───────────┴── Same Trace ID

Headers to propagate:
- traceparent: 00-{trace_id}-{span_id}-{flags}
- tracestate: vendor-specific data
- X-Correlation-ID: custom correlation
```

### Span Naming Conventions

```
GOOD SPAN NAMES:
✓ HTTP GET /users/{id}
✓ DB SELECT users
✓ Redis GET user:123
✓ Kafka SEND orders

BAD SPAN NAMES:
✗ doSomething
✗ handler
✗ /users/12345 (high cardinality)
```

---

## Alerting Strategy

### Alert Severity Levels

```
┌─────────────────────────────────────────────┐
│ CRITICAL (Page immediately)                 │
│ → Service is down                           │
│ → Data loss occurring                       │
│ → SLA breach imminent                       │
├─────────────────────────────────────────────┤
│ WARNING (Page during business hours)        │
│ → Error rate elevated                       │
│ → Approaching capacity limits               │
│ → Performance degradation                   │
├─────────────────────────────────────────────┤
│ INFO (No page, ticket/dashboard only)       │
│ → Unusual patterns                          │
│ → Scheduled maintenance                     │
│ → Non-critical component issues             │
└─────────────────────────────────────────────┘
```

### Alert Rules (Prometheus)

```yaml
groups:
  - name: slo_alerts
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m])) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate > 1%"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.99,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "p99 latency > 500ms"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.instance }} is down"
```

### On-Call Runbook Template

```markdown
## Alert: HighErrorRate

### Impact
- Users experiencing errors
- Revenue impact: $X per minute

### Investigation Steps
1. Check error logs: `kubectl logs -l app=api --tail=100`
2. Check recent deployments: `kubectl rollout history`
3. Check dependent services: [Dashboard Link]
4. Check database: [Grafana DB Dashboard]

### Mitigation
1. If recent deploy: `kubectl rollout undo deployment/api`
2. If DB issue: Scale read replicas
3. If external dependency: Enable circuit breaker

### Escalation
- After 15 min: Page backend lead
- After 30 min: Page engineering manager
```

---

## Dashboard Best Practices

### Dashboard Structure

```
┌─────────────────────────────────────────────┐
│ EXECUTIVE DASHBOARD                         │
│ → SLO status, error budget, key metrics     │
├─────────────────────────────────────────────┤
│ SERVICE DASHBOARD                           │
│ → RED metrics, dependencies, deployments    │
├─────────────────────────────────────────────┤
│ INFRASTRUCTURE DASHBOARD                    │
│ → USE metrics, capacity, costs              │
├─────────────────────────────────────────────┤
│ DEBUG DASHBOARD                             │
│ → Detailed metrics for troubleshooting      │
└─────────────────────────────────────────────┘
```

### Grafana Dashboard JSON (Example)

```json
{
  "title": "Service Overview",
  "panels": [
    {
      "title": "Request Rate",
      "type": "graph",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total[5m]))",
          "legendFormat": "Requests/sec"
        }
      ]
    },
    {
      "title": "Error Rate",
      "type": "stat",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))"
        }
      ],
      "thresholds": {
        "steps": [
          {"color": "green", "value": null},
          {"color": "yellow", "value": 0.001},
          {"color": "red", "value": 0.01}
        ]
      }
    }
  ]
}
```

---

## Observability Stack

### Recommended Stack

```
┌─────────────────────────────────────────────┐
│ COLLECTION                                  │
│ OpenTelemetry Collector, Fluent Bit,        │
│ Prometheus, Vector                          │
├─────────────────────────────────────────────┤
│ STORAGE                                     │
│ Prometheus/Thanos, Loki, Jaeger/Tempo,      │
│ Elasticsearch                               │
├─────────────────────────────────────────────┤
│ VISUALIZATION                               │
│ Grafana                                     │
├─────────────────────────────────────────────┤
│ ALERTING                                    │
│ Alertmanager, PagerDuty, Opsgenie           │
└─────────────────────────────────────────────┘
```

---

## Commands

```bash
# Prometheus queries
# Request rate
rate(http_requests_total[5m])

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# p99 latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Jaeger trace search
curl "http://jaeger:16686/api/traces?service=api&limit=20"

# Check health endpoints
curl -s http://localhost:8080/health/ready | jq
curl -s http://localhost:8080/health/live | jq

# OpenTelemetry Collector config test
otelcol validate --config=otel-config.yaml
```

---

## Resources

- **OpenTelemetry**: [opentelemetry.io](https://opentelemetry.io/)
- **Prometheus**: [prometheus.io](https://prometheus.io/)
- **Grafana**: [grafana.com](https://grafana.com/)
- **Google SRE Book**: [sre.google/books](https://sre.google/books/)
- **Distributed Systems Observability**: [O'Reilly](https://www.oreilly.com/library/view/distributed-systems-observability/9781492033431/)

---

## Examples

### Example 1: Distributed Tracing with OpenTelemetry

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter

# Setup tracing
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger",
    agent_port=6831,
)

trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(jaeger_exporter)
)

# Create traced function
@tracer.start_as_current_span("process_order")
def process_order(order_id: str):
    with tracer.start_as_current_span("fetch_order"):
        order = db.get_order(order_id)
    
    with tracer.start_as_current_span("validate_order"):
        validate(order)
    
    with tracer.start_as_current_span("charge_payment"):
        payment = charge(order)
    
    return {"order_id": order_id, "payment_id": payment.id}
