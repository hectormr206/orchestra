import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { SessionHistory } from "../../utils/sessionHistory.js";
import { existsSync } from "fs";
import { unlink, rm } from "fs/promises";
import path from "path";

interface SessionSummary {
  id: string;
  task: string;
  startTime: string;
  status: "completed" | "failed" | "running" | "cancelled";
  filesCreated: number;
  duration?: number;
}

interface HistoryProps {
  sessions: SessionSummary[];
  onSelect: (sessionId: string) => void;
  onSessionDetails: (sessionId: string) => void;
  onBack: () => void;
  onDelete: (sessionId: string) => void;
  onSessionsChange: () => void;
}

export const History: React.FC<HistoryProps> = ({
  sessions,
  onSelect,
  onSessionDetails,
  onBack,
  onDelete,
  onSessionsChange,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleteStatus, setBulkDeleteStatus] = useState<string | null>(null);

  const handleDeleteSession = async (sessionId: string) => {
    try {
      setDeleteStatus("Deleting...");

      // Delete session directory
      const sessionDir = path.join(".orchestra", "sessions", sessionId);
      if (existsSync(sessionDir)) {
        await rm(sessionDir, { recursive: true, force: true });
      }

      // Remove from history index
      const history = new SessionHistory();
      await history.init();
      await history.deleteSession(sessionId);

      setDeleteStatus("Deleted!");
      onSessionsChange(); // Refresh sessions list
      onDelete(sessionId); // Notify parent

      setTimeout(() => {
        setDeleteStatus(null);
        setConfirmDelete(null);
      }, 1000);
    } catch (error) {
      setDeleteStatus("Failed: " + String(error));
      setTimeout(() => {
        setDeleteStatus(null);
      }, 2000);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setBulkDeleteStatus(`Deleting ${selectedSessions.size} sessions...`);

      const history = new SessionHistory();
      await history.init();

      const result = await history.bulkDelete(Array.from(selectedSessions));

      setBulkDeleteStatus(`Deleted ${result.deleted} of ${selectedSessions.size} sessions!`);
      onSessionsChange(); // Refresh sessions list

      setTimeout(() => {
        setBulkDeleteStatus(null);
        setShowBulkDeleteConfirm(false);
        setSelectionMode(false);
        setSelectedSessions(new Set());
      }, 2000);
    } catch (error) {
      setBulkDeleteStatus("Failed: " + String(error));
      setTimeout(() => {
        setBulkDeleteStatus(null);
      }, 2000);
    }
  };

  useInput((input, key) => {
    // Handle bulk delete confirmation
    if (showBulkDeleteConfirm) {
      if (input === "y") {
        handleBulkDelete();
      } else if (input === "n" || key.escape) {
        setShowBulkDeleteConfirm(false);
        setBulkDeleteStatus(null);
      }
      return;
    }

    if (key.escape) {
      if (confirmDelete) {
        setConfirmDelete(null);
        setDeleteStatus(null);
      } else if (selectionMode) {
        setSelectionMode(false);
        setSelectedSessions(new Set());
      } else {
        onBack();
      }
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(sessions.length - 1, prev + 1));
    }

    // Space bar to toggle selection in selection mode
    if (input === ' ' && selectionMode && sessions[selectedIndex]) {
      const sessionId = sessions[selectedIndex].id;
      const newSelected = new Set(selectedSessions);
      if (newSelected.has(sessionId)) {
        newSelected.delete(sessionId);
      } else {
        newSelected.add(sessionId);
      }
      setSelectedSessions(newSelected);
    }

    if (key.return && sessions[selectedIndex]) {
      if (confirmDelete) {
        handleDeleteSession(confirmDelete);
      } else if (!selectionMode) {
        onSessionDetails(sessions[selectedIndex].id);
      }
    }

    // Toggle selection mode with 's'
    if (input === "s" && !confirmDelete) {
      setSelectionMode(!selectionMode);
      setSelectedSessions(new Set());
    }

    // Delete single session in normal mode
    if (input === "d" && sessions[selectedIndex] && !confirmDelete && !selectionMode) {
      setConfirmDelete(sessions[selectedIndex].id);
    }

    // Bulk delete in selection mode
    if (input === "d" && selectionMode && selectedSessions.size > 0) {
      setShowBulkDeleteConfirm(true);
    }

    if (input === "v" && sessions[selectedIndex] && !confirmDelete) {
      onSessionDetails(sessions[selectedIndex].id);
    }

    if ((input === "n" || input === "c") && confirmDelete) {
      setConfirmDelete(null);
      setDeleteStatus(null);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "+";
      case "failed":
        return "x";
      case "running":
        return ">";
      case "cancelled":
        return "!";
      default:
        return "?";
    }
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

  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString().substring(0, 5)
    );
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="single" borderColor="cyan" paddingX={2}>
        <Text bold color="cyan">
          = SESSION HISTORY
        </Text>
      </Box>

      {sessions.length === 0 ? (
        <Box
          marginTop={2}
          borderStyle="single"
          borderColor="gray"
          padding={1}
        >
          <Text color="white">
            No sessions found. Start a new task to create one!
          </Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {/* Header */}
          <Box borderStyle="single" borderColor="gray">
            <Box width={10}>
              <Text bold color="white">
                ID
              </Text>
            </Box>
            <Box width={8}>
              <Text bold color="white">
                Status
              </Text>
            </Box>
            <Box width={18}>
              <Text bold color="white">
                Date
              </Text>
            </Box>
            <Box width={10}>
              <Text bold color="white">
                Duration
              </Text>
            </Box>
            <Box width={6}>
              <Text bold color="white">
                Files
              </Text>
            </Box>
            <Box flexGrow={1}>
              <Text bold color="white">
                Task
              </Text>
            </Box>
          </Box>

          {/* Sessions */}
          {sessions.map((session, index) => (
            <Box
              key={session.id}
              backgroundColor={selectedIndex === index ? "blue" : "black"}
            >
              {selectionMode && (
                <Box
                  width={4}
                  backgroundColor={selectedIndex === index ? "blue" : "black"}
                >
                  <Text
                    color="cyan"
                    backgroundColor={selectedIndex === index ? "blue" : "black"}
                  >
                    {selectedSessions.has(session.id) ? "[x]" : "[ ]"}
                  </Text>
                </Box>
              )}
              <Box
                width={10}
                backgroundColor={selectedIndex === index ? "blue" : "black"}
              >
                <Text
                  color={selectedIndex === index ? "white" : "cyan"}
                  backgroundColor={selectedIndex === index ? "blue" : "black"}
                >
                  {session.id.substring(0, 8)}
                </Text>
              </Box>
              <Box
                width={8}
                backgroundColor={selectedIndex === index ? "blue" : "black"}
              >
                <Text
                  color={getStatusColor(session.status)}
                  backgroundColor={selectedIndex === index ? "blue" : "black"}
                >
                  {getStatusIcon(session.status)}
                </Text>
              </Box>
              <Box
                width={18}
                backgroundColor={selectedIndex === index ? "blue" : "black"}
              >
                <Text
                  color="gray"
                  backgroundColor={selectedIndex === index ? "blue" : "black"}
                >
                  {formatDate(session.startTime)}
                </Text>
              </Box>
              <Box
                width={10}
                backgroundColor={selectedIndex === index ? "blue" : "black"}
              >
                <Text
                  color="white"
                  backgroundColor={selectedIndex === index ? "blue" : "black"}
                >
                  {formatDuration(session.duration)}
                </Text>
              </Box>
              <Box
                width={6}
                backgroundColor={selectedIndex === index ? "blue" : "black"}
              >
                <Text
                  color="green"
                  backgroundColor={selectedIndex === index ? "blue" : "black"}
                >
                  {session.filesCreated}
                </Text>
              </Box>
              <Box
                flexGrow={1}
                backgroundColor={selectedIndex === index ? "blue" : "black"}
              >
                <Text
                  color={selectedIndex === index ? "white" : "gray"}
                  backgroundColor={selectedIndex === index ? "blue" : "black"}
                >
                  {session.task}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <Box
          marginTop={2}
          borderStyle="single"
          borderColor="red"
          padding={1}
          flexDirection="column"
        >
          <Text color="red">
            ! Delete session {confirmDelete.substring(0, 8)}?
          </Text>
          {deleteStatus ? (
            <Text
              color={deleteStatus === "Deleted!" ? "green" : "red"}
            >
              {deleteStatus}
            </Text>
          ) : (
            <Text color="gray">
              Press y to confirm, n to cancel
            </Text>
          )}
        </Box>
      )}

      {/* Bulk Delete Confirmation */}
      {showBulkDeleteConfirm && (
        <Box
          marginTop={2}
          borderStyle="single"
          borderColor="red"
          padding={1}
          flexDirection="column"
        >
          <Text color="red">
            ! Delete {selectedSessions.size} selected sessions?
          </Text>
          {bulkDeleteStatus ? (
            <Text
              color={bulkDeleteStatus.includes("Deleted") ? "green" : "red"}
            >
              {bulkDeleteStatus}
            </Text>
          ) : (
            <Text color="gray">
              Press y to confirm, n/Esc to cancel
            </Text>
          )}
        </Box>
      )}

      {/* Selection Mode Indicator */}
      {selectionMode && (
        <Box
          marginTop={2}
          borderStyle="single"
          borderColor="cyan"
          padding={1}
        >
          <Text color="cyan">
            * Selection Mode: {selectedSessions.size} selected | Space: Toggle | d: Delete | s: Exit
          </Text>
        </Box>
      )}

      {/* Help */}
      <Box
        marginTop={2}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
      >
        <Text color="white">
          {selectionMode
            ? "Space: Toggle | d: Bulk delete | s: Exit selection | Esc: Back"
            : "↑/↓: Navigate | Enter/v: View | d: Delete | s: Selection mode | Esc: Back"}
        </Text>
      </Box>
    </Box>
  );
};
