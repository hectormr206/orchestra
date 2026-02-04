/**
 * Example 07: Git Workflow Integration
 *
 * Shows automatic git commits after successful orchestration.
 */

import { Orchestrator } from '../src/orchestrator/Orchestrator.js';

async function gitWorkflowExample() {
  const orchestrator = new Orchestrator({
    parallel: false,
    git: {
      autoCommit: true,
      commitMessageTemplate: 'feat: {task}',
    },
  });

  const result = await orchestrator.orchestrate(
    'Add user profile page with avatar upload and bio editing',
  );

  console.log('Task completed and changes committed:', result);

  await orchestrator.clean();
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  gitWorkflowExample().catch(console.error);
}
