import React, { useEffect, useMemo, useState } from "react";
import { Text, useStdout } from "ink";

interface CurrentPathProps {
  prefix?: string;
  color?: string;
  maxWidth?: number;
}

function truncateMiddle(value: string, maxLen: number): string {
  if (value.length <= maxLen) {
    return value;
  }
  if (maxLen <= 3) {
    return "...";
  }
  const keepStart = Math.floor((maxLen - 3) / 2);
  const keepEnd = maxLen - 3 - keepStart;
  return value.slice(0, keepStart) + "..." + value.slice(-keepEnd);
}

export const CurrentPath: React.FC<CurrentPathProps> = ({
  prefix = "CWD: ",
  color = "gray",
  maxWidth,
}) => {
  const { stdout } = useStdout();
  const [columns, setColumns] = useState(stdout?.columns ?? 80);

  useEffect(() => {
    if (!stdout) return;

    const handleResize = () => {
      setColumns(stdout.columns ?? 80);
    };

    stdout.on("resize", handleResize);
    return () => {
      stdout.off("resize", handleResize);
    };
  }, [stdout]);

  const cwd = useMemo(() => process.cwd(), []);
  const available = (maxWidth ?? columns) - prefix.length - 1;
  const value = truncateMiddle(cwd, Math.max(available, 0));

  return (
    <Text color={color} dimColor>
      {prefix}
      {value}
    </Text>
  );
};