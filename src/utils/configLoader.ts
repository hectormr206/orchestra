/**
 * Config Loader - Carga configuración desde .orchestrarc.json
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { ProjectConfig, OrchestratorConfig } from '../types.js';

const CONFIG_FILES = [
  '.orchestrarc.json',
  '.orchestrarc',
  'orchestra.config.json',
  '.orchestra/config.json',
];

/**
 * Busca y carga el archivo de configuración del proyecto
 */
export async function loadProjectConfig(workingDir: string = process.cwd()): Promise<ProjectConfig | null> {
  for (const configFile of CONFIG_FILES) {
    const configPath = path.join(workingDir, configFile);
    if (existsSync(configPath)) {
      try {
        const content = await readFile(configPath, 'utf-8');
        const config = JSON.parse(content) as ProjectConfig;
        return config;
      } catch (error) {
        console.warn(`Warning: Could not parse ${configFile}: ${error}`);
      }
    }
  }
  return null;
}

/**
 * Combina la configuración del proyecto con la configuración base
 */
export function mergeConfig(
  baseConfig: Partial<OrchestratorConfig>,
  projectConfig: ProjectConfig | null
): Partial<OrchestratorConfig> {
  if (!projectConfig) {
    return baseConfig;
  }

  const merged: Partial<OrchestratorConfig> = { ...baseConfig };

  // Merge execution config
  if (projectConfig.execution) {
    if (projectConfig.execution.parallel !== undefined) {
      merged.parallel = projectConfig.execution.parallel;
    }
    if (projectConfig.execution.maxConcurrency !== undefined) {
      merged.maxConcurrency = projectConfig.execution.maxConcurrency;
    }
    if (projectConfig.execution.maxIterations !== undefined) {
      merged.maxIterations = projectConfig.execution.maxIterations;
    }
    if (projectConfig.execution.timeout !== undefined) {
      merged.timeout = projectConfig.execution.timeout;
    }
  }

  // Merge test config
  if (projectConfig.test) {
    if (projectConfig.test.runAfterGeneration !== undefined) {
      merged.runTests = projectConfig.test.runAfterGeneration;
    }
    if (projectConfig.test.command !== undefined) {
      merged.testCommand = projectConfig.test.command;
    }
  }

  // Merge git config
  if (projectConfig.git) {
    if (projectConfig.git.autoCommit !== undefined) {
      merged.gitCommit = projectConfig.git.autoCommit;
    }
    if (projectConfig.git.commitMessageTemplate !== undefined) {
      merged.commitMessage = projectConfig.git.commitMessageTemplate;
    }
  }

  // Merge languages
  if (projectConfig.languages) {
    merged.languages = projectConfig.languages;
  }

  // Merge custom prompts
  if (projectConfig.prompts) {
    merged.customPrompts = {
      architect: projectConfig.prompts.architect,
      executor: projectConfig.prompts.executor,
      auditor: projectConfig.prompts.auditor,
    };
  }

  return merged;
}

/**
 * Crea un archivo de configuración de ejemplo
 */
export async function createDefaultConfig(workingDir: string = process.cwd()): Promise<string> {
  const defaultConfig: ProjectConfig = {
    defaultTask: 'Describe your task here',
    languages: ['python', 'javascript', 'typescript'],
    test: {
      command: 'npm test',
      timeout: 120000,
      runAfterGeneration: true,
    },
    git: {
      autoCommit: false,
      commitMessageTemplate: 'feat: {{task}}',
      branch: 'main',
    },
    execution: {
      parallel: true,
      maxConcurrency: 3,
      maxIterations: 3,
      timeout: 600000,
    },
    prompts: {
      // Contexto adicional para el Arquitecto
      // architect: "Este proyecto usa clean architecture con DDD",
      // Contexto adicional para el Ejecutor
      // executor: "Usa TypeScript strict, nunca any",
      // Contexto adicional para el Auditor
      // auditor: "Verifica cobertura de tests > 80%",
    },
  };

  const configPath = path.join(workingDir, '.orchestrarc.json');
  await writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');

  return configPath;
}

/**
 * Valida la configuración del proyecto
 */
export function validateConfig(config: ProjectConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate languages
  const validLanguages = ['python', 'javascript', 'typescript', 'go', 'rust', 'json', 'yaml'];
  if (config.languages) {
    for (const lang of config.languages) {
      if (!validLanguages.includes(lang)) {
        errors.push(`Invalid language: ${lang}. Valid options: ${validLanguages.join(', ')}`);
      }
    }
  }

  // Validate execution config
  if (config.execution) {
    if (config.execution.maxConcurrency !== undefined && config.execution.maxConcurrency < 1) {
      errors.push('maxConcurrency must be at least 1');
    }
    if (config.execution.maxIterations !== undefined && config.execution.maxIterations < 1) {
      errors.push('maxIterations must be at least 1');
    }
    if (config.execution.timeout !== undefined && config.execution.timeout < 1000) {
      errors.push('timeout must be at least 1000ms');
    }
  }

  // Validate test config
  if (config.test) {
    if (config.test.timeout !== undefined && config.test.timeout < 1000) {
      errors.push('test.timeout must be at least 1000ms');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
