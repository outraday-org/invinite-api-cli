import { Command } from 'commander';
import chalk from 'chalk';
import { setApiKey } from '../config/auth.js';
import { setBaseUrl, showConfig, resetConfig } from '../config/config-manager.js';

export function registerConfigCommands(program: Command): void {
  const configCmd = program
    .command('config')
    .description('Manage CLI configuration');

  configCmd
    .command('set-key')
    .description('Set API key (interactive, masked input)')
    .action(async () => {
      const { default: Enquirer } = await import('enquirer');
      const enquirer = new Enquirer();
      const response = await enquirer.prompt({
        type: 'password',
        name: 'key',
        message: 'Enter your Invinite API key:',
      }) as { key: string };
      await setApiKey(response.key);
      console.log(chalk.green('API key saved successfully.'));
    });

  configCmd
    .command('set-url')
    .description('Set API base URL')
    .argument('<url>', 'Base URL for the API')
    .action((url: string) => {
      setBaseUrl(url);
      console.log(chalk.green(`Base URL set to ${url}`));
    });

  configCmd
    .command('show')
    .description('Display current configuration')
    .action(() => {
      const cfg = showConfig();
      console.log(chalk.bold('Current Configuration:'));
      console.log(`  Base URL:    ${cfg.baseUrl}`);
      console.log(`  API Key:     ${cfg.apiKeySet ? chalk.green('configured') : chalk.yellow('not set')}`);
    });

  configCmd
    .command('reset')
    .description('Reset all configuration')
    .action(async () => {
      const { default: Enquirer } = await import('enquirer');
      const enquirer = new Enquirer();
      const response = await enquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to reset all configuration?',
      }) as { confirm: boolean };
      if (response.confirm) {
        resetConfig();
        console.log(chalk.green('Configuration reset.'));
      }
    });
}
