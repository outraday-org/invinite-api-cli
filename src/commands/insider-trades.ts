import { Command } from 'commander';
import { apiGet } from '../client/api-client.js';
import { fetchAllPages } from '../client/pagination.js';
import { withErrorHandling } from '../shared/errors.js';
import { output } from '../shared/output.js';
import { formatTable, printPaginationHint } from '../formatters/table-formatter.js';
import { setJsonMode } from '../shared/spinner.js';
import chalk from 'chalk';

export function registerInsiderTradesCommands(program: Command): void {
  const insiderTrades = program
    .command('insider-trades')
    .description('Insider trading data');

  insiderTrades
    .command('list')
    .description('Fetch insider transactions')
    .requiredOption('-i, --identifier <ticker>', 'Ticker or CIK')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--acquired-disposed <ad>', 'Filter: A (acquisition) or D (disposition)')
    .option('-s, --sort <dir>', 'Sort direction', 'desc')
    .option('-l, --limit <n>', 'Max results', '100')
    .option('--offset <n>', 'Offset', '0')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      let data = await apiGet<{ ticker: string; cik: string; transactions: any[]; next_url?: string }>({
        path: '/v1/insider-trades',
        params: {
          identifier: cmdOpts.identifier,
          start_date: cmdOpts.startDate,
          end_date: cmdOpts.endDate,
          acquired_disposed: cmdOpts.acquiredDisposed,
          sort: cmdOpts.sort,
          limit: cmdOpts.limit,
          offset: cmdOpts.offset,
        },
      });
      if (opts.all && data.next_url) {
        data = await fetchAllPages(data,
          d => d.next_url,
          (acc, page) => ({ ...page, transactions: [...acc.transactions, ...page.transactions] }),
        );
      }
      output(data, opts, () => {
        console.log(chalk.bold(`\n${data.ticker} (${data.cik}) Insider Trades\n`));
        formatTable(data.transactions, [
          'filed_at', 'period_of_report', 'reporting_person_name',
          'reporting_person_is_director', 'reporting_person_is_officer', 'reporting_person_is_ten_percent_owner', 'reporting_person_is_other',
          'reporting_person_officer_title', 'reporting_person_other_text',
          'security_title', 'acquired_disposed', 'coding_code',
          'shares', 'share_price', 'total',
          'shares_owned_before_transaction', 'shares_owned_following_transaction',
          'accession_number',
        ]);
        printPaginationHint(data.next_url);
      });
    }));
}
