/**
 * Config Loader - Carga configuración desde .orchestrarc.json
 */

import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import type { ProjectConfig, OrchestratorConfig, ModelType } from "../types.js";

const CONFIG_FILES = [
  ".orchestrarc.json",
  ".orchestrarc",
  "orchestra.config.json",
  ".orchestra/config.json",
];

/**
 * Busca y carga el archivo de configuración del proyecto
 */
export async function loadProjectConfig(
  workingDir: string = process.cwd(),
): Promise<ProjectConfig | null> {
  for (const configFile of CONFIG_FILES) {
    const configPath = path.join(workingDir, configFile);
    if (existsSync(configPath)) {
      try {
        const content = await readFile(configPath, "utf-8");
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
  projectConfig: ProjectConfig | null,
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
export async function createDefaultConfig(
  workingDir: string = process.cwd(),
): Promise<string> {
  const defaultConfig: ProjectConfig = {
    defaultTask: "Describe your task here",
    languages: ["python", "javascript", "typescript"],
    test: {
      command: "npm test",
      timeout: 120000,
      runAfterGeneration: true,
    },
    git: {
      autoCommit: false,
      commitMessageTemplate: "feat: {{task}}",
      branch: "main",
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

  const configPath = path.join(workingDir, ".orchestrarc.json");
  await writeFile(configPath, JSON.stringify(defaultConfig, null, 2), "utf-8");

  return configPath;
}

/**
 * Valida la configuración del proyecto
 */
export function validateConfig(config: ProjectConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate languages
  const validLanguages = [
    "python",
    "javascript",
    "typescript",
    "go",
    "rust",
    "json",
    "yaml",
  ];
  if (config.languages) {
    for (const lang of config.languages) {
      if (!validLanguages.includes(lang)) {
        errors.push(
          `Invalid language: ${lang}. Valid options: ${validLanguages.join(", ")}`,
        );
      }
    }
  }

  // Validate execution config
  if (config.execution) {
    if (
      config.execution.maxConcurrency !== undefined &&
      config.execution.maxConcurrency < 1
    ) {
      errors.push("maxConcurrency must be at least 1");
    }
    if (
      config.execution.maxIterations !== undefined &&
      config.execution.maxIterations < 1
    ) {
      errors.push("maxIterations must be at least 1");
    }
    if (
      config.execution.timeout !== undefined &&
      config.execution.timeout < 1000
    ) {
      errors.push("timeout must be at least 1000ms");
    }
  }

  // Validate test config
  if (config.test) {
    if (config.test.timeout !== undefined && config.test.timeout < 1000) {
      errors.push("test.timeout must be at least 1000ms");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Guarda la configuración de la TUI al archivo .orchestrarc.json
 */
export interface TUISettings {
  parallel: boolean;
  maxConcurrency: number;
  autoApprove: boolean;
  runTests: boolean;
  testCommand: string;
  gitCommit: boolean;
  notifications: boolean;
  cacheEnabled: boolean;
  // Recovery Mode settings
  maxRecoveryAttempts: number;
  recoveryTimeoutMinutes: number;
  autoRevertOnFailure: boolean;
  // Agent Models
  agents: {
    architect: ModelType[];
    executor: ModelType[];
    auditor: ModelType[];
    consultant: ModelType[];
  };
}

export async function saveSettings(
  settings: TUISettings,
  workingDir: string = process.cwd(),
): Promise<void> {
  const configPath = path.join(workingDir, ".orchestrarc.json");

  let existingConfig: ProjectConfig = {};

  // Load existing config if it exists
  if (existsSync(configPath)) {
    try {
      const content = await readFile(configPath, "utf-8");
      existingConfig = JSON.parse(content) as ProjectConfig;
    } catch {
      // File exists but couldn't be parsed, start fresh
    }
  }

  // Merge settings into config
  const updatedConfig: ProjectConfig = {
    ...existingConfig,
    execution: {
      ...existingConfig.execution,
      parallel: settings.parallel,
      maxConcurrency: settings.maxConcurrency,
    },
    test: {
      ...existingConfig.test,
      command: settings.testCommand,
      runAfterGeneration: settings.runTests,
    },
    git: {
      ...existingConfig.git,
      autoCommit: settings.gitCommit,
    },
    // Store TUI-specific settings in a dedicated section
    tui: {
      autoApprove: settings.autoApprove,
      notifications: settings.notifications,
      cacheEnabled: settings.cacheEnabled,
      // Recovery Mode settings
      maxRecoveryAttempts: settings.maxRecoveryAttempts,
      recoveryTimeoutMinutes: settings.recoveryTimeoutMinutes,
      autoRevertOnFailure: settings.autoRevertOnFailure,
      // Agent Models
      agents: settings.agents,
    },
  };

  await writeFile(configPath, JSON.stringify(updatedConfig, null, 2), "utf-8");
}

/**
 * Carga la configuración de la TUI desde .orchestrarc.json
 */
export async function loadSettings(
  workingDir: string = process.cwd(),
): Promise<TUISettings | null> {
  const config = await loadProjectConfig(workingDir);

  if (!config) {
    return null;
  }

  const defaultAgents = {
    architect: [
      "Claude (Opus 4.5)",
      "Gemini",
      "Claude (GLM 4.7)",
      "Codex",
    ] as ModelType[],
    executor: [
      "Claude (GLM 4.7)",
      "Gemini",
      "Claude (Opus 4.5)",
      "Codex",
    ] as ModelType[],
    auditor: [
      "Gemini",
      "Claude (GLM 4.7)",
      "Claude (Opus 4.5)",
      "Codex",
    ] as ModelType[],
    consultant: [
      "Claude (Opus 4.5)",
      "Gemini",
      "Claude (GLM 4.7)",
      "Codex",
    ] as ModelType[],
  };

  return {
    parallel: config.execution?.parallel ?? true,
    maxConcurrency: config.execution?.maxConcurrency ?? 3,
    autoApprove: (config as any).tui?.autoApprove ?? false,
    runTests: config.test?.runAfterGeneration ?? false,
    testCommand: config.test?.command ?? "npm test",
    gitCommit: config.git?.autoCommit ?? false,
    notifications: (config as any).tui?.notifications ?? true,
    cacheEnabled: (config as any).tui?.cacheEnabled ?? true,
    // Recovery Mode settings with defaults
    maxRecoveryAttempts: (config as any).tui?.maxRecoveryAttempts ?? 3,
    recoveryTimeoutMinutes: (config as any).tui?.recoveryTimeoutMinutes ?? 10,
    autoRevertOnFailure: (config as any).tui?.autoRevertOnFailure ?? true,
    // Agent Models
    agents: (() => {
      const loadedAgents = (config as any).tui?.agents;
      if (!loadedAgents) return defaultAgents;

      const mergedAgents = { ...defaultAgents };
      const keys = ["architect", "executor", "auditor", "consultant"] as const;

      for (const key of keys) {
        const val = loadedAgents[key];
        if (Array.isArray(val)) {
          mergedAgents[key] = val;
        } else if (typeof val === "string") {
          // Migration: Old string config -> New array config
          // Use loaded value as primary, keep defaults as backfills (excluding duplicates)
          const primary = val as ModelType;
          const defaults = defaultAgents[key].filter((m) => m !== primary);
          mergedAgents[key] = [primary, ...defaults];
        }
      }
      return mergedAgents;
    })(),
  };
}
