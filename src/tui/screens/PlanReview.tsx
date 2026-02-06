import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";

interface PlanReviewProps {
  plan: string;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
}

/**
 * Cleans up plan content by removing AI conversation text
 * and extracting only the actual Markdown plan
 */
function cleanPlanContent(rawPlan: string): string {
  if (!rawPlan) return "";

  // Find the first Markdown heading (# or ##)
  const headingMatch = rawPlan.match(/^(#{1,3}\s.+)/m);

  if (headingMatch && headingMatch.index !== undefined) {
    // Return everything from the first heading onwards
    return rawPlan.substring(headingMatch.index);
  }

  // If no heading found, try to find "PLAN" or "IMPLEMENTACION" or similar
  const planMarkers = [
    /^PLAN\s/im,
    /^IMPLEMENTATION\s/im,
    /^IMPLEMENTACION\s/im,
    /^Archivos\s/im,
    /^Files\s/im,
    /^\*\*[A-Z]/m, // Bold text at start of line
  ];

  for (const marker of planMarkers) {
    const match = rawPlan.match(marker);
    if (match && match.index !== undefined) {
      return rawPlan.substring(match.index);
    }
  }

  // As last resort, remove common AI conversation prefixes
  const cleanedLines = rawPlan.split("\n").filter((line, index) => {
    // Skip lines that look like AI conversation at the start
    if (index < 3) {
      const lower = line.toLowerCase();
      if (
        lower.includes("puedo escribir") ||
        lower.includes("here's") ||
        lower.includes("i'll") ||
        lower.includes("let me") ||
        lower.includes("voy a") ||
        lower.includes("aquí está")
      ) {
        return false;
      }
    }
    return true;
  });

  return cleanedLines.join("\n").trim();
}

export const PlanReview: React.FC<PlanReviewProps> = ({
  plan,
  onApprove,
  onReject,
  onEdit,
}) => {
  const [selectedAction, setSelectedAction] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const actions = [
    { label: "Approve", color: "green", icon: "✓", action: onApprove },
    { label: "Reject", color: "red", icon: "✗", action: onReject },
    { label: "Edit", color: "blue", icon: "✎", action: onEdit },
  ];

  // Clean the plan content before displaying
  const cleanedPlan = useMemo(() => cleanPlanContent(plan), [plan]);
  const planLines = cleanedPlan.split("\n");
  const visibleLines = 20;

  useInput((input, key) => {
    if (key.leftArrow) {
      setSelectedAction((prev) => (prev - 1 + actions.length) % actions.length);
    }
    if (key.rightArrow) {
      setSelectedAction((prev) => (prev + 1) % actions.length);
    }
    if (key.upArrow) {
      setScrollOffset((prev) => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setScrollOffset((prev) =>
        Math.min(planLines.length - visibleLines, prev + 1),
      );
    }
    if (key.return) {
      actions[selectedAction].action();
    }
    if (input === "a") onApprove();
    if (input === "r") onReject();
    if (input === "e") onEdit();
  });

  const visiblePlan = planLines.slice(
    scrollOffset,
    scrollOffset + visibleLines,
  );
  const scrollPercent =
    planLines.length > visibleLines && planLines.length - visibleLines > 0
      ? Math.round((scrollOffset / (planLines.length - visibleLines)) * 100)
      : 0;

  return (
    <Box flexDirection="column" padding={1} backgroundColor="black">
      <Box
        borderStyle="double"
        borderColor="cyan"
        paddingX={2}
        backgroundColor="black"
      >
        <Text bold color="cyan" backgroundColor="black">
          📋 PLAN REVIEW
        </Text>
      </Box>

      {/* Plan Content */}
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        padding={1}
        marginTop={1}
        height={visibleLines + 2}
        backgroundColor="black"
      >
        {visiblePlan.map((line, index) => {
          // Simple Markdown Parsing for Visual Structure
          const trimmed = line.trim();

          // H1: # Title
          if (trimmed.startsWith("# ")) {
            return (
              <Box
                key={index}
                marginTop={1}
                marginBottom={1}
                backgroundColor="black"
              >
                <Text color="cyan" bold underline backgroundColor="black">
                  {trimmed.replace(/^#\s/, "").toUpperCase()}
                </Text>
              </Box>
            );
          }

          // H2: ## Subtitle
          if (trimmed.startsWith("## ")) {
            return (
              <Box key={index} marginTop={1}>
                <Text color="blue" bold>
                  {" "}
                  {trimmed.replace(/^##\s/, "")}
                </Text>
              </Box>
            );
          }

          // H3: ### Section
          if (trimmed.startsWith("### ")) {
            return (
              <Box key={index} marginTop={0}>
                <Text color="green" bold>
                  {" "}
                  {trimmed.replace(/^###\s/, "")}
                </Text>
              </Box>
            );
          }

          // List item: - Item
          if (trimmed.startsWith("- ")) {
            return (
              <Text key={index} color="white">
                {"    "}
                <Text color="green">●</Text> {trimmed.substring(2)}
              </Text>
            );
          }

          // Numbered list: 1. Item
          if (/^\d+\./.test(trimmed)) {
            return (
              <Text key={index} color="white">
                {"    "}
                <Text color="yellow">{trimmed.match(/^\d+\./)![0]}</Text>{" "}
                {trimmed.replace(/^\d+\.\s*/, "")}
              </Text>
            );
          }

          // Code block markers or content (simple heuristic)
          if (trimmed.startsWith("```")) {
            return (
              <Text key={index} color="white" backgroundColor="black">
                {" "}
                {line}
              </Text>
            );
          }

          // Default Text
          return (
            <Text key={index} color="white" backgroundColor="black">
              {line || " "}
            </Text>
          );
        })}
      </Box>

      {/* Scroll indicator */}
      <Box justifyContent="flex-end" backgroundColor="black">
        <Text color="white" backgroundColor="black">
          {`Scroll: ${scrollPercent}% │ Lines: ${scrollOffset + 1}-${Math.min(scrollOffset + visibleLines, planLines.length)}/${planLines.length}`}
        </Text>
      </Box>

      {/* Actions */}
      <Box marginTop={2} justifyContent="center">
        {actions.map((action, index) => (
          <Box key={action.label} marginX={2}>
            <Text
              color={selectedAction === index ? action.color : "white"}
              bold={selectedAction === index}
              backgroundColor="black"
            >
              {selectedAction === index ? "▶ " : "  "}[{action.icon}]{" "}
              {action.label}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Help */}
      <Box
        marginTop={2}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        backgroundColor="black"
      >
        <Text color="white" backgroundColor="black">
          ←/→: Select action │ ↑/↓: Scroll │ Enter: Confirm │ a/r/e: Quick
          select
        </Text>
      </Box>
    </Box>
  );
};
