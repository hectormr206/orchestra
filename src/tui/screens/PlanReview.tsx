import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface PlanReviewProps {
  plan: string;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
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

  const planLines = plan.split("\n");
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
    planLines.length > visibleLines
      ? Math.round((scrollOffset / (planLines.length - visibleLines)) * 100)
      : 100;

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="double" borderColor="cyan" paddingX={2}>
        <Text bold color="cyan">
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
      >
        {visiblePlan.map((line, index) => {
          // Simple Markdown Parsing for Visual Structure
          const trimmed = line.trim();

          // H1: # Title
          if (trimmed.startsWith("# ")) {
            return (
              <Box key={index} marginTop={1} marginBottom={1}>
                <Text color="cyan" bold underline>
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
              <Text key={index} color="gray">
                {" "}
                {line}
              </Text>
            );
          }

          // Default Text
          return (
            <Text key={index} color="white">
              {line || " "}
            </Text>
          );
        })}
      </Box>

      {/* Scroll indicator */}
      <Box justifyContent="flex-end">
        <Text color="gray">
          Scroll: {scrollPercent}% │ Lines: {scrollOffset + 1}-
          {Math.min(scrollOffset + visibleLines, planLines.length)}/
          {planLines.length}
        </Text>
      </Box>

      {/* Actions */}
      <Box marginTop={2} justifyContent="center">
        {actions.map((action, index) => (
          <Box key={action.label} marginX={2}>
            <Text
              color={selectedAction === index ? action.color : "gray"}
              bold={selectedAction === index}
            >
              {selectedAction === index ? "▶ " : "  "}[{action.icon}]{" "}
              {action.label}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Help */}
      <Box marginTop={2} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">
          ←/→: Select action │ ↑/↓: Scroll │ Enter: Confirm │ a/r/e: Quick
          select
        </Text>
      </Box>
    </Box>
  );
};
