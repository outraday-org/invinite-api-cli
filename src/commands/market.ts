import { Command } from 'commander';
import { apiGet } from '../client/api-client.js';
import { fetchAllPages } from '../client/pagination.js';
import { withErrorHandling } from '../shared/errors.js';
import { output } from '../shared/output.js';
import { formatTable, printPaginationHint } from '../formatters/table-formatter.js';
import { setJsonMode } from '../shared/spinner.js';

export function registerMarketCommands(program: Command): void {
  const market = program
    .command('market')
    .description('Market data');

  market
    .command('holidays')
    .description('Fetch market holidays')
    .option('-s, --sort <dir>', 'Sort direction', 'asc')
    .option('-l, --limit <n>', 'Max results', '100')
    .option('--offset <n>', 'Offset', '0')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      let data = await apiGet<{ holidays: any[]; next_url?: string }>({
        path: '/v1/market/market-holidays',
        params: { sort: cmdOpts.sort, limit: cmdOpts.limit, offset: cmdOpts.offset },
      });
      if (opts.all && data.next_url) {
        data = await fetchAllPages(data,
          d => d.next_url,
          (acc, page) => ({ ...page, holidays: [...acc.holidays, ...page.holidays] }),
        );
      }
      output(data, opts, () => {
        formatTable(data.holidays, ['day', 'event_name', 'start_time', 'end_time']);
        printPaginationHint(data.next_url);
      });
    }));
}
