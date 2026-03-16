import { Command } from 'commander';
import { apiGet } from '../client/api-client.js';
import { withErrorHandling } from '../shared/errors.js';
import { output } from '../shared/output.js';
import { formatTable } from '../formatters/table-formatter.js';
import { setJsonMode } from '../shared/spinner.js';
import chalk from 'chalk';

export function registerMetadataCommands(program: Command): void {
  const metadata = program
    .command('metadata')
    .description('API metadata');

  metadata
    .command('metrics')
    .description('List available standardized metrics')
    .action(withErrorHandling(async () => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      const data = await apiGet<{ metrics: any[] }>({ path: '/v1/metadata/list-available-metrics' });
      output(data, opts, () => {
        formatTable(data.metrics, ['metric_id', 'name']);
      });
    }));

  metadata
    .command('section-ids')
    .description('List available section IDs for SEC filings')
    .action(withErrorHandling(async () => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      const data = await apiGet<{ form_types: any[] }>({ path: '/v1/metadata/list-available-section-ids' });
      output(data, opts, () => {
        for (const ft of data.form_types) {
          console.log(chalk.bold(`\n${ft.form_type}:`));
          formatTable(ft.sections, ['section_id', 'part', 'item_id', 'title']);
        }
      });
    }));
}
