/**
 * Example 11: GitHub Integration
 *
 * Shows automatic GitHub issue/PR creation after orchestration.
 */

import { Orchestrator } from '../src/orchestrator/Orchestrator.js';

async function githubIntegrationExample() {
  const orchestrator = new Orchestrator({
    parallel: false,
    github: {
      enabled: true,
      autoCreatePR: true,
      repoOwner: 'your-org',
      repoName: 'your-repo',
    },
  });

  const result = await orchestrator.orchestrate(
    'Add rate limiting middleware to prevent API abuse',
  );

  console.log('Task completed and GitHub PR created:', result);

  await orchestrator.clean();
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  githubIntegrationExample().catch(console.error);
}
