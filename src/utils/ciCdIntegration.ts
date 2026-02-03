/**
 * CI/CD Integration - GitHub Actions, GitLab CI, Jenkins support
 *
 * Provides:
 * - Workflow configuration generation
 * - Pipeline validation
 * - CI/CD platform detection
 * - Automatic workflow updates
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { glob } from 'glob';

export type CIPlatform = 'github' | 'gitlab' | 'jenkins' | 'azure' | 'circleci' | 'bitbucket';

export interface CIConfig {
  platform: CIPlatform;
  configPath: string;
  workflowPaths: string[];
}

export interface OrchestraCIConfig {
  enabled?: boolean;
  runTests?: boolean;
  testCommand?: string;
  runLint?: boolean;
  lintCommand?: string;
  runBuild?: boolean;
  buildCommand?: string;
  notifyOnFailure?: boolean;
  autoMergeOnSuccess?: boolean;
  requiredChecks?: string[];
  timeoutMinutes?: number;
}

export interface PipelineConfig {
  name: string;
  triggerOn: string[];
  jobs: PipelineJob[];
  orchestraConfig: OrchestraCIConfig;
}

export interface PipelineJob {
  name: string;
  runsOn: string[];
  steps: PipelineStep[];
  timeoutMinutes?: number;
}

export interface PipelineStep {
  name: string;
  uses?: string;
  with?: Record<string, any>;
  run?: string;
  env?: Record<string, string>;
}

/**
 * Detect CI/CD platform
 */
export function detectCIPlatform(cwd: string = process.cwd()): CIPlatform | null {
  // Check for GitHub Actions
  if (existsSync(path.join(cwd, '.github/workflows'))) {
    return 'github';
  }

  // Check for GitLab CI
  if (existsSync(path.join(cwd, '.gitlab-ci.yml'))) {
    return 'gitlab';
  }

  // Check for Jenkins
  if (existsSync(path.join(cwd, 'Jenkinsfile'))) {
    return 'jenkins';
  }

  // Check for Azure Pipelines
  if (existsSync(path.join(cwd, 'azure-pipelines.yml'))) {
    return 'azure';
  }

  // Check for CircleCI
  if (existsSync(path.join(cwd, '.circleci'))) {
    return 'circleci';
  }

  // Check for Bitbucket Pipelines
  if (existsSync(path.join(cwd, 'bitbucket-pipelines.yml'))) {
    return 'bitbucket';
  }

  return null;
}

/**
 * Get CI configuration for a platform
 */
export function getCIConfig(platform: CIPlatform, cwd: string = process.cwd()): CIConfig | null {
  switch (platform) {
    case 'github':
      return {
        platform: 'github',
        configPath: '.github',
        workflowPaths: glob.sync('.github/workflows/*.yml', { cwd, absolute: false }),
      };

    case 'gitlab':
      return {
        platform: 'gitlab',
        configPath: '.gitlab-ci.yml',
        workflowPaths: ['.gitlab-ci.yml'],
      };

    case 'jenkins':
      return {
        platform: 'jenkins',
        configPath: 'Jenkinsfile',
        workflowPaths: ['Jenkinsfile'],
      };

    case 'azure':
      return {
        platform: 'azure',
        configPath: 'azure-pipelines.yml',
        workflowPaths: ['azure-pipelines.yml'],
      };

    case 'circleci':
      return {
        platform: 'circleci',
        configPath: '.circleci',
        workflowPaths: glob.sync('.circleci/*.yml', { cwd, absolute: false }),
      };

    case 'bitbucket':
      return {
        platform: 'bitbucket',
        configPath: 'bitbucket-pipelines.yml',
        workflowPaths: ['bitbucket-pipelines.yml'],
      };

    default:
      return null;
  }
}

/**
 * Generate GitHub Actions workflow for Orchestra
 */
export function generateGitHubActionsWorkflow(
  name: string = 'Orchestra',
  config: OrchestraCIConfig = {}
): string {
  const {
    runTests = true,
    testCommand = 'npm test',
    runLint = true,
    lintCommand = 'npm run lint',
    runBuild = true,
    buildCommand = 'npm run build',
    notifyOnFailure = true,
    autoMergeOnSuccess = false,
    requiredChecks = [],
  } = config;

  const steps: PipelineStep[] = [
    {
      name: 'Checkout',
      uses: 'actions/checkout@v4',
      with: { 'fetch-depth': 0 },
    },
    {
      name: 'Setup Node.js',
      uses: 'actions/setup-node@v4',
      with: { 'node-version': '18', cache: 'npm' },
    },
    {
      name: 'Install dependencies',
      run: 'npm ci',
    },
  ];

  if (runLint) {
    steps.push({
      name: 'Run linting',
      run: lintCommand,
    });
  }

  if (runTests) {
    steps.push({
      name: 'Run tests',
      run: testCommand,
    });
  }

  if (runBuild) {
    steps.push({
      name: 'Build project',
      run: buildCommand,
    });
  }

  steps.push({
    name: 'Run Orchestra',
    run: 'npx orchestra start "Review and validate code changes"',
  });

  const workflow = {
    name,
    on: {
      pull_request: { branches: ['main', 'develop'] },
      push: { branches: ['main', 'develop'] },
    },
    jobs: {
      orchestra: {
        'runs-on': 'ubuntu-latest',
        steps,
      },
    },
  };

  if (autoMergeOnSuccess) {
    (workflow.jobs as any).orchestra.if = 'success()';
    steps.push({
      name: 'Auto-merge',
      uses: 'pascalgn/automerge-action@v0.15.5',
      with: { 'merge-method': 'squash' },
    });
  }

  return `# Orchestra CI/CD Workflow
# This workflow was generated by Orchestra CLI
${stringifyYAML(workflow)}`;
}

/**
 * Generate GitLab CI pipeline for Orchestra
 */
export function generateGitLabCIPipeline(
  config: OrchestraCIConfig = {}
): string {
  const {
    runTests = true,
    testCommand = 'npm test',
    runLint = true,
    lintCommand = 'npm run lint',
    runBuild = true,
    buildCommand = 'npm run build',
  } = config;

  const pipeline: any = {
    stages: ['lint', 'test', 'build', 'orchestra'],
    cache: {
      paths: ['node_modules/'],
      key: '$CI_COMMIT_REF_SLUG',
    },
  };

  const beforeScript = [
    'npm ci',
  ];

  if (runLint) {
    pipeline.lint = {
      stage: 'lint',
      script: [lintCommand],
      cache: pipeline.cache,
      before_script: beforeScript,
    };
  }

  if (runTests) {
    pipeline.test = {
      stage: 'test',
      script: [testCommand],
      cache: pipeline.cache,
      before_script: beforeScript,
    };
  }

  if (runBuild) {
    pipeline.build = {
      stage: 'build',
      script: [buildCommand],
      cache: pipeline.cache,
      before_script: beforeScript,
    };
  }

  pipeline.orchestra = {
    stage: 'orchestra',
    script: ['npx orchestra start "Review and validate code changes"'],
    cache: pipeline.cache,
    before_script: beforeScript,
    only: ['merge_requests', 'main', 'develop'],
  };

  return `# Orchestra GitLab CI Pipeline
# This pipeline was generated by Orchestra CLI
${stringifyYAML(pipeline)}`;
}

/**
 * Generate Jenkinsfile for Orchestra
 */
export function generateJenkinsfile(config: OrchestraCIConfig = {}): string {
  const {
    runTests = true,
    testCommand = 'npm test',
    runLint = true,
    lintCommand = 'npm run lint',
    runBuild = true,
    buildCommand = 'npm run build',
    timeoutMinutes = 30,
  } = config;

  return `pipeline {
    agent any

    options {
        timeout(time: ${timeoutMinutes}, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }${runLint ? `
        stage('Lint') {
            steps {
                sh '${lintCommand}'
            }
        }` : ''}${runTests ? `
        stage('Test') {
            steps {
                sh '${testCommand}'
            }
        }` : ''}${runBuild ? `
        stage('Build') {
            steps {
                sh '${buildCommand}'
            }
        }` : ``
        }stage('Orchestra') {
            steps {
                sh 'npx orchestra start "Review and validate code changes"'
            }
        }
    }

    post {
        success {
            echo 'Orchestra validation passed!'
        }
        failure {
            echo 'Orchestra validation failed!'
        }
    }
}`;
}

/**
 * Simple YAML stringifier (basic implementation)
 */
function stringifyYAML(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let output = '';

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        output += `${spaces}-\n${stringifyYAML(item, indent + 1)}`;
      } else {
        output += `${spaces}- ${item}\n`;
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        output += `${spaces}${key}:\n${stringifyYAML(value, indent + 1)}`;
      } else if (typeof value === 'string') {
        output += `${spaces}${key}: "${value}"\n`;
      } else {
        output += `${spaces}${key}: ${value}\n`;
      }
    }
  }

  return output;
}

/**
 * Create or update CI/CD workflow
 */
export async function setupCI(
  platform: CIPlatform,
  workflowName: string = 'orchestra',
  config: OrchestraCIConfig = {},
  cwd: string = process.cwd()
): Promise<{ success: boolean; path: string; error?: string }> {
  try {
    let workflowContent: string;
    let workflowPath: string;

    switch (platform) {
      case 'github':
        workflowContent = generateGitHubActionsWorkflow(workflowName, config);
        workflowPath = `.github/workflows/${workflowName}.yml`;
        break;

      case 'gitlab':
        workflowContent = generateGitLabCIPipeline(config);
        workflowPath = '.gitlab-ci.yml';
        break;

      case 'jenkins':
        workflowContent = generateJenkinsfile(config);
        workflowPath = 'Jenkinsfile';
        break;

      default:
        return {
          success: false,
          path: '',
          error: `Platform ${platform} not yet supported`,
        };
    }

    const fullPath = path.join(cwd, workflowPath);
    const dir = path.dirname(fullPath);

    // Create directory if it doesn't exist
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Write workflow file
    writeFileSync(fullPath, workflowContent, 'utf-8');

    return {
      success: true,
      path: workflowPath,
    };
  } catch (error) {
    return {
      success: false,
      path: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate CI/CD workflow syntax
 */
export function validateWorkflow(
  platform: CIPlatform,
  workflowPath: string,
  cwd: string = process.cwd()
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const fullPath = path.join(cwd, workflowPath);

  if (!existsSync(fullPath)) {
    errors.push(`Workflow file not found: ${workflowPath}`);
    return { valid: false, errors };
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');

    // Basic validation checks
    if (platform === 'github' || platform === 'gitlab' || platform === 'circleci') {
      // Check for YAML syntax errors
      if (!content.trim()) {
        errors.push('Workflow file is empty');
      }

      // Check for required keys
      if (platform === 'github') {
        if (!content.includes('on:') && !content.includes('on:')) {
          errors.push('Missing trigger configuration (on:)');
        }
        if (!content.includes('jobs:') && !content.includes('steps:')) {
          errors.push('Missing jobs or steps configuration');
        }
      }
    }

    if (platform === 'jenkins') {
      // Check for Groovy syntax basics
      if (!content.includes('pipeline')) {
        errors.push('Missing pipeline block');
      }
      if (!content.includes('stages')) {
        errors.push('Missing stages block');
      }
    }
  } catch (error) {
    errors.push(`Failed to read workflow: ${error}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get Orchestra CI config from existing workflow
 */
export function extractOrchestraConfig(
  platform: CIPlatform,
  workflowPath: string,
  cwd: string = process.cwd()
): OrchestraCIConfig | null {
  const fullPath = path.join(cwd, workflowPath);

  if (!existsSync(fullPath)) {
    return null;
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');

    // Look for orchestra-specific configuration
    const config: OrchestraCIConfig = {
      enabled: content.includes('orchestra') || content.includes('Orchestra'),
      runTests: content.includes('test') || content.includes('Test'),
      runLint: content.includes('lint') || content.includes('Lint'),
      runBuild: content.includes('build') || content.includes('Build'),
      notifyOnFailure: content.includes('notify') || content.includes('post'),
      autoMergeOnSuccess: content.includes('automerge') || content.includes('auto-merge'),
      requiredChecks: [],
    };

    return config;
  } catch {
    return null;
  }
}

/**
 * List all CI/CD workflows in project
 */
export function listWorkflows(cwd: string = process.cwd()): CIConfig[] {
  const workflows: CIConfig[] = [];

  const platforms: CIPlatform[] = ['github', 'gitlab', 'jenkins', 'azure', 'circleci', 'bitbucket'];

  for (const platform of platforms) {
    const config = getCIConfig(platform, cwd);
    if (config) {
      workflows.push(config);
    }
  }

  return workflows;
}

/**
 * Add Orchestra step to existing workflow
 */
export async function addOrchestraStep(
  platform: CIPlatform,
  workflowPath: string,
  cwd: string = process.cwd()
): Promise<{ success: boolean; error?: string }> {
  const fullPath = path.join(cwd, workflowPath);

  if (!existsSync(fullPath)) {
    return {
      success: false,
      error: `Workflow file not found: ${workflowPath}`,
    };
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');

    // Check if Orchestra step already exists
    if (content.includes('orchestra') || content.includes('Orchestra')) {
      return {
        success: false,
        error: 'Orchestra step already exists in workflow',
      };
    }

    // Add Orchestra step based on platform
    let newContent: string;

    switch (platform) {
      case 'github':
        // Add to existing job or create new one
        if (content.includes('steps:')) {
          newContent = content.replace(
            /steps:/,
            `steps:\n        - name: Run Orchestra\n          run: npx orchestra start "Review and validate code changes"\n`
          );
        } else {
          newContent = content + `
jobs:
  orchestra:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Run Orchestra
        run: npx orchestra start "Review and validate code changes"
`;
        }
        break;

      case 'gitlab':
        newContent = content + `
orchestra:
  stage: orchestra
  script:
    - npx orchestra start "Review and validate code changes"
  only:
    - merge_requests
    - main
    - develop
`;
        break;

      case 'jenkins':
        // Add stage to pipeline
        const stageInsert = `\n        stage('Orchestra') {\n            steps {\n                sh 'npx orchestra start "Review and validate code changes"'\n            }\n        }`;
        newContent = content.replace(/(\}\s*$)/, `${stageInsert}\n$1`);
        break;

      default:
        return {
          success: false,
          error: `Platform ${platform} not yet supported for adding steps`,
        };
    }

    writeFileSync(fullPath, newContent, 'utf-8');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
