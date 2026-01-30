---
name: performance
description: >
  Performance optimization patterns: caching, lazy loading, database optimization,
  profiling, bundle optimization.
  Trigger: When optimizing slow operations, reducing latency, or improving throughput.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Optimizing performance"
    - "Reducing latency"
    - "Improving throughput"
allowed-tools: [Read,Edit,Write,Bash,Grep]
---

## When to Use

- Application is slow
- Database queries are expensive
- API response times are high
- Frontend bundle is large

---

## Critical Patterns

### > **ALWAYS**

1. **Measure Before Optimizing**
   ```bash
   # Profile first
   python -m cProfile -o profile.stats myapp.py
   grep -v "0.000" profile.stats | sort -k2 -rn | head -20

   # Database slow query log
   slow_queries = "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10"
   ```

2. **Caching Strategy**
   ```
   L1: In-memory cache (Redis, Memcached)
   L2: CDN (CloudFlare, CloudFront)
   L3: Browser cache (Cache-Control headers)

   Cache Invalidation:
   - TTL (time-based)
   - Write-through
   - Cache-aside
   ```

3. **Database Indexing**
   ```sql
   -- Index columns used in WHERE, JOIN, ORDER BY
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);

   -- Use EXPLAIN ANALYZE to verify
   EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;
   ```

4. **Lazy Loading**
   ```python
   # WRONG - eager loads everything
   users = User.all()
   for user in users:
       print(user.orders)  # N+1 queries

   # RIGHT - lazy load with select_related/prefetch_related
   users = User.objects.prefetch_related('orders')
   for user in users:
       print(user.orders)  # No extra queries
   ```

5. **Pagination**
   ```python
   # WRONG - loads all records
   users = User.objects.all()

   # RIGHT - paginate
   def get_users(page=1, limit=20):
       offset = (page - 1) * limit
       return User.objects.limit(limit).offset(offset)
   ```

6. **Frontend Code Splitting**
   ```typescript
   // Lazy load routes
   const Dashboard = lazy(() => import('./pages/Dashboard'));

   // Lazy load components
   const HeavyChart = lazy(() => import('./components/Chart'));
   ```

7. **Compression**
   ```
   gzip, brotli for text responses (HTML, CSS, JS, JSON)
   Typical savings: 60-80%
   ```

8. **Connection Pooling**
   ```python
   # Database connection pool
   engine = create_engine(
       DATABASE_URL,
       pool_size=20,
       max_overflow=10,
       pool_pre_ping=True
   )
   ```

### > **NEVER**

1. **Don't optimize without measuring**
   ```python
   # WRONG - premature optimization
   # Assuming this is slow without profiling
   def add(a, b):
       return a + b  # Actually fast enough

   # RIGHT - profile first, optimize hotspots
   ```

2. **Don't cache everything**
   ```
   Cache: Frequently read, rarely written
   Don't cache: Real-time data, user-specific sessions (sometimes)
   ```

3. **Don't ignore N+1 queries**
   ```python
   # WRONG - N+1 problem
   for order in orders:
       customer = order.customer  # Separate query each time

   # RIGHT - single query with join
   orders = Order.objects.select_related('customer').all()
   ```

4. **Don't fetch more data than needed**
   ```sql
   -- WRONG - fetches all columns
   SELECT * FROM users;

   -- RIGHT - fetch only needed columns
   SELECT id, name, email FROM users;
   ```

---

## Performance Checklist

### Backend
- [ ] Profile hotspots
- [ ] Add database indexes
- [ ] Enable query caching
- [ ] Use connection pooling
- [ ] Implement pagination
- [ ] Compress responses (gzip)
- [ ] Add CDN for static assets
- [ ] Cache expensive computations

### Frontend
- [ ] Code splitting
- [ ] Lazy load images
- [ ] Tree-shake unused code
- [ ] Minimize bundle size
- [ ] Optimize images (WebP, lazy load)
- [ ] Use CDN
- [ ] Enable browser caching

### Database
- [ ] Index foreign keys
- [ ] Analyze slow queries
- [ ] Use EXPLAIN ANALYZE
- [ ] Denormalize if needed
- [ ] Partition large tables
- [ ] Archive old data

---

## Profiling Tools

| Tool | Purpose | Platform |
|------|---------|----------|
| **cProfile** | Python profiling | Python |
| **pprof** | Go profiling | Go |
| **Chrome DevTools** | Frontend performance | Web |
| **Lighthouse** | Page load metrics | Web |
| **pg_stat_statements** | PostgreSQL query stats | PostgreSQL |
| **Slow Query Log** | MySQL slow queries | MySQL |

---

## Resources

- **Web Performance**: [web.dev/performance](https://web.dev/performance)
- **Database Performance**: [use-the-index-luke.com](https://use-the-index-luke.com)
- **Performance Checklist**: [developer.yahoo.com/performance/rules.html](https://developer.yahoo.com/performance/rules.html)

---

## Examples

### Example 1: Database Query Optimization

```python
# BEFORE: N+1 query problem
def get_users_with_orders():
    users = db.query("SELECT * FROM users")
    result = []
    for user in users:
        orders = db.query(
            "SELECT * FROM orders WHERE user_id = %s",
            (user['id'],)
        )
        user['orders'] = orders
        result.append(user)
    return result
# Executes: 1 + N queries (N = number of users)

# AFTER: Single query with JOIN
def get_users_with_orders():
    return db.query("""
        SELECT 
            u.*,
            json_agg(o) as orders
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        GROUP BY u.id
    """)
# Executes: 1 query

# BEFORE: No index, slow lookups
# SELECT * FROM users WHERE email = 'user@example.com';
# Time: 500ms

# AFTER: With index
# CREATE INDEX idx_users_email ON users(email);
# SELECT * FROM users WHERE email = 'user@example.com';
# Time: 5ms (100x faster)
