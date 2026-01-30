import React, { useState, useEffect, useRef } from "react";
import { Text } from "ink";

interface DurationDisplayProps {
  /** Start time in milliseconds (Date.now()) */
  startTime: number;
  /** Whether the timer is running */
  isRunning: boolean;
  /** Update interval in milliseconds (default: 1000) */
  interval?: number;
}

/**
 * Isolated component that displays elapsed time.
 * Uses its own local state to avoid re-rendering parent components.
 */
export const DurationDisplay: React.FC<DurationDisplayProps> = ({
  startTime,
  isRunning,
  interval = 1000,
}) => {
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && startTime > 0) {
      // Update immediately
      setDuration(Date.now() - startTime);

      // Then update periodically
      intervalRef.current = setInterval(() => {
        setDuration(Date.now() - startTime);
      }, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      // Clear interval when not running
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isRunning, startTime, interval]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return <Text color="white">{formatDuration(duration)}</Text>;
};
