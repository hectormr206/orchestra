import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import { initPerfHooks } from './perfHooks.js';

interface TUIOptions {
  task?: string;
  autoStart?: boolean;
}

export async function startTUI(options: TUIOptions = {}): Promise<void> {
  initPerfHooks();

  const { waitUntilExit } = render(
    <App initialTask={options.task} autoStart={options.autoStart} />
  );

  await waitUntilExit();
}

// If run directly
if (process.argv[1]?.includes('tui')) {
  startTUI().catch(console.error);
}