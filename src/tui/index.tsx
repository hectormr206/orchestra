#!/usr/bin/env node

import React from "react";
import { render } from "ink";
import { performance, PerformanceObserver } from "perf_hooks";
import { App } from "./App.js";

interface TUIOptions {
  task?: string;
  autoStart?: boolean;
}

// Clear performance entries periodically to prevent memory leak
let cleanupInterval: NodeJS.Timeout | null = null;

function startPerformanceCleanup(): void {
  // Clear any existing entries immediately
  performance.clearMarks();
  performance.clearMeasures();

  // Set up periodic cleanup every 30 seconds
  cleanupInterval = setInterval(() => {
    performance.clearMarks();
    performance.clearMeasures();
  }, 30000);
}

function stopPerformanceCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

export async function startTUI(options: TUIOptions = {}): Promise<void> {
  // Start performance cleanup to prevent memory leak
  startPerformanceCleanup();

  const { waitUntilExit } = render(
    <App initialTask={options.task} autoStart={options.autoStart} />,
  );

  await waitUntilExit();

  // Stop cleanup when TUI exits
  stopPerformanceCleanup();
}

// If run directly
if (process.argv[1]?.includes("tui")) {
  startTUI().catch(console.error);
}
