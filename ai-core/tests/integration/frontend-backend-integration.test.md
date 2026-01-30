# Integration Tests: Frontend + Backend

## Test Suite: Full Stack Integration

### Test 1: CRUD Application Pattern

**Scenario:** "Create task management application"

**Expected Flow:**
```
1. backend skill
   └── Design API
      ├── POST /tasks (create)
      ├── GET /tasks (list)
      ├── GET /tasks/:id (read)
      ├── PATCH /tasks/:id (update)
      └── DELETE /tasks/:id (delete)

2. database skill
   └── Design schema
      ├── tasks table
      ├── Index on user_id
      └── Foreign key constraints

3. frontend skill
   └── Create UI components
      ├── TaskList component
      ├── TaskItem component
      ├── TaskForm component
      └── Accessibility (WCAG 2.1 AA)

4. testing skill
   └── Test full stack
      ├── API integration tests
      ├── Component tests
      └── E2E tests
```

**Validation:**
- ✅ API RESTful
- ✅ Database optimized
- ✅ UI accessible
- ✅ End-to-end coverage

### Test 2: Real-time Features Pattern

**Scenario:** "Add real-time notifications"

**Expected Flow:**
```
1. realtime skill
   └── WebSocket implementation
      ├── Connection management
      ├── Event broadcasting
      └── Reconnection logic

2. backend skill
   └── API endpoints
      ├── Subscribe to notifications
      ├── Unsubscribe
      └── Send notification

3. frontend skill
   └── UI components
      ├── Notification bell
      ├── Notification list
      └── Live updates

4. testing skill
   └── Test real-time features
      ├── WebSocket connection
      ├── Message delivery
      └── Reconnection handling
```

**Validation:**
- ✅ WebSocket works
- ✅ Messages delivered
- ✅ UI updates live
- ✅ Handles disconnect
