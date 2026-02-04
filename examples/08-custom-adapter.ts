/**
 * Example 08: Custom Adapter Configuration
 *
 * Demonstrates using multiple AI adapters with fallback chains.
 */

import { Orchestrator } from '../src/orchestrator/Orchestrator.js';

async function customAdapterExample() {
  const orchestrator = new Orchestrator({
    // Configure adapter priorities for each agent
    adapters: {
      architect: ['gemini', 'glm', 'codex'],  // Try Gemini first, fall back to GLM, then Codex
      executor: ['glm', 'codex'],              // Use GLM for code generation (fast, cost-effective)
      auditor: ['gemini', 'glm'],              // Use Gemini for code review
      consultant: ['codex', 'gemini'],         // Use Codex for algorithmic help
    },
    parallel: false,
    maxIterations: 3,
  });

  const result = await orchestrator.orchestrate(
    'Implement a binary search tree with insert, delete, and search operations',
  );

  console.log('Used custom adapter configuration:', result);

  await orchestrator.clean();
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  customAdapterExample().catch(console.error);
}
