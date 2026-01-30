---
name: architecture
description: >
  Software architecture patterns: microservices, monoliths, event-driven,
  CQRS, DDD, clean architecture, system design, trade-offs analysis.
  Trigger: When designing systems or making architectural decisions.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Designing system architecture"
    - "Choosing between monolith and microservices"
    - "Implementing domain-driven design"
    - "Creating Architecture Decision Records"
    - "Evaluating architectural trade-offs"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Starting a new project (architecture decision)
- Refactoring monolith to microservices
- Implementing domain-driven design
- Designing event-driven systems
- Creating Architecture Decision Records (ADRs)
- Evaluating system scalability

---

## Critical Patterns

### > **ALWAYS**

1. **Start with the problem, not the solution**
   ```
   ┌─────────────────────────────────────────────┐
   │ BEFORE CHOOSING ARCHITECTURE, ANSWER:      │
   │                                             │
   │ 1. What are the business requirements?     │
   │ 2. What are the scalability needs?         │
   │ 3. What is the team size and expertise?    │
   │ 4. What are the deployment constraints?    │
   │ 5. What is the expected timeline?          │
   │ 6. What are the compliance requirements?   │
   └─────────────────────────────────────────────┘
   ```

2. **Document decisions with ADRs**
   ```markdown
   # ADR-001: Use Microservices Architecture

   ## Status
   Accepted

   ## Context
   We need to scale individual components independently
   and deploy updates without full system deployment.

   ## Decision
   We will use microservices with API Gateway pattern.

   ## Consequences
   + Independent scaling and deployment
   + Technology flexibility per service
   - Increased operational complexity
   - Network latency between services
   - Distributed transaction challenges
   ```

3. **Apply the right pattern for the right scale**
   ```
   TEAM SIZE → ARCHITECTURE

   1-5 developers   → Modular Monolith
   5-15 developers  → Modular Monolith or Service-Oriented
   15-50 developers → Microservices
   50+ developers   → Microservices with Platform Team
   ```

4. **Design for failure**
   ```
   EVERY external call should handle:
   - Timeout
   - Retry with backoff
   - Circuit breaker
   - Graceful degradation
   - Fallback response
   ```

5. **Separate concerns clearly**
   ```
   ┌─────────────────────────────────────────────┐
   │ LAYERS OF CONCERN                          │
   │                                             │
   │ Presentation  → How to display              │
   │ Application   → Use cases, orchestration    │
   │ Domain        → Business rules              │
   │ Infrastructure→ Technical details           │
   │                                             │
   │ Dependencies point INWARD only             │
   └─────────────────────────────────────────────┘
   ```

### > **NEVER**

1. **Start with microservices**
   - Always start simpler (modular monolith)
   - Extract services when you understand boundaries

2. **Create circular dependencies**
   ```
   Service A → Service B → Service A  ✗

   Use events or shared service instead
   ```

3. **Share databases between services**
4. **Ignore Conway's Law**
5. **Over-engineer for hypothetical scale**

---

## Architecture Comparison

### Monolith vs Microservices

| Aspect | Monolith | Microservices |
|--------|----------|---------------|
| **Complexity** | Lower | Higher |
| **Deployment** | All or nothing | Independent |
| **Scaling** | Vertical | Horizontal per service |
| **Data consistency** | ACID transactions | Eventual consistency |
| **Team structure** | Single team | Multiple teams |
| **Technology** | Single stack | Polyglot |
| **Testing** | Simpler | Complex (contracts) |
| **Debugging** | Easier | Distributed tracing needed |

### When to Use What

```
MONOLITH when:
- Small team (< 10)
- New product (unknown domain)
- Simple deployment needs
- Strong consistency required
- Tight deadline

MICROSERVICES when:
- Large team (> 15)
- Well-understood domain
- Independent scaling needed
- Different tech requirements
- Multiple deployment cycles
```

---

## Clean Architecture

### Layer Structure

```
┌─────────────────────────────────────────────┐
│              FRAMEWORKS & DRIVERS            │
│  (Web, UI, DB, External APIs, Devices)      │
├─────────────────────────────────────────────┤
│           INTERFACE ADAPTERS                 │
│  (Controllers, Gateways, Presenters)        │
├─────────────────────────────────────────────┤
│           APPLICATION BUSINESS               │
│  (Use Cases, Application Services)          │
├─────────────────────────────────────────────┤
│           ENTERPRISE BUSINESS                │
│  (Entities, Domain Services, Value Objects) │
└─────────────────────────────────────────────┘

DEPENDENCY RULE: Dependencies point INWARD only
```

### Project Structure

```
src/
├── domain/                    # Enterprise Business Rules
│   ├── entities/
│   │   ├── user.py
│   │   └── order.py
│   ├── value_objects/
│   │   ├── email.py
│   │   └── money.py
│   ├── services/
│   │   └── pricing_service.py
│   └── repositories/          # Interfaces only
│       └── user_repository.py
│
├── application/               # Application Business Rules
│   ├── use_cases/
│   │   ├── create_user.py
│   │   └── place_order.py
│   ├── dtos/
│   │   └── user_dto.py
│   └── interfaces/
│       └── email_service.py
│
├── infrastructure/            # Frameworks & Drivers
│   ├── persistence/
│   │   ├── postgres_user_repository.py
│   │   └── models/
│   ├── external/
│   │   └── stripe_payment_service.py
│   └── email/
│       └── sendgrid_email_service.py
│
└── presentation/              # Interface Adapters
    ├── api/
    │   ├── routes/
    │   └── controllers/
    └── cli/
```

### Implementation Example

```python
# domain/entities/user.py
from dataclasses import dataclass
from domain.value_objects import Email

@dataclass
class User:
    id: str
    email: Email
    name: str

    def change_email(self, new_email: Email) -> None:
        # Business rule: email change requires verification
        self.email = new_email
        self.email_verified = False

# domain/repositories/user_repository.py
from abc import ABC, abstractmethod

class UserRepository(ABC):
    @abstractmethod
    async def get_by_id(self, user_id: str) -> User | None:
        pass

    @abstractmethod
    async def save(self, user: User) -> None:
        pass

# application/use_cases/create_user.py
@dataclass
class CreateUserUseCase:
    user_repository: UserRepository
    email_service: EmailService

    async def execute(self, request: CreateUserRequest) -> CreateUserResponse:
        # Validate
        email = Email(request.email)  # Value object validates format

        # Check existing
        existing = await self.user_repository.get_by_email(email)
        if existing:
            raise UserAlreadyExistsError(email)

        # Create
        user = User(
            id=generate_id(),
            email=email,
            name=request.name
        )

        await self.user_repository.save(user)
        await self.email_service.send_welcome(user)

        return CreateUserResponse(user_id=user.id)

# infrastructure/persistence/postgres_user_repository.py
class PostgresUserRepository(UserRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: str) -> User | None:
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def save(self, user: User) -> None:
        model = self._to_model(user)
        self.session.add(model)
        await self.session.commit()
```

---

## Domain-Driven Design (DDD)

### Strategic Patterns

```
┌─────────────────────────────────────────────┐
│ BOUNDED CONTEXT                             │
│ A boundary within which a domain model      │
│ has consistent meaning                      │
│                                             │
│ Example contexts:                           │
│ - Orders (Order, OrderItem, Payment)        │
│ - Inventory (Product, Stock, Warehouse)     │
│ - Shipping (Shipment, Address, Carrier)     │
│                                             │
│ Same word, different meaning per context:   │
│ "Customer" in Sales vs Support              │
└─────────────────────────────────────────────┘
```

### Context Mapping

```
┌─────────────┐     ┌─────────────┐
│   Orders    │     │  Inventory  │
│   Context   │────▶│   Context   │
└─────────────┘     └─────────────┘
      │                    │
      │    Shared Kernel   │
      └────────┬───────────┘
               │
        ┌──────┴──────┐
        │  Shipping   │
        │   Context   │
        └─────────────┘

Integration patterns:
- Shared Kernel: Share code between contexts
- Customer-Supplier: Upstream/downstream relationship
- Conformist: Accept upstream model as-is
- Anti-Corruption Layer: Translate between models
- Open Host Service: Public API for multiple consumers
```

### Tactical Patterns

```python
# Entity: Has identity, mutable
class Order:
    id: OrderId
    items: list[OrderItem]

    def add_item(self, product: Product, quantity: int):
        # Business logic
        pass

# Value Object: No identity, immutable
@dataclass(frozen=True)
class Money:
    amount: Decimal
    currency: str

    def add(self, other: Money) -> Money:
        if self.currency != other.currency:
            raise CurrencyMismatchError()
        return Money(self.amount + other.amount, self.currency)

# Aggregate: Cluster of entities/value objects
# Single entry point, transactional boundary
class Order:  # Aggregate Root
    id: OrderId
    items: list[OrderItem]  # Part of aggregate
    shipping: ShippingAddress  # Value object

    def place(self):
        # Invariants enforced here
        if not self.items:
            raise OrderMustHaveItemsError()

# Domain Event: Something that happened
@dataclass
class OrderPlaced:
    order_id: str
    customer_id: str
    total: Money
    occurred_at: datetime

# Repository: Persistence abstraction per aggregate
class OrderRepository(ABC):
    @abstractmethod
    def get(self, order_id: OrderId) -> Order | None:
        pass

    @abstractmethod
    def save(self, order: Order) -> None:
        pass

# Domain Service: Stateless operations across entities
class PricingService:
    def calculate_discount(
        self,
        order: Order,
        customer: Customer
    ) -> Money:
        # Complex pricing logic
        pass
```

---

## Event-Driven Architecture

### Patterns

```
EVENT SOURCING
- Store events, not state
- Rebuild state by replaying events
- Perfect audit trail
- Enables temporal queries

CQRS (Command Query Responsibility Segregation)
- Separate read and write models
- Optimize each independently
- Eventually consistent

EVENT-DRIVEN
- Services communicate via events
- Loose coupling
- Asynchronous processing
```

### Event Sourcing Example

```python
# Events
@dataclass
class AccountOpened:
    account_id: str
    owner_id: str
    initial_balance: Decimal
    opened_at: datetime

@dataclass
class MoneyDeposited:
    account_id: str
    amount: Decimal
    deposited_at: datetime

@dataclass
class MoneyWithdrawn:
    account_id: str
    amount: Decimal
    withdrawn_at: datetime

# Aggregate with event sourcing
class BankAccount:
    def __init__(self):
        self.id = None
        self.balance = Decimal(0)
        self.events = []

    def apply(self, event):
        """Apply event to update state"""
        match event:
            case AccountOpened():
                self.id = event.account_id
                self.balance = event.initial_balance
            case MoneyDeposited():
                self.balance += event.amount
            case MoneyWithdrawn():
                self.balance -= event.amount

    def deposit(self, amount: Decimal):
        """Command: creates event"""
        if amount <= 0:
            raise InvalidAmountError()

        event = MoneyDeposited(
            account_id=self.id,
            amount=amount,
            deposited_at=datetime.utcnow()
        )
        self.apply(event)
        self.events.append(event)

    def withdraw(self, amount: Decimal):
        if amount > self.balance:
            raise InsufficientFundsError()

        event = MoneyWithdrawn(
            account_id=self.id,
            amount=amount,
            withdrawn_at=datetime.utcnow()
        )
        self.apply(event)
        self.events.append(event)

    @classmethod
    def from_events(cls, events: list) -> 'BankAccount':
        """Reconstruct from event stream"""
        account = cls()
        for event in events:
            account.apply(event)
        return account
```

### CQRS Implementation

```python
# Write side (commands)
class CreateOrderCommand:
    customer_id: str
    items: list[OrderItemDTO]

class CreateOrderHandler:
    def __init__(self, order_repo: OrderRepository, event_bus: EventBus):
        self.order_repo = order_repo
        self.event_bus = event_bus

    async def handle(self, command: CreateOrderCommand) -> str:
        order = Order.create(command.customer_id, command.items)
        await self.order_repo.save(order)

        # Publish event for read side
        await self.event_bus.publish(OrderCreated(
            order_id=order.id,
            customer_id=order.customer_id,
            total=order.total
        ))

        return order.id

# Read side (queries)
class OrderReadModel:
    """Denormalized view optimized for reading"""
    id: str
    customer_name: str  # Denormalized
    item_count: int
    total: Decimal
    status: str
    created_at: datetime

class OrderQueryService:
    def __init__(self, read_db: ReadDatabase):
        self.read_db = read_db

    async def get_customer_orders(
        self,
        customer_id: str,
        page: int,
        limit: int
    ) -> list[OrderReadModel]:
        # Fast query on denormalized data
        return await self.read_db.query(
            "SELECT * FROM order_views WHERE customer_id = ? LIMIT ? OFFSET ?",
            customer_id, limit, page * limit
        )

# Projector: Updates read model from events
class OrderProjector:
    async def handle(self, event: OrderCreated):
        await self.read_db.insert("order_views", {
            "id": event.order_id,
            "customer_id": event.customer_id,
            "total": event.total,
            "status": "created",
            "created_at": event.occurred_at
        })

    async def handle(self, event: OrderShipped):
        await self.read_db.update(
            "order_views",
            {"status": "shipped"},
            {"id": event.order_id}
        )
```

---

## Microservices Patterns

### Service Communication

```
SYNCHRONOUS
├── REST (HTTP/JSON)
├── gRPC (HTTP/2, Protobuf)
└── GraphQL

ASYNCHRONOUS
├── Message Queue (RabbitMQ, SQS)
├── Event Streaming (Kafka)
└── Pub/Sub (Redis, Google Pub/Sub)
```

### API Gateway Pattern

```
┌─────────────────────────────────────────────┐
│                   CLIENT                     │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│               API GATEWAY                    │
│  - Authentication                           │
│  - Rate limiting                            │
│  - Request routing                          │
│  - Response aggregation                     │
│  - Protocol translation                     │
└─────────────────────┬───────────────────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ Users   │ │ Orders  │ │Products │
    │ Service │ │ Service │ │ Service │
    └─────────┘ └─────────┘ └─────────┘
```

### Saga Pattern (Distributed Transactions)

```
ORDER SAGA (Choreography)

  Order        Payment      Inventory     Shipping
  Service      Service      Service       Service
     │            │            │            │
     │ OrderCreated           │            │
     │──────────────▶         │            │
     │            │           │            │
     │         PaymentProcessed            │
     │            │───────────▶            │
     │            │           │            │
     │                   InventoryReserved │
     │            │           │───────────▶│
     │            │           │            │
     │            │           │   ShipmentScheduled
     │◀───────────────────────────────────│
     │            │           │            │

COMPENSATION (if any step fails):
  PaymentFailed → ReleaseInventory → CancelOrder
```

---

## System Design Checklist

```
FUNCTIONAL REQUIREMENTS
□ Core use cases defined
□ Data model designed
□ API contracts specified
□ User flows documented

NON-FUNCTIONAL REQUIREMENTS
□ Performance (latency, throughput)
□ Scalability (users, data, regions)
□ Availability (uptime SLA)
□ Security (auth, encryption)
□ Compliance (GDPR, HIPAA)

ARCHITECTURAL DECISIONS
□ Monolith vs microservices
□ Database choices (SQL, NoSQL)
□ Caching strategy
□ Message queue needs
□ Deployment topology

TRADE-OFFS DOCUMENTED
□ Consistency vs availability
□ Complexity vs flexibility
□ Cost vs performance
□ Build vs buy
```

---

## Commands

```bash
# Generate PlantUML diagrams
java -jar plantuml.jar architecture.puml

# C4 model diagrams
npx c4builder export --format png

# Dependency analysis
madge --circular --extensions ts ./src

# Architecture fitness functions
npx archunit
```

---

## Resources

- **Clean Architecture**: Robert C. Martin
- **Domain-Driven Design**: Eric Evans
- **Building Microservices**: Sam Newman
- **Designing Data-Intensive Applications**: Martin Kleppmann
- **C4 Model**: [c4model.com](https://c4model.com/)

---

## Examples

### Example 1: Choosing Between Monolith and Microservices

**User request:** "Should we use monolith or microservices for our e-commerce platform?"

**Analysis and recommendation:**

```yaml
Project Context:
  Team size: 5 developers
  Traffic: 1,000 users/day
  Requirements: 
    - Fast time to market
    - Simple deployment
    - Limited DevOps experience

Recommendation: START WITH MONOLITH

Rationale:
  1. Team too small for microservices complexity
  2. Traffic doesn't require horizontal scaling
  3. Can extract services later when needed
  
Architecture:
  Modular Monolith:
    ├── /users      # User management module
    ├── /products   # Product catalog module
    ├── /orders     # Order processing module
    └── /payments   # Payment integration module
  
  Each module:
    - Has clear boundaries
    - Exports well-defined interfaces
    - Can be extracted to service later

Migration Path (when needed):
  1. Traffic > 100K users/day
  2. Team > 20 developers
  3. Specific module needs independent scaling
  
  Then extract: orders → First microservice
```

### Example 2: Event-Driven Architecture for Order Processing

**User request:** "Design an order processing system that handles inventory, payment, and shipping"

**Implementation:**

```python
from enum import Enum
from dataclasses import dataclass
from typing import Protocol

class OrderStatus(Enum):
    PENDING = "pending"
    PAYMENT_PROCESSING = "payment_processing"
    PAID = "paid"
    INVENTORY_RESERVED = "inventory_reserved"
    SHIPPED = "shipped"
    COMPLETED = "completed"

@dataclass
class Order:
    id: str
    user_id: str
    items: list[dict]
    status: OrderStatus

# Event-driven architecture using message bus
class MessageBus(Protocol):
    async def publish(self, event: dict) -> None: ...

class OrderService:
    def __init__(self, bus: MessageBus):
        self.bus = bus
    
    async def create_order(self, user_id: str, items: list) -> Order:
        order = Order(
            id=str(uuid4()),
            user_id=user_id,
            items=items,
            status=OrderStatus.PENDING
        )
        
        # Publish event
        await self.bus.publish({
            "type": "OrderCreated",
            "order_id": order.id,
            "user_id": user_id,
            "items": items
        })
        
        return order

# Independent services listen to events
class PaymentService:
    async def on_order_created(self, event: dict):
        # Process payment
        await self.process_payment(event["order_id"])
        
        # Publish next event
        await self.bus.publish({
            "type": "PaymentCompleted",
            "order_id": event["order_id"]
        })

class InventoryService:
    async def on_payment_completed(self, event: dict):
        # Reserve inventory
        await self.reserve_items(event["order_id"])
        
        await self.bus.publish({
            "type": "InventoryReserved",
            "order_id": event["order_id"]
        })
```

**Benefits:**
- ✅ Services are loosely coupled
- ✅ Each service can scale independently
- ✅ Easy to add new listeners (e.g., analytics, notifications)
- ✅ Natural audit log from event stream
