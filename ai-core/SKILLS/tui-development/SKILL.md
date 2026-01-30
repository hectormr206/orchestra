---
name: tui-development
description: "Patterns for terminal user interfaces with React and Ink. Components, state, layouts, performance optimization, and cross-platform compatibility. Trigger: Building CLI apps, terminal UI, React Ink, TUI development."
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [frontend]
  auto_invoke:
    ["TUI", "terminal UI", "CLI interface", "React Ink", "terminal app"]
  tags: [tui, terminal, cli, react, ink]
---

# TUI Development

Patterns for building terminal user interfaces with React and Ink.

## When to Use

- Building interactive CLI applications
- Creating terminal dashboards or monitoring tools
- Developing AI agent interfaces
- Building developer tools with rich terminal output
- Creating log viewers, progress trackers, or status displays

## Critical Patterns

> **ALWAYS**:
>
> - Use React hooks for state management
> - Handle terminal resize events
> - Implement proper cleanup on exit
> - Support both Unicode and ASCII fallbacks
> - Test in multiple terminal emulators

> **NEVER**:
>
> - Trigger excessive re-renders
> - Block the main thread with heavy computations
> - Assume terminal supports all Unicode characters
> - Hard-code terminal dimensions
> - Ignore keyboard interrupt signals (Ctrl+C)

---

## Component Patterns

### Progress Bar

```tsx
import React from "react";
import { Box, Text } from "ink";

interface ProgressBarProps {
  value: number; // 0-100
  width?: number;
  showPercentage?: boolean;
  label?: string;
  color?: string;
}

function ProgressBar({
  value,
  width = 40,
  showPercentage = true,
  label,
  color = "green",
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const filled = Math.round((clampedValue / 100) * width);
  const empty = width - filled;

  return (
    <Box flexDirection="column">
      {label && <Text dimColor>{label}</Text>}
      <Box>
        <Text color={color}>{"█".repeat(filled)}</Text>
        <Text dimColor>{"░".repeat(empty)}</Text>
        {showPercentage && <Text> {Math.round(clampedValue)}%</Text>}
      </Box>
    </Box>
  );
}

// Animated version with spinner
function AnimatedProgress({ value, label }: ProgressBarProps) {
  const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const [frame, setFrame] = React.useState(0);

  React.useEffect(() => {
    if (value < 100) {
      const timer = setInterval(() => {
        setFrame((f) => (f + 1) % spinnerFrames.length);
      }, 80);
      return () => clearInterval(timer);
    }
  }, [value]);

  return (
    <Box>
      <Text color={value < 100 ? "yellow" : "green"}>
        {value < 100 ? spinnerFrames[frame] : "✓"}
      </Text>
      <Text> </Text>
      <ProgressBar value={value} label={label} />
    </Box>
  );
}
```

### Log Viewer

```tsx
import React, { useRef, useEffect } from "react";
import { Box, Text, useStdout } from "ink";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

interface LogViewerProps {
  logs: LogEntry[];
  maxLines?: number;
  showTimestamp?: boolean;
}

function LogViewer({
  logs,
  maxLines = 10,
  showTimestamp = true,
}: LogViewerProps) {
  const { stdout } = useStdout();
  const height = maxLines || Math.floor(stdout.rows * 0.5);
  const visibleLogs = logs.slice(-height);

  const levelColors: Record<string, string> = {
    info: "blue",
    warn: "yellow",
    error: "red",
    debug: "gray",
  };

  const levelIcons: Record<string, string> = {
    info: "ℹ",
    warn: "⚠",
    error: "✗",
    debug: "○",
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="gray"
      padding={1}
    >
      <Text bold>Logs ({logs.length})</Text>
      <Box flexDirection="column" marginTop={1}>
        {visibleLogs.map((log) => (
          <Box key={log.id}>
            <Text color={levelColors[log.level]}>{levelIcons[log.level]}</Text>
            {showTimestamp && (
              <Text dimColor> [{formatTime(log.timestamp)}]</Text>
            )}
            <Text> {log.message}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function formatTime(date: Date): string {
  return date.toISOString().substr(11, 8);
}
```

### Status Indicator

```tsx
import React from "react";
import { Box, Text } from "ink";

type Status = "idle" | "running" | "success" | "error" | "warning";

interface StatusIndicatorProps {
  status: Status;
  label: string;
  detail?: string;
}

function StatusIndicator({ status, label, detail }: StatusIndicatorProps) {
  const configs: Record<Status, { icon: string; color: string }> = {
    idle: { icon: "○", color: "gray" },
    running: { icon: "◐", color: "yellow" },
    success: { icon: "●", color: "green" },
    error: { icon: "●", color: "red" },
    warning: { icon: "●", color: "yellow" },
  };

  const { icon, color } = configs[status];

  // Animate running status
  const [animatedIcon, setAnimatedIcon] = React.useState(icon);

  React.useEffect(() => {
    if (status === "running") {
      const frames = ["◐", "◓", "◑", "◒"];
      let i = 0;
      const timer = setInterval(() => {
        setAnimatedIcon(frames[i % frames.length]);
        i++;
      }, 150);
      return () => clearInterval(timer);
    } else {
      setAnimatedIcon(icon);
    }
  }, [status, icon]);

  return (
    <Box>
      <Text color={color}>{animatedIcon}</Text>
      <Text> {label}</Text>
      {detail && <Text dimColor> ({detail})</Text>}
    </Box>
  );
}
```

### Input Handler

```tsx
import React, { useState } from "react";
import { Box, Text, useInput, useApp } from "ink";

interface InputHandlerProps {
  onSubmit: (value: string) => void;
  placeholder?: string;
  prefix?: string;
}

function TextInput({
  onSubmit,
  placeholder = "",
  prefix = "> ",
}: InputHandlerProps) {
  const [value, setValue] = useState("");
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.escape) {
      exit();
      return;
    }

    if (key.return) {
      onSubmit(value);
      setValue("");
      return;
    }

    if (key.backspace || key.delete) {
      setValue((v) => v.slice(0, -1));
      return;
    }

    if (!key.ctrl && !key.meta && input) {
      setValue((v) => v + input);
    }
  });

  return (
    <Box>
      <Text color="cyan">{prefix}</Text>
      <Text>{value || <Text dimColor>{placeholder}</Text>}</Text>
      <Text color="cyan">▋</Text>
    </Box>
  );
}
```

---

## State Management

### Global State with Context

```tsx
import React, { createContext, useContext, useReducer } from "react";

// Types
interface AppState {
  status: "idle" | "running" | "complete";
  logs: LogEntry[];
  progress: number;
  currentTask: string | null;
}

type Action =
  | { type: "SET_STATUS"; payload: AppState["status"] }
  | { type: "ADD_LOG"; payload: LogEntry }
  | { type: "SET_PROGRESS"; payload: number }
  | { type: "SET_TASK"; payload: string | null };

// Context
const StateContext = createContext<AppState | null>(null);
const DispatchContext = createContext<React.Dispatch<Action> | null>(null);

// Reducer
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_STATUS":
      return { ...state, status: action.payload };
    case "ADD_LOG":
      return { ...state, logs: [...state.logs, action.payload] };
    case "SET_PROGRESS":
      return { ...state, progress: action.payload };
    case "SET_TASK":
      return { ...state, currentTask: action.payload };
    default:
      return state;
  }
}

// Provider
function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    status: "idle",
    logs: [],
    progress: 0,
    currentTask: null,
  });

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// Hooks
function useAppState() {
  const state = useContext(StateContext);
  if (!state) throw new Error("useAppState must be used within AppProvider");
  return state;
}

function useAppDispatch() {
  const dispatch = useContext(DispatchContext);
  if (!dispatch)
    throw new Error("useAppDispatch must be used within AppProvider");
  return dispatch;
}

// Usage
function Dashboard() {
  const { status, progress, logs } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <Box flexDirection="column">
      <StatusIndicator status={status} label="System Status" />
      <ProgressBar value={progress} />
      <LogViewer logs={logs} />
    </Box>
  );
}
```

---

## Layout Patterns

### Responsive Layout

```tsx
import React from "react";
import { Box, Text, useStdout } from "ink";

function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = React.useState({
    width: stdout.columns || 80,
    height: stdout.rows || 24,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: stdout.columns || 80,
        height: stdout.rows || 24,
      });
    };

    stdout.on("resize", handleResize);
    return () => stdout.off("resize", handleResize);
  }, [stdout]);

  const isNarrow = dimensions.width < 60;
  const isShort = dimensions.height < 15;

  return (
    <Box
      flexDirection={isNarrow ? "column" : "row"}
      width={dimensions.width}
      height={isShort ? undefined : dimensions.height}
    >
      {children}
    </Box>
  );
}
```

### Panel Layout

```tsx
function PanelLayout() {
  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="single" borderColor="cyan" justifyContent="center">
        <Text bold color="cyan">
          Orchestra - AI Orchestrator
        </Text>
      </Box>

      {/* Main content */}
      <Box flexGrow={1} flexDirection="row">
        {/* Left panel */}
        <Box flexDirection="column" width="30%" borderStyle="single">
          <Text bold underline>
            Agents
          </Text>
          <StatusIndicator status="success" label="Architect" />
          <StatusIndicator status="running" label="Executor" />
          <StatusIndicator status="idle" label="Auditor" />
        </Box>

        {/* Right panel */}
        <Box flexDirection="column" flexGrow={1} borderStyle="single">
          <Text bold underline>
            Output
          </Text>
          <LogViewer logs={[]} maxLines={10} />
        </Box>
      </Box>

      {/* Footer */}
      <Box borderStyle="single" borderColor="gray">
        <Text dimColor>Press q to quit | ↑↓ to scroll | Enter to submit</Text>
      </Box>
    </Box>
  );
}
```

---

## Performance Optimization

### Memoization

```tsx
import React, { memo, useMemo, useCallback } from "react";

// Memoize expensive components
const MemoizedLogViewer = memo(LogViewer, (prev, next) => {
  // Only re-render if logs actually changed
  return (
    prev.logs.length === next.logs.length &&
    prev.logs[prev.logs.length - 1]?.id === next.logs[next.logs.length - 1]?.id
  );
});

// Memoize derived data
function Dashboard({ logs }: { logs: LogEntry[] }) {
  const errorCount = useMemo(
    () => logs.filter((l) => l.level === "error").length,
    [logs],
  );

  const recentLogs = useMemo(() => logs.slice(-50), [logs]);

  // Memoize callbacks
  const handleLog = useCallback((entry: LogEntry) => {
    // Handle new log
  }, []);

  return (
    <Box>
      <Text>Errors: {errorCount}</Text>
      <MemoizedLogViewer logs={recentLogs} />
    </Box>
  );
}
```

### Animation Throttling

```tsx
import React, { useState, useEffect, useRef } from "react";

function useThrottledAnimation(fps: number = 15) {
  const frameMs = 1000 / fps;
  const lastFrame = useRef(Date.now());
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    let animationId: NodeJS.Timeout;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - lastFrame.current;

      if (elapsed >= frameMs) {
        lastFrame.current = now;
        setFrame((f) => f + 1);
      }

      animationId = setTimeout(animate, Math.max(0, frameMs - elapsed));
    };

    animate();
    return () => clearTimeout(animationId);
  }, [frameMs]);

  return frame;
}

// Usage
function Spinner() {
  const frame = useThrottledAnimation(10);
  const spinners = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

  return <Text>{spinners[frame % spinners.length]}</Text>;
}
```

### Batched Updates

```tsx
import React, { useRef, useCallback } from "react";

function useBatchedUpdates<T>(
  onBatch: (items: T[]) => void,
  batchSize: number = 10,
  flushInterval: number = 100,
) {
  const batchRef = useRef<T[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  const flush = useCallback(() => {
    if (batchRef.current.length > 0) {
      onBatch([...batchRef.current]);
      batchRef.current = [];
    }
  }, [onBatch]);

  const add = useCallback(
    (item: T) => {
      batchRef.current.push(item);

      if (batchRef.current.length >= batchSize) {
        flush();
      } else if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          flush();
          timerRef.current = undefined;
        }, flushInterval);
      }
    },
    [batchSize, flush, flushInterval],
  );

  return { add, flush };
}
```

---

## Cross-Platform Compatibility

### Unicode Fallbacks

```tsx
const ICONS = {
  // Try emoji first, fall back to ASCII
  success: process.platform === "win32" && !supportsUnicode() ? "[OK]" : "✓",
  error: process.platform === "win32" && !supportsUnicode() ? "[X]" : "✗",
  warning: process.platform === "win32" && !supportsUnicode() ? "[!]" : "⚠",
  spinner:
    process.platform === "win32" && !supportsUnicode()
      ? ["-", "\\", "|", "/"]
      : ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  progress: {
    filled: process.platform === "win32" && !supportsUnicode() ? "#" : "█",
    empty: process.platform === "win32" && !supportsUnicode() ? "-" : "░",
  },
};

function supportsUnicode(): boolean {
  return (
    process.env.TERM_PROGRAM !== "Apple_Terminal" &&
    !process.env.WT_SESSION &&
    process.env.TERM !== "linux"
  );
}
```

### Terminal Size Detection

```tsx
function useTerminalSize() {
  const { stdout } = useStdout();
  const [size, setSize] = useState({
    columns: stdout.columns || 80,
    rows: stdout.rows || 24,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        columns: stdout.columns || 80,
        rows: stdout.rows || 24,
      });
    };

    stdout.on("resize", handleResize);
    process.on("SIGWINCH", handleResize);

    return () => {
      stdout.off("resize", handleResize);
      process.off("SIGWINCH", handleResize);
    };
  }, [stdout]);

  return size;
}
```

---

## Checklist

Before deploying TUI application:

- [ ] Progress indicators for long operations?
- [ ] Clear status indicators for different states?
- [ ] Keyboard shortcuts documented?
- [ ] Graceful exit handling (Ctrl+C, Ctrl+D)?
- [ ] Terminal resize handling?
- [ ] ASCII fallbacks for limited terminals?
- [ ] Memoization for expensive renders?
- [ ] Animation throttling to prevent CPU usage?
- [ ] State management without prop drilling?
- [ ] Error boundaries for component crashes?

---

## Related Skills

- `session-persistence` - Persist TUI state between runs
- `error-handling` - Handle TUI errors gracefully
- `observability` - Log TUI interactions
- `accessibility` - Keyboard navigation patterns

---

## Commands

```bash
# Install Ink and dependencies
npm install ink ink-spinner ink-text-input

# Run TUI in development
npm run dev

# Test in different terminals
TERM=xterm-256color node app.js
TERM=linux node app.js  # Test ASCII fallback

# Check terminal capabilities
tput colors  # Number of colors supported
tput cols    # Terminal width
tput lines   # Terminal height
```
