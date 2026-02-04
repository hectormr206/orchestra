/**
 * Example 05: React Component with TypeScript
 *
 * Shows Orchestra creating React components with proper typing.
 */

import { Orchestrator } from '../src/orchestrator/Orchestrator.js';

async function reactComponentExample() {
  const orchestrator = new Orchestrator({
    parallel: false,
    maxIterations: 3,
  });

  const result = await orchestrator.orchestrate(`
    Create a React data table component with:
    - TypeScript interfaces for props
    - Sorting functionality
    - Pagination controls
    - Row selection
    - Filter/search
    - Responsive design with Tailwind CSS
  `);

  console.log('React component created:', result);

  await orchestrator.clean();
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  reactComponentExample().catch(console.error);
}
