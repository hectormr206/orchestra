---
name: data-analytics
description: >
  Data analytics patterns: ETL/ELT pipelines, data warehousing, BI integration,
  event tracking, analytics SDKs, data modeling, reporting.
  Trigger: When implementing analytics, data pipelines, or BI dashboards.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Implementing event tracking"
    - "Building data pipelines"
    - "Setting up analytics"
    - "Creating BI dashboards"
    - "Designing data warehouses"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Implementing product analytics
- Building ETL/ELT pipelines
- Setting up data warehouses
- Creating BI dashboards
- Tracking user behavior
- Measuring business KPIs

---

## Critical Patterns

### > **ALWAYS**

1. **Define a tracking plan**
   ```markdown
   ## Tracking Plan

   ### Events

   | Event Name | Description | Properties | Trigger |
   |------------|-------------|------------|---------|
   | `page_viewed` | User views a page | page_name, referrer | On page load |
   | `button_clicked` | User clicks a button | button_name, location | On click |
   | `signup_completed` | User completes signup | method, referral_code | On success |
   | `purchase_completed` | User completes purchase | amount, currency, items | On success |

   ### User Properties

   | Property | Type | Description |
   |----------|------|-------------|
   | `plan` | string | Current subscription plan |
   | `signup_date` | datetime | When user signed up |
   | `company_size` | string | Size of user's company |
   ```

2. **Use consistent naming conventions**
   ```
   NAMING CONVENTIONS:

   Events: object_action (snake_case)
   ✓ page_viewed
   ✓ button_clicked
   ✓ purchase_completed
   ✗ PageViewed
   ✗ clickButton
   ✗ user-signup

   Properties: snake_case
   ✓ user_id
   ✓ created_at
   ✓ total_amount
   ```

3. **Include essential properties**
   ```typescript
   interface BaseEventProperties {
     // Identity
     user_id?: string;
     anonymous_id: string;

     // Context
     timestamp: string;  // ISO 8601
     session_id: string;

     // Device
     device_type: 'desktop' | 'mobile' | 'tablet';
     os: string;
     browser: string;

     // Location
     page_url: string;
     referrer?: string;

     // App
     app_version: string;
     environment: 'production' | 'staging' | 'development';
   }
   ```

4. **Validate events before sending**
   ```typescript
   import { z } from 'zod';

   const PurchaseEventSchema = z.object({
     event: z.literal('purchase_completed'),
     properties: z.object({
       order_id: z.string(),
       amount: z.number().positive(),
       currency: z.string().length(3),
       items: z.array(z.object({
         product_id: z.string(),
         name: z.string(),
         price: z.number(),
         quantity: z.number().int().positive()
       }))
     })
   });

   function trackPurchase(properties: unknown) {
     const result = PurchaseEventSchema.safeParse({
       event: 'purchase_completed',
       properties
     });

     if (!result.success) {
       console.error('Invalid purchase event:', result.error);
       return;
     }

     analytics.track(result.data);
   }
   ```

5. **Buffer and batch events**
   ```typescript
   class EventBuffer {
     private buffer: Event[] = [];
     private maxSize = 10;
     private flushInterval = 10000;  // 10 seconds

     constructor() {
       setInterval(() => this.flush(), this.flushInterval);
       window.addEventListener('beforeunload', () => this.flush());
     }

     add(event: Event) {
       this.buffer.push(event);
       if (this.buffer.length >= this.maxSize) {
         this.flush();
       }
     }

     private async flush() {
       if (this.buffer.length === 0) return;

       const events = [...this.buffer];
       this.buffer = [];

       await fetch('/api/analytics/batch', {
         method: 'POST',
         body: JSON.stringify({ events }),
         keepalive: true  // Ensure delivery on page unload
       });
     }
   }
   ```

### > **NEVER**

1. **Track PII without consent**
2. **Use inconsistent event names**
3. **Skip event validation**
4. **Block UI waiting for analytics**
5. **Store raw user input in analytics**

---

## Event Tracking

### Client-Side (Browser)

```typescript
// analytics.ts
class Analytics {
  private userId?: string;
  private anonymousId: string;
  private queue: Event[] = [];

  constructor() {
    this.anonymousId = this.getOrCreateAnonymousId();
    this.setupPageTracking();
  }

  identify(userId: string, traits?: Record<string, any>) {
    this.userId = userId;
    this.track('user_identified', { ...traits });

    // Update analytics services
    if (window.gtag) {
      window.gtag('set', 'user_id', userId);
    }
  }

  track(event: string, properties?: Record<string, any>) {
    const enrichedEvent = {
      event,
      properties: {
        ...properties,
        ...this.getContext()
      },
      timestamp: new Date().toISOString()
    };

    // Send to multiple destinations
    this.sendToSegment(enrichedEvent);
    this.sendToGoogleAnalytics(enrichedEvent);
    this.sendToBackend(enrichedEvent);
  }

  page(name: string, properties?: Record<string, any>) {
    this.track('page_viewed', {
      page_name: name,
      page_url: window.location.href,
      referrer: document.referrer,
      ...properties
    });
  }

  private getContext(): Record<string, any> {
    return {
      user_id: this.userId,
      anonymous_id: this.anonymousId,
      session_id: this.getSessionId(),
      device_type: this.getDeviceType(),
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      user_agent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language
    };
  }

  private setupPageTracking() {
    // Track initial page view
    this.page(document.title);

    // Track SPA navigation
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.page(document.title);
    };

    window.addEventListener('popstate', () => {
      this.page(document.title);
    });
  }
}

export const analytics = new Analytics();
```

### Server-Side (Node.js)

```typescript
import Analytics from '@segment/analytics-node';

const analytics = new Analytics({ writeKey: process.env.SEGMENT_WRITE_KEY! });

// Track server-side events
function trackServerEvent(
  userId: string,
  event: string,
  properties: Record<string, any>
) {
  analytics.track({
    userId,
    event,
    properties: {
      ...properties,
      source: 'server',
      timestamp: new Date().toISOString()
    },
    context: {
      app: {
        name: 'my-app',
        version: process.env.APP_VERSION
      }
    }
  });
}

// Track API events
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    trackServerEvent(req.user?.id || 'anonymous', 'api_request', {
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
      duration_ms: Date.now() - start
    });
  });

  next();
});
```

---

## ETL/ELT Pipelines

### Architecture

```
┌─────────────────────────────────────────────┐
│              DATA PIPELINE                   │
├─────────────────────────────────────────────┤
│                                             │
│  SOURCES              TRANSFORM     DEST    │
│  ───────              ─────────     ────    │
│  PostgreSQL ─┐                              │
│  MongoDB    ─┤        ┌─────────┐           │
│  S3 Files   ─┼──────▶ │ Airflow │ ───────▶ Snowflake
│  APIs       ─┤        │   dbt   │           BigQuery
│  Events     ─┘        └─────────┘           Redshift
│                                             │
└─────────────────────────────────────────────┘
```

### Airflow DAG Example

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'email_on_failure': True,
    'email': ['data-team@company.com'],
    'retries': 3,
    'retry_delay': timedelta(minutes=5)
}

with DAG(
    'daily_analytics_pipeline',
    default_args=default_args,
    description='Daily analytics data pipeline',
    schedule_interval='0 6 * * *',  # 6 AM daily
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=['analytics', 'daily']
) as dag:

    extract_events = PythonOperator(
        task_id='extract_events',
        python_callable=extract_events_from_source,
        op_kwargs={'date': '{{ ds }}'}
    )

    transform_events = PythonOperator(
        task_id='transform_events',
        python_callable=transform_event_data
    )

    load_to_warehouse = PostgresOperator(
        task_id='load_to_warehouse',
        postgres_conn_id='warehouse',
        sql='sql/load_daily_events.sql'
    )

    run_dbt_models = BashOperator(
        task_id='run_dbt_models',
        bash_command='cd /opt/dbt && dbt run --models daily_metrics'
    )

    extract_events >> transform_events >> load_to_warehouse >> run_dbt_models
```

### dbt Model Example

```sql
-- models/marts/daily_metrics.sql
{{ config(
    materialized='incremental',
    unique_key='date',
    cluster_by=['date']
) }}

WITH events AS (
    SELECT * FROM {{ ref('stg_events') }}
    {% if is_incremental() %}
    WHERE event_date >= (SELECT MAX(date) FROM {{ this }})
    {% endif %}
),

daily_signups AS (
    SELECT
        event_date AS date,
        COUNT(DISTINCT user_id) AS new_users
    FROM events
    WHERE event_name = 'signup_completed'
    GROUP BY 1
),

daily_revenue AS (
    SELECT
        event_date AS date,
        SUM(amount) AS revenue,
        COUNT(DISTINCT user_id) AS paying_users
    FROM events
    WHERE event_name = 'purchase_completed'
    GROUP BY 1
)

SELECT
    COALESCE(s.date, r.date) AS date,
    COALESCE(s.new_users, 0) AS new_users,
    COALESCE(r.revenue, 0) AS revenue,
    COALESCE(r.paying_users, 0) AS paying_users,
    CASE
        WHEN COALESCE(s.new_users, 0) > 0
        THEN COALESCE(r.paying_users, 0)::FLOAT / s.new_users
        ELSE 0
    END AS conversion_rate
FROM daily_signups s
FULL OUTER JOIN daily_revenue r ON s.date = r.date
```

---

## Data Warehouse Schema

### Star Schema

```sql
-- Fact table: Events
CREATE TABLE fact_events (
    event_id BIGINT PRIMARY KEY,
    event_timestamp TIMESTAMP NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    user_key BIGINT REFERENCES dim_users(user_key),
    product_key BIGINT REFERENCES dim_products(product_key),
    date_key INT REFERENCES dim_date(date_key),
    session_id VARCHAR(100),
    amount DECIMAL(10, 2),
    quantity INT,
    properties JSONB
);

-- Dimension: Users
CREATE TABLE dim_users (
    user_key BIGINT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP,
    plan VARCHAR(50),
    country VARCHAR(2),
    -- SCD Type 2 fields
    valid_from TIMESTAMP,
    valid_to TIMESTAMP,
    is_current BOOLEAN
);

-- Dimension: Date
CREATE TABLE dim_date (
    date_key INT PRIMARY KEY,
    date DATE NOT NULL,
    day_of_week INT,
    day_name VARCHAR(10),
    week_of_year INT,
    month INT,
    month_name VARCHAR(10),
    quarter INT,
    year INT,
    is_weekend BOOLEAN,
    is_holiday BOOLEAN
);

-- Dimension: Products
CREATE TABLE dim_products (
    product_key BIGINT PRIMARY KEY,
    product_id VARCHAR(100) NOT NULL,
    name VARCHAR(255),
    category VARCHAR(100),
    price DECIMAL(10, 2)
);
```

---

## BI Dashboard

### Metabase / Looker / Tableau

```yaml
# Dashboard configuration (conceptual)
dashboard:
  name: "Product Analytics"
  refresh_interval: 3600  # 1 hour

  filters:
    - name: date_range
      type: date_range
      default: last_30_days
    - name: plan
      type: dropdown
      values: [free, pro, enterprise]

  charts:
    - name: Daily Active Users
      type: line_chart
      query: |
        SELECT date, COUNT(DISTINCT user_id) as dau
        FROM fact_events
        WHERE date BETWEEN :start_date AND :end_date
        GROUP BY date
        ORDER BY date

    - name: Revenue by Plan
      type: pie_chart
      query: |
        SELECT
          u.plan,
          SUM(e.amount) as revenue
        FROM fact_events e
        JOIN dim_users u ON e.user_key = u.user_key
        WHERE e.event_name = 'purchase_completed'
        AND e.date_key BETWEEN :start_date AND :end_date
        GROUP BY u.plan

    - name: Conversion Funnel
      type: funnel
      stages:
        - name: Visited
          query: "SELECT COUNT(DISTINCT user_id) FROM events WHERE name = 'page_viewed'"
        - name: Signed Up
          query: "SELECT COUNT(DISTINCT user_id) FROM events WHERE name = 'signup_completed'"
        - name: Activated
          query: "SELECT COUNT(DISTINCT user_id) FROM events WHERE name = 'first_action'"
        - name: Purchased
          query: "SELECT COUNT(DISTINCT user_id) FROM events WHERE name = 'purchase_completed'"
```

---

## Analytics SDKs

### Segment

```typescript
// Client-side
import { AnalyticsBrowser } from '@segment/analytics-next';

const analytics = AnalyticsBrowser.load({
  writeKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY!
});

analytics.identify(userId, { plan: 'pro', company: 'Acme' });
analytics.track('Button Clicked', { button: 'signup', location: 'header' });
analytics.page('Home');

// Server-side
import Analytics from '@segment/analytics-node';

const analytics = new Analytics({ writeKey: process.env.SEGMENT_WRITE_KEY! });
analytics.track({ userId, event: 'Order Completed', properties: { orderId, amount } });
```

### Mixpanel

```typescript
import mixpanel from 'mixpanel-browser';

mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!);

mixpanel.identify(userId);
mixpanel.people.set({ plan: 'pro', company: 'Acme' });
mixpanel.track('Button Clicked', { button: 'signup', location: 'header' });
```

### PostHog

```typescript
import posthog from 'posthog-js';

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: 'https://app.posthog.com'
});

posthog.identify(userId, { email, plan: 'pro' });
posthog.capture('Button Clicked', { button: 'signup' });

// Feature flags integration
if (posthog.isFeatureEnabled('new-checkout')) {
  // Show new checkout
}
```

---

## Data Quality

### Validation Rules

```python
import great_expectations as gx

# Create expectation suite
context = gx.get_context()
suite = context.add_expectation_suite("events_quality")

# Add expectations
suite.add_expectation(
    gx.expectations.ExpectColumnToExist(column="user_id")
)
suite.add_expectation(
    gx.expectations.ExpectColumnValuesToNotBeNull(column="event_timestamp")
)
suite.add_expectation(
    gx.expectations.ExpectColumnValuesToBeInSet(
        column="event_name",
        value_set=["page_viewed", "button_clicked", "purchase_completed"]
    )
)
suite.add_expectation(
    gx.expectations.ExpectColumnValuesToBeBetween(
        column="amount",
        min_value=0,
        max_value=10000
    )
)

# Run validation
results = context.run_checkpoint(checkpoint_name="events_checkpoint")
```

---

## Commands

```bash
# dbt
dbt run --models daily_metrics
dbt test
dbt docs generate && dbt docs serve

# Airflow
airflow dags trigger daily_analytics_pipeline
airflow tasks test daily_analytics_pipeline extract_events 2024-01-15

# Great Expectations
great_expectations checkpoint run events_checkpoint

# Segment
npx @segment/analytics-next debug
```

---

## Resources

- **Segment**: [segment.com/docs](https://segment.com/docs/)
- **Mixpanel**: [mixpanel.com/docs](https://mixpanel.com/docs/)
- **dbt**: [docs.getdbt.com](https://docs.getdbt.com/)
- **Airflow**: [airflow.apache.org](https://airflow.apache.org/)
- **Great Expectations**: [greatexpectations.io](https://greatexpectations.io/)

---

## Examples

### Example 1: Building ETL Pipeline with Airflow

**User request:** "Create an ETL pipeline to sync data from PostgreSQL to data warehouse"

```python
from airflow import DAG
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.providers.snowflake.transfers.postgres_to_snowflake import PostgresToSnowflakeOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5)
}

dag = DAG(
    'postgres_to_snowflake',
    default_args=default_args,
    description='Sync transactional data to data warehouse',
    schedule_interval='0 2 * * *',  # Daily at 2 AM
    catchup=False,
    tags=['etl', 'postgres', 'snowflake']
)

# Extract: Get data from PostgreSQL
extract_orders = PostgresOperator(
    task_id='extract_orders',
    postgres_conn_id='postgres_source',
    sql='''
        SELECT 
            order_id,
            user_id,
            total_amount,
            status,
            created_at
        FROM orders
        WHERE created_at >= '{{ ds }}' 
          AND created_at < '{{ tomorrow_ds }}'
    ''',
    dag=dag
)

# Load: Transfer to Snowflake
load_orders = PostgresToSnowflakeOperator(
    task_id='load_orders',
    postgres_conn_id='postgres_source',
    snowflake_conn_id='snowflake_dest',
    database='analytics_db',
    schema='public',
    table='orders',
    sql='''SELECT 
            order_id,
            user_id,
            total_amount,
            status,
            created_at
          FROM orders
          WHERE created_at >= '{{ ds }}' 
            AND created_at < '{{ tomorrow_ds }}' ''',
    dag=dag
)

# Update statistics
update_stats = PostgresOperator(
    task_id='update_statistics',
    postgres_conn_id='postgres_source',
    sql='''
        INSERT INTO etl_audit_log (
            run_date,
            source_table,
            destination_table,
            rows_processed,
            status
        )
        SELECT 
            '{{ ds }}',
            'orders',
            'analytics_db.public.orders',
            COUNT(*),
            'success'
        FROM orders
        WHERE created_at >= '{{ ds }}' 
          AND created_at < '{{ tomorrow_ds }}'
    ''',
    dag=dag
)

# Define task dependencies
extract_orders >> load_orders >> update_stats
