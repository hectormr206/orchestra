#!/usr/bin/env node

/**
 * Meta-Orchestrator CLI
 *
 * Uso:
 *   orchestra start "Crea un API REST"
 *   orchestra start "Crea un API REST" --auto --parallel
 *   orchestra pipeline "Crea un API REST" --auto
 *   orchestra watch "Crea un API REST" --auto
 *   orchestra resume --parallel
 *   orchestra status
 *   orchestra clean
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'readline';
import { Orchestrator, type PlanApprovalResult } from '../orchestrator/Orchestrator.js';
import { StateManager } from '../utils/StateManager.js';
import { createDefaultConfig } from '../utils/configLoader.js';
import { readFile, writeFile } from 'fs/promises';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { TestResult } from '../types.js';
import type { CommitResult } from '../utils/gitIntegration.js';

// ES module equivalents for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Pregunta al usuario y retorna la respuesta
 */
async function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Muestra el plan y solicita aprobación
 */
async function promptPlanApproval(
  planContent: string,
  planFile: string
): Promise<PlanApprovalResult> {
  console.log();
  console.log(chalk.cyan('═'.repeat(60)));
  console.log(chalk.cyan.bold('                    PLAN GENERADO'));
  console.log(chalk.cyan('═'.repeat(60)));
  console.log();
  console.log(planContent);
  console.log();
  console.log(chalk.cyan('═'.repeat(60)));
  console.log();
  console.log(chalk.yellow('Opciones:'));
  console.log(chalk.green('  [A]probar') + ' - Continuar con la implementación');
  console.log(chalk.red('  [R]echazar') + ' - Cancelar la tarea');
  console.log(chalk.blue('  [E]ditar') + ' - Abrir el plan para edición manual');
  console.log();

  const answer = await askQuestion(chalk.bold('¿Qué deseas hacer? [A/r/e]: '));

  const choice = answer.toLowerCase() || 'a';

  switch (choice) {
    case 'a':
    case 'aprobar':
    case 'approve':
    case 'yes':
    case 'y':
    case '':
      console.log(chalk.green('✓ Plan aprobado'));
      return { approved: true };

    case 'r':
    case 'rechazar':
    case 'reject':
    case 'no':
    case 'n':
      console.log(chalk.red('✗ Plan rechazado'));
      return { approved: false, reason: 'rejected' };

    case 'e':
    case 'editar':
    case 'edit':
      console.log(chalk.blue(`→ Edita el plan en: ${planFile}`));
      console.log(chalk.gray('  Guarda los cambios y presiona Enter para continuar...'));
      await askQuestion('');

      // Leer el plan editado
      const editedPlan = await readFile(planFile, 'utf-8');
      console.log(chalk.green('✓ Plan editado guardado'));
      return { approved: false, reason: 'edit', editedPlan };

    default:
      console.log(chalk.yellow('⚠ Opción no reconocida, aprobando por defecto'));
      return { approved: true };
  }
}

/**
 * Estado para mostrar progreso paralelo
 */
interface ParallelState {
  spinner: ReturnType<typeof ora>;
  inProgress: Map<string, number>; // file -> startTime
  completed: number;
  total: number;
}

function createParallelState(): ParallelState {
  return {
    spinner: ora(),
    inProgress: new Map(),
    completed: 0,
    total: 0,
  };
}

function updateParallelSpinner(state: ParallelState) {
  const inProgressFiles = Array.from(state.inProgress.keys());
  if (inProgressFiles.length === 0) {
    return;
  }

  const fileList = inProgressFiles.map(f => chalk.cyan(f)).join(', ');
  state.spinner.text = chalk.yellow(
    `Procesando ${inProgressFiles.length} archivo(s): ${fileList} ` +
    chalk.gray(`[${state.completed}/${state.total}]`)
  );
}

const program = new Command();

// Banner
function showBanner() {
  console.log(chalk.cyan(`
╔════════════════════════════════════════════════════════════╗
║              META-ORCHESTRATOR v0.1.0                      ║
║          Orquestación Inteligente de Agentes IA            ║
╚════════════════════════════════════════════════════════════╝
`));
}

program
  .name('orchestra')
  .description('Meta-Orchestrator for AI development tools')
  .version('0.1.0');

// ============================================================================
// COMANDO: start
// ============================================================================
program
  .command('start <task>')
  .description('Inicia una nueva tarea de orquestación')
  .option('--no-banner', 'No mostrar banner')
  .option('--auto', 'Aprobar plan automáticamente sin confirmación')
  .option('--parallel', 'Procesar archivos en paralelo')
  .option('--concurrency <n>', 'Número máximo de archivos en paralelo', '3')
  .option('--test', 'Ejecutar tests después de la generación')
  .option('--test-command <cmd>', 'Comando de tests personalizado')
  .option('--commit', 'Auto-commit de archivos generados')
  .option('--commit-message <msg>', 'Template de mensaje de commit')
  .action(async (task: string, options: {
    banner: boolean;
    auto: boolean;
    parallel: boolean;
    concurrency: string;
    test: boolean;
    testCommand?: string;
    commit: boolean;
    commitMessage?: string;
  }) => {
    if (options.banner) {
      showBanner();
    }

    console.log(chalk.blue('Task:'), task);
    if (options.auto) {
      console.log(chalk.gray('Modo automático: el plan se aprobará sin confirmación'));
    }
    if (options.parallel) {
      console.log(chalk.gray(`Modo paralelo: hasta ${options.concurrency} archivos simultáneos`));
    }
    if (options.test) {
      console.log(chalk.gray(`Tests: ${options.testCommand || 'auto-detectar'}`));
    }
    if (options.commit) {
      console.log(chalk.gray('Auto-commit: habilitado'));
    }
    console.log();

    const spinner = ora();
    const parallelState = createParallelState();

    const orchestrator = new Orchestrator(
      {
        autoApprove: options.auto,
        parallel: options.parallel,
        maxConcurrency: parseInt(options.concurrency, 10),
        runTests: options.test,
        testCommand: options.testCommand || '',
        gitCommit: options.commit,
        commitMessage: options.commitMessage || '',
      },
      {
        onPhaseStart: (phase, agent) => {
          if (options.parallel && (phase === 'executing' || phase === 'fixing')) {
            parallelState.spinner.start(chalk.yellow(`${agent} iniciando...`));
          } else {
            spinner.start(chalk.yellow(`${agent} trabajando...`));
          }
        },
        onPhaseComplete: (phase, agent, result) => {
          if (options.parallel && (phase === 'executing' || phase === 'fixing')) {
            parallelState.spinner.succeed(
              chalk.green(`${agent} completado`) +
              chalk.gray(` (${(result.duration / 1000).toFixed(1)}s)`)
            );
            parallelState.inProgress.clear();
          } else {
            spinner.succeed(
              chalk.green(`${agent} completado`) +
              chalk.gray(` (${(result.duration / 1000).toFixed(1)}s)`)
            );
          }
        },
        onError: (phase, error) => {
          if (options.parallel) {
            parallelState.spinner.fail(chalk.red(`Error en ${phase}: ${error}`));
          } else {
            spinner.fail(chalk.red(`Error en ${phase}: ${error}`));
          }
        },
        onIteration: (iteration, max) => {
          console.log(chalk.cyan(`  Iteración ${iteration}/${max}`));
        },
        onSyntaxCheck: (file, valid, error) => {
          if (valid) {
            console.log(chalk.green(`    ✓ ${file}: sintaxis válida`));
          } else {
            console.log(chalk.yellow(`    ⚠ ${file}: ${error?.substring(0, 50)}...`));
          }
        },
        onConsultant: (file, reason) => {
          console.log(chalk.magenta(`    → Consultor ayudando con ${file}: ${reason}`));
        },
        onAdapterFallback: (from, to, reason) => {
          console.log(chalk.yellow(`    ⚠ Fallback: ${from} → ${to} (${reason})`));
        },
        onPlanReady: options.auto ? undefined : promptPlanApproval,
        onFileStart: (file, index, total) => {
          if (options.parallel) {
            parallelState.inProgress.set(file, Date.now());
            parallelState.total = total;
            updateParallelSpinner(parallelState);
          }
        },
        onFileComplete: (file, success, duration) => {
          if (options.parallel) {
            parallelState.inProgress.delete(file);
            parallelState.completed++;
            const status = success ? chalk.green('✓') : chalk.red('✗');
            console.log(`    ${status} ${file} ${chalk.gray(`(${(duration / 1000).toFixed(1)}s)`)}`);
            updateParallelSpinner(parallelState);
          }
        },
        onParallelProgress: (completed, total, inProgress) => {
          if (options.parallel) {
            parallelState.completed = completed;
            parallelState.total = total;
            updateParallelSpinner(parallelState);
          }
        },
        onTestStart: (command) => {
          spinner.start(chalk.blue(`Ejecutando tests: ${command}`));
        },
        onTestComplete: (result: TestResult) => {
          if (result.success) {
            spinner.succeed(
              chalk.green(`Tests completados: ${result.passed} passed`) +
              (result.skipped > 0 ? chalk.yellow(`, ${result.skipped} skipped`) : '') +
              chalk.gray(` (${(result.duration / 1000).toFixed(1)}s)`)
            );
          } else {
            spinner.fail(
              chalk.red(`Tests fallaron: ${result.failed} failed, ${result.passed} passed`) +
              chalk.gray(` (${(result.duration / 1000).toFixed(1)}s)`)
            );
          }
        },
        onCommitStart: (files) => {
          spinner.start(chalk.blue(`Creando commit con ${files.length} archivo(s)...`));
        },
        onCommitComplete: (result: CommitResult) => {
          if (result.success) {
            spinner.succeed(
              chalk.green(`Commit creado: ${result.commitHash}`)
            );
          } else {
            spinner.fail(chalk.red(`Error en commit: ${result.error}`));
          }
        },
        onConfigLoaded: (configPath) => {
          console.log(chalk.gray(`  Configuración cargada: ${configPath}`));
        },
      }
    );

    const success = await orchestrator.run(task);

    console.log();
    if (success) {
      console.log(chalk.green('✓ Tarea completada y aprobada por el Auditor'));
      console.log();
      console.log(chalk.gray('Archivos creados en el directorio actual.'));
      console.log(chalk.gray('Plan: .orchestra/plan.md'));
      console.log(chalk.gray('Auditoría: .orchestra/audit-result.json'));
    } else {
      console.log(chalk.red('✗ La tarea no se completó'));
      console.log(chalk.gray('Usa "orchestra status" para ver detalles'));
    }
  });

// ============================================================================
// COMANDO: status
// ============================================================================
program
  .command('status')
  .description('Muestra el estado de la sesión actual')
  .action(async () => {
    const orchestrator = new Orchestrator();
    const status = await orchestrator.getStatus();
    console.log(status);
  });

// ============================================================================
// COMANDO: resume
// ============================================================================
program
  .command('resume')
  .description('Retoma una sesión interrumpida')
  .option('--no-banner', 'No mostrar banner')
  .option('--auto', 'Aprobar plan automáticamente sin confirmación')
  .option('--parallel', 'Procesar archivos en paralelo')
  .option('--concurrency <n>', 'Número máximo de archivos en paralelo', '3')
  .action(async (options: { banner: boolean; auto: boolean; parallel: boolean; concurrency: string }) => {
    if (options.banner) {
      showBanner();
    }

    if (options.auto) {
      console.log(chalk.gray('Modo automático: el plan se aprobará sin confirmación'));
    }
    if (options.parallel) {
      console.log(chalk.gray(`Modo paralelo: hasta ${options.concurrency} archivos simultáneos`));
    }

    const spinner = ora();
    const parallelState = createParallelState();

    const orchestrator = new Orchestrator(
      {
        autoApprove: options.auto,
        parallel: options.parallel,
        maxConcurrency: parseInt(options.concurrency, 10),
      },
      {
        onResume: (sessionId, phase, iteration) => {
          console.log(chalk.cyan(`Retomando sesión: ${sessionId}`));
          console.log(chalk.gray(`  Fase: ${phase}, Iteración: ${iteration}`));
          console.log();
        },
        onPhaseStart: (phase, agent) => {
          if (options.parallel && (phase === 'executing' || phase === 'fixing')) {
            parallelState.spinner.start(chalk.yellow(`${agent} iniciando...`));
          } else {
            spinner.start(chalk.yellow(`${agent} trabajando...`));
          }
        },
        onPhaseComplete: (phase, agent, result) => {
          if (options.parallel && (phase === 'executing' || phase === 'fixing')) {
            parallelState.spinner.succeed(
              chalk.green(`${agent} completado`) +
              chalk.gray(` (${(result.duration / 1000).toFixed(1)}s)`)
            );
            parallelState.inProgress.clear();
          } else {
            spinner.succeed(
              chalk.green(`${agent} completado`) +
              chalk.gray(` (${(result.duration / 1000).toFixed(1)}s)`)
            );
          }
        },
        onError: (phase, error) => {
          if (options.parallel) {
            parallelState.spinner.fail(chalk.red(`Error en ${phase}: ${error}`));
          } else {
            spinner.fail(chalk.red(`Error en ${phase}: ${error}`));
          }
        },
        onIteration: (iteration, max) => {
          console.log(chalk.cyan(`  Iteración ${iteration}/${max}`));
        },
        onSyntaxCheck: (file, valid, error) => {
          if (valid) {
            console.log(chalk.green(`    ✓ ${file}: sintaxis válida`));
          } else {
            console.log(chalk.yellow(`    ⚠ ${file}: ${error?.substring(0, 50)}...`));
          }
        },
        onConsultant: (file, reason) => {
          console.log(chalk.magenta(`    → Consultor ayudando con ${file}: ${reason}`));
        },
        onAdapterFallback: (from, to, reason) => {
          console.log(chalk.yellow(`    ⚠ Fallback: ${from} → ${to} (${reason})`));
        },
        onPlanReady: options.auto ? undefined : promptPlanApproval,
        onFileStart: (file, index, total) => {
          if (options.parallel) {
            parallelState.inProgress.set(file, Date.now());
            parallelState.total = total;
            updateParallelSpinner(parallelState);
          }
        },
        onFileComplete: (file, success, duration) => {
          if (options.parallel) {
            parallelState.inProgress.delete(file);
            parallelState.completed++;
            const status = success ? chalk.green('✓') : chalk.red('✗');
            console.log(`    ${status} ${file} ${chalk.gray(`(${(duration / 1000).toFixed(1)}s)`)}`);
            updateParallelSpinner(parallelState);
          }
        },
        onParallelProgress: (completed, total, inProgress) => {
          if (options.parallel) {
            parallelState.completed = completed;
            parallelState.total = total;
            updateParallelSpinner(parallelState);
          }
        },
      }
    );

    const success = await orchestrator.resume();

    console.log();
    if (success) {
      console.log(chalk.green('✓ Tarea completada y aprobada por el Auditor'));
      console.log();
      console.log(chalk.gray('Archivos creados en el directorio actual.'));
      console.log(chalk.gray('Plan: .orchestra/plan.md'));
      console.log(chalk.gray('Auditoría: .orchestra/audit-result.json'));
    } else {
      console.log(chalk.red('✗ La tarea no se completó'));
      console.log(chalk.gray('Usa "orchestra status" para ver detalles'));
    }
  });

// ============================================================================
// COMANDO: pipeline
// ============================================================================
program
  .command('pipeline <task>')
  .description('Ejecuta en modo pipeline: procesa y audita archivos simultáneamente')
  .option('--no-banner', 'No mostrar banner')
  .option('--auto', 'Aprobar plan automáticamente sin confirmación')
  .option('--concurrency <n>', 'Número máximo de archivos en paralelo', '3')
  .action(async (task: string, options: { banner: boolean; auto: boolean; concurrency: string }) => {
    if (options.banner) {
      showBanner();
    }

    console.log(chalk.blue('Task:'), task);
    console.log(chalk.magenta('Modo Pipeline: ejecutar y auditar simultáneamente'));
    if (options.auto) {
      console.log(chalk.gray('Modo automático: el plan se aprobará sin confirmación'));
    }
    console.log();

    const spinner = ora();
    const parallelState = createParallelState();

    const orchestrator = new Orchestrator(
      {
        autoApprove: options.auto,
        parallel: true,
        pipeline: true,
        maxConcurrency: parseInt(options.concurrency, 10),
      },
      {
        onPhaseStart: (phase, agent) => {
          if (phase === 'pipeline') {
            parallelState.spinner.start(chalk.magenta(`${agent}...`));
          } else {
            spinner.start(chalk.yellow(`${agent} trabajando...`));
          }
        },
        onPhaseComplete: (phase, agent, result) => {
          if (phase === 'pipeline') {
            parallelState.spinner.succeed(
              chalk.magenta(`${agent} completado`) +
              chalk.gray(` (${(result.duration / 1000).toFixed(1)}s)`)
            );
          } else {
            spinner.succeed(
              chalk.green(`${agent} completado`) +
              chalk.gray(` (${(result.duration / 1000).toFixed(1)}s)`)
            );
          }
        },
        onError: (phase, error) => {
          spinner.fail(chalk.red(`Error en ${phase}: ${error}`));
        },
        onIteration: (iteration, max) => {
          console.log(chalk.cyan(`  Iteración ${iteration}/${max}`));
        },
        onSyntaxCheck: (file, valid, error) => {
          if (valid) {
            console.log(chalk.green(`    ✓ ${file}: sintaxis válida`));
          } else {
            console.log(chalk.yellow(`    ⚠ ${file}: ${error?.substring(0, 50)}...`));
          }
        },
        onFileStart: (file, index, total) => {
          parallelState.inProgress.set(file, Date.now());
          parallelState.total = total;
        },
        onFileComplete: (file, success, duration) => {
          parallelState.inProgress.delete(file);
          parallelState.completed++;
          const status = success ? chalk.green('✓') : chalk.red('✗');
          console.log(`    ${status} ${file} ${chalk.gray(`(${(duration / 1000).toFixed(1)}s)`)}`);
        },
        onFileAudit: (file, status, issues) => {
          const icon = status === 'APPROVED' ? chalk.green('✓') : chalk.yellow('⚠');
          const issueText = issues > 0 ? chalk.gray(` (${issues} issues)`) : '';
          console.log(`    ${icon} Audit ${file}: ${status}${issueText}`);
        },
        onPlanReady: options.auto ? undefined : promptPlanApproval,
      }
    );

    const success = await orchestrator.runPipeline(task);

    console.log();
    if (success) {
      console.log(chalk.green('✓ Pipeline completado - todos los archivos aprobados'));
      console.log();
      console.log(chalk.gray('Archivos creados en el directorio actual.'));
      console.log(chalk.gray('Plan: .orchestra/plan.md'));
    } else {
      console.log(chalk.yellow('⚠ Pipeline completado con issues pendientes'));
      console.log(chalk.gray('Usa "orchestra status" para ver detalles'));
    }
  });

// ============================================================================
// COMANDO: watch
// ============================================================================
program
  .command('watch <task>')
  .description('Ejecuta y observa cambios para re-ejecutar automáticamente')
  .option('--no-banner', 'No mostrar banner')
  .option('--auto', 'Aprobar plan automáticamente sin confirmación')
  .option('--parallel', 'Procesar archivos en paralelo')
  .option('--concurrency <n>', 'Número máximo de archivos en paralelo', '3')
  .action(async (task: string, options: { banner: boolean; auto: boolean; parallel: boolean; concurrency: string }) => {
    if (options.banner) {
      showBanner();
    }

    console.log(chalk.blue('Task:'), task);
    console.log(chalk.cyan('Modo Watch: observando cambios...'));
    console.log(chalk.gray('Presiona Ctrl+C para detener'));
    console.log();

    const spinner = ora();
    const parallelState = createParallelState();

    const orchestrator = new Orchestrator(
      {
        autoApprove: options.auto,
        parallel: options.parallel,
        watch: true,
        maxConcurrency: parseInt(options.concurrency, 10),
      },
      {
        onPhaseStart: (phase, agent) => {
          spinner.start(chalk.yellow(`${agent} trabajando...`));
        },
        onPhaseComplete: (phase, agent, result) => {
          spinner.succeed(
            chalk.green(`${agent} completado`) +
            chalk.gray(` (${(result.duration / 1000).toFixed(1)}s)`)
          );
        },
        onError: (phase, error) => {
          spinner.fail(chalk.red(`Error en ${phase}: ${error}`));
        },
        onIteration: (iteration, max) => {
          console.log(chalk.cyan(`  Iteración ${iteration}/${max}`));
        },
        onSyntaxCheck: (file, valid, error) => {
          if (valid) {
            console.log(chalk.green(`    ✓ ${file}: sintaxis válida`));
          } else {
            console.log(chalk.yellow(`    ⚠ ${file}: ${error?.substring(0, 50)}...`));
          }
        },
        onFileStart: (file, index, total) => {
          if (options.parallel) {
            parallelState.inProgress.set(file, Date.now());
            parallelState.total = total;
            updateParallelSpinner(parallelState);
          }
        },
        onFileComplete: (file, success, duration) => {
          if (options.parallel) {
            parallelState.inProgress.delete(file);
            parallelState.completed++;
            const status = success ? chalk.green('✓') : chalk.red('✗');
            console.log(`    ${status} ${file} ${chalk.gray(`(${(duration / 1000).toFixed(1)}s)`)}`);
            updateParallelSpinner(parallelState);
          }
        },
        onPlanReady: options.auto ? undefined : promptPlanApproval,
        onWatchChange: (file, event) => {
          console.log(chalk.cyan(`  → Cambio detectado: ${file} (${event})`));
        },
        onWatchRerun: (trigger, runNumber) => {
          console.log();
          console.log(chalk.cyan('═'.repeat(50)));
          console.log(chalk.cyan(`Re-ejecución #${runNumber} - trigger: ${trigger}`));
          console.log(chalk.cyan('═'.repeat(50)));
        },
      }
    );

    // Manejar Ctrl+C
    process.on('SIGINT', () => {
      console.log();
      console.log(chalk.yellow('Deteniendo watch mode...'));
      orchestrator.stopWatch();
      process.exit(0);
    });

    await orchestrator.watch(task);
  });

// ============================================================================
// COMANDO: plan
// ============================================================================
program
  .command('plan')
  .description('Muestra el plan actual')
  .action(async () => {
    const planFile = '.orchestra/plan.md';

    if (!existsSync(planFile)) {
      console.log(chalk.yellow('No hay plan activo.'));
      console.log(chalk.gray('Usa "orchestra start <task>" para crear uno.'));
      return;
    }

    const content = await readFile(planFile, 'utf-8');
    console.log(content);
  });

// ============================================================================
// COMANDO: clean
// ============================================================================
program
  .command('clean')
  .description('Limpia la sesión actual')
  .action(async () => {
    const { rm } = await import('fs/promises');
    const orchestraDir = '.orchestra';

    if (existsSync(orchestraDir)) {
      await rm(orchestraDir, { recursive: true });
      console.log(chalk.green('✓ Sesión limpiada'));
    } else {
      console.log(chalk.gray('No hay sesión que limpiar'));
    }
  });

// ============================================================================
// COMANDO: doctor
// ============================================================================
program
  .command('doctor')
  .description('Verifica que todo esté configurado correctamente')
  .action(async () => {
    console.log(chalk.cyan('Verificando configuración...\n'));

    // Verificar Claude CLI
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    try {
      const { stdout } = await execFileAsync('claude', ['--version']);
      console.log(chalk.green('✓'), 'Claude CLI:', stdout.trim());
    } catch {
      console.log(chalk.red('✗'), 'Claude CLI no encontrado');
    }

    // Verificar Codex CLI
    try {
      const { stdout } = await execFileAsync('codex', ['--version']);
      console.log(chalk.green('✓'), 'Codex CLI:', stdout.trim());
    } catch {
      console.log(chalk.yellow('⚠'), 'Codex CLI no encontrado (opcional, para Consultor)');
    }

    // Verificar Gemini CLI (opcional)
    try {
      const { stdout } = await execFileAsync('gemini', ['--version']);
      console.log(chalk.green('✓'), 'Gemini CLI:', stdout.trim(), chalk.gray('(disponible)'));
    } catch {
      console.log(chalk.gray('-'), 'Gemini CLI no encontrado (opcional)');
    }

    // Verificar Python
    try {
      const { stdout } = await execFileAsync('python3', ['--version']);
      console.log(chalk.green('✓'), 'Python:', stdout.trim());
    } catch {
      console.log(chalk.red('✗'), 'Python3 no encontrado (necesario para validación)');
    }

    // Verificar ZAI_API_KEY
    if (process.env.ZAI_API_KEY) {
      const key = process.env.ZAI_API_KEY;
      const masked = key.substring(0, 8) + '...' + key.substring(key.length - 4);
      console.log(chalk.green('✓'), 'ZAI_API_KEY:', masked);
    } else {
      console.log(chalk.red('✗'), 'ZAI_API_KEY no configurada');
    }

    // Verificar Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion >= 18) {
      console.log(chalk.green('✓'), 'Node.js:', nodeVersion);
    } else {
      console.log(chalk.yellow('⚠'), 'Node.js:', nodeVersion, '(se requiere 18+)');
    }

    // Verificar archivo de configuración
    const configFiles = ['.orchestrarc.json', '.orchestrarc', 'orchestra.config.json'];
    let configFound = false;
    for (const file of configFiles) {
      if (existsSync(file)) {
        console.log(chalk.green('✓'), 'Configuración:', file);
        configFound = true;
        break;
      }
    }
    if (!configFound) {
      console.log(chalk.gray('-'), 'Configuración: no encontrada (usa "orchestra init" para crear)');
    }

    console.log();
  });

// ============================================================================
// COMANDO: init
// ============================================================================
program
  .command('init')
  .description('Crea un archivo de configuración .orchestrarc.json')
  .option('--force', 'Sobrescribir si ya existe')
  .action(async (options: { force: boolean }) => {
    const configFile = '.orchestrarc.json';

    if (existsSync(configFile) && !options.force) {
      console.log(chalk.yellow('⚠ El archivo .orchestrarc.json ya existe.'));
      console.log(chalk.gray('Usa --force para sobrescribir.'));
      return;
    }

    try {
      const createdPath = await createDefaultConfig(process.cwd());
      console.log(chalk.green('✓ Archivo de configuración creado:'), createdPath);
      console.log();
      console.log(chalk.cyan('Configuración disponible:'));
      console.log(chalk.gray('  - defaultTask: Tarea por defecto'));
      console.log(chalk.gray('  - languages: Lenguajes a validar'));
      console.log(chalk.gray('  - test.command: Comando de tests'));
      console.log(chalk.gray('  - test.runAfterGeneration: Auto-ejecutar tests'));
      console.log(chalk.gray('  - git.autoCommit: Auto-commit'));
      console.log(chalk.gray('  - execution.parallel: Ejecución paralela'));
      console.log(chalk.gray('  - execution.maxConcurrency: Máximo de archivos simultáneos'));
      console.log();
      console.log(chalk.gray('Edita el archivo para personalizar la configuración.'));
    } catch (error) {
      console.log(chalk.red('✗ Error creando configuración:'), error);
    }
  });

// ============================================================================
// COMANDO: validate
// ============================================================================
program
  .command('validate')
  .description('Valida la sintaxis de los archivos generados')
  .action(async () => {
    const planFile = '.orchestra/plan.md';

    if (!existsSync(planFile)) {
      console.log(chalk.yellow('No hay archivos para validar.'));
      console.log(chalk.gray('Ejecuta "orchestra start <task>" primero.'));
      return;
    }

    const spinner = ora('Validando archivos...').start();

    const orchestrator = new Orchestrator(
      {},
      {
        onSyntaxValidation: (result) => {
          const icon = result.valid ? chalk.green('✓') : chalk.red('✗');
          console.log(`  ${icon} ${result.file} (${result.language})`);
          if (!result.valid) {
            for (const err of result.errors) {
              console.log(chalk.red(`    L${err.line}:${err.column} - ${err.message}`));
            }
          }
        },
      }
    );

    try {
      const results = await orchestrator.validateGeneratedFiles();
      spinner.stop();

      const valid = results.filter(r => r.valid).length;
      const invalid = results.filter(r => !r.valid).length;

      console.log();
      if (invalid === 0) {
        console.log(chalk.green(`✓ Todos los archivos válidos (${valid})`));
      } else {
        console.log(chalk.yellow(`⚠ ${invalid} archivo(s) con errores, ${valid} válido(s)`));
      }
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error}`));
    }
  });

// ============================================================================
// COMANDO: github
// ============================================================================
program
  .command('github')
  .description('Integración con GitHub (crear issues/PRs)')
  .option('--issue', 'Crear issue desde los resultados de auditoría')
  .option('--pr', 'Crear PR con los archivos generados')
  .option('--branch <name>', 'Nombre de la rama para el PR')
  .action(async (options: { issue?: boolean; pr?: boolean; branch?: string }) => {
    const { isGitHubAvailable, createIssue, createPullRequest, createBranch, pushBranch, generateIssueFromAudit, generatePRFromTask } = await import('../utils/githubIntegration.js');

    // Verificar disponibilidad de gh CLI
    const available = await isGitHubAvailable();
    if (!available) {
      console.log(chalk.red('✗ GitHub CLI (gh) no está disponible o no autenticado.'));
      console.log(chalk.gray('  Instala: https://cli.github.com/'));
      console.log(chalk.gray('  Autentica: gh auth login'));
      return;
    }

    const planFile = '.orchestra/plan.md';
    const auditFile = '.orchestra/audit-result.json';

    if (!existsSync(planFile)) {
      console.log(chalk.yellow('No hay sesión activa.'));
      console.log(chalk.gray('Ejecuta "orchestra start <task>" primero.'));
      return;
    }

    const planContent = await readFile(planFile, 'utf-8');
    const taskMatch = planContent.match(/## Objetivo\n([^\n]+)/);
    const task = taskMatch ? taskMatch[1] : 'Tarea de Orchestra';

    if (options.issue) {
      // Crear issue desde auditoría
      if (!existsSync(auditFile)) {
        console.log(chalk.yellow('No hay resultados de auditoría.'));
        return;
      }

      const auditContent = JSON.parse(await readFile(auditFile, 'utf-8'));
      const issues = auditContent.issues || [];

      if (issues.length === 0) {
        console.log(chalk.green('✓ No hay issues que reportar.'));
        return;
      }

      const spinner = ora('Creando issue en GitHub...').start();
      const issueData = generateIssueFromAudit(task, issues);
      const result = await createIssue(issueData);

      if (result.success) {
        spinner.succeed(chalk.green('Issue creado: ' + result.url));
      } else {
        spinner.fail(chalk.red('Error: ' + result.error));
      }
    }

    if (options.pr) {
      const branchName = options.branch || 'orchestra/' + Date.now();

      // Obtener archivos del plan
      const { extractFilesFromPlan } = await import('../prompts/executor.js');
      const files = extractFilesFromPlan(planContent).map(f => f.path);

      const spinner = ora('Creando PR en GitHub...').start();

      // Crear rama y hacer push
      spinner.text = 'Creando rama...';
      const branchCreated = await createBranch(branchName);
      if (!branchCreated) {
        spinner.fail(chalk.red('Error creando rama'));
        return;
      }

      spinner.text = 'Haciendo push...';
      const pushed = await pushBranch(branchName);
      if (!pushed) {
        spinner.fail(chalk.red('Error haciendo push'));
        return;
      }

      spinner.text = 'Creando PR...';
      const prData = generatePRFromTask(task, files, branchName);
      const result = await createPullRequest(prData);

      if (result.success) {
        spinner.succeed(chalk.green('PR creado: ' + result.url));
      } else {
        spinner.fail(chalk.red('Error: ' + result.error));
      }
    }

    if (!options.issue && !options.pr) {
      console.log(chalk.cyan('Opciones disponibles:'));
      console.log(chalk.gray('  --issue    Crear issue desde auditoría'));
      console.log(chalk.gray('  --pr       Crear PR con archivos generados'));
      console.log(chalk.gray('  --branch   Nombre de rama para PR'));
    }
  });

// ============================================================================
// COMANDO: dry-run
// ============================================================================
program
  .command('dry-run <task>')
  .description('Analiza una tarea sin ejecutar (muestra plan estimado)')
  .option('--json', 'Salida en formato JSON')
  .action(async (task: string, options: { json?: boolean }) => {
    const { analyzeDryRun, formatDryRunOutput } = await import('../utils/dryRun.js');
    const planFile = '.orchestra/plan.md';

    // Si existe un plan, usarlo para análisis más preciso
    let planContent: string | undefined;
    if (existsSync(planFile)) {
      planContent = await readFile(planFile, 'utf-8');
    }

    const analysis = await analyzeDryRun(task, planContent);
    const output = formatDryRunOutput(analysis, {
      outputFormat: options.json ? 'json' : 'text',
    });

    console.log(output);
  });

// ============================================================================
// COMANDO: export
// ============================================================================
program
  .command('export')
  .description('Exporta la sesión actual a Markdown/JSON/CSV/HTML')
  .option('--format <type>', 'Formato: markdown, json, csv, html, both', 'both')
  .option('--output <dir>', 'Directorio de salida', '.orchestra/exports')
  .action(async (options: { format: 'markdown' | 'json' | 'csv' | 'html' | 'both'; output: string }) => {
    const sessionExportModule = await import('../utils/sessionExport.js');
    const stateFile = '.orchestra/session-state.json';
    const planFile = '.orchestra/plan.md';
    const auditFile = '.orchestra/audit-result.json';

    if (!existsSync(stateFile)) {
      console.log(chalk.yellow('No hay sesión para exportar.'));
      console.log(chalk.gray('Ejecuta "orchestra start <task>" primero.'));
      return;
    }

    const spinner = ora('Exportando sesión...').start();

    try {
      const stateContent = JSON.parse(await readFile(stateFile, 'utf-8'));
      const planContent = existsSync(planFile) ? await readFile(planFile, 'utf-8') : undefined;
      const auditContent = existsSync(auditFile) ? JSON.parse(await readFile(auditFile, 'utf-8')) : undefined;

      const sessionData = {
        id: stateContent.sessionId || 'unknown',
        task: stateContent.task || 'Unknown task',
        startTime: stateContent.startTime || new Date().toISOString(),
        endTime: stateContent.endTime,
        status: stateContent.status || 'completed',
        plan: planContent,
        files: (stateContent.files || []).map((f: any) => ({
          path: f.path || f,
          description: f.description || '',
          status: f.status || 'created',
        })),
        iterations: stateContent.iterations || [],
        metrics: stateContent.metrics,
      };

      const savedFiles = await sessionExportModule.saveSession(sessionData, options.format, options.output);

      spinner.succeed(chalk.green('Sesión exportada'));
      for (const file of savedFiles) {
        console.log(chalk.gray('  → ' + file));
      }
    } catch (error) {
      spinner.fail(chalk.red('Error exportando: ' + error));
    }
  });

// ============================================================================
// COMANDO: history
// ============================================================================
program
  .command('history')
  .description('Muestra el historial de sesiones')
  .option('--limit <n>', 'Número de sesiones a mostrar', '10')
  .option('--status <status>', 'Filtrar por estado (completed, failed, running)')
  .option('--search <query>', 'Buscar en tareas')
  .option('--full-search <query>', 'Búsqueda full-text (task, plan, logs, errors)')
  .option('--from <date>', 'Fecha desde (YYYY-MM-DD)')
  .option('--to <date>', 'Fecha hasta (YYYY-MM-DD)')
  .option('--fields <fields>', 'Campos para búsqueda full-text (task,plan,logs,errors)', 'task,plan,logs,errors')
  .option('--stats', 'Mostrar estadísticas')
  .option('--load <id>', 'Cargar detalles de una sesión')
  .option('--delete <id>', 'Eliminar una sesión')
  .action(async (options: {
    limit: string;
    status?: string;
    search?: string;
    fullSearch?: string;
    from?: string;
    to?: string;
    fields?: string;
    stats?: boolean;
    load?: string;
    delete?: string;
  }) => {
    const { SessionHistory } = await import('../utils/sessionHistory.js');
    const history = new SessionHistory();
    await history.init();

    if (options.delete) {
      const deleted = await history.deleteSession(options.delete);
      if (deleted) {
        console.log(chalk.green('✓ Sesión eliminada: ' + options.delete));
      } else {
        console.log(chalk.yellow('Sesión no encontrada: ' + options.delete));
      }
      return;
    }

    if (options.load) {
      const session = await history.loadFullSession(options.load);
      if (session) {
        console.log(chalk.cyan.bold('Sesión: ' + session.id));
        console.log();
        console.log(chalk.white('Task: ') + session.task);
        console.log(chalk.white('Status: ') + session.status);
        console.log(chalk.white('Start: ') + session.startTime);
        if (session.endTime) {
          console.log(chalk.white('End: ') + session.endTime);
        }
        console.log(chalk.white('Files: ') + session.files.length);
        console.log();
        if (session.plan) {
          console.log(chalk.cyan('Plan:'));
          console.log(session.plan);
        }
      } else {
        console.log(chalk.yellow('Sesión no encontrada: ' + options.load));
      }
      return;
    }

    if (options.stats) {
      const stats = history.getStats();
      console.log(chalk.cyan.bold('Estadísticas del Historial'));
      console.log();
      console.log(chalk.white('Total sesiones: ') + stats.total);
      console.log(chalk.green('Completadas: ') + stats.completed);
      console.log(chalk.red('Fallidas: ') + stats.failed);
      console.log(chalk.white('Duración promedio: ') + formatDurationMs(stats.avgDuration));
      console.log(chalk.white('Archivos promedio: ') + stats.avgFiles.toFixed(1));
      return;
    }

    let sessions;

    // Full-text search if --full-search is provided
    if (options.fullSearch) {
      const searchOptions: any = { status: options.status };

      if (options.from) {
        searchOptions.dateFrom = new Date(options.from);
      }
      if (options.to) {
        searchOptions.dateTo = new Date(options.to);
      }
      if (options.fields) {
        searchOptions.searchFields = options.fields.split(',') as ('task' | 'plan' | 'logs' | 'errors')[];
      }

      const spinner = ora('Buscando en sesiones...').start();
      sessions = await history.fullTextSearch(options.fullSearch, searchOptions);
      spinner.succeed(`Encontradas ${sessions.length} sesiones`);

      if (options.limit) {
        sessions = sessions.slice(0, parseInt(options.limit, 10));
      }
    } else {
      // Regular list with basic filters
      sessions = history.list({
        limit: parseInt(options.limit, 10),
        status: options.status,
        search: options.search,
      });
    }

    if (sessions.length === 0) {
      console.log(chalk.gray('No hay sesiones en el historial.'));
      return;
    }

    console.log(chalk.cyan.bold('Historial de Sesiones'));
    console.log();
    for (const session of sessions) {
      console.log(SessionHistory.formatForConsole(session));
    }
    console.log();
    console.log(chalk.gray('Usa --load <id> para ver detalles, --stats para estadísticas'));
  });

// ============================================================================
// COMANDO: notify (configurar notificaciones)
// ============================================================================
program
  .command('notify')
  .description('Configurar notificaciones')
  .option('--test', 'Enviar notificación de prueba')
  .option('--slack <url>', 'Configurar webhook de Slack')
  .option('--webhook <url>', 'Configurar webhook genérico')
  .action(async (options: { test?: boolean; slack?: string; webhook?: string }) => {
    const { NotificationService } = await import('../utils/notifications.js');

    if (options.test) {
      const notifier = new NotificationService({ enabled: true, desktop: true });
      await notifier.notify({
        title: '🎵 Orchestra Test',
        message: 'Las notificaciones están funcionando correctamente.',
        type: 'info',
      });
      console.log(chalk.green('✓ Notificación de prueba enviada'));
      return;
    }

    if (options.slack || options.webhook) {
      // Guardar configuración
      const configPath = '.orchestra/notifications.json';
      const config: any = {};

      if (existsSync(configPath)) {
        const existing = JSON.parse(await readFile(configPath, 'utf-8'));
        Object.assign(config, existing);
      }

      if (options.slack) {
        config.slack = { webhookUrl: options.slack };
        console.log(chalk.green('✓ Webhook de Slack configurado'));
      }

      if (options.webhook) {
        config.webhook = { url: options.webhook };
        console.log(chalk.green('✓ Webhook genérico configurado'));
      }

      const { mkdir } = await import('fs/promises');
      if (!existsSync('.orchestra')) {
        await mkdir('.orchestra', { recursive: true });
      }
      await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
      console.log(chalk.gray('Configuración guardada en: ' + configPath));
      return;
    }

    console.log(chalk.cyan('Opciones de notificación:'));
    console.log(chalk.gray('  --test            Enviar notificación de prueba'));
    console.log(chalk.gray('  --slack <url>     Configurar webhook de Slack'));
    console.log(chalk.gray('  --webhook <url>   Configurar webhook genérico'));
  });

// ============================================================================
// COMANDO: cache
// ============================================================================
program
  .command('cache')
  .description('Gestionar cache de resultados')
  .option('--list', 'Listar entradas en cache')
  .option('--stats', 'Mostrar estadísticas del cache')
  .option('--clear', 'Limpiar todo el cache')
  .action(async (options: { list?: boolean; stats?: boolean; clear?: boolean }) => {
    const { ResultCache } = await import('../utils/cache.js');
    const cache = new ResultCache();
    await cache.init();

    if (options.clear) {
      await cache.clear();
      console.log(chalk.green('✓ Cache limpiado'));
      return;
    }

    if (options.stats) {
      const stats = cache.getStats();
      console.log(chalk.cyan.bold('Estadísticas del Cache'));
      console.log();
      console.log(chalk.white('Entradas: ') + stats.entries);
      if (stats.oldestEntry) {
        console.log(chalk.white('Más antigua: ') + stats.oldestEntry);
      }
      if (stats.newestEntry) {
        console.log(chalk.white('Más reciente: ') + stats.newestEntry);
      }
      return;
    }

    if (options.list) {
      const entries = cache.list();
      if (entries.length === 0) {
        console.log(chalk.gray('Cache vacío.'));
        return;
      }

      console.log(chalk.cyan.bold('Entradas en Cache'));
      console.log();
      for (const entry of entries) {
        const status = entry.success ? chalk.green('✓') : chalk.red('✗');
        const date = new Date(entry.timestamp).toLocaleString();
        console.log(status + ' ' + entry.taskHash.substring(0, 8) + ' | ' + date + ' | ' + entry.task.substring(0, 50) + '...');
      }
      return;
    }

    console.log(chalk.cyan('Opciones de cache:'));
    console.log(chalk.gray('  --list    Listar entradas'));
    console.log(chalk.gray('  --stats   Ver estadísticas'));
    console.log(chalk.gray('  --clear   Limpiar cache'));
  });

// ============================================================================
// COMANDO: tui (Interfaz Visual en Terminal)
// ============================================================================
program
  .command('tui')
  .description('Abre la interfaz visual en terminal (TUI)')
  .option('--task <task>', 'Iniciar con una tarea específica')
  .option('--auto', 'Auto-iniciar la tarea (requiere --task)')
  .action(async (options: { task?: string; auto?: boolean }) => {
    const { startTUI } = await import('../tui/index.js');
    await startTUI({
      task: options.task,
      autoStart: options.auto && !!options.task,
    });
  });

// ============================================================================
// COMANDO: web
// ============================================================================
program
  .command('web')
  .description('Inicia servidor API y UI web de Orchestra')
  .option('--api-port <n>', 'Puerto del servidor API', '3001')
  .option('--ui-port <n>', 'Puerto de la interfaz web', '3002')
  .option('--no-open', 'No abrir navegador automáticamente')
  .action(async (options: {
    apiPort: string;
    uiPort: string;
    open: boolean;
  }) => {
    const { spawn } = await import('child_process');
    const { existsSync } = await import('fs');
    const open = await import('open');

    console.log(chalk.cyan('╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.cyan.bold('               Orchestra Web Interface') + chalk.cyan('                  ║'));
    console.log(chalk.cyan('╚════════════════════════════════════════════════════════════╝'));
    console.log();
    console.log(chalk.bold('Working Directory:'));
    console.log(`  ${chalk.cyan(process.cwd())}`);
    console.log();
    console.log(chalk.bold('Services:'));
    console.log(`  API Server:  ${chalk.green(`http://localhost:${options.apiPort}`)}`);
    console.log(`  Web UI:      ${chalk.green(`http://localhost:${options.uiPort}`)}`);
    console.log();

    // Find Orchestra installation directory
    const orchestraRoot = path.resolve(__dirname, '../..');
    const webPath = path.join(orchestraRoot, 'src/web');
    const serverPath = path.join(orchestraRoot, 'src/web/server.ts');
    const nodeModulesPath = path.join(webPath, 'node_modules');

    // Check if dependencies are installed
    if (!existsSync(nodeModulesPath)) {
      console.log(chalk.yellow('⚠️  Installing web dependencies...'));
      const { execSync } = await import('child_process');
      try {
        execSync('npm install', { cwd: webPath, stdio: 'inherit' });
        console.log(chalk.green('✓ Dependencies installed'));
        console.log();
      } catch (error) {
        console.error(chalk.red('Failed to install dependencies'));
        process.exit(1);
      }
    }

    const processes: any[] = [];
    let apiServerFailed = false;

    // Start API Server
    console.log(chalk.yellow('Starting API server...'));
    const apiProcess = spawn('npx', ['tsx', serverPath], {
      env: { ...process.env, PORT: options.apiPort },
      shell: true,
    });

    apiProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) console.log(chalk.gray('[API]'), output);
    });

    apiProcess.stderr?.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('ExperimentalWarning')) {
        console.error(chalk.red('[API ERROR]'), output);
        if (output.includes('EADDRINUSE') || output.includes('address already in use')) {
          apiServerFailed = true;
        }
      }
    });

    apiProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        apiServerFailed = true;
      }
    });

    processes.push(apiProcess);

    // Wait for API server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (apiServerFailed) {
      console.log();
      console.error(chalk.red('✗ API server failed to start'));
      console.error(chalk.yellow(`\nPort ${options.apiPort} may be in use. Try:`));
      console.error(chalk.gray(`  1. Kill existing processes: lsof -ti:${options.apiPort} | xargs kill -9`));
      console.error(chalk.gray(`  2. Use a different port: orchestra web --api-port 4001`));
      console.log();

      // Kill any started processes
      for (const proc of processes) {
        try {
          proc.kill('SIGTERM');
        } catch (e) {
          // Ignore
        }
      }
      process.exit(1);
    }

    console.log(chalk.green('✓ API server started'));
    console.log();

    // Start Web UI
    console.log(chalk.yellow('Starting web UI...'));
    const webProcess = spawn('npm', ['run', 'dev'], {
      cwd: webPath,
      env: { ...process.env, VITE_API_URL: `http://localhost:${options.apiPort}` },
      shell: true,
    });

    webProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) console.log(chalk.gray('[WEB]'), output);
    });

    webProcess.stderr?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) console.error(chalk.red('[WEB ERROR]'), output);
    });

    processes.push(webProcess);

    // Wait for web server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log(chalk.green('✓ Web UI started'));
    console.log();

    // Open browser
    if (options.open) {
      console.log(chalk.cyan('Opening browser...'));
      try {
        await open.default(`http://localhost:${options.uiPort}`);
      } catch (error) {
        console.log(chalk.yellow('Could not open browser automatically'));
        console.log(chalk.gray('Open manually: ') + chalk.cyan(`http://localhost:${options.uiPort}`));
      }
    }

    console.log();
    console.log(chalk.green.bold('✓ Orchestra Web is ready!'));
    console.log();
    console.log(chalk.gray('  The API server is running in the current directory:'));
    console.log(chalk.gray(`  ${process.cwd()}`));
    console.log();
    console.log(chalk.gray('  All file operations will be performed here.'));
    console.log(chalk.gray('  Sessions are stored in: .orchestra/'));
    console.log();
    console.log(chalk.yellow('Press Ctrl+C to stop all services'));
    console.log();

    // Handle graceful shutdown
    const shutdownHandler = async () => {
      console.log();
      console.log(chalk.yellow('Shutting down services...'));

      for (const proc of processes) {
        try {
          proc.kill('SIGTERM');
        } catch (e) {
          // Ignore errors
        }
      }

      // Give processes time to clean up
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log(chalk.green('✓ All services stopped'));
      process.exit(0);
    };

    process.on('SIGINT', shutdownHandler);
    process.on('SIGTERM', shutdownHandler);
  });

// ============================================================================
// COMANDO: completion
// ============================================================================
program
  .command('completion')
  .description('Shell completion setup')
  .option('--bash', 'Install bash completion')
  .option('--zsh', 'Install zsh completion')
  .option('--fish', 'Install fish completion')
  .option('--install', 'Install to shell config')
  .option('--uninstall', 'Uninstall completion')
  .action(async (options: {
    bash?: boolean;
    zsh?: boolean;
    fish?: boolean;
    install?: boolean;
    uninstall?: boolean;
  }) => {
    const { execSync } = await import('child_process');
    const os = await import('os');

    // Detect shell
    const shell = process.env.SHELL || '';
    const isBash = shell.includes('bash') || options.bash;
    const isZsh = shell.includes('zsh') || options.zsh;
    const isFish = shell.includes('fish') || options.fish;

    if (options.uninstall) {
      console.log(chalk.yellow('Uninstalling orchestra completion...'));

      const homeDir = os.homedir();
      const configFiles = [
        path.join(homeDir, '.bashrc'),
        path.join(homeDir, '.bash_profile'),
        path.join(homeDir, '.zshrc'),
        path.join(homeDir, '.config/fish/config.fish'),
      ];

      for (const configFile of configFiles) {
        try {
          let content = await readFileSync(configFile, 'utf-8');
          const completionLine = '# orchestra completion';

          if (content.includes(completionLine)) {
            // Remove completion block
            content = content.replace(
              /# orchestra completion[\s\S]*?# end orchestra completion\n?/,
              ''
            );
            await writeFileSync(configFile, content, 'utf-8');
            console.log(chalk.green(`✓ Removed from ${path.basename(configFile)}`));
          }
        } catch (e) {
          // File doesn't exist or can't be read
        }
      }

      console.log(chalk.green('✓ Completion uninstalled'));
      console.log(chalk.gray('  Restart your shell for changes to take effect'));
      return;
    }

    // Determine which shell to install for
    let targetShell = isBash ? 'bash' : isZsh ? 'zsh' : isFish ? 'fish' : 'bash';
    if (options.bash) targetShell = 'bash';
    if (options.zsh) targetShell = 'zsh';
    if (options.fish) targetShell = 'fish';

    const completionFile = `orchestra-completion.${targetShell}`;
    const sourceLine = `source "${path.resolve(__dirname, '../../', completionFile)}"`;

    console.log(chalk.blue(`Installing ${targetShell} completion for orchestra...`));

    if (targetShell === 'bash') {
      const bashrc = path.join(os.homedir(), '.bashrc');
      try {
        let content = '';
        try {
          content = await readFileSync(bashrc, 'utf-8');
        } catch (e) {}

        if (!content.includes('# orchestra completion')) {
          content += `\n# orchestra completion\n${sourceLine} 2>/dev/null || true\n# end orchestra completion\n`;
          await writeFileSync(bashrc, content, 'utf-8');
          console.log(chalk.green(`✓ Added to ~/.bashrc`));
        } else {
          console.log(chalk.yellow('  Already installed in ~/.bashrc'));
        }
      } catch (e) {
        console.log(chalk.red(`✗ Failed to update ~/.bashrc: ${e}`));
        console.log(chalk.gray(`  Add this line to ~/.bashrc:`));
        console.log(chalk.gray(`  ${sourceLine}`));
      }
    } else if (targetShell === 'zsh') {
      const zshrc = path.join(os.homedir(), '.zshrc');
      try {
        let content = '';
        try {
          content = await readFileSync(zshrc, 'utf-8');
        } catch (e) {}

        if (!content.includes('# orchestra completion')) {
          content += `\n# orchestra completion\nfpath=("${path.dirname(__dirname)}/share/zsh/site-functions"); \nsource "${path.resolve(__dirname, '../../', completionFile)}"\n# end orchestra completion\n`;
          await writeFileSync(zshrc, content, 'utf-8');
          console.log(chalk.green(`✓ Added to ~/.zshrc`));
        } else {
          console.log(chalk.yellow('  Already installed in ~/.zshrc'));
        }
      } catch (e) {
        console.log(chalk.red(`✗ Failed to update ~/.zshrc: ${e}`));
        console.log(chalk.gray(`  Add these lines to ~/.zshrc:`));
        console.log(chalk.gray(`  fpath=("${path.dirname(__dirname)}/share/zsh/site-functions");`));
        console.log(chalk.gray(`  ${sourceLine}`));
      }
    } else if (targetShell === 'fish') {
      const fishConfigDir = path.join(os.homedir(), '.config/fish');
      const fishConfig = path.join(fishConfigDir, 'config.fish');

      try {
        await execSync(`mkdir -p "${fishConfigDir}"`);
        let content = '';
        try {
          content = await readFileSync(fishConfig, 'utf-8');
        } catch (e) {}

        if (!content.includes('# orchestra completion')) {
          content += `\n# orchestra completion\n${sourceLine}\n# end orchestra completion\n`;
          await writeFileSync(fishConfig, content, 'utf-8');
          console.log(chalk.green(`✓ Added to ~/.config/fish/config.fish`));
        } else {
          console.log(chalk.yellow('  Already installed in ~/.config/fish/config.fish'));
        }
      } catch (e) {
        console.log(chalk.red(`✗ Failed to update config.fish: ${e}`));
        console.log(chalk.gray(`  Add this line to ~/.config/fish/config.fish:`));
        console.log(chalk.gray(`  ${sourceLine}`));
      }
    }

    console.log();
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.gray('  1. Restart your shell or run:'));
    console.log(chalk.gray(`     source ${targetShell === 'bash' ? '~/.bashrc' : targetShell === 'zsh' ? '~/.zshrc' : '~/.config/fish/config.fish'}`));
    console.log(chalk.gray('  2. Type: orchestra <command> and press Tab to see completions'));
    console.log();
  });

// ============================================================================
// COMANDO: profile
// ============================================================================
program
  .command('profile')
  .description('Manage configuration profiles')
  .argument('[action]', 'Action: list, show, apply, create, delete')
  .argument('[name]', 'Profile name')
  .option('--inherit <profile>', 'Parent profile to inherit from')
  .action(async (action: string | undefined, name: string | undefined, options: {
    inherit?: string;
  }) => {
    const { getProfileManager } = await import('../utils/profiles.js');

    if (!action || action === 'list') {
      const profiles = getProfileManager().listProfiles();
      console.log(chalk.cyan('Available profiles:'));
      for (const profile of profiles) {
        console.log(`  ${chalk.green('•')} ${profile}`);
      }
      return;
    }

    if (action === 'show' && name) {
      const profile = getProfileManager().loadProfile(name);
      if (!profile) {
        console.log(chalk.red(`Profile "${name}" not found`));
        process.exit(1);
      }
      console.log(chalk.cyan(`Profile: ${profile.name}`));
      if (profile.inherits) {
        console.log(chalk.gray(`Inherits: ${profile.inherits}`));
      }
      console.log(chalk.gray('Settings:'));
      console.log(JSON.stringify(profile.settings, null, 2));
      if (profile.environment) {
        console.log(chalk.gray('Environment:'));
        console.log(JSON.stringify(profile.environment, null, 2));
      }
      return;
    }

    if (action === 'apply' && name) {
      try {
        const settings = getProfileManager().applyProfile(name);
        console.log(chalk.green(`✓ Applied profile: ${name}`));
        console.log(chalk.gray('Settings loaded:'));
        console.log(JSON.stringify(settings, null, 2));
      } catch (e: any) {
        console.log(chalk.red(`✗ Failed to apply profile: ${e.message}`));
        process.exit(1);
      }
      return;
    }

    if (action === 'create' && name) {
      const { loadSettings } = await import('../utils/configLoader.js');
      const { getProfileManager } = await import('../utils/profiles.js');
      const currentSettings = await loadSettings();

      const profile = {
        name,
        inherits: options.inherit,
        settings: (currentSettings || {}) as any,
        environment: {},
      };

      getProfileManager().saveProfile(profile);
      console.log(chalk.green(`✓ Created profile: ${name}`));
      return;
    }

    if (action === 'delete' && name) {
      const profiles = getProfileManager().listProfiles();
      if (!profiles.includes(name)) {
        console.log(chalk.red(`Profile "${name}" not found`));
        process.exit(1);
      }

      if (name === 'development' || name === 'staging' || name === 'production') {
        console.log(chalk.red('Cannot delete default profiles'));
        process.exit(1);
      }

      getProfileManager().deleteProfile(name);
      console.log(chalk.green(`✓ Deleted profile: ${name}`));
      return;
    }

    console.log(chalk.red('Unknown action. Use: list, show, apply, create, delete'));
    process.exit(1);
  });

// ============================================================================
// COMANDO: profiler - Performance profiling y optimización
// ============================================================================
program
  .command('profiler')
  .description('Performance profiling and optimization tools')
  .option('-s, --start <operation>', 'Start profiling an operation')
  .option('-e, --end <operation>', 'End profiling and show report')
  .option('-m, --memory', 'Show current memory usage')
  .option('-b, --baseline', 'Set baseline for comparison')
  .option('-c, --compare', 'Compare current state with baseline')
  .option('-r, --report <file>', 'Generate report from saved profile data')
  .option('--clear', 'Clear all profiling data')
  .action(async (options) => {
    const { getProfiler, PerformanceProfiler } = await import('../utils/profiler.js');
    const { default: chalk } = await import('chalk');

    const profiler = getProfiler();

    if (options.memory) {
      console.log(chalk.bold('Current Memory Usage:'));
      console.log('  ' + PerformanceProfiler.getMemoryUsage());
      return;
    }

    if (options.baseline) {
      profiler.setBaseline();
      console.log(chalk.green('✓ Baseline set'));
      console.log('  ' + PerformanceProfiler.getMemoryUsage());
      return;
    }

    if (options.compare) {
      const comparison = profiler.compareWithBaseline();
      if (!comparison) {
        console.log(chalk.yellow('No baseline set. Use --baseline first.'));
        return;
      }
      console.log(chalk.bold('Comparison with Baseline:'));
      console.log(`  Memory Delta: ${(comparison.memory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  CPU Delta: ${(comparison.cpu / 1000).toFixed(2)}s`);
      return;
    }

    if (options.start) {
      profiler.start(options.start);
      console.log(chalk.green(`✓ Profiling started: ${options.start}`));
      console.log(chalk.gray('Run with --end when operation completes'));
      return;
    }

    if (options.end) {
      try {
        const report = profiler.end(options.end);
        console.log(PerformanceProfiler.formatReport(report));

        // Save report if bottlenecks detected
        if (report.bottlenecks.length > 0) {
          const reportPath = `.orchestra/profiles/${options.end.replace(/\//g, '-')}-${Date.now()}.json`;
          const { writeFileSync, mkdirSync } = await import('fs');
          mkdirSync('.orchestra/profiles', { recursive: true });
          writeFileSync(reportPath, JSON.stringify(report, null, 2));
          console.log(chalk.gray(`\nReport saved: ${reportPath}`));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
      }
      return;
    }

    if (options.clear) {
      profiler.clear();
      console.log(chalk.green('✓ Profiling data cleared'));
      return;
    }

    // Show help if no option provided
    console.log(chalk.bold('Performance Profiler'));
    console.log('');
    console.log('Usage:');
    console.log('  orchestra profiler --memory          Show current memory usage');
    console.log('  orchestra profiler --baseline        Set baseline for comparison');
    console.log('  orchestra profiler --compare         Compare with baseline');
    console.log('  orchestra profiler --start <op>      Start profiling operation');
    console.log('  orchestra profiler --end <op>        End profiling and show report');
    console.log('  orchestra profiler --clear           Clear profiling data');
    console.log('');
    console.log('Examples:');
    console.log('  orchestra profiler --start "agent-execution"');
    console.log('  orchestra profiler --end "agent-execution"');
  });

// ============================================================================
// COMANDO: server (modo servidor para orquestación remota)
// ============================================================================
program
  .command('server')
  .description('Inicia Orchestra en modo servidor para orquestación remota')
  .option('-p, --port <n>', 'Puerto del servidor', '8080')
  .option('-h, --host <address>', 'Dirección de escucha', '0.0.0.0')
  .option('-t, --token <token>', 'Token de autenticación (opcional)')
  .option('--no-cors', 'Desactivar CORS')
  .option('-c, --max-connections <n>', 'Número máximo de conexiones', '10')
  .action(async (options: {
    port: string;
    host: string;
    token?: string;
    cors: boolean;
    maxConnections: string;
  }) => {
    const { OrchestraServer } = await import('../server/OrchestraServer.js');
    const server = new OrchestraServer({
      port: parseInt(options.port),
      host: options.host,
      authToken: options.token,
      enableCors: options.cors,
      maxConnections: parseInt(options.maxConnections),
    });

    console.log(chalk.cyan('╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.cyan.bold('           Orchestra Server - Remote Orchestration') + chalk.cyan('          ║'));
    console.log(chalk.cyan('╚════════════════════════════════════════════════════════════╝'));
    console.log();
    console.log(chalk.gray('Server configuration:'));
    console.log(`  Host: ${chalk.cyan(options.host)}`);
    console.log(`  Port: ${chalk.cyan(options.port)}`);
    console.log(`  CORS: ${options.cors ? chalk.green('enabled') : chalk.red('disabled')}`);
    console.log(`  Auth: ${options.token ? chalk.green('enabled') : chalk.yellow('disabled (not recommended for production)')}`);
    console.log(`  Max connections: ${chalk.cyan(options.maxConnections)}`);
    console.log();
    console.log(chalk.yellow('Press Ctrl+C to stop the server'));
    console.log();

    try {
      await server.start();
    } catch (error) {
      console.error(chalk.red('Failed to start server:'), error);
      process.exit(1);
    }

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log();
      console.log(chalk.yellow('Stopping Orchestra Server...'));
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log();
      console.log(chalk.yellow('Stopping Orchestra Server...'));
      await server.stop();
      process.exit(0);
    });
  });

// ============================================================================
// COMANDO: remote (CLI remoto vía WebSocket)
// ============================================================================
program
  .command('remote <action>')
  .description('Cliente CLI remoto para servidor Orchestra')
  .option('-u, --url <url>', 'URL del servidor Orchestra', 'http://localhost:8080')
  .option('-t, --token <token>', 'Token de autenticación')
  .option('-s, --session <id>', 'ID de sesión (para attach/cancel/status)')
  .option('--watch', 'Modo watch - seguir mostrando logs')
  .action(async (action: string, options: {
    url: string;
    token?: string;
    session?: string;
    watch?: boolean;
  }) => {
    const { OrchestraClient } = await import('../client/OrchestraClient.js');

    const client = new OrchestraClient({
      url: options.url,
      authToken: options.token,
      reconnect: false,
    });

    try {
      switch (action) {
        case 'connect': {
          await client.connect();
          console.log(chalk.green('✓ Connected to Orchestra Server'));

          // Set up message handler
          client.onMessage((data) => {
            console.log(JSON.stringify(data, null, 2));
          });

          // Keep connection open
          process.on('SIGINT', () => {
            client.disconnect();
            process.exit(0);
          });

          break;
        }

        case 'orchestrate': {
          if (!options.session) {
            console.error(chalk.red('Error: Task description required'));
            console.error(chalk.gray('Usage: orchestra remote orchestrate <task>'));
            process.exit(1);
          }

          const sessionId = await client.orchestrate({
            task: options.session,
          });

          console.log(chalk.green('✓ Orchestration started'));
          console.log(chalk.cyan(`Session ID: ${sessionId}`));

          if (options.watch) {
            // Connect to WebSocket for real-time updates
            await client.connect();
            client.attach(sessionId);

            client.onMessage((data) => {
              if (data.type === 'complete' || data.type === 'error') {
                console.log(chalk.cyan('Session completed:'));
                console.log(JSON.stringify(data, null, 2));
                client.disconnect();
                process.exit(0);
              }
            });

            // Keep connection open
            process.on('SIGINT', () => {
              client.disconnect();
              process.exit(0);
            });
          }

          break;
        }

        case 'list': {
          const result = await client.listSessions();
          console.log(chalk.bold(`Active Sessions (${result.count}):`));
          console.log();

          if (result.sessions.length === 0) {
            console.log(chalk.gray('No active sessions'));
          } else {
            for (const session of result.sessions) {
              const statusColor = session.status === 'running' ? chalk.green : session.status === 'completed' ? chalk.blue : chalk.red;
              console.log(`${chalk.cyan(session.sessionId)}: ${statusColor(session.status)} - ${session.task}`);
              console.log(`  Started: ${new Date(session.startTime).toLocaleString()}`);
              if (session.endTime) {
                console.log(`  Ended: ${new Date(session.endTime).toLocaleString()}`);
              }
              console.log(`  Clients: ${session.clientCount}`);
              console.log();
            }
          }

          break;
        }

        case 'status': {
          if (!options.session) {
            const status = await client.getStatus();
            console.log(chalk.bold('Server Status:'));
            console.log(`  Server: ${chalk.green(status.server)}`);
            console.log(`  Version: ${chalk.cyan(status.version)}`);
            console.log(`  Uptime: ${Math.floor(status.uptime / 60)}m ${Math.floor(status.uptime % 60)}s`);
            console.log(`  Connections: ${chalk.cyan(status.connections)}`);
            console.log(`  Active Sessions: ${chalk.cyan(status.activeSessions)}`);
            console.log(`  Total Sessions: ${chalk.cyan(status.totalSessions)}`);
          } else {
            const session = await client.getSession(options.session);
            console.log(chalk.bold('Session Status:'));
            console.log(`  ID: ${chalk.cyan(session.sessionId)}`);
            console.log(`  Status: ${session.status === 'running' ? chalk.green('running') : chalk.blue(session.status)}`);
            console.log(`  Task: ${session.task}`);
            console.log(`  Started: ${new Date(session.startTime).toLocaleString()}`);
            if (session.endTime) {
              console.log(`  Ended: ${new Date(session.endTime).toLocaleString()}`);
            }
            console.log(`  Clients: ${session.clientCount}`);
          }

          break;
        }

        case 'cancel': {
          if (!options.session) {
            console.error(chalk.red('Error: Session ID required'));
            console.error(chalk.gray('Usage: orchestra remote cancel --session <id>'));
            process.exit(1);
          }

          const result = await client.cancelSession(options.session);
          console.log(chalk.green('✓'), result.message);
          console.log(chalk.cyan(`Session ID: ${result.sessionId}`));

          break;
        }

        case 'attach': {
          if (!options.session) {
            console.error(chalk.red('Error: Session ID required'));
            console.error(chalk.gray('Usage: orchestra remote attach --session <id>'));
            process.exit(1);
          }

          await client.connect();
          console.log(chalk.green(`✓ Attached to session: ${options.session}`));

          client.attach(options.session);

          client.onMessage((data) => {
            if (data.sessionId === options.session) {
              console.log(JSON.stringify(data, null, 2));
            }
          });

          // Keep connection open
          process.on('SIGINT', () => {
            client.detach();
            client.disconnect();
            process.exit(0);
          });

          break;
        }

        default:
          console.error(chalk.red(`Unknown action: ${action}`));
          console.log();
          console.log(chalk.bold('Available actions:'));
          console.log('  connect           - Connect to server (WebSocket)');
          console.log('  orchestrate       - Start orchestration task');
          console.log('  list              - List all sessions');
          console.log('  status            - Show server/session status');
          console.log('  cancel            - Cancel a running session');
          console.log('  attach            - Attach to session for real-time updates');
          console.log();
          console.log(chalk.bold('Examples:'));
          console.log('  orchestra remote connect');
          console.log('  orchestra remote orchestrate "Create API endpoint" --watch');
          console.log('  orchestra remote list');
          console.log('  orchestra remote status');
          console.log('  orchestra remote status --session abc123');
          console.log('  orchestra remote cancel --session abc123');
          console.log('  orchestra remote attach --session abc123');
          process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), (error as Error).message);
      process.exit(1);
    }
  });

// ============================================================================
// COMANDO: marketplace (gestión de plugins)
// ============================================================================
program
  .command('marketplace <action>')
  .description('Gestionar marketplace de plugins de Orchestra')
  .option('-s, --search <query>', 'Buscar plugins')
  .option('-c, --category <category>', 'Filtrar por categoría')
  .option('-i, --info <plugin>', 'Mostrar información de un plugin')
  .option('--install <plugin>', 'Instalar un plugin')
  .option('--uninstall <plugin>', 'Desinstalar un plugin')
  .option('-f, --force', 'Forzar reinstalación')
  .option('-v, --verbose', 'Salida detallada')
  .action(async (action: string, options: {
    search?: string;
    category?: string;
    info?: string;
    install?: string;
    uninstall?: string;
    force?: boolean;
    verbose?: boolean;
  }) => {
    const { PluginMarketplace } = await import('../marketplace/PluginMarketplace.js');
    const marketplace = new PluginMarketplace();

    try {
      switch (action) {
        case 'search': {
          const query = options.search || '';
          const category = options.category;

          const result = await marketplace.search(query, category);

          console.log(chalk.bold(`Found ${result.total} plugin(s):`));
          console.log();

          if (result.plugins.length === 0) {
            console.log(chalk.gray('No plugins found'));
          } else {
            for (const plugin of result.plugins) {
              const badge = plugin.official ? chalk.green('[OFFICIAL]') : chalk.gray('[COMMUNITY]');
              console.log(`${badge} ${chalk.cyan(plugin.name)} (${chalk.yellow(plugin.id)})`);
              console.log(`  ${plugin.description}`);
              console.log(`  Version: ${plugin.version} | Author: ${plugin.author}`);
              console.log(`  Category: ${plugin.category} | Tags: ${plugin.tags.join(', ')}`);
              console.log(`  Rating: ${'★'.repeat(Math.floor(plugin.rating))}${'☆'.repeat(5 - Math.floor(plugin.rating))} (${plugin.rating})`);
              console.log();
            }
          }

          break;
        }

        case 'list': {
          const result = await marketplace.list();

          console.log(chalk.bold(`Available Plugins (${result.total}):`));
          console.log();

          if (result.plugins.length === 0) {
            console.log(chalk.gray('No plugins available'));
          } else {
            const categories = await marketplace.getCategories();

            for (const category of categories) {
              console.log(chalk.bold(`${category}:`));
              const categoryPlugins = result.plugins.filter((p) => p.category === category);

              for (const plugin of categoryPlugins) {
                const badge = plugin.official ? chalk.green('✓') : chalk.gray('·');
                console.log(`  ${badge} ${chalk.cyan(plugin.id)} - ${plugin.name} v${plugin.version}`);
              }
              console.log();
            }
          }

          break;
        }

        case 'info': {
          const pluginId = options.info;

          if (!pluginId) {
            console.error(chalk.red('Error: Plugin ID required'));
            console.error(chalk.gray('Usage: orchestra marketplace info --info <plugin>'));
            process.exit(1);
          }

          const plugin = await marketplace.info(pluginId);

          if (!plugin) {
            console.error(chalk.red(`Plugin "${pluginId}" not found`));
            process.exit(1);
          }

          console.log(chalk.bold(plugin.name));
          console.log(chalk.gray('─'.repeat(50)));
          console.log();
          console.log(`ID:        ${chalk.cyan(plugin.id)}`);
          console.log(`Version:   ${chalk.yellow(plugin.version)}`);
          console.log(`Author:    ${plugin.author}`);
          console.log(`License:   ${plugin.license}`);
          console.log(`Category:  ${plugin.category}`);
          console.log(`Official:  ${plugin.official ? chalk.green('Yes') : chalk.gray('No')}`);
          console.log(`Verified:  ${plugin.verified ? chalk.green('Yes') : chalk.gray('No')}`);
          console.log(`Rating:    ${'★'.repeat(Math.floor(plugin.rating))}${'☆'.repeat(5 - Math.floor(plugin.rating))} (${plugin.rating})`);
          console.log(`Downloads: ${plugin.downloads}`);
          console.log();
          console.log(chalk.bold('Description:'));
          console.log(`  ${plugin.description}`);
          console.log();
          console.log(chalk.bold('Tags:'));
          console.log(`  ${plugin.tags.join(', ')}`);
          console.log();
          console.log(chalk.bold('Repository:'));
          console.log(`  ${plugin.repository.url}`);
          console.log();
          console.log(chalk.bold('Hooks:'));
          for (const [hook, fn] of Object.entries(plugin.manifest.hooks)) {
            console.log(`  ${hook}: ${fn}`);
          }

          break;
        }

        case 'install': {
          const pluginId = options.install;

          if (!pluginId) {
            console.error(chalk.red('Error: Plugin ID required'));
            console.error(chalk.gray('Usage: orchestra marketplace install --install <plugin>'));
            process.exit(1);
          }

          const installOptions = {
            force: options.force,
            verbose: options.verbose,
          };

          const result = await marketplace.install(pluginId, installOptions);

          if (result.success) {
            console.log(chalk.green('✓'), result.message);
            if (result.installedPath) {
              console.log(chalk.gray(`  Path: ${result.installedPath}`));
            }
          } else {
            console.error(chalk.red('✗'), result.message);
            process.exit(1);
          }

          break;
        }

        case 'uninstall': {
          const pluginId = options.uninstall;

          if (!pluginId) {
            console.error(chalk.red('Error: Plugin ID required'));
            console.error(chalk.gray('Usage: orchestra marketplace uninstall --uninstall <plugin>'));
            process.exit(1);
          }

          const result = await marketplace.uninstall(pluginId);

          if (result.success) {
            console.log(chalk.green('✓'), result.message);
          } else {
            console.error(chalk.red('✗'), result.message);
            process.exit(1);
          }

          break;
        }

        case 'installed': {
          const installed = await marketplace.listInstalled();

          console.log(chalk.bold(`Installed Plugins (${installed.length}):`));
          console.log();

          if (installed.length === 0) {
            console.log(chalk.gray('No plugins installed'));
          } else {
            for (const manifest of installed) {
              console.log(`${chalk.cyan(manifest.name)} - v${manifest.version}`);
              console.log(`  ${manifest.description}`);
              console.log(`  Hooks: ${Object.keys(manifest.hooks).join(', ')}`);
              console.log();
            }
          }

          break;
        }

        case 'categories': {
          const categories = await marketplace.getCategories();

          console.log(chalk.bold('Categories:'));
          for (const category of categories) {
            console.log(`  - ${category}`);
          }

          break;
        }

        case 'tags': {
          const tags = await marketplace.getTags();

          console.log(chalk.bold('Available Tags:'));
          console.log(`  ${tags.join(', ')}`);
          console.log();

          break;
        }

        default:
          console.error(chalk.red(`Unknown action: ${action}`));
          console.log();
          console.log(chalk.bold('Available actions:'));
          console.log('  search            - Search for plugins');
          console.log('  list              - List all available plugins');
          console.log('  info              - Show plugin details');
          console.log('  install           - Install a plugin');
          console.log('  uninstall         - Uninstall a plugin');
          console.log('  installed         - List installed plugins');
          console.log('  categories        - List all categories');
          console.log('  tags              - List all tags');
          console.log();
          console.log(chalk.bold('Examples:'));
          console.log('  orchestra marketplace search --search express');
          console.log('  orchestra marketplace search --category "Backend Frameworks"');
          console.log('  orchestra marketplace list');
          console.log('  orchestra marketplace info --info express-js');
          console.log('  orchestra marketplace install --install express-js');
          console.log('  orchestra marketplace uninstall --uninstall express-js');
          console.log('  orchestra marketplace installed');
          console.log('  orchestra marketplace categories');
          console.log('  orchestra marketplace tags');
          process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), (error as Error).message);
      process.exit(1);
    }
  });

// ============================================================================
// COMANDO: default (sin argumentos abre TUI)
// ============================================================================
program
  .action(() => {
    // Si no hay comando, mostrar ayuda
    program.help();
  });

// ============================================================================
// REGISTRAR COMANDOS DE INTEGRACIÓN
// ============================================================================
import { registerIntegrationCommands } from './integrationCommands.js';
registerIntegrationCommands(program);

// ============================================================================
// REGISTRAR COMANDOS DE PLUGINS
// ============================================================================
import { registerPluginCommands } from './pluginCommands.js';
registerPluginCommands(program);

// ============================================================================
// REGISTRAR COMANDOS DE LEARNING
// ============================================================================
import { registerLearningCommands } from './learningCommands.js';
registerLearningCommands(program);

// Helper function para formatear duración
function formatDurationMs(ms: number): string {
  if (ms < 1000) return ms + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return minutes + 'm ' + seconds + 's';
}

// Ejecutar
program.parse();
