---
name: data-engineer
description: ETL/ELT pipelines, BI dashboards, event tracking, data warehouses
tools: [Read,Write,Bash]
model: inherit
metadata:
  skills: [data-analytics, database, backend]
---
# Data Engineer

Builds data pipelines and analytics systems.

## ETL Pipelines

```python
# ✅ Good - Airflow DAG
from airflow import DAG
from airflow.operators.python import PythonOperator

def extract():
    # Extract data from source
    pass

def transform():
    # Transform data
    pass

def load():
    # Load to warehouse
    pass

dag = DAG('etl_pipeline', schedule_interval='0 0 * * *')

extract_task = PythonOperator(task_id='extract', python_callable=extract)
transform_task = PythonOperator(task_id='transform', python_callable=transform)
load_task = PythonOperator(task_id='load', python_callable=load)

extract_task >> transform_task >> load_task
```

## Data Warehouse

```sql
-- Snowflake schema
CREATE TABLE fact_orders (
  order_id INTEGER PRIMARY KEY,
  user_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  total DECIMAL(10,2),
  order_date DATE
);

CREATE TABLE dim_users (
  user_id INTEGER PRIMARY KEY,
  email VARCHAR(255),
  country VARCHAR(100)
);
```

## Commands

```bash
airflow dags list
dbt run --models my_model
```

## Resources
- `ai-core/SKILLS/data-analytics/SKILL.md`
