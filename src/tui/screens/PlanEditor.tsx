import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";

interface PlanEditorProps {
  initialPlan: string;
  onSave: (editedPlan: string) => void;
  onCancel: () => void;
}

export const PlanEditor: React.FC<PlanEditorProps> = ({
  initialPlan,
  onSave,
  onCancel,
}) => {
  const [plan, setPlan] = useState(initialPlan);
  const [lines, setLines] = useState(initialPlan.split("\n"));
  const [currentLine, setCurrentLine] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState("");
  const [scrollOffset, setScrollOffset] = useState(0);
  const [showHelp, setShowHelp] = useState(true);

  const visibleLines = 18;

  // Update lines when plan changes
  useEffect(() => {
    setLines(plan.split("\n"));
  }, [plan]);

  useInput((input, key) => {
    if (isEditing) {
      if (key.return) {
        // Finish editing this line
        const newLines = [...lines];
        newLines[currentLine] = editingValue;
        setLines(newLines);
        setPlan(newLines.join("\n"));
        setIsEditing(false);
        setEditingValue("");

        // Move to next line
        if (currentLine < lines.length - 1) {
          setCurrentLine(currentLine + 1);
          if (currentLine + 1 - scrollOffset >= visibleLines - 2) {
            setScrollOffset(
              Math.min(lines.length - visibleLines, scrollOffset + 1),
            );
          }
        }
      }
      if (key.escape) {
        // Cancel editing
        setIsEditing(false);
        setEditingValue("");
      }
      return;
    }

    if (key.escape) {
      if (showHelp) {
        setShowHelp(false);
      } else {
        onCancel();
      }
      return;
    }

    if (input === "h") {
      setShowHelp(!showHelp);
      return;
    }

    if (input === "s") {
      onSave(plan);
      return;
    }

    if (key.upArrow) {
      setCurrentLine((prev) => Math.max(0, prev - 1));
      if (currentLine - 1 < scrollOffset) {
        setScrollOffset(Math.max(0, scrollOffset - 1));
      }
    }

    if (key.downArrow) {
      setCurrentLine((prev) => Math.min(lines.length - 1, prev + 1));
      if (currentLine + 1 - scrollOffset >= visibleLines - 2) {
        setScrollOffset(
          Math.min(lines.length - visibleLines, scrollOffset + 1),
        );
      }
    }

    if (input === "e") {
      setIsEditing(true);
      setEditingValue(lines[currentLine] || "");
    }

    if (input === "i") {
      // Insert new line after current
      const newLines = [...lines];
      newLines.splice(currentLine + 1, 0, "");
      setLines(newLines);
      setPlan(newLines.join("\n"));
      setCurrentLine(currentLine + 1);
    }

    if (input === "d" && lines.length > 1) {
      // Delete current line
      const newLines = lines.filter((_, i) => i !== currentLine);
      setLines(newLines);
      setPlan(newLines.join("\n"));
      setCurrentLine(Math.min(currentLine, newLines.length - 1));
    }

    if (input === "n") {
      // Add new line at end
      const newLines = [...lines, ""];
      setLines(newLines);
      setPlan(newLines.join("\n"));
      setCurrentLine(newLines.length - 1);
      setScrollOffset(Math.max(0, newLines.length - visibleLines));
    }

    // Page up/down
    if (key.pageUp) {
      const newScroll = Math.max(0, scrollOffset - visibleLines / 2);
      setScrollOffset(newScroll);
      setCurrentLine(Math.max(0, currentLine - Math.floor(visibleLines / 2)));
    }

    if (key.pageDown) {
      const newScroll = Math.min(
        lines.length - visibleLines,
        scrollOffset + visibleLines / 2,
      );
      setScrollOffset(Math.floor(newScroll));
      setCurrentLine(
        Math.min(lines.length - 1, currentLine + Math.floor(visibleLines / 2)),
      );
    }
  });

  const visibleLinesSlice = lines.slice(
    scrollOffset,
    scrollOffset + visibleLines,
  );

  const scrollPercent =
    lines.length > visibleLines
      ? Math.round((scrollOffset / (lines.length - visibleLines)) * 100)
      : 0;

  return (
    <Box flexDirection="column" padding={1}>
      <Box
        borderStyle="single"
        borderColor="cyan"
        paddingX={2}
      >
        <Text bold color="cyan">
          * PLAN EDITOR
        </Text>
      </Box>

      {/* Editor Area */}
      <Box
        marginTop={1}
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        padding={1}
        height={visibleLines + 2}
      >
        {visibleLinesSlice.map((line, index) => {
          const actualIndex = scrollOffset + index;
          const isCurrentLine = actualIndex === currentLine;

          // Parse markdown for syntax highlighting
          const trimmed = line.trim();
          let content: React.ReactNode;

          if (isEditing && isCurrentLine) {
            content = (
              <TextInput
                value={editingValue}
                onChange={setEditingValue}
                placeholder="Enter text..."
                onSubmit={() => {}}
              />
            );
          } else if (trimmed.startsWith("# ")) {
            content = (
              <Text bold color="cyan">
                {line}
              </Text>
            );
          } else if (trimmed.startsWith("## ")) {
            content = (
              <Text bold color="blue">
                {line}
              </Text>
            );
          } else if (trimmed.startsWith("### ")) {
            content = (
              <Text bold color="green">
                {line}
              </Text>
            );
          } else if (trimmed.startsWith("- ")) {
            content = (
              <Text color="white">
                {"  "}
                <Text color="green">-</Text> {trimmed.substring(2)}
              </Text>
            );
          } else if (/^\d+\./.test(trimmed)) {
            const match = trimmed.match(/^(\d+\.)\s*(.*)/);
            if (match) {
              content = (
                <Text color="white">
                  {"  "}
                  <Text color="yellow">{match[1]}</Text> {match[2]}
                </Text>
              );
            } else {
              content = <Text>{line || " "}</Text>;
            }
          } else if (trimmed.startsWith("```")) {
            content = (
              <Text color="gray" dimColor>
                {line}
              </Text>
            );
          } else {
            content = <Text color="white">{line || " "}</Text>;
          }

          return (
            <Box
              key={actualIndex}
              backgroundColor={isCurrentLine ? "blue" : "black"}
              width="100%"
            >
              <Box width={5} backgroundColor={isCurrentLine ? "blue" : "black"}>
                <Text
                  color={isCurrentLine ? "white" : "white"}
                  dimColor={!isCurrentLine}
                  backgroundColor={isCurrentLine ? "blue" : "black"}
                >
                  {(actualIndex + 1).toString().padStart(3, " ")}:
                </Text>
              </Box>
              <Box
                flexGrow={1}
                backgroundColor={isCurrentLine ? "blue" : "black"}
              >
                {content}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Status Bar */}
      <Box
        marginTop={1}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
      >
        <Text color="white">
          Line:{" "}
          <Text color="white">
            {currentLine + 1}
          </Text>
          /{lines.length} | Scroll:{" "}
          <Text color="white">
            {scrollPercent}%
          </Text>{" "}
          | Lines:{" "}
          <Text color="white">
            {scrollOffset + 1}-
            {Math.min(scrollOffset + visibleLines, lines.length)}
          </Text>
        </Text>
      </Box>

      {/* Help */}
      {showHelp && (
        <Box
          marginTop={1}
          borderStyle="single"
          borderColor="cyan"
          paddingX={1}
        >
          <Box flexDirection="column">
            <Text color="cyan" bold>
              Commands:
            </Text>
            <Text color="white">
              {" "}
              ↑/↓: Navigate | e: Edit line | i: Insert line | d: Delete line
            </Text>
            <Text color="white">
              {" "}
              n: New line at end | PgUp/PgDn: Scroll | s: Save | Esc: Cancel
            </Text>
            <Text color="white">
              {" "}
              h: Toggle help
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
