import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";

interface CheckResult {
  name: string;
  status: "checking" | "ok" | "warning" | "error";
  message?: string;
  version?: string;
}

interface DoctorProps {
  onBack: () => void;
}

export const Doctor: React.FC<DoctorProps> = ({ onBack }) => {
  const [checks, setChecks] = useState<CheckResult[]>([
    { name: "Node.js", status: "checking" },
    { name: "Claude CLI", status: "checking" },
    { name: "Codex CLI", status: "checking" },
    { name: "Gemini CLI", status: "checking" },
    { name: "Python 3", status: "checking" },
    { name: "ZAI_API_KEY", status: "checking" },
    { name: "GitHub CLI", status: "checking" },
    { name: "Config File", status: "checking" },
  ]);

  useInput((input, key) => {
    if (key.escape || input === "q") {
      onBack();
    }
  });

  useEffect(() => {
    const runChecks = async () => {
      const { execFile } = await import("child_process");
      const { promisify } = await import("util");
      const { existsSync } = await import("fs");
      const execFileAsync = promisify(execFile);

      const updateCheck = (name: string, result: Partial<CheckResult>) => {
        setChecks((prev) =>
          prev.map((c) => (c.name === name ? { ...c, ...result } : c)),
        );
      };

      // Node.js
      const nodeVersion = process.version;
      const nodeMajor = parseInt(nodeVersion.slice(1).split(".")[0]);
      updateCheck("Node.js", {
        status: nodeMajor >= 18 ? "ok" : "warning",
        version: nodeVersion,
        message: nodeMajor < 18 ? "Requires Node.js 18+" : undefined,
      });

      // Claude CLI
      try {
        const { stdout } = await execFileAsync("claude", ["--version"]);
        updateCheck("Claude CLI", { status: "ok", version: stdout.trim() });
      } catch {
        updateCheck("Claude CLI", { status: "error", message: "Not found" });
      }

      // Codex CLI
      try {
        const { stdout } = await execFileAsync("codex", ["--version"]);
        updateCheck("Codex CLI", { status: "ok", version: stdout.trim() });
      } catch {
        updateCheck("Codex CLI", {
          status: "warning",
          message: "Optional - for Consultant",
        });
      }

      // Gemini CLI
      try {
        const { stdout } = await execFileAsync("gemini", ["--version"]);
        updateCheck("Gemini CLI", { status: "ok", version: stdout.trim() });
      } catch {
        updateCheck("Gemini CLI", {
          status: "warning",
          message: "Optional - for fallback",
        });
      }

      // Python
      try {
        const { stdout } = await execFileAsync("python3", ["--version"]);
        updateCheck("Python 3", { status: "ok", version: stdout.trim() });
      } catch {
        updateCheck("Python 3", {
          status: "error",
          message: "Required for validation",
        });
      }

      // ZAI_API_KEY
      if (process.env.ZAI_API_KEY) {
        const key = process.env.ZAI_API_KEY;
        updateCheck("ZAI_API_KEY", {
          status: "ok",
          version: key.substring(0, 8) + "...",
        });
      } else {
        updateCheck("ZAI_API_KEY", {
          status: "error",
          message: "Not configured",
        });
      }

      // GitHub CLI
      try {
        const { stdout } = await execFileAsync("gh", ["--version"]);
        updateCheck("GitHub CLI", {
          status: "ok",
          version: stdout.split("\n")[0],
        });
      } catch {
        updateCheck("GitHub CLI", {
          status: "warning",
          message: "Optional - for GitHub integration",
        });
      }

      // Config file
      const configFiles = [
        ".orchestrarc.json",
        ".orchestrarc",
        "orchestra.config.json",
      ];
      const foundConfig = configFiles.find((f) => existsSync(f));
      if (foundConfig) {
        updateCheck("Config File", { status: "ok", version: foundConfig });
      } else {
        updateCheck("Config File", {
          status: "warning",
          message: "Using defaults",
        });
      }
    };

    runChecks();
  }, []);

  const getStatusIcon = (status: CheckResult["status"]) => {
    switch (status) {
      case "checking":
        return "◈";
      case "ok":
        return "✓";
      case "warning":
        return "⚠";
      case "error":
        return "✗";
    }
  };

  const getStatusColor = (status: CheckResult["status"]) => {
    switch (status) {
      case "checking":
        return "gray";
      case "ok":
        return "green";
      case "warning":
        return "yellow";
      case "error":
        return "red";
    }
  };

  const okCount = checks.filter((c) => c.status === "ok").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;
  const errorCount = checks.filter((c) => c.status === "error").length;
  const checkingCount = checks.filter((c) => c.status === "checking").length;

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="double" borderColor="cyan" paddingX={2}>
        <Text bold color="cyan">
          🩺 SYSTEM DOCTOR
        </Text>
      </Box>

      <Box
        flexDirection="column"
        marginTop={1}
        borderStyle="single"
        borderColor="gray"
        padding={1}
      >
        {checks.map((check) => (
          <Box key={check.name}>
            <Box width={4}>
              <Text color={getStatusColor(check.status)}>
                {getStatusIcon(check.status)}
              </Text>
            </Box>
            <Box width={15}>
              <Text color="white">{check.name}</Text>
            </Box>
            <Box>
              {check.version && (
                <Text color={getStatusColor(check.status)}>
                  {check.version}
                </Text>
              )}
              {check.message && (
                <Text color={getStatusColor(check.status)}>
                  {" "}
                  {check.message}
                </Text>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Summary */}
      <Box marginTop={1} borderStyle="round" padding={1}>
        {checkingCount > 0 ? (
          <Text color="gray">Checking... {checkingCount} remaining</Text>
        ) : (
          <Box>
            <Text color="green">{okCount} OK</Text>
            <Text color="gray"> │ </Text>
            <Text color="yellow">{warningCount} Warnings</Text>
            <Text color="gray"> │ </Text>
            <Text color="red">{errorCount} Errors</Text>
          </Box>
        )}
      </Box>

      {/* Help */}
      <Box marginTop={2} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">Press Esc or q to go back</Text>
      </Box>
    </Box>
  );
};
