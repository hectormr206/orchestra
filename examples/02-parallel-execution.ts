/**
 * Example 02: Parallel Execution
 *
 * Demonstrates parallel file processing for improved performance.
 */

import { Orchestrator } from '../src/orchestrator/Orchestrator.js';

async function parallelExecution() {
  const orchestrator = new Orchestrator({
    parallel: true,
    maxConcurrency: 5,  // Process 5 files simultaneously
    maxIterations: 3,
  });

  const result = await orchestrator.orchestrate(
    'Create utility functions: capitalize, reverse, truncate, slugify, and camelCase strings',
  );

  console.log('Processed files in parallel:', result);

  await orchestrator.clean();
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  parallelExecution().catch(console.error);
}
