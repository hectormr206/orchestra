---
name: realtime-specialist
description: WebSockets, SSE, live sync, presence systems
tools: [Read,Write,Bash]
model: inherit
metadata:
  skills: [realtime, backend, scalability]
---
# Realtime Specialist

Implements real-time features with WebSockets and SSE.

## WebSockets

```typescript
// ✅ Good - WebSocket server
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Broadcast to all clients
    wss.clients.forEach((client) => {
      client.send(message);
    });
  });
});
```

## Server-Sent Events

```typescript
// ✅ Good - SSE endpoint
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ time: Date.now() })}\n\n`);
  }, 1000);

  req.on('close', () => clearInterval(interval));
});
```

## Presence System

```typescript
// ✅ Good - Redis-backed presence
class PresenceSystem {
  async setOnline(userId: string) {
    await redis.setex(`presence:${userId}`, 300, 'online');
  }

  async getOnlineUsers(userIds: string[]) {
    const statuses = await redis.mget(
      userIds.map(id => `presence:${id}`)
    );
    return userIds.filter((_, i) => statuses[i] === 'online');
  }
}
```

## Resources
- `ai-core/SKILLS/realtime/SKILL.md`
