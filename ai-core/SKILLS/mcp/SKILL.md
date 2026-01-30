# MCP (Model Context Protocol)

> **Model Context Protocol** - Open protocol for connecting AI applications to external systems and data sources.
> Like USB-C for AI apps - standardized way to connect LLMs with tools, resources, and workflows.

## Overview

MCP provides a standardized protocol for AI applications to connect to:
- **Data sources**: Local files, databases, APIs
- **Tools**: Search engines, calculators, custom functions
- **Workflows**: Specialized prompts and automation

### Key Benefits

| Role | Benefits |
|------|----------|
| **Developers** | Reduced development time and complexity when building AI integrations |
| **AI Applications** | Access to ecosystem of data sources, tools, and apps |
| **End Users** | More capable AI that can access data and take actions |

## Architecture

### Participants

```
┌─────────────────────────────────────────────────────────────┐
│                         MCP Host                             │
│              (Claude Desktop, VS Code, etc.)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├────────────────────────────────┐
                     │                                │
              ┌──────▼──────┐                 ┌──────▼──────┐
              │  MCP Client │                 │  MCP Client │
              └──────┬──────┘                 └──────┬──────┘
                     │                                │
            (STDIO or HTTP)                  (STDIO or HTTP)
                     │                                │
              ┌──────▼──────┐                 ┌──────▼──────┐
              │ MCP Server  │                 │ MCP Server  │
              │ (Filesystem)│                 │  (Sentry)   │
              └─────────────┘                 └─────────────┘
```

### Layers

#### Data Layer (JSON-RPC 2.0)
- **Lifecycle management**: Initialization, capability negotiation, termination
- **Server features**: Tools, resources, prompts
- **Client features**: Sampling, roots, elicitation, logging
- **Utilities**: Notifications, progress tracking

#### Transport Layer
- **STDIO**: Standard input/output for local processes
- **Streamable HTTP**: HTTP POST + Server-Sent Events for remote servers

## Server Primitives

### Tools
Executable functions that AI applications can invoke:

```typescript
// Example: Weather tool
server.registerTool(
  "get_forecast",
  {
    description: "Get weather forecast for a location",
    inputSchema: {
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    },
  },
  async ({ latitude, longitude }) => {
    // Fetch weather data
    return { content: [{ type: "text", text: forecast }] };
  }
);
```

### Resources
Data sources that provide contextual information:

```typescript
server.registerResource(
  "database_schema",
  {
    uri: "db://schema",
    name: "Database Schema",
    description: "Current database structure",
    mimeType: "application/json",
  },
  async () => {
    return { contents: [{ uri: "db://schema", text: schema }] };
  }
);
```

### Prompts
Reusable templates for structured interactions:

```typescript
server.registerPrompt(
  "analyze_data",
  {
    name: "Analyze Database",
    description: "Few-shot examples for data analysis",
    arguments: [
      {
        name: "table",
        description: "Table to analyze",
        required: true,
      },
    ],
  },
  async ({ table }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Analyze ${table} using these patterns...`,
          },
        },
      ],
    };
  }
);
```

## Client Primitives

### Sampling
Servers can request LLM completions from the client's AI application:

```typescript
const result = await client.requestSampling({
  messages: [{ role: "user", content: "Summarize this data" }],
  model: "claude-3-5-sonnet-20241022",
  maxTokens: 500,
});
```

### Elicitation
Servers can request additional information from users:

```typescript
const response = await client.requestElicitation({
  title: "Confirm Action",
  description: "Delete 100 records from database",
  type: "confirmation",
});
```

### Logging
Servers can send log messages to clients:

```typescript
client.sendLog({
  level: "info",
  data: "Connected to database successfully",
  logger: "database",
});
```

## SDK Reference

### TypeScript SDK

```bash
npm install @modelcontextprotocol/sdk zod
```

**STDIO Server**:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "my-server",
  version: "1.0.0",
});

server.registerTool(
  "add_numbers",
  {
    description: "Add two numbers",
    inputSchema: {
      a: z.number(),
      b: z.number(),
    },
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: `${a} + b = ${a + b}` }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

**HTTP Server**:

```typescript
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

const app = express();
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
});

await server.connect(transport);

app.post("/", async (req, res) => {
  await transport.handleRequest(req, res, req.body);
});

app.listen(3000);
```

### Python SDK (FastMCP)

```bash
uv add "mcp[cli]" httpx
```

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("weather")

@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Get weather forecast for a location."""
    # Fetch weather data
    return f"Weather at {latitude}, {longitude}: ..."

mcp.run(transport="stdio")
```

### Java/Kotlin SDK (Spring AI)

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-server</artifactId>
</dependency>
```

```java
@Service
public class WeatherService {
    @Tool(description = "Get weather forecast")
    public String getForecast(double latitude, double longitude) {
        // Implementation
        return forecast;
    }
}
```

### C# SDK (ASP.NET Core)

```bash
dotnet add package ModelContextProtocol
```

```csharp
builder.Services.AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly();

[McpServerTool]
public static string GetForecast(
    [Description("Latitude")] double latitude,
    [Description("Longitude")] double longitude)
{
    // Implementation
    return forecast;
}
```

### Rust SDK (rmcp)

```toml
[dependencies]
rmcp = { version = "0.3", features = ["server", "macros", "transport-io"] }
```

```rust
use rmcp::tool;

#[tool(description = "Get weather forecast")]
async fn get_forecast(
    latitude: f32,
    longitude: f32,
) -> String {
    // Implementation
    forecast
}
```

## Security & Authorization

### OAuth 2.1 Authorization

**Server Metadata Endpoint** (`/.well-known/oauth-protected-resource`):

```json
{
  "resource": "http://localhost:3000/",
  "authorization_servers": ["http://localhost:8080/realms/master/"],
  "scopes_supported": ["mcp:tools"],
  "bearer_methods_supported": ["header"]
}
```

**Token Introspection**:

```typescript
async function verifyAccessToken(token: string) {
  const response = await fetch(introspectionEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      token,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  const data = await response.json();

  if (!data.active) {
    throw new Error("Inactive token");
  }

  return {
    token,
    clientId: data.client_id,
    scopes: data.scope?.split(" ") || [],
    expiresAt: data.exp,
  };
}
```

**Authentication Middleware**:

```typescript
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";

app.use(requireBearerAuth({
  verifier: tokenVerifier,
  requiredScopes: ["mcp:tools"],
}));
```

### Security Best Practices

1. **User Consent and Control**
   - Explicit consent before data access
   - Clear UI for reviewing activities
   - User retains control over shared data

2. **Data Privacy**
   - No data transmission without consent
   - Appropriate access controls
   - Protect PII and sensitive data

3. **Tool Safety**
   - Treat tool descriptions as untrusted
   - Explicit consent before tool invocation
   - Clear understanding of tool behavior

4. **LLM Sampling Controls**
   - User approval for sampling requests
   - Control over prompts and results
   - Limited server visibility

## Development Tools

### MCP Inspector

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

Testing tool for MCP servers:
- Explore available tools, resources, prompts
- Test tool execution
- Debug JSON-RPC messages
- Inspect capabilities

### Configuration (Claude Desktop)

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/absolute/path/to/weather/build/index.js"]
    },
    "database": {
      "command": "python",
      "args": ["/absolute/path/to/db_server.py"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432"
      }
    }
  }
}
```

## Logging Best Practices

### STDIO-Based Servers

❌ **BAD** - Writing to stdout corrupts JSON-RPC:

```python
print("Server started")  # DO NOT DO THIS
console.log("Processing")  # DO NOT DO THIS
```

✅ **GOOD** - Use stderr or proper logging:

```python
import logging
logging.info("Server started")  # ✅
```

```javascript
console.error("Processing");  // ✅
```

### HTTP-Based Servers

Standard output logging is fine (doesn't interfere with HTTP responses):

```javascript
console.log("Server started");  // ✅ OK for HTTP
```

## Transport Comparison

| Feature | STDIO | Streamable HTTP |
|---------|-------|-----------------|
| **Use case** | Local processes | Remote servers |
| **Performance** | Best (no network overhead) | Good (HTTP) |
| **Authentication** | Environment-based | OAuth, API keys, Bearer tokens |
| **Discovery** | Command-line | HTTP endpoints |
| **Multi-client** | No (single client) | Yes (many clients) |

## Lifecycle Management

### Initialization Sequence

1. **Client sends `initialize` request**
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "initialize",
     "params": {
       "protocolVersion": "2025-11-25",
       "capabilities": {
         "tools": {},
         "resources": {}
       }
     }
   }
   ```

2. **Server responds with capabilities**
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "result": {
       "protocolVersion": "2025-11-25",
       "capabilities": {
         "tools": { "listChanged": true },
         "resources": { "subscribe": true }
       },
       "serverInfo": {
         "name": "weather-server",
         "version": "1.0.0"
       }
     }
   }
   ```

3. **Client sends `initialized` notification**
   ```json
   {
     "jsonrpc": "2.0",
     "method": "notifications/initialized"
   }
   ```

## Common Patterns

### Database Integration Server

```python
from mcp.server.fastmcp import FastMCP
import asyncpg

mcp = FastMCP("database")

@mcp.tool()
async def query_database(sql: str) -> str:
    """Execute SQL query (read-only)."""
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        results = await conn.fetch(sql)
        return json.dumps([dict(r) for r in results])
    finally:
        await conn.close()

@mcp.resource()
async def schema() -> str:
    """Get database schema."""
    # Return schema information
    return schema_json

mcp.run(transport="stdio")
```

### API Integration Server

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({ name: "github", version: "1.0.0" });

server.registerTool(
  "create_issue",
  {
    description: "Create GitHub issue",
    inputSchema: {
      repo: z.string(),
      title: z.string(),
      body: z.string(),
    },
  },
  async ({ repo, title, body }) => {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, body }),
      }
    );
    return {
      content: [{ type: "text", text: await response.text() }],
    };
  }
);
```

### Filesystem Server

```typescript
server.registerTool(
  "read_file",
  {
    description: "Read file contents",
    inputSchema: {
      path: z.string().describe("File path"),
    },
  },
  async ({ path }) => {
    const content = await fs.readFile(path, "utf-8");
    return {
      content: [{ type: "text", text: content }],
    };
  }
);
```

## Notifications

### Server → Client Notifications

```typescript
// Tool list changed
server.sendNotification({
  method: "notifications/tools/list_changed",
});

// Resource updated
server.sendNotification({
  method: "notifications/resources/updated",
  params: { uri: "db://schema" },
});

// Progress update
server.sendNotification({
  method: "notifications/progress",
  params: {
    progressToken: "123",
    progress: 0.5,
    message: "Halfway done",
  },
});
```

## Utilities

### Progress Tracking

```typescript
server.registerTool(
  "long_operation",
  { inputSchema: {} },
  async (params, extra) => {
    const { progressToken } = extra;

    await server.sendNotification({
      method: "notifications/progress",
      params: {
        progressToken,
        progress: 0.25,
      },
    });

    // Continue operation...
  }
);
```

### Cancellation

```typescript
let cancelled = false;

server.registerTool(
  "cancellable_task",
  { inputSchema: {} },
  async (params, extra) => {
    const { requestId } = extra;

    const checkCancelled = () => {
      if (cancelled) throw new Error("Cancelled by user");
    };

    for (let i = 0; i < 100; i++) {
      checkCancelled();
      await processItem(i);
    }
  }
);
```

## Troubleshooting

### Server Not Showing Up

1. Check configuration file syntax
2. Use absolute paths (not relative)
3. Restart host application completely
4. Check logs: `~/Library/Logs/Claude/mcp*.log`

### Tool Calls Failing

1. Verify server builds and runs without errors
2. Check input schema matches request
3. Review server logs for errors
4. Test with MCP Inspector

### STDIO Server Issues

1. Ensure no stdout output (use stderr)
2. Check JSON-RPC message format
3. Verify process exits cleanly
4. Test with simple echo server first

### HTTP Server Issues

1. Verify CORS headers
2. Check authentication middleware
3. Ensure session management
4. Test endpoint with curl

## Reference Links

- **Official Docs**: https://modelcontextprotocol.io
- **Specification**: https://modelcontextprotocol.io/specification/2025-11-25
- **TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk
- **Python SDK**: https://github.com/modelcontextprotocol/python-sdk
- **MCP Inspector**: https://modelcontextprotocol.io/docs/tools/inspector

## Quick Start Checklist

- [ ] Choose transport (STDIO for local, HTTP for remote)
- [ ] Select SDK based on your language
- [ ] Implement tools/resources/prompts
- [ ] Add authentication if using HTTP
- [ ] Test with MCP Inspector
- [ ] Configure in host application
- [ ] Verify server appears in host UI
- [ ] Test tool execution
- [ ] Review logs for errors
