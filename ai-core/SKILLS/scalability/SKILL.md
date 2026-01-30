---
name: scalability
description: >
  Scalability patterns: horizontal scaling, load balancing, queues,
  microservices, data partitioning.
  Trigger: When planning system architecture for growth or handling increased load.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Planning system architecture"
    - "Designing for scale"
    - "Planning horizontal scaling"
allowed-tools: [Read,Edit,Write]
---

## When to Use

- Planning architecture for growth
- Designing distributed systems
- Implementing horizontal scaling
- Adding message queues

---

## Critical Patterns

### > **ALWAYS**

1. **Stateless Applications**
   ```python
   # WRONG - state in memory
   class SessionManager:
       sessions = {}  # Lost on restart, can't scale horizontally

   # RIGHT - state in Redis (shared)
   class SessionManager:
       def get(self, session_id):
               return redis.get(f"session:{session_id}")
   ```

2. **Load Balancing**
   ```
   Client → Load Balancer → [App1, App2, App3]

   Algorithms:
   - Round Robin (default)
   - Least Connections (better for varied request times)
   - IP Hash (sticky sessions, avoid when possible)
   ```

3. **Horizontal > Vertical Scaling**
   ```
   Horizontal (scale out): Add more instances
   - Better fault tolerance
   - Potential unlimited scale
   - Cost effective with commodity hardware

   Vertical (scale up): Bigger machine
   - Single point of failure
   - Expensive at high end
   - Easier (no distributed system complexity)
   ```

4. **Database Replication**
   ```
   Primary (writes) ←───┐
                      ├→ Replica 1 (reads)
                      └→ Replica 2 (reads)

   Reads → Replicas (load balanced)
   Writes → Primary
   ```

5. **Caching Layer**
   ```
   App → Cache → Miss → Database
             ↓
            Hit
   ```

6. **Message Queues for Async Work**
   ```
   Producer → Queue → Consumer
   (API)     (RabbitMQ,  (Worker)
              Redis, SQS)

   Benefits:
   - Decouples components
   - Handles load spikes
   - Retries on failure
   ```

7. **Data Partitioning**
   ```
   Horizontal Sharding:
   - users_0, users_1, users_2, users_3
   - Shard by user_id % 4

   Vertical Partitioning:
   - Split by feature (users, orders, payments)
   ```

8. **Rate Limiting**
   ```python
   # Per-IP rate limit
   @rate_limit(requests=100, window=60)  # 100 req/min
   def api_endpoint():
       pass

   # Per-user rate limit
   @rate_limit(requests=1000, window=60, key_func=lambda r: r.user.id)
   def premium_endpoint():
       pass
   ```

9. **Auto-scaling**
   ```yaml
   # Kubernetes HPA
   resources:
     requests:
       cpu: 100m
       memory: 128Mi
   autoscaling:
     minReplicas: 2
     maxReplicas: 10
     targetCPUUtilizationPercentage: 70
   ```

### > **NEVER**

1. **Don't assume single-instance deployment**
   ```python
   # WRONG - local filesystem
   def upload_file(file):
       filename = f"/tmp/{file.name}"
       with open(filename, 'wb') as f:
           f.write(file.read())
       # Problem: Which instance has the file?

   # RIGHT - shared storage (S3, database)
   def upload_file(file):
       return s3.upload(file)
   ```

2. **Don't create monolithic services**
   ```
   WRONG: One service does everything
   RIGHT: Separate by domain (users, orders, payments)
   ```

3. **Don't ignore database connection limits**
   ```python
   # WRONG - each instance opens 100 connections, 10 instances = 1000 connections (exceeds limit)
   # RIGHT - use connection pool, limit pool size per instance
   engine = create_engine(URL, pool_size=10, max_overflow=20)
   ```

4. **Don't use synchronous HTTP for long tasks**
   ```python
   # WRONG - blocks HTTP connection for 30 seconds
   @app.route("/generate-report")
   def generate_report():
       report = create_report()  # Takes 30 seconds
       return report

   # RIGHT - return immediately, process in background
   @app.route("/generate-report")
   def generate_report():
       job_id = queue.enqueue(create_report)
       return {"job_id": job_id, "status": "processing"}
   ```

---

## Scaling Patterns

| Pattern | Description | When to Use |
|---------|-------------|-------------|
| **Horizontal** | Add more instances | Stateless apps |
| **Vertical** | Bigger machine | Simple apps, DB |
| **Caching** | In-memory store | Read-heavy workloads |
| **Read Replicas** | Copy DB for reads | Read-heavy, write-light |
| **Sharding** | Partition data | Very large datasets |
| **Queue** | Async processing | Long-running tasks |
| **Microservices** | Split by domain | Large teams, complex domains |

---

## Cloud Architecture Example

```
                        ┌─────────────────┐
                        │   Load Balancer │
                        └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │    Auto-scaling Group   │
                    │  [App1, App2, App3...]   │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
        ┌───────▼───────┐ ┌─────▼──────┐ ┌──────▼──────┐
        │    Redis     │ │   Queue   │ │  Database  │
        │   (Cache)    │ │ (Worker)  │ │ (Primary)  │
        └───────────────┘ └───────────┘ └─────┬──────┘
                                           │
                                    ┌──────┴──────┐
                                    │ Replicas    │
                                    │ (Read-only) │
                                    └─────────────┘
```

---

## Resources

- **The Twelve-Factor App**: [12factor.net](https://12factor.net)
- **System Design Primer**: [github.com/donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer)
- **Scaling Strategies**: [www.nginx.com/blog/microservices-reference-architecture-nginx-ingress-controller](https://www.nginx.com/blog/microservices-reference-architecture-nginx-ingress-controller)

---

## Examples

### Example 1: Load Balancer Configuration

```yaml
# nginx.conf for load balancing
upstream backend_servers {
    # Load balancing algorithm: least_conn
    least_conn;
    
    # Backend servers
    server backend1.example.com:3000 weight=3;
    server backend2.example.com:3000 weight=2;
    server backend3.example.com:3000 weight=1;
    
    # Health checks
    check interval=3000 rise=2 fall=3 timeout=1000;
    
    # Keep-alive connections
    keepalive 32;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://backend_servers;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
}

# Horizontal scaling strategy:
# 1. Stateless application design
# 2. Shared session store (Redis)
# 3. Database connection pooling
# 4. CDN for static assets
# 5. Auto-scaling based on CPU/memory
