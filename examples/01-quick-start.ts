/**
 * Example 01: Quick Start - Simple Task
 *
 * Basic example showing how to use Orchestra CLI for a simple task.
 */

import { Orchestrator } from '../src/orchestrator/Orchestrator.js';
import type { OrchestratorConfig } from '../src/types.js';

async function quickStart() {
  const config: Partial<OrchestratorConfig> = {
    parallel: false,
    maxIterations: 3,
  };

  const orchestrator = new Orchestrator(config, {
    onPhaseStart: (phase, agent) => console.log(`[${phase}] Started with ${agent}`),
    onPhaseComplete: (phase, agent, result) => {
      console.log(`[${phase}] Completed in ${result.duration}ms`);
    },
  });

  const result = await orchestrator.orchestrate(
    'Create a function to calculate the factorial of a number',
  );

  console.log('Result:', result);

  await orchestrator.clean();
}

// Run if executed directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  quickStart().catch(console.error);
}
