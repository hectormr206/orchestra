/**
 * Example 06: Docker Containerization
 *
 * Demonstrates Orchestra creating Docker configuration files.
 */

import { Orchestrator } from '../src/orchestrator/Orchestrator.js';

async function dockerExample() {
  const orchestrator = new Orchestrator({
    parallel: false,
    maxIterations: 2,
  });

  const result = await orchestrator.orchestrate(`
    Create Docker configuration for a Node.js API:
    - Dockerfile with multi-stage build
    - docker-compose.yml for local development
    - .dockerignore file
    - Environment configuration
    - Health check endpoint
  `);

  console.log('Docker setup created:', result);

  await orchestrator.clean();
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  dockerExample().catch(console.error);
}
