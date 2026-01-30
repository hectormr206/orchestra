---
name: realtime
description: >
  Real-time communication patterns: WebSockets, Server-Sent Events, presence,
  live sync, notifications, collaborative editing, pub/sub architecture.
  Trigger: When implementing real-time features like chat, notifications, or live updates.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Implementing WebSockets"
    - "Building real-time features"
    - "Adding live notifications"
    - "Creating collaborative features"
    - "Implementing presence (online status)"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Building chat applications
- Implementing live notifications
- Creating collaborative editing features
- Adding online presence indicators
- Real-time dashboards and monitoring
- Live sports scores, stock tickers
- Multiplayer games

---

## Critical Patterns

### > **ALWAYS**

1. **Implement heartbeat/ping-pong**
   ```javascript
   // Server (Node.js with ws)
   const WebSocket = require('ws');
   const wss = new WebSocket.Server({ port: 8080 });

   wss.on('connection', (ws) => {
     ws.isAlive = true;

     ws.on('pong', () => {
       ws.isAlive = true;
     });
   });

   // Heartbeat interval
   const interval = setInterval(() => {
     wss.clients.forEach((ws) => {
       if (!ws.isAlive) {
         return ws.terminate();
       }
       ws.isAlive = false;
       ws.ping();
     });
   }, 30000);  // 30 seconds
   ```

2. **Handle reconnection gracefully**
   ```typescript
   class ReconnectingWebSocket {
     private ws: WebSocket | null = null;
     private reconnectAttempts = 0;
     private maxReconnectAttempts = 5;
     private reconnectDelay = 1000;

     connect(url: string) {
       this.ws = new WebSocket(url);

       this.ws.onopen = () => {
         this.reconnectAttempts = 0;
         this.onConnect();
       };

       this.ws.onclose = (event) => {
         if (!event.wasClean) {
           this.attemptReconnect(url);
         }
       };

       this.ws.onerror = (error) => {
         console.error('WebSocket error:', error);
       };
     }

     private attemptReconnect(url: string) {
       if (this.reconnectAttempts >= this.maxReconnectAttempts) {
         this.onMaxRetriesReached();
         return;
       }

       const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
       this.reconnectAttempts++;

       setTimeout(() => {
         console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
         this.connect(url);
       }, delay);
     }
   }
   ```

3. **Use message queues for reliability**
   ```
   ┌─────────────────────────────────────────────┐
   │ RELIABLE MESSAGE DELIVERY                   │
   │                                             │
   │ Client ─────▶ Server ─────▶ Message Queue   │
   │                               │             │
   │                               ▼             │
   │                          Persistence        │
   │                               │             │
   │                               ▼             │
   │ Client ◀───── Server ◀───── Delivery       │
   │                                             │
   │ + Acknowledgments (ACK)                     │
   │ + Retry on failure                          │
   │ + Message ordering (sequence numbers)       │
   └─────────────────────────────────────────────┘
   ```

4. **Implement proper authentication**
   ```typescript
   // Client: Send auth token on connect
   const ws = new WebSocket(`wss://api.example.com/ws?token=${authToken}`);

   // Server: Verify on connection
   wss.on('connection', async (ws, req) => {
     const token = new URL(req.url, 'http://localhost').searchParams.get('token');

     try {
       const user = await verifyToken(token);
       ws.userId = user.id;
       ws.send(JSON.stringify({ type: 'connected', userId: user.id }));
     } catch (error) {
       ws.close(4001, 'Unauthorized');
     }
   });
   ```

5. **Rate limit messages**
   ```javascript
   const rateLimiter = new Map();

   function checkRateLimit(userId) {
     const now = Date.now();
     const userLimit = rateLimiter.get(userId) || { count: 0, resetAt: now + 60000 };

     if (now > userLimit.resetAt) {
       userLimit.count = 0;
       userLimit.resetAt = now + 60000;
     }

     userLimit.count++;
     rateLimiter.set(userId, userLimit);

     return userLimit.count <= 100;  // 100 messages per minute
   }
   ```

### > **NEVER**

1. **Trust client-sent data without validation**
2. **Broadcast sensitive data to all clients**
3. **Keep connections without timeout**
4. **Skip message acknowledgments for critical data**
5. **Use WebSockets for simple request-response**

---

## WebSockets vs SSE vs Polling

| Feature | WebSockets | SSE | Long Polling |
|---------|------------|-----|--------------|
| **Direction** | Bidirectional | Server → Client | Bidirectional |
| **Protocol** | ws:// / wss:// | HTTP | HTTP |
| **Reconnection** | Manual | Automatic | Manual |
| **Browser Support** | All modern | All modern | All |
| **Proxy Friendly** | Sometimes | Yes | Yes |
| **Best For** | Chat, games | Notifications, feeds | Fallback |

### When to Use What

```
WEBSOCKETS:
✓ Chat applications
✓ Real-time games
✓ Collaborative editing
✓ High-frequency bidirectional data

SERVER-SENT EVENTS (SSE):
✓ Live notifications
✓ News feeds
✓ Stock tickers
✓ Server-only updates

LONG POLLING:
✓ Fallback when WebSocket blocked
✓ Simple one-way updates
✓ Legacy browser support
```

---

## Implementation Examples

### WebSocket Server (Node.js)

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

interface Client {
  ws: WebSocket;
  userId: string;
  rooms: Set<string>;
}

class RealtimeServer {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private rooms: Map<string, Set<string>> = new Map();

  constructor(port: number) {
    const server = createServer();
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', this.handleConnection.bind(this));
    server.listen(port);
  }

  private async handleConnection(ws: WebSocket, req: any) {
    // Authenticate
    const token = new URL(req.url, 'http://localhost').searchParams.get('token');
    const user = await this.authenticate(token);

    if (!user) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    const client: Client = {
      ws,
      userId: user.id,
      rooms: new Set()
    };

    this.clients.set(user.id, client);

    // Handle messages
    ws.on('message', (data) => this.handleMessage(client, data));

    // Handle disconnect
    ws.on('close', () => this.handleDisconnect(client));

    // Send welcome
    this.send(ws, { type: 'connected', userId: user.id });
  }

  private handleMessage(client: Client, data: any) {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case 'join_room':
        this.joinRoom(client, message.room);
        break;
      case 'leave_room':
        this.leaveRoom(client, message.room);
        break;
      case 'message':
        this.broadcastToRoom(message.room, {
          type: 'message',
          from: client.userId,
          content: message.content,
          timestamp: Date.now()
        });
        break;
    }
  }

  private joinRoom(client: Client, roomId: string) {
    client.rooms.add(roomId);

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(client.userId);

    // Notify room
    this.broadcastToRoom(roomId, {
      type: 'user_joined',
      userId: client.userId,
      room: roomId
    });
  }

  private broadcastToRoom(roomId: string, message: any, excludeUserId?: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.forEach(userId => {
      if (userId === excludeUserId) return;

      const client = this.clients.get(userId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        this.send(client.ws, message);
      }
    });
  }

  private send(ws: WebSocket, message: any) {
    ws.send(JSON.stringify(message));
  }
}
```

### Server-Sent Events (Node.js)

```typescript
import express from 'express';

const app = express();

// Store connected clients
const clients: Map<string, express.Response> = new Map();

// SSE endpoint
app.get('/events', (req, res) => {
  const userId = req.query.userId as string;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');  // Disable nginx buffering

  // Send initial connection event
  res.write(`event: connected\ndata: {"userId": "${userId}"}\n\n`);

  // Store client
  clients.set(userId, res);

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(userId);
  });
});

// Send event to specific user
function sendToUser(userId: string, event: string, data: any) {
  const client = clients.get(userId);
  if (client) {
    client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

// Send event to all users
function broadcast(event: string, data: any) {
  clients.forEach((client) => {
    client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  });
}
```

### Client-Side (React)

```typescript
import { useEffect, useState, useCallback, useRef } from 'react';

interface UseWebSocketOptions {
  url: string;
  token: string;
  onMessage?: (message: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

function useWebSocket({ url, token, onMessage, onConnect, onDisconnect }: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    const ws = new WebSocket(`${url}?token=${token}`);

    ws.onopen = () => {
      setIsConnected(true);
      onConnect?.();
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      onMessage?.(message);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      onDisconnect?.();

      // Reconnect unless intentionally closed
      if (event.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [url, token, onMessage, onConnect, onDisconnect]);

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimeoutRef.current);
    wsRef.current?.close(1000, 'User disconnected');
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { isConnected, send, disconnect };
}

// Usage
function ChatComponent() {
  const [messages, setMessages] = useState<Message[]>([]);

  const { isConnected, send } = useWebSocket({
    url: 'wss://api.example.com/ws',
    token: authToken,
    onMessage: (message) => {
      if (message.type === 'message') {
        setMessages(prev => [...prev, message]);
      }
    }
  });

  const sendMessage = (content: string) => {
    send({ type: 'message', room: 'general', content });
  };

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {/* ... */}
    </div>
  );
}
```

---

## Presence (Online Status)

### Implementation

```typescript
class PresenceManager {
  private redis: Redis;
  private presenceTTL = 60;  // seconds

  async setOnline(userId: string, metadata?: any) {
    const key = `presence:${userId}`;
    await this.redis.setex(key, this.presenceTTL, JSON.stringify({
      status: 'online',
      lastSeen: Date.now(),
      ...metadata
    }));
  }

  async setOffline(userId: string) {
    const key = `presence:${userId}`;
    await this.redis.del(key);
  }

  async heartbeat(userId: string) {
    const key = `presence:${userId}`;
    await this.redis.expire(key, this.presenceTTL);
  }

  async getPresence(userId: string): Promise<PresenceStatus | null> {
    const key = `presence:${userId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async getOnlineUsers(userIds: string[]): Promise<string[]> {
    const pipeline = this.redis.pipeline();
    userIds.forEach(id => pipeline.exists(`presence:${id}`));
    const results = await pipeline.exec();

    return userIds.filter((_, i) => results?.[i]?.[1] === 1);
  }
}
```

### Presence with Pub/Sub

```typescript
// Publish presence changes
async function publishPresenceChange(userId: string, status: 'online' | 'offline') {
  await redis.publish('presence', JSON.stringify({
    userId,
    status,
    timestamp: Date.now()
  }));
}

// Subscribe to presence changes
const subscriber = redis.duplicate();
subscriber.subscribe('presence');

subscriber.on('message', (channel, message) => {
  const { userId, status } = JSON.parse(message);
  // Broadcast to relevant WebSocket clients
  broadcastPresenceUpdate(userId, status);
});
```

---

## Scaling WebSockets

### Architecture

```
┌─────────────────────────────────────────────┐
│              SCALED ARCHITECTURE            │
├─────────────────────────────────────────────┤
│                                             │
│         Load Balancer (sticky sessions)     │
│                    │                        │
│         ┌──────────┼──────────┐            │
│         ▼          ▼          ▼            │
│      Server 1   Server 2   Server 3        │
│         │          │          │            │
│         └──────────┼──────────┘            │
│                    ▼                        │
│            Redis Pub/Sub                    │
│           (message broker)                  │
│                                             │
└─────────────────────────────────────────────┘
```

### Redis Pub/Sub for Cross-Server Communication

```typescript
import Redis from 'ioredis';

const publisher = new Redis();
const subscriber = new Redis();

class ScaledWebSocketServer {
  private serverId = process.env.SERVER_ID || 'server-1';

  constructor() {
    // Subscribe to messages from other servers
    subscriber.subscribe('ws:broadcast', 'ws:room:*', 'ws:user:*');

    subscriber.on('message', (channel, message) => {
      const data = JSON.parse(message);

      // Don't process our own messages
      if (data.serverId === this.serverId) return;

      if (channel === 'ws:broadcast') {
        this.localBroadcast(data.payload);
      } else if (channel.startsWith('ws:room:')) {
        const roomId = channel.replace('ws:room:', '');
        this.localBroadcastToRoom(roomId, data.payload);
      } else if (channel.startsWith('ws:user:')) {
        const userId = channel.replace('ws:user:', '');
        this.localSendToUser(userId, data.payload);
      }
    });
  }

  // Send to user (any server)
  async sendToUser(userId: string, message: any) {
    // Try local first
    if (this.localSendToUser(userId, message)) {
      return;
    }

    // Publish for other servers
    await publisher.publish(`ws:user:${userId}`, JSON.stringify({
      serverId: this.serverId,
      payload: message
    }));
  }

  // Broadcast to room (all servers)
  async broadcastToRoom(roomId: string, message: any) {
    // Send to local clients
    this.localBroadcastToRoom(roomId, message);

    // Publish for other servers
    await publisher.publish(`ws:room:${roomId}`, JSON.stringify({
      serverId: this.serverId,
      payload: message
    }));
  }
}
```

---

## Message Queuing for Reliability

```typescript
import { Queue, Worker } from 'bullmq';

// Queue for outgoing messages
const messageQueue = new Queue('messages', {
  connection: { host: 'redis', port: 6379 }
});

// Add message to queue
async function queueMessage(userId: string, message: any) {
  await messageQueue.add('send', {
    userId,
    message,
    timestamp: Date.now()
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  });
}

// Worker to process messages
const worker = new Worker('messages', async (job) => {
  const { userId, message } = job.data;

  const client = clients.get(userId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
    return { delivered: true };
  } else {
    // Store for later delivery
    await storeUndeliveredMessage(userId, message);
    return { delivered: false, stored: true };
  }
}, { connection: { host: 'redis', port: 6379 } });
```

---

## Commands

```bash
# WebSocket testing with wscat
npm install -g wscat
wscat -c wss://api.example.com/ws

# Load testing with Artillery
npm install -g artillery
artillery run websocket-load-test.yml

# Monitor WebSocket connections
ss -t | grep :8080 | wc -l

# Redis pub/sub test
redis-cli SUBSCRIBE ws:broadcast
redis-cli PUBLISH ws:broadcast '{"test": true}'
```

---

## Resources

- **Socket.io**: [socket.io/docs](https://socket.io/docs/)
- **ws (Node.js)**: [github.com/websockets/ws](https://github.com/websockets/ws)
- **WebSocket API**: [developer.mozilla.org/WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- **SSE**: [developer.mozilla.org/EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)

---

## Examples

### Example 1: WebSocket Chat Server

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
    
    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_json(message)
    
    def disconnect(self, websocket: WebSocket, room_id: str):
        self.active_connections[room_id].remove(websocket)

manager = ConnectionManager()

@app.websocket("/ws/chat/{room_id}")
async def chat_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Broadcast to all in room
            await manager.broadcast(room_id, {
                "type": "message",
                "user": data["user"],
                "text": data["text"],
                "timestamp": datetime.utcnow().isoformat()
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
