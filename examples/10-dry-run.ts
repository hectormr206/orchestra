/**
 * Example 10: Dry Run Mode
 *
 * Demonstrates analyzing a task without making actual changes.
 */

import { Orchestrator } from '../src/orchestrator/Orchestrator.js';

async function dryRunExample() {
  const orchestrator = new Orchestrator({
    parallel: false,
    dryRun: true,  // Enable dry-run mode
  });

  const result = await orchestrator.orchestrate(
    'Refactor the authentication system to use OAuth2',
  );

  console.log('Dry-run analysis:', result);
  console.log('No files were actually modified.');

  await orchestrator.clean();
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  dryRunExample().catch(console.error);
}
