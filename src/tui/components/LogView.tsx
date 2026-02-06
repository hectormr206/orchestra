import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";

export interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "warning" | "error" | "debug";
  message: string;
  agent?: string;
}

interface LogViewProps {
  logs: LogEntry[];
  maxLines?: number;
  showTimestamp?: boolean;
  enableScroll?: boolean; // Nueva prop para habilitar scroll
}

export const LogView: React.FC<LogViewProps> = ({
  logs,
  maxLines = 15,
  showTimestamp = true,
  enableScroll = true,
}) => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Auto-scroll al final cuando hay nuevos logs (si estábamos al final)
  useEffect(() => {
    if (isAtBottom) {
      setScrollOffset(Math.max(0, logs.length - maxLines));
    }
  }, [logs.length, maxLines, isAtBottom]);

  // Manejar scroll con flechas arriba/abajo
  useInput((input, key) => {
    if (!enableScroll) return;

    if (key.upArrow) {
      setScrollOffset((prev) => {
        const newOffset = Math.max(0, prev - 1);
        setIsAtBottom(newOffset >= logs.length - maxLines);
        return newOffset;
      });
    } else if (key.downArrow) {
      setScrollOffset((prev) => {
        const maxOffset = Math.max(0, logs.length - maxLines);
        const newOffset = Math.min(maxOffset, prev + 1);
        setIsAtBottom(newOffset >= maxOffset);
        return newOffset;
      });
    } else if (key.pageUp) {
      setScrollOffset((prev) => {
        const newOffset = Math.max(0, prev - maxLines);
        setIsAtBottom(newOffset >= logs.length - maxLines);
        return newOffset;
      });
    } else if (key.pageDown) {
      setScrollOffset((prev) => {
        const maxOffset = Math.max(0, logs.length - maxLines);
        const newOffset = Math.min(maxOffset, prev + maxLines);
        setIsAtBottom(newOffset >= maxOffset);
        return newOffset;
      });
    } else if (input === "g") {
      // 'g' para ir al inicio
      setScrollOffset(0);
      setIsAtBottom(false);
    } else if (input === "G") {
      // 'G' para ir al final
      const maxOffset = Math.max(0, logs.length - maxLines);
      setScrollOffset(maxOffset);
      setIsAtBottom(true);
    }
  });

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "info":
        return "blue";
      case "success":
        return "green";
      case "warning":
        return "yellow";
      case "error":
        return "red";
      case "debug":
        return "gray";
    }
  };

  const getLevelIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "info":
        return "ℹ";
      case "success":
        return "✓";
      case "warning":
        return "⚠";
      case "error":
        return "✗";
      case "debug":
        return "·";
    }
  };

  const visibleLogs = enableScroll
    ? logs.slice(scrollOffset, scrollOffset + maxLines)
    : logs.slice(-maxLines);

  const totalLogs = logs.length;
  const canScrollUp = scrollOffset > 0;
  const canScrollDown = scrollOffset < totalLogs - maxLines;
  const scrollPercentage =
    totalLogs > maxLines
      ? Math.round((scrollOffset / (totalLogs - maxLines)) * 100)
      : 100;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      padding={1}
      height={maxLines + 3}
    >
      <Box justifyContent="space-between">
        <Text bold color="white">
          Logs
        </Text>
        {enableScroll && totalLogs > maxLines && (
          <Text color="cyan" dimColor>
            {canScrollUp && "↑"} {scrollOffset + 1}-
            {Math.min(scrollOffset + maxLines, totalLogs)}/{totalLogs} (
            {scrollPercentage}%) {canScrollDown && "↓"}
          </Text>
        )}
      </Box>
      <Text color="gray">{"─".repeat(50)}</Text>
      {visibleLogs.length === 0 ? (
        <Text color="gray" dimColor>
          No logs yet...
        </Text>
      ) : (
        visibleLogs.map((log, index) => (
          <Box key={scrollOffset + index}>
            {showTimestamp && (
              <Text color="gray" dimColor>
                {log.timestamp.split("T")[1]?.substring(0, 8) ||
                  log.timestamp}{" "}
              </Text>
            )}
            <Text color={getLevelColor(log.level)}>
              {getLevelIcon(log.level)}{" "}
            </Text>
            {log.agent && <Text color="cyan">[{log.agent}] </Text>}
            <Text color="white">{log.message}</Text>
          </Box>
        ))
      )}
      {enableScroll && totalLogs > maxLines && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            [↑/↓: Scroll | PgUp/PgDn: Page | g: Top | G: Bottom]
          </Text>
        </Box>
      )}
    </Box>
  );
};
