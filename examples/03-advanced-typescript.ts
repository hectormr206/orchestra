/**
 * Example 03: Advanced TypeScript Project
 *
 * Shows Orchestra working with TypeScript projects including type definitions.
 */

import { Orchestrator } from '../src/orchestrator/Orchestrator.js';

async function typescriptExample() {
  const orchestrator = new Orchestrator({
    parallel: true,
    maxIterations: 5,
    languages: ['typescript'],
  });

  const result = await orchestrator.orchestrate(`
    Create a TypeScript user authentication module with:
    - User interface with email, password, name
    - AuthService class with login, register, logout methods
    - Password hashing utility
    - JWT token generation/validation
    - Input validation with zod schemas
  `);

  console.log('TypeScript module created:', result);

  await orchestrator.clean();
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  typescriptExample().catch(console.error);
}
