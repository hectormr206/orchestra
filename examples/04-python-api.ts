/**
 * Example 04: Python FastAPI Project
 *
 * Demonstrates Orchestra creating a Python REST API with FastAPI.
 */

import { Orchestrator } from '../src/orchestrator/Orchestrator.js';

async function pythonFastApiExample() {
  const orchestrator = new Orchestrator({
    parallel: false,
    maxIterations: 3,
    languages: ['python'],
  });

  const result = await orchestrator.orchestrate(`
    Create a FastAPI application with:
    - User CRUD endpoints
    - Database models with SQLAlchemy
    - Pydantic schemas for request/response
    - JWT authentication middleware
    - OpenAPI documentation
    - Unit tests with pytest
  `);

  console.log('Python FastAPI project created:', result);

  await orchestrator.clean();
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  pythonFastApiExample().catch(console.error);
}
