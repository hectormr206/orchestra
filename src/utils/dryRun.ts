/**
 * Dry Run Mode - Simula ejecución sin crear archivos
 */

import chalk from 'chalk';

export interface DryRunPlan {
  task: string;
  estimatedFiles: string[];
  estimatedDuration: string;
  adaptersToUse: {
    architect: string;
    executor: string;
    auditor: string;
  };
  warnings: string[];
}

export interface DryRunConfig {
  showPlan: boolean;
  showEstimates: boolean;
  showWarnings: boolean;
  outputFormat: 'text' | 'json';
}

const DEFAULT_CONFIG: DryRunConfig = {
  showPlan: true,
  showEstimates: true,
  showWarnings: true,
  outputFormat: 'text',
};

/**
 * Ejecuta análisis de dry-run
 */
export async function analyzeDryRun(
  task: string,
  planContent?: string,
  config: Partial<DryRunConfig> = {}
): Promise<DryRunPlan> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const warnings: string[] = [];

  // Extraer archivos del plan si existe
  const estimatedFiles = planContent ? extractFilesFromPlan(planContent) : estimateFiles(task);

  // Estimar duración basada en cantidad de archivos
  const estimatedDuration = estimateDuration(estimatedFiles.length);

  // Detectar posibles problemas
  if (estimatedFiles.length === 0) {
    warnings.push('No files detected in plan - may need manual file specification');
  }

  if (estimatedFiles.length > 10) {
    warnings.push('Large number of files (' + estimatedFiles.length + ') - consider breaking into smaller tasks');
  }

  // Detectar archivos sensibles
  const sensitivePatterns = ['.env', 'secret', 'password', 'key', 'credential'];
  for (const file of estimatedFiles) {
    for (const pattern of sensitivePatterns) {
      if (file.toLowerCase().includes(pattern)) {
        warnings.push('Potential sensitive file detected: ' + file);
        break;
      }
    }
  }

  // Detectar archivos de configuración críticos
  const criticalFiles = ['package.json', 'tsconfig.json', '.gitignore', 'Dockerfile'];
  for (const file of estimatedFiles) {
    if (criticalFiles.includes(file)) {
      warnings.push('Critical config file will be modified: ' + file);
    }
  }

  return {
    task,
    estimatedFiles,
    estimatedDuration,
    adaptersToUse: {
      architect: 'Codex → Gemini → GLM 4.7',
      executor: 'GLM 4.7',
      auditor: 'Gemini → GLM 4.7',
    },
    warnings,
  };
}

/**
 * Formatea el resultado de dry-run para consola
 */
export function formatDryRunOutput(plan: DryRunPlan, config: Partial<DryRunConfig> = {}): string {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  if (mergedConfig.outputFormat === 'json') {
    return JSON.stringify(plan, null, 2);
  }

  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.cyan.bold('═══════════════════════════════════════════════════════════════'));
  lines.push(chalk.cyan.bold('                    DRY RUN ANALYSIS'));
  lines.push(chalk.cyan.bold('═══════════════════════════════════════════════════════════════'));
  lines.push('');

  // Task
  lines.push(chalk.white.bold('📋 Task:'));
  lines.push(chalk.gray('   ' + plan.task));
  lines.push('');

  // Adapters
  lines.push(chalk.white.bold('🤖 Adapters to use:'));
  lines.push(chalk.gray('   Architect: ') + chalk.green(plan.adaptersToUse.architect));
  lines.push(chalk.gray('   Executor:  ') + chalk.green(plan.adaptersToUse.executor));
  lines.push(chalk.gray('   Auditor:   ') + chalk.green(plan.adaptersToUse.auditor));
  lines.push('');

  // Estimated files
  if (mergedConfig.showPlan && plan.estimatedFiles.length > 0) {
    lines.push(chalk.white.bold('📁 Files to create/modify (' + plan.estimatedFiles.length + '):'));
    for (const file of plan.estimatedFiles) {
      lines.push(chalk.gray('   • ') + chalk.yellow(file));
    }
    lines.push('');
  }

  // Estimates
  if (mergedConfig.showEstimates) {
    lines.push(chalk.white.bold('⏱️  Estimated Duration:'));
    lines.push(chalk.gray('   ' + plan.estimatedDuration));
    lines.push('');
  }

  // Warnings
  if (mergedConfig.showWarnings && plan.warnings.length > 0) {
    lines.push(chalk.yellow.bold('⚠️  Warnings:'));
    for (const warning of plan.warnings) {
      lines.push(chalk.yellow('   • ' + warning));
    }
    lines.push('');
  }

  lines.push(chalk.cyan.bold('═══════════════════════════════════════════════════════════════'));
  lines.push(chalk.gray('   This is a dry run. No files will be created or modified.'));
  lines.push(chalk.gray('   Run without --dry-run to execute the task.'));
  lines.push(chalk.cyan.bold('═══════════════════════════════════════════════════════════════'));
  lines.push('');

  return lines.join('\n');
}

/**
 * Extrae archivos de un plan existente
 */
function extractFilesFromPlan(planContent: string): string[] {
  const files: string[] = [];
  const seen = new Set<string>();

  // Buscar sección de archivos
  const match = planContent.match(/## Archivos a Crear[\\/Modificar]*\n([\s\S]*?)(?=\n##|$)/i);

  if (match) {
    const section = match[1];
    const patterns = [
      /[-*]\s+\*\*[`]?([^`*:\n]+)[`]?\*\*:/g,
      /[-*]\s+[`]([^`:\n]+)[`]:/g,
      /[-*]\s+([^\s:]+\.\w+):/g,
    ];

    for (const pattern of patterns) {
      let fileMatch;
      while ((fileMatch = pattern.exec(section)) !== null) {
        const fileName = fileMatch[1].trim().replace(/[`*]/g, '');
        const cleanName = fileName.split('/').pop() || fileName;
        if (cleanName.includes('.') && !seen.has(cleanName)) {
          seen.add(cleanName);
          files.push(cleanName);
        }
      }
    }
  }

  // Fallback: buscar cualquier archivo mencionado
  if (files.length === 0) {
    const simplePattern = /[`*]*([a-zA-Z_][a-zA-Z0-9_]*\.(py|js|ts|tsx|jsx|md|json|yaml|yml|sh|html|css))[`*]*/g;
    const matches = planContent.matchAll(simplePattern);

    for (const m of matches) {
      const fileName = m[1];
      if (!seen.has(fileName)) {
        seen.add(fileName);
        files.push(fileName);
      }
    }
  }

  return files;
}

/**
 * Estima archivos basados en la tarea (heurística simple)
 */
function estimateFiles(task: string): string[] {
  const taskLower = task.toLowerCase();
  const files: string[] = [];

  // Detectar tipo de proyecto
  if (taskLower.includes('api') || taskLower.includes('rest') || taskLower.includes('backend')) {
    files.push('app.py', 'models.py', 'routes.py', 'requirements.txt');
  }

  if (taskLower.includes('flask')) {
    files.push('app.py', 'models.py', 'requirements.txt');
  }

  if (taskLower.includes('express') || taskLower.includes('node')) {
    files.push('index.js', 'routes.js', 'package.json');
  }

  if (taskLower.includes('react') || taskLower.includes('frontend')) {
    files.push('App.tsx', 'index.tsx', 'package.json');
  }

  if (taskLower.includes('test')) {
    files.push('test_main.py', 'tests/test_unit.py');
  }

  // Si no detectamos nada específico
  if (files.length === 0) {
    files.push('main.py', 'requirements.txt');
  }

  return files;
}

/**
 * Estima duración basada en cantidad de archivos
 */
function estimateDuration(fileCount: number): string {
  // Estimación base: 30s por archivo para el arquitecto
  // + 45s por archivo para el ejecutor
  // + 20s por archivo para el auditor
  const baseSeconds = 30 + (fileCount * (30 + 45 + 20));

  if (baseSeconds < 60) {
    return 'Less than 1 minute';
  } else if (baseSeconds < 300) {
    return '1-5 minutes';
  } else if (baseSeconds < 600) {
    return '5-10 minutes';
  } else if (baseSeconds < 1200) {
    return '10-20 minutes';
  } else {
    return 'More than 20 minutes';
  }
}
