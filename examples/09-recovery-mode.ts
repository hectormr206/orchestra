/**
 * Example 09: Recovery Mode Configuration
 *
 * Shows how to configure Recovery Mode for handling errors.
 */

import { Orchestrator } from '../src/orchestrator/Orchestrator.js';

async function recoveryModeExample() {
  const orchestrator = new Orchestrator({
    parallel: false,
    maxIterations: 10,  // Allow more iterations for complex tasks
    recovery: {
      maxRecoveryAttempts: 5,
      recoveryTimeout: 600000,  // 10 minutes
      autoRevertOnFailure: true,
    },
  });

  const result = await orchestrator.orchestrate(`
    Create a complete GraphQL API with:
    - Schema definitions for User, Post, Comment
    - Resolvers with error handling
    - Authentication middleware
    - DataLoader for batching queries
    - Unit tests for all resolvers
  `);

  console.log('Complex task with Recovery Mode:', result);

  await orchestrator.clean();
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  recoveryModeExample().catch(console.error);
}
