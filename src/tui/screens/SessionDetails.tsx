import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { SessionHistory } from "../../utils/sessionHistory.js";

interface SessionDetail {
  id: string;
  task: string;
  startTime: string;
  endTime?: string;
  status: "completed" | "failed" | "running" | "cancelled";
  files: Array<{
    path: string;
    status: "created" | "modified" | "deleted" | "error" | "failed" | "pending";
  }>;
  metrics: {
    duration: number;
    architectTime: number;
    executorTime: number;
    auditorTime: number;
    iterations: number;
    totalDuration?: number;
  };
  plan: string;
  logs: Array<{
    timestamp: string;
    level: string;
    message: string;
    agent?: string;
  }>;
}

interface SessionDetailsProps {
  sessionId: string;
  onBack: () => void;
}

export const SessionDetails: React.FC<SessionDetailsProps> = ({
  sessionId,
  onBack,
}) => {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const tabs = ["Overview", "Files", "Plan", "Logs"];
  const visibleLines = 20;

  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        setError(null);

        const history = new SessionHistory();
        await history.init();

        const sessionData = await history.getFullSession(sessionId);
        if (!sessionData) {
          setError("Session not found");
          return;
        }

        // Load plan
        let planContent = "";
        try {
          const planPath = `.orchestra/sessions/${sessionId}/plan.md`;
          const fs = await import("fs/promises");
          planContent = await fs.readFile(planPath, "utf-8");
        } catch {
          planContent = "Plan not available";
        }

        // Load logs
        const logs: any[] = [];
        try {
          const logPath = `.orchestra/sessions/${sessionId}/logs.json`;
          const fs = await import("fs/promises");
          const logContent = await fs.readFile(logPath, "utf-8");
          const logData = JSON.parse(logContent);
          logs.push(
            ...(Array.isArray(logData) ? logData : logData.entries || []),
          );
        } catch {
          // Logs not available
        }

        // Map session metrics to our expected format
        const metrics = sessionData.metrics
          ? {
              duration: sessionData.metrics.totalDuration || 0,
              architectTime: sessionData.metrics.architectDuration || 0,
              executorTime: sessionData.metrics.executorDuration || 0,
              auditorTime: sessionData.metrics.auditorDuration || 0,
              iterations: sessionData.metrics.iterations || 0,
              totalDuration: sessionData.metrics.totalDuration,
            }
          : {
              duration: 0,
              architectTime: 0,
              executorTime: 0,
              auditorTime: 0,
              iterations: 0,
            };

        setSession({
          id: sessionData.id,
          task: sessionData.task || "",
          startTime: sessionData.startTime || "",
          endTime: sessionData.endTime,
          status: sessionData.status || "unknown",
          files: sessionData.files || [],
          metrics,
          plan: planContent,
          logs,
        });
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  useInput((input, key) => {
    if (loading) return;

    if (key.escape || key.return) {
      onBack();
      return;
    }

    if (input === "q") {
      onBack();
      return;
    }

    if (key.leftArrow) {
      setCurrentTab((prev) => (prev - 1 + tabs.length) % tabs.length);
      setScrollOffset(0);
    }

    if (key.rightArrow) {
      setCurrentTab((prev) => (prev + 1) % tabs.length);
      setScrollOffset(0);
    }

    if (key.upArrow) {
      setScrollOffset((prev) => Math.max(0, prev - 1));
    }

    if (key.downArrow) {
      const maxScroll = getMaxScrollForTab();
      setScrollOffset((prev) => Math.min(maxScroll, prev + 1));
    }

    // Number keys to switch tabs
    if (/^[1-4]$/.test(input)) {
      setCurrentTab(parseInt(input) - 1);
      setScrollOffset(0);
    }
  });

  const getMaxScrollForTab = () => {
    if (!session) return 0;

    switch (tabs[currentTab]) {
      case "Overview":
        return 0;
      case "Files":
        return Math.max(0, session.files.length - visibleLines);
      case "Plan":
        return Math.max(0, session.plan.split("\n").length - visibleLines);
      case "Logs":
        return Math.max(0, session.logs.length - visibleLines);
      default:
        return 0;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "green";
      case "failed":
        return "red";
      case "running":
        return "yellow";
      case "cancelled":
        return "yellow";
      default:
        return "gray";
    }
  };

  const getFileStatusColor = (status: string) => {
    switch (status) {
      case "created":
        return "green";
      case "modified":
        return "yellow";
      case "deleted":
        return "red";
      case "error":
      case "failed":
        return "red";
      case "pending":
        return "gray";
      default:
        return "gray";
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case "error":
        return "red";
      case "warning":
        return "yellow";
      case "success":
        return "green";
      case "info":
        return "blue";
      default:
        return "gray";
    }
  };

  if (loading) {
    return (
      <Box flexDirection="column" padding={1} backgroundColor="black">
        <Box
          borderStyle="double"
          borderColor="cyan"
          paddingX={2}
          backgroundColor="black"
        >
          <Text bold color="cyan" backgroundColor="black">
            📄 SESSION DETAILS
          </Text>
        </Box>
        <Box marginTop={2} backgroundColor="black">
          <Text color="yellow" backgroundColor="black">
            Loading session data...
          </Text>
        </Box>
      </Box>
    );
  }

  if (error || !session) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box borderStyle="double" borderColor="cyan" paddingX={2}>
          <Text bold color="cyan">
            📄 SESSION DETAILS
          </Text>
        </Box>
        <Box marginTop={2}>
          <Text color="red">{error || "Session not found"}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Press Esc or q to return</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1} backgroundColor="black">
      <Box
        borderStyle="double"
        borderColor="cyan"
        paddingX={2}
        backgroundColor="black"
      >
        <Text bold color="cyan" backgroundColor="black">
          📄 SESSION DETAILS
        </Text>
      </Box>

      {/* Session ID */}
      <Box marginTop={1} backgroundColor="black">
        <Text color="gray" backgroundColor="black">
          ID:{" "}
        </Text>
        <Text color="cyan" backgroundColor="black">
          {session.id}
        </Text>
      </Box>

      {/* Tabs */}
      <Box marginTop={1} backgroundColor="black">
        {tabs.map((tab, index) => (
          <Box key={tab} marginX={1} backgroundColor="black">
            <Text
              color={currentTab === index ? "cyan" : "gray"}
              bold={currentTab === index}
              underline={currentTab === index}
              backgroundColor="black"
            >
              {index + 1}. {tab}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Tab Content */}
      <Box
        marginTop={1}
        borderStyle="single"
        borderColor="gray"
        padding={1}
        height={visibleLines + 2}
        flexDirection="column"
        backgroundColor="black"
      >
        {tabs[currentTab] === "Overview" && (
          <Box flexDirection="column">
            <Box>
              <Text bold color="white">
                Task:{" "}
              </Text>
              <Text color="gray">{session.task}</Text>
            </Box>
            <Box marginTop={1}>
              <Text bold color="white">
                Status:{" "}
              </Text>
              <Text color={getStatusColor(session.status)}>
                {session.status.toUpperCase()}
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text bold color="white">
                Started:{" "}
              </Text>
              <Text color="gray">{formatDate(session.startTime)}</Text>
            </Box>
            {session.endTime && (
              <Box marginTop={1}>
                <Text bold color="white">
                  Ended:{" "}
                </Text>
                <Text color="gray">{formatDate(session.endTime)}</Text>
              </Box>
            )}
            <Box marginTop={1}>
              <Text bold color="white">
                Duration:{" "}
              </Text>
              <Text color="white">
                {formatDuration(session.metrics.duration)}
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text bold color="white">
                Iterations:{" "}
              </Text>
              <Text color="white">{session.metrics.iterations}</Text>
            </Box>
            <Box marginTop={1}>
              <Text bold color="white">
                Files:{" "}
              </Text>
              <Text color="white">{session.files.length}</Text>
            </Box>
            <Box marginTop={1}>
              <Text bold color="white">
                Times:
              </Text>
            </Box>
            <Box marginLeft={2}>
              <Text color="gray">
                Architect:{" "}
                <Text color="cyan">
                  {formatDuration(session.metrics.architectTime)}
                </Text>
              </Text>
            </Box>
            <Box marginLeft={2}>
              <Text color="gray">
                Executor:{" "}
                <Text color="cyan">
                  {formatDuration(session.metrics.executorTime)}
                </Text>
              </Text>
            </Box>
            <Box marginLeft={2}>
              <Text color="gray">
                Auditor:{" "}
                <Text color="cyan">
                  {formatDuration(session.metrics.auditorTime)}
                </Text>
              </Text>
            </Box>
          </Box>
        )}

        {tabs[currentTab] === "Files" && (
          <Box flexDirection="column">
            {session.files.length === 0 ? (
              <Text color="gray">No files in this session</Text>
            ) : (
              session.files
                .slice(scrollOffset, scrollOffset + visibleLines)
                .map((file, index) => (
                  <Box key={index}>
                    <Text color={getFileStatusColor(file.status)}>
                      [{file.status.toUpperCase()}]
                    </Text>
                    <Text color="white"> {file.path}</Text>
                  </Box>
                ))
            )}
          </Box>
        )}

        {tabs[currentTab] === "Plan" && (
          <Box flexDirection="column">
            {session.plan
              .split("\n")
              .slice(scrollOffset, scrollOffset + visibleLines)
              .map((line, index) => (
                <Text key={index} color="white">
                  {line || " "}
                </Text>
              ))}
          </Box>
        )}

        {tabs[currentTab] === "Logs" && (
          <Box flexDirection="column">
            {session.logs.length === 0 ? (
              <Text color="gray">No logs available</Text>
            ) : (
              session.logs
                .slice(scrollOffset, scrollOffset + visibleLines)
                .map((log, index) => (
                  <Box key={index}>
                    <Text color="gray" dimColor>
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </Text>
                    <Text color={getLogColor(log.level)}>
                      [{log.level.toUpperCase()}
                      {log.agent ? ` ${log.agent}` : ""}]
                    </Text>
                    <Text color="white"> {log.message}</Text>
                  </Box>
                ))
            )}
          </Box>
        )}
      </Box>

      {/* Scroll indicator for tabs with content */}
      {tabs[currentTab] !== "Overview" && (
        <Box justifyContent="flex-end">
          <Text color="gray">
            Scroll:{" "}
            {Math.round(
              (scrollOffset / Math.max(1, getMaxScrollForTab())) * 100,
            )}
            %
          </Text>
        </Box>
      )}

      {/* Help */}
      <Box
        marginTop={1}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        backgroundColor="black"
      >
        <Text color="gray" backgroundColor="black">
          1-4: Switch tabs │ ←/→: Navigate tabs │ ↑/↓: Scroll │ Esc/q: Back
        </Text>
      </Box>
    </Box>
  );
};
