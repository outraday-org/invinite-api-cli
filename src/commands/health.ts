import { Command } from 'commander';
import { apiGet } from '../client/api-client.js';
import { withErrorHandling } from '../shared/errors.js';
import { output } from '../shared/output.js';
import chalk from 'chalk';

export function registerHealthCommand(program: Command): void {
  program
    .command('health')
    .description('Check API health status')
    .action(withErrorHandling(async () => {
      const parentOpts = program.opts();
      const data = await apiGet<{ status: string; timestamp: string }>({ path: '/health' });
      output(data, parentOpts, () => {
        console.log(chalk.green('✓'), `API is ${data.status}`);
        console.log(chalk.dim(`  Timestamp: ${data.timestamp}`));
      });
    }));
}
