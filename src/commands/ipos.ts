import { Command } from 'commander';
import { apiGet } from '../client/api-client.js';
import { fetchAllPages } from '../client/pagination.js';
import { withErrorHandling } from '../shared/errors.js';
import { output } from '../shared/output.js';
import { formatTable, printPaginationHint } from '../formatters/table-formatter.js';
import { setJsonMode } from '../shared/spinner.js';

export function registerIposCommands(program: Command): void {
  const ipos = program
    .command('ipos')
    .description('IPO listings');

  ipos
    .command('list')
    .description('List IPOs')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('-s, --sort <dir>', 'Sort direction', 'desc')
    .option('-l, --limit <n>', 'Max results', '100')
    .option('--offset <n>', 'Offset', '0')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      let data = await apiGet<{ ipos: any[]; next_url?: string }>({
        path: '/v1/ipos',
        params: {
          start_date: cmdOpts.startDate,
          end_date: cmdOpts.endDate,
          sort: cmdOpts.sort,
          limit: cmdOpts.limit,
          offset: cmdOpts.offset,
        },
      });
      if (opts.all && data.next_url) {
        data = await fetchAllPages(data,
          d => d.next_url,
          (acc, page) => ({ ...page, ipos: [...acc.ipos, ...page.ipos] }),
        );
      }
      output(data, opts, () => {
        formatTable(data.ipos);
        printPaginationHint(data.next_url);
      });
    }));
}
