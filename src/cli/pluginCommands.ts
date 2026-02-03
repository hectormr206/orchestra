/**
 * Plugin CLI Commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import {
  getPluginManager,
  PLUGIN_TEMPLATE,
  PLUGIN_MODULE_TEMPLATE,
  createPluginManifest,
  type PluginManifest,
} from '../plugins/PluginManager.js';

/**
 * Register plugin commands with CLI program
 */
export function registerPluginCommands(program: Command): void {
  // =========================================================================
  // COMANDO: plugin - Plugin management
  // =========================================================================
  program
    .command('plugin')
    .description('Plugin management system')
    .argument('[action]', 'Action to perform (list|load|unload|enable|disable|create|info)')
    .option('-n, --name <name>', 'Plugin name/id')
    .option('-p, --path <path>', 'Plugin path')
    .option('-d, --dir <dir>', 'Plugins directory', '.orchestra/plugins')
    .action(async (action, options) => {
      const manager = getPluginManager(options.dir);

      if (!action) {
        // Show plugin management help
        console.log(chalk.bold('Plugin Management'));
        console.log();
        console.log('Actions:');
        console.log('  list     - List all installed plugins');
        console.log('  load     - Load a plugin');
        console.log('  unload   - Unload a plugin');
        console.log('  enable   - Enable a plugin');
        console.log('  disable  - Disable a plugin');
        console.log('  create   - Create a new plugin scaffold');
        console.log('  info     - Show plugin information');
        console.log();
        console.log('Examples:');
        console.log('  orchestra plugin list');
        console.log('  orchestra plugin load --path ./my-plugin');
        console.log('  orchestra plugin create --name my-plugin');
        console.log();
        return;
      }

      switch (action) {
        case 'list': {
          const plugins = manager.getPlugins();

          console.log();
          console.log(chalk.bold('Installed Plugins:'));
          console.log();

          if (plugins.length === 0) {
            console.log(chalk.gray('No plugins installed'));
          } else {
            const stats = manager.getStats();

            for (const plugin of plugins) {
              const status = plugin.enabled
                ? chalk.green('● enabled')
                : chalk.gray('○ disabled');

              console.log(`  ${chalk.cyan(plugin.manifest.name)} ${status}`);
              console.log(`    Version: ${plugin.manifest.version}`);
              console.log(`    Description: ${plugin.manifest.description}`);
              if (plugin.manifest.author) {
                console.log(`    Author: ${plugin.manifest.author}`);
              }
              console.log(`    Hooks: ${Object.keys(plugin.manifest.hooks).join(', ')}`);
              console.log();
            }

            console.log(chalk.gray(`Total: ${stats.total} plugins (${stats.enabled} enabled)`));
          }
          break;
        }

        case 'load': {
          if (!options.path) {
            console.error(chalk.red('Specify plugin path with --path'));
            process.exit(1);
          }

          const fullPath = path.resolve(options.path);
          if (!existsSync(fullPath)) {
            console.error(chalk.red(`Plugin path not found: ${fullPath}`));
            process.exit(1);
          }

          const spinner = ora(`Loading plugin from ${fullPath}...`).start();

          const result = await manager.loadPlugin(fullPath);

          if (result.success) {
            spinner.succeed('Plugin loaded successfully');
          } else {
            spinner.fail('Failed to load plugin');
            console.error(chalk.red(result.error));
            process.exit(1);
          }
          break;
        }

        case 'unload': {
          if (!options.name) {
            console.error(chalk.red('Specify plugin name with --name'));
            process.exit(1);
          }

          const spinner = ora(`Unloading plugin ${options.name}...`).start();

          const result = await manager.unloadPlugin(options.name);

          if (result.success) {
            spinner.succeed('Plugin unloaded successfully');
          } else {
            spinner.fail('Failed to unload plugin');
            console.error(chalk.red(result.error));
            process.exit(1);
          }
          break;
        }

        case 'enable': {
          if (!options.name) {
            console.error(chalk.red('Specify plugin name with --name'));
            process.exit(1);
          }

          const success = manager.setPluginEnabled(options.name, true);

          if (success) {
            console.log(chalk.green(`✓ Plugin enabled: ${options.name}`));
          } else {
            console.error(chalk.red(`Plugin not found: ${options.name}`));
            process.exit(1);
          }
          break;
        }

        case 'disable': {
          if (!options.name) {
            console.error(chalk.red('Specify plugin name with --name'));
            process.exit(1);
          }

          const success = manager.setPluginEnabled(options.name, false);

          if (success) {
            console.log(chalk.green(`✓ Plugin disabled: ${options.name}`));
          } else {
            console.error(chalk.red(`Plugin not found: ${options.name}`));
            process.exit(1);
          }
          break;
        }

        case 'create': {
          if (!options.name) {
            console.error(chalk.red('Specify plugin name with --name'));
            process.exit(1);
          }

          const pluginName = options.name;
          const pluginDir = path.join(options.dir, pluginName);

          if (existsSync(pluginDir)) {
            console.error(chalk.red(`Plugin directory already exists: ${pluginDir}`));
            process.exit(1);
          }

          const spinner = ora(`Creating plugin ${pluginName}...`).start();

          try {
            // Create plugin directory
            mkdirSync(pluginDir, { recursive: true });

            // Create manifest
            const manifest: PluginManifest = {
              ...PLUGIN_TEMPLATE,
              name: pluginName,
              description: `Orchestra plugin: ${pluginName}`,
            };

            const manifestPath = path.join(pluginDir, 'orchestra.json');
            writeFileSync(manifestPath, createPluginManifest(manifest), 'utf-8');

            // Create main module
            const modulePath = path.join(pluginDir, 'index.js');
            writeFileSync(modulePath, PLUGIN_MODULE_TEMPLATE.trim(), 'utf-8');

            // Create package.json if needed
            const packageJson = {
              name: `orchestra-plugin-${pluginName}`,
              version: '1.0.0',
              description: `Orchestra plugin: ${pluginName}`,
              type: 'module',
              exports: './index.js',
            };

            const packageJsonPath = path.join(pluginDir, 'package.json');
            writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');

            spinner.succeed(`Plugin created: ${chalk.cyan(pluginDir)}`);
            console.log();
            console.log(chalk.gray('Next steps:'));
            console.log(chalk.gray(`  1. cd ${pluginDir}`));
            console.log(chalk.gray('  2. Edit orchestra.json to configure hooks'));
            console.log(chalk.gray('  3. Edit index.js to implement hooks'));
            console.log(chalk.gray(`  4. orchestra plugin load --path ${pluginDir}`));
          } catch (error) {
            spinner.fail('Failed to create plugin');
            console.error(chalk.red((error as Error).message));
            process.exit(1);
          }
          break;
        }

        case 'info': {
          if (!options.name) {
            console.error(chalk.red('Specify plugin name with --name'));
            process.exit(1);
          }

          const plugin = manager.getPlugin(options.name);

          if (!plugin) {
            console.error(chalk.red(`Plugin not found: ${options.name}`));
            process.exit(1);
          }

          console.log();
          console.log(chalk.bold('Plugin Information:'));
          console.log();
          console.log(`  Name:        ${chalk.cyan(plugin.manifest.name)}`);
          console.log(`  Version:     ${plugin.manifest.version}`);
          console.log(`  Description: ${plugin.manifest.description}`);
          console.log(`  Status:      ${plugin.enabled ? chalk.green('Enabled') : chalk.gray('Disabled')}`);
          console.log(`  Loaded:      ${plugin.loaded ? chalk.green('Yes') : chalk.gray('No')}`);
          console.log(`  Main:        ${plugin.manifest.main}`);
          if (plugin.manifest.author) {
            console.log(`  Author:      ${plugin.manifest.author}`);
          }
          if (plugin.manifest.license) {
            console.log(`  License:     ${plugin.manifest.license}`);
          }
          if (plugin.manifest.dependencies && plugin.manifest.dependencies.length > 0) {
            console.log(`  Depends On:  ${plugin.manifest.dependencies.join(', ')}`);
          }
          console.log();
          console.log(chalk.bold('Registered Hooks:'));
          for (const [hook, func] of Object.entries(plugin.manifest.hooks)) {
            console.log(`  ${chalk.yellow(hook)} → ${func}`);
          }
          console.log();
          break;
        }

        default:
          console.error(chalk.red(`Unknown action: ${action}`));
          console.error(chalk.gray('Valid actions: list, load, unload, enable, disable, create, info'));
          process.exit(1);
      }
    });

  // =========================================================================
  // COMANDO: hooks - Show available hooks
  // =========================================================================
  program
    .command('hooks')
    .description('List available plugin hooks')
    .action(() => {
      console.log();
      console.log(chalk.bold('Available Plugin Hooks:'));
      console.log();
      console.log(chalk.gray('Lifecycle Hooks:'));
      console.log('  before-init      - Called before Orchestra initializes');
      console.log('  after-init       - Called after Orchestra initializes');
      console.log('  before-plan      - Called before creating plan');
      console.log('  after-plan       - Called after plan is created');
      console.log('  before-execute   - Called before executing code');
      console.log('  after-execute    - Called after executing code');
      console.log('  before-audit     - Called before auditing code');
      console.log('  after-audit      - Called after auditing code');
      console.log('  before-recovery  - Called before recovery mode');
      console.log('  after-recovery   - Called after recovery mode');
      console.log('  before-test      - Called before running tests');
      console.log('  after-test       - Called after running tests');
      console.log('  before-commit    - Called before git commit');
      console.log('  after-commit     - Called after git commit');
      console.log();
      console.log(chalk.gray('Event Hooks:'));
      console.log('  on-complete      - Called when task completes successfully');
      console.log('  on-error         - Called when an error occurs');
      console.log('  on-file-change   - Called in watch mode when file changes');
      console.log();
    });
}
