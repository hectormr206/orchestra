---
name: database
description: >
  Universal database patterns: schema design, indexing, migrations,
  backups, transactions, query optimization.
  Trigger: When designing database schema, writing queries, or planning migrations.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Designing database schema"
    - "Writing database queries"
    - "Planning migrations"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Designing database schema
- Creating tables and relationships
- Writing queries
- Planning migrations
- Optimizing slow queries
- Setting up backups

---

## Critical Patterns

### > **ALWAYS**

1. **Use appropriate data types**
   ```sql
   -- WRONG - string as number
   CREATE TABLE users (id VARCHAR(50));

   -- RIGHT
   CREATE TABLE users (id SERIAL PRIMARY KEY);

   -- WRONG - string as date
   CREATE TABLE events (created_at VARCHAR(20));

   -- RIGHT
   CREATE TABLE events (created_at TIMESTAMP DEFAULT NOW());
   ```

2. **Add indexes on foreign keys and query filters**
   ```sql
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_orders_user_id ON orders(user_id);
   CREATE INDEX idx_posts_created ON posts(created_at DESC);
   ```

3. **Use transactions for multi-step operations**
   ```python
   try:
       db.begin()
       account1.debit(100)
       account2.credit(100)
       db.commit()
   except:
       db.rollback()
   ```

4. **Use parameterized queries**
   ```sql
   -- WRONG - SQL injection risk
   SELECT * FROM users WHERE id = '{user_input}'

   -- RIGHT
   SELECT * FROM users WHERE id = $1
   ```

5. **Normalize (3NF) until it hurts, then denormalize**
   - Start normalized
   - Denormalize for performance when needed

6. **Use UUIDs for public IDs, ints for internal**
   ```sql
   CREATE TABLE users (
       id SERIAL PRIMARY KEY,  -- Internal, fast
       public_id UUID DEFAULT gen_random_uuid(),  -- Public
       email VARCHAR(255) NOT NULL
   );
   ```

7. **Set NOT NULL and DEFAULT**
   ```sql
   CREATE TABLE posts (
       id SERIAL PRIMARY KEY,
       title VARCHAR(255) NOT NULL,
       status VARCHAR(20) DEFAULT 'draft',
       created_at TIMESTAMP DEFAULT NOW()
   );
   ```

8. **Regular backups**
   ```bash
   # Daily backups, keep 30 days
   0 2 * * * pg_dump mydb | gzip > /backups/mydb_$(date +%Y%m%d).sql.gz
   ```

### > **NEVER**

1. **Don't use SELECT ***
   ```sql
   -- WRONG - fetches all columns
   SELECT * FROM users;

   -- RIGHT
   SELECT id, name, email FROM users;
   ```

2. **Don't N+1 query**
   ```python
   # WRONG - N+1 queries
   users = db.query("SELECT * FROM users")
   for user in users:
       orders = db.query(f"SELECT * FROM orders WHERE user_id = {user.id}")

   # RIGHT - JOIN
   users = db.query("""
       SELECT u.*, o.*
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
   """)
   ```

3. **Don't store passwords in plain text**
   ```sql
   -- WRONG
   INSERT INTO users (email, password) VALUES ('x@x.com', 'password123');

   -- RIGHT
   INSERT INTO users (email, password_hash)
   VALUES ('x@x.com', '$2b$12$...');
   ```

4. **Don't forget foreign key constraints**
   ```sql
   CREATE TABLE orders (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
   );
   ```

5. **Don't use ENUM for mutable data**
   ```sql
   -- WRONG - hard to add new statuses
   CREATE TYPE status AS ENUM ('draft', 'published');

   -- RIGHT - use lookup table
   CREATE TABLE statuses (
       id SERIAL PRIMARY KEY,
       name VARCHAR(50) UNIQUE NOT NULL
   );
   ```

---

## Schema Design Patterns

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    public_id UUID DEFAULT gen_random_uuid() UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP  -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_public_id ON users(public_id);
```

### Many-to-Many
```sql
-- Users can have many roles, roles can have many users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
```

### Timestamps and Soft Delete
```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP  -- NULL = not deleted
);

-- Query only non-deleted
SELECT * FROM posts WHERE deleted_at IS NULL;
```

---

## Migration Pattern

```sql
-- migrations/001_create_users.up.sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- migrations/001_create_users.down.sql
DROP TABLE users;
```

```bash
# Run migrations
migrate up
# Rollback
migrate down
```

---

## Query Optimization

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Analyze query plan
EXPLAIN ANALYZE
SELECT u.*, o.*
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE u.email = 'user@example.com';

-- Add index if needed
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

---

## Backup and Restore

```bash
# Backup
pg_dump mydb > backup.sql
pg_dump mydb | gzip > backup.sql.gz

# Restore
psql mydb < backup.sql
gunzip < backup.sql.gz | psql mydb

# Backup specific table
pg_dump -t users mydb > users_backup.sql
```

---

## ORM Injection Prevention

### SQLAlchemy (Python)

```python
from sqlalchemy import text
from sqlalchemy.orm import Session

# ❌ WRONG - User input directly in query (SQL injection risk)
def get_user_by_email_unsafe(email: str, session: Session):
    query = text(f"SELECT * FROM users WHERE email = '{email}'")
    return session.execute(query)

# ✅ CORRECT - Parameterized query
def get_user_by_email_safe(email: str, session: Session):
    query = text("SELECT * FROM users WHERE email = :email")
    return session.execute(query, {"email": email})

# ✅ CORRECT - ORM method (automatically parameterized)
def get_user_by_email_orm(email: str, session: Session):
    return session.query(User).filter(User.email == email).first()
```

### Django ORM

```python
from django.db.models import Q

# ❌ WRONG - Raw SQL with f-strings
def unsafe_search(search_term: str):
    return User.objects.raw(f"SELECT * FROM users WHERE name = '{search_term}'")

# ✅ CORRECT - Django ORM with parameterization
def safe_search(search_term: str):
    return User.objects.filter(name__icontains=search_term)

# ✅ CORRECT - Q objects for complex queries
def complex_search(search_term: str):
    return User.objects.filter(
        Q(name__icontains=search_term) |
        Q(email__icontains=search_term)
    )
```

### Sequelize (Node.js)

```javascript
const { Sequelize, Op } = require('sequelize');

// ❌ WRONG - Template literals with user input
const unsafeQuery = `SELECT * FROM users WHERE name = '${userName}'`;

// ✅ CORRECT - Parameterized with replacements
const safeQuery = `SELECT * FROM users WHERE name = ?`;
sequelize.query(safeQuery, {
    replacements: [userName],
    type: Sequelize.QueryTypes.SELECT
});

// ✅ CORRECT - Operator usage
User.findAll({
  where: {
    name: {
      [Op.like]: `%${searchTerm}%`,  // Escaped automatically
    },
  },
});
```

### Hibernate (Java)

```java
import javax.persistence.*;
import org.hibernate.query.Query;

@Repository
public class UserRepository {

    // ❌ WRONG - Concatenation
    @Query("SELECT u FROM User u WHERE u.email = '" + email + "'")
    List<User> unsafeFindByEmail(String email);

    // ✅ CORRECT - Parameterized
    @Query("SELECT u FROM User u WHERE u.email = :email")
    List<User> findByEmail(@Param("email") String email);

    // ✅ CORRECT - Criteria API
    public List<User> safeFindByEmail(String email) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        cb.add(Restrictions.eq("email", email));
        return cb.createQuery(criteria).getResultList();
    }
}
```

---

## Migration Rollback Strategies

### Safe Rollback Pattern

```sql
-- migrations/003_add_status_column.up.sql
BEGIN;

-- Step 1: Add new column with default value
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- Step 2: Backfill data for existing rows
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Step 3: Add NOT NULL constraint (only after backfill)
ALTER TABLE users ALTER COLUMN status SET NOT NULL;

COMMIT;
```

```sql
-- migrations/003_add_status_column.down.sql
BEGIN;

-- Step 1: Remove NOT NULL constraint first
ALTER TABLE users ALTER COLUMN status DROP NOT NULL;

-- Step 2: Drop the column
ALTER TABLE users DROP COLUMN status;

COMMIT;
```

### Zero-Downtime Migration Strategy

```bash
#!/bin/bash
# migrate-zero-downtime.sh

# 1. Create new table (with migration)
psql $DATABASE -f migrations/004_add_new_users_table.up.sql

# 2. Copy data with transformations
psql $DATABASE <<SQL
INSERT INTO users_new (id, email, name, status)
  SELECT id, email, name,
         CASE
           WHEN active THEN 'active'
           WHEN verified THEN 'verified'
           ELSE 'pending'
         END as status
  FROM users;
SQL

# 3: Swap tables atomically
psql $DATABASE <<SQL
BEGIN;
  ALTER TABLE users RENAME TO users_old;
  ALTER TABLE users_new RENAME TO users;
COMMIT;
SQL

# 4: Keep old table for backup
psql $DATABASE -c "RENAME TABLE users_old TO users_backup_$(date +%Y%m%d)"

# 5: Verify before dropping
sleep 30  # Wait for verification
# Verify with app team
# If good: drop backup
# If bad: swap back
```

### Migration Rollback with Version Control

```python
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Apply migration
    op.add_column('users', 'status', sa.String(length=20), nullable=True)
    op.execute("UPDATE users SET status = 'active'")
    op.alter_column('users', 'status', nullable=False)

def downgrade():
    # Rollback migration
    op.alter_column('users', 'status', nullable=True)
    op.drop_column('users', 'status')
```

### Automated Rollback on Failure

```python
from typing import Callable
import logging

logger = logging.getLogger(__name__)

class MigrationExecutor:
    def __init__(self):
        self.backup_dir = "/backups/migrations"

    def execute_with_rollback(
        self,
        upgrade_fn: Callable,
        downgrade_fn: Callable
    ):
        try:
            # 1. Backup current state
            self.create_backup()

            # 2. Execute migration
            upgrade_fn()

            # 3. Verify migration
            if not self.verify_migration():
                raise MigrationError("Verification failed")

        except Exception as e:
            logger.error(f"Migration failed: {e}")

            # 4. Rollback automatically
            try:
                downgrade_fn()
                logger.info("Rollback successful")
            except Exception as rollback_error:
                logger.critical(f"Rollback failed: {rollback_error}")
                raise

    def create_backup(self):
        """Create schema backup before migration"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = f"{self.backup_dir}/pre_migration_{timestamp}.sql"

        os.makedirs(self.backup_dir, exist_ok=True)

        subprocess.run([
            "pg_dump", "-U", "user", "-d", "database",
            "-f", backup_file
        ], check=True)

        logger.info(f"Backup created: {backup_file}")

    def verify_migration(self) -> bool:
        """Verify migration was successful"""
        try:
            # Test critical operations
            result = subprocess.run([
                "psql", "-U", "user", "-d", "database",
                "-c", "SELECT COUNT(*) FROM users WHERE status IS NOT NULL"
            ], capture_output=True, text=True)

            if result.returncode == 0:
                count = int(result.stdout.strip())
                return count > 0  # Basic sanity check

        except Exception as e:
            logger.error(f"Verification failed: {e}")

        return False
```

---

## Commands

```bash
# Connect to database
psql -U user -d mydb

# Run SQL file
psql -U user -d mydb -f schema.sql

# Show table size
SELECT
    table_name,
    pg_size_pretty(pg_total_relation_size(table_name::regclass)) as size
FROM information_schema.tables
WHERE table_schema = 'public';

# Vacuum and analyze
VACUUM ANALYZE users;
```

---

## Resources

- **PostgreSQL Tutorial**: [postgresqltutorial.com](https://www.postgresqltutorial.com)
- **Database Normalization**: [dba.stackexchange.com](https://dba.stackexchange.com/questions/11765/whats-the-difference-between-3nf-and-bcnf)
- **Indexing Strategy**: [use-the-index-luke.com](https://use-the-index-luke.com)

---

## Examples

### Example 1: Designing PostgreSQL Schema for E-commerce

**User request:** "Design a database schema for an e-commerce platform"

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for email lookups
CREATE INDEX idx_users_email ON users(email);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    inventory_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for product search
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_sku ON products(sku);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for user orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Order items table (many-to-many relationship)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- Index for order items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Trigger to update orders.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View: Order summaries for reporting
CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.user_id,
    u.email as user_email,
    o.status,
    o.total_amount,
    o.created_at,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.user_id, u.email, o.status, o.total_amount, o.created_at;
