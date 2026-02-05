/**
 * Learning System CLI Commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { getLearningManager } from '../learning/LearningManager.js';
import type { LearningMode } from '../learning/types.js';

/**
 * Register learning-related commands
 */
export function registerLearningCommands(program: Command): void {
  // ============================================================================
  // COMANDO: learning status
  // ============================================================================
  program
    .command('learning')
    .alias('learn')
    .description('Learning system commands')
    .action(async () => {
      // Default action: show status
      await showLearningStatus();
    });

  // ============================================================================
  // SUBCOMANDO: learning status
  // ============================================================================
  program
    .command('learning-status')
    .description('Show learning system status')
    .action(async () => {
      await showLearningStatus();
    });

  // ============================================================================
  // SUBCOMANDO: learning mode
  // ============================================================================
  program
    .command('learning-mode')
    .description('Get or set learning mode')
    .argument('[mode]', 'Learning mode: disabled, shadow, ab_test, production')
    .action(async (mode?: string) => {
      try {
        const learningManager = getLearningManager();

        if (!mode) {
          // Show current mode
          const currentMode = learningManager.getMode();
          console.log(chalk.bold('Current Learning Mode:'), chalk.cyan(currentMode));
          console.log();
          console.log(chalk.gray('Available modes:'));
          console.log('  ' + chalk.yellow('disabled') + '   - No learning, use rules only');
          console.log('  ' + chalk.blue('shadow') + '     - Collect experiences but use rules');
          console.log('  ' + chalk.green('ab_test') + '    - 10% learned, 90% rules');
          console.log('  ' + chalk.magenta('production') + ' - 100% learned with fallback');
          console.log();
          console.log(chalk.gray('Set mode:') + ' orchestra learning-mode <mode>');
          return;
        }

        // Validate and set mode
        const validModes: LearningMode[] = ['disabled', 'shadow', 'ab_test', 'production'];
        if (!validModes.includes(mode as LearningMode)) {
          console.error(chalk.red('Invalid mode:'), mode);
          console.log(chalk.gray('Valid modes:'), validModes.join(', '));
          process.exit(1);
        }

        learningManager.setMode(mode as LearningMode);
        console.log(chalk.green('✓ Learning mode set to:'), chalk.cyan(mode));

        // Update environment variable
        console.log();
        console.log(chalk.gray('To persist this mode, add to your shell profile:'));
        console.log(chalk.gray(`export ORCHESTRA_LEARNING_MODE=${mode}`));
      } catch (error) {
        console.error(chalk.red('Error:'), (error as Error).message);
        process.exit(1);
      }
    });

  // ============================================================================
  // SUBCOMANDO: learning export
  // ============================================================================
  program
    .command('learning-export')
    .description('Export experiences for training')
    .option('-o, --output <file>', 'Output file', 'experiences-export.json')
    .action(async (options) => {
      try {
        const learningManager = getLearningManager();
        await learningManager.initialize();

        const outputFile = options.output;
        console.log(chalk.blue('→ Exporting experiences...'));

        await learningManager.exportExperiences(outputFile);

        console.log(chalk.green('✓ Experiences exported to:'), chalk.cyan(outputFile));

        // Show stats
        const stats = learningManager.getStats();
        console.log();
        console.log(chalk.bold('Statistics:'));
        console.log('  Total experiences:', chalk.cyan(stats.experienceStats.total));
        console.log('  Mean reward:', chalk.cyan(stats.experienceStats.meanReward.toFixed(2)));
        console.log('  Success rate:', chalk.cyan((stats.experienceStats.successRate * 100).toFixed(1) + '%'));
      } catch (error) {
        console.error(chalk.red('Error:'), (error as Error).message);
        process.exit(1);
      }
    });

  // ============================================================================
  // SUBCOMANDO: learning stats
  // ============================================================================
  program
    .command('learning-stats')
    .description('Show learning statistics')
    .action(async () => {
      try {
        const learningManager = getLearningManager();
        await learningManager.initialize();

        const stats = learningManager.getStats();

        console.log();
        console.log(chalk.cyan('═'.repeat(60)));
        console.log(chalk.cyan.bold('            LEARNING SYSTEM STATISTICS'));
        console.log(chalk.cyan('═'.repeat(60)));
        console.log();

        console.log(chalk.bold('Mode:'), chalk.cyan(stats.mode));
        console.log(chalk.bold('Policy Loaded:'), stats.policyLoaded ? chalk.green('Yes') : chalk.gray('No'));
        console.log();

        console.log(chalk.bold('Experience Buffer:'));
        console.log('  Total experiences:', chalk.cyan(stats.experienceStats.total));
        console.log('  Mean reward:', chalk.cyan(stats.experienceStats.meanReward.toFixed(2)));
        console.log('  Success rate:', chalk.cyan((stats.experienceStats.successRate * 100).toFixed(1) + '%'));
        console.log();

        if (Object.keys(stats.experienceStats.byTaskType).length > 0) {
          console.log(chalk.bold('By Task Type:'));
          for (const [type, count] of Object.entries(stats.experienceStats.byTaskType)) {
            console.log(`  ${type.padEnd(15)} ${chalk.cyan(count)}`);
          }
          console.log();
        }

        if (Object.keys(stats.experienceStats.byDomain).length > 0) {
          console.log(chalk.bold('By Domain:'));
          for (const [domain, count] of Object.entries(stats.experienceStats.byDomain)) {
            console.log(`  ${domain.padEnd(15)} ${chalk.cyan(count)}`);
          }
          console.log();
        }

        console.log(chalk.cyan('═'.repeat(60)));
        console.log();
      } catch (error) {
        console.error(chalk.red('Error:'), (error as Error).message);
        process.exit(1);
      }
    });

  // ============================================================================
  // SUBCOMANDO: learning train
  // ============================================================================
  program
    .command('learning-train')
    .description('Train Actor-Critic policy from collected experiences')
    .option('-e, --epochs <number>', 'Training epochs', '100')
    .option('-o, --output <dir>', 'Output directory for trained model', 'data/models/policy_v1')
    .option('--min-experiences <number>', 'Minimum experiences required', '50')
    .action(async (options) => {
      try {
        const learningManager = getLearningManager();
        await learningManager.initialize();

        const stats = learningManager.getStats();
        const totalExperiences = stats.experienceStats.total;
        const minExperiences = parseInt(options.minExperiences);

        console.log();
        console.log(chalk.cyan('═'.repeat(60)));
        console.log(chalk.cyan.bold('           ACTOR-CRITIC POLICY TRAINING'));
        console.log(chalk.cyan('═'.repeat(60)));
        console.log();

        // Check if we have enough experiences
        if (totalExperiences < minExperiences) {
          console.log(chalk.red('✗ Not enough experiences to train'));
          console.log();
          console.log(chalk.gray(`  Current: ${totalExperiences} experiences`));
          console.log(chalk.gray(`  Required: ${minExperiences} experiences`));
          console.log();
          console.log(chalk.yellow('Collect more experiences by running tasks in shadow mode:'));
          console.log(chalk.gray('  1. ') + chalk.cyan('export ORCHESTRA_LEARNING_MODE=shadow'));
          console.log(chalk.gray('  2. ') + chalk.cyan('orchestra start "your task"'));
          console.log(chalk.gray('  3. ') + chalk.cyan('orchestra learning-stats'));
          console.log();
          process.exit(1);
        }

        console.log(chalk.bold('Training Configuration:'));
        console.log('  Experiences:', chalk.cyan(totalExperiences));
        console.log('  Epochs:', chalk.cyan(options.epochs));
        console.log('  Output:', chalk.cyan(options.output));
        console.log();

        // Train
        console.log(chalk.blue('→ Training Actor-Critic policy...'));
        console.log(chalk.gray('  This may take a few minutes...'));
        console.log();

        const epochs = parseInt(options.epochs);
        const history = await learningManager.trainPolicy(epochs);

        // Show training results
        const lastMetrics = history[history.length - 1];
        console.log();
        console.log(chalk.green('✓ Training complete!'));
        console.log();
        console.log(chalk.bold('Final Metrics:'));
        console.log('  Actor Loss:', chalk.cyan(lastMetrics.actorLoss.toFixed(4)));
        console.log('  Critic Loss:', chalk.cyan(lastMetrics.criticLoss.toFixed(4)));
        console.log('  Mean Reward:', chalk.cyan(lastMetrics.meanReward.toFixed(2)));
        console.log('  Mean Value:', chalk.cyan(lastMetrics.meanValue.toFixed(2)));
        console.log();

        // Evaluate
        console.log(chalk.blue('→ Evaluating policy...'));
        const evalMetrics = await learningManager.evaluatePolicy();

        console.log(chalk.green('✓ Evaluation complete!'));
        console.log();
        console.log(chalk.bold('Evaluation Metrics:'));
        console.log('  Accuracy:', chalk.cyan((evalMetrics.accuracy * 100).toFixed(1) + '%'));
        console.log('  Mean Reward:', chalk.cyan(evalMetrics.meanReward.toFixed(2)));
        console.log('  Success Rate:', chalk.cyan((evalMetrics.successRate * 100).toFixed(1) + '%'));
        console.log();

        // Save model
        console.log(chalk.blue('→ Saving trained model...'));
        await learningManager.savePolicy(options.output);

        console.log(chalk.green('✓ Model saved!'));
        console.log();
        console.log(chalk.cyan('═'.repeat(60)));
        console.log();
        console.log(chalk.bold('Next Steps:'));
        console.log('  1. Test the policy in A/B mode:');
        console.log(chalk.cyan('     orchestra learning-mode ab_test'));
        console.log('  2. Update model path in config if needed');
        console.log('  3. Monitor performance with:');
        console.log(chalk.cyan('     orchestra learning-stats'));
        console.log();
      } catch (error) {
        console.error(chalk.red('Error:'), (error as Error).message);
        process.exit(1);
      }
    });
}

/**
 * Show learning system status
 */
async function showLearningStatus(): Promise<void> {
  try {
    const learningManager = getLearningManager();
    await learningManager.initialize();

    const stats = learningManager.getStats();

    console.log();
    console.log(chalk.cyan('═'.repeat(60)));
    console.log(chalk.cyan.bold('              LEARNING SYSTEM STATUS'));
    console.log(chalk.cyan('═'.repeat(60)));
    console.log();

    // Mode
    const modeColor = {
      disabled: chalk.gray,
      shadow: chalk.blue,
      ab_test: chalk.green,
      production: chalk.magenta,
    }[stats.mode];

    console.log(chalk.bold('Mode:'), modeColor(stats.mode.toUpperCase()));
    console.log(chalk.bold('Policy:'), stats.policyLoaded ? chalk.green('Loaded') : chalk.gray('Not loaded'));
    console.log();

    // Experience stats
    console.log(chalk.bold('Experience Buffer:'));
    if (stats.experienceStats.total > 0) {
      console.log('  Experiences:', chalk.cyan(stats.experienceStats.total));
      console.log('  Mean Reward:', chalk.cyan(stats.experienceStats.meanReward.toFixed(2)));
      console.log('  Success Rate:', chalk.cyan((stats.experienceStats.successRate * 100).toFixed(1) + '%'));
    } else {
      console.log(chalk.gray('  No experiences collected yet'));
    }
    console.log();

    // Mode description
    console.log(chalk.bold('Mode Description:'));
    switch (stats.mode) {
      case 'disabled':
        console.log(chalk.gray('  Learning is disabled. Using rule-based orchestration only.'));
        break;
      case 'shadow':
        console.log(chalk.blue('  Collecting experiences using rules. Not using learned policy yet.'));
        break;
      case 'ab_test':
        console.log(chalk.green('  A/B testing: 10% learned policy, 90% rules.'));
        break;
      case 'production':
        console.log(chalk.magenta('  Using learned policy with fallback to rules.'));
        break;
    }
    console.log();

    // Commands
    console.log(chalk.bold('Commands:'));
    console.log('  ' + chalk.cyan('orchestra learning-mode <mode>') + '  - Set learning mode');
    console.log('  ' + chalk.cyan('orchestra learning-stats') + '         - Show detailed statistics');
    console.log('  ' + chalk.cyan('orchestra learning-export') + '        - Export experiences');
    console.log('  ' + chalk.cyan('orchestra learning-train') + '         - Train policy (placeholder)');
    console.log();

    console.log(chalk.cyan('═'.repeat(60)));
    console.log();
  } catch (error) {
    console.error(chalk.red('Error:'), (error as Error).message);
    process.exit(1);
  }
}
