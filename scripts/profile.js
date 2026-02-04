#!/usr/bin/env node

/**
 * Performance Profiling Script for Orchestra CLI
 *
 * Run with: clinic doctor -- node scripts/profile.js
 * Or: clinic bubbleprof -- node scripts/profile.js
 * Or: clinic flame -- node scripts/profile.js
 *
 * Requirements:
 * npm install --save-dev clinic
 */

import { Orchestrator } from '../src/orchestrator/Orchestrator.js';
import type { OrchestratorConfig } from '../src/types.js';

async function runProfile() {
  console.log('Starting Orchestra Performance Profile...\n');

  const config: Partial<OrchestratorConfig> = {
    parallel: true,
    maxConcurrency: 3,
    maxIterations: 3,
    timeout: 30000,
  };

  const callbacks = {
    onPhaseStart: (phase: string, agent: string) => {
      console.log(`[${new Date().toISOString()}] Phase: ${phase} | Agent: ${agent}`);
    },
    onPhaseComplete: (phase: string, agent: string, result: any) => {
      console.log(`[${new Date().toISOString()}] Complete: ${phase} | Duration: ${result.duration}ms`);
    },
    onError: (phase: string, error: string) => {
      console.error(`[${new Date().toISOString()}] Error in ${phase}: ${error}`);
    },
  };

  const orchestrator = new Orchestrator(config, callbacks);

  try {
    // Test 1: Simple task
    console.log('\n=== Test 1: Simple Task ===');
    await orchestrator.orchestrate(
      'Create a simple function to calculate fibonacci numbers',
    );

    // Test 2: Parallel file processing
    console.log('\n=== Test 2: Parallel File Processing ===');
    await orchestrator.orchestrate(
      'Create 3 TypeScript utility functions: capitalize, reverse, and truncate strings',
    );

    // Test 3: Complex task with iterations
    console.log('\n=== Test 3: Complex Task ===');
    await orchestrator.orchestrate(
      'Create a REST API with Express.js with endpoints for users, posts, and comments',
    );

  } catch (error) {
    console.error('Profile failed:', error);
  } finally {
    await orchestrator.clean();
    console.log('\nProfile complete. Check Clinic output for detailed analysis.');
  }
}

// Run the profile
runProfile().catch(console.error);
