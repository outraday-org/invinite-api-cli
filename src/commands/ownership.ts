import { Command } from 'commander';
import { apiGet } from '../client/api-client.js';
import { fetchAllPages } from '../client/pagination.js';
import { withErrorHandling } from '../shared/errors.js';
import { output } from '../shared/output.js';
import { formatTable, printPaginationHint } from '../formatters/table-formatter.js';
import { setJsonMode } from '../shared/spinner.js';
import chalk from 'chalk';

export function registerOwnershipCommands(program: Command): void {
  const ownership = program
    .command('ownership')
    .description('Institutional ownership data');

  ownership
    .command('holdings-by-investor')
    .description('Fetch holdings for an institutional investor')
    .requiredOption('--cik <cik>', 'Institution CIK')
    .option('-s, --sort <dir>', 'Sort direction', 'desc')
    .option('-l, --limit <n>', 'Max results', '100')
    .option('--offset <n>', 'Offset', '0')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      let data = await apiGet<{ cik_institution: string; holdings: any[]; next_url?: string }>({
        path: '/v1/institutional-ownership/holdings-by-investor',
        params: { cik: cmdOpts.cik, sort: cmdOpts.sort, limit: cmdOpts.limit, offset: cmdOpts.offset },
      });
      if (opts.all && data.next_url) {
        data = await fetchAllPages(data,
          d => d.next_url,
          (acc, page) => ({ ...page, holdings: [...acc.holdings, ...page.holdings] }),
        );
      }
      output(data, opts, () => {
        console.log(chalk.bold(`\nInstitution CIK: ${data.cik_institution}\n`));
        formatTable(data.holdings, [
          'ticker_company', 'cik_company', 'name_company', 'cusip_company',
          'cik_institution', 'name_institution',
          'dollar_value', 'shares_or_principal_amount', 'shares_or_principal_amount_type',
          'investment_discretion', 'put_call',
          'voting_authority_sole', 'voting_authority_shared', 'voting_authority_none',
          'calendar_year', 'calendar_quarter', 'period_end', 'filing_date',
          'accession_number', 'link_to_filing_details',
        ]);
        printPaginationHint(data.next_url);
      });
    }));

  ownership
    .command('holdings-by-company')
    .description('Fetch institutional holders of a company')
    .requiredOption('-i, --identifier <ticker>', 'Ticker or CIK')
    .option('--min-value <n>', 'Minimum dollar value')
    .option('-s, --sort <dir>', 'Sort direction', 'desc')
    .option('-l, --limit <n>', 'Max results', '100')
    .option('--offset <n>', 'Offset', '0')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      let data = await apiGet<{ ticker: string; cik: string; holdings: any[]; next_url?: string }>({
        path: '/v1/institutional-ownership/holdings-by-company',
        params: { identifier: cmdOpts.identifier, min_value: cmdOpts.minValue, sort: cmdOpts.sort, limit: cmdOpts.limit, offset: cmdOpts.offset },
      });
      if (opts.all && data.next_url) {
        data = await fetchAllPages(data,
          d => d.next_url,
          (acc, page) => ({ ...page, holdings: [...acc.holdings, ...page.holdings] }),
        );
      }
      output(data, opts, () => {
        console.log(chalk.bold(`\n${data.ticker} (${data.cik}) Institutional Holders\n`));
        formatTable(data.holdings, [
          'name_institution', 'cik_institution',
          'ticker_company', 'cik_company', 'name_company', 'cusip_company',
          'dollar_value', 'shares_or_principal_amount', 'shares_or_principal_amount_type',
          'investment_discretion', 'put_call',
          'voting_authority_sole', 'voting_authority_shared', 'voting_authority_none',
          'calendar_year', 'calendar_quarter', 'period_end', 'filing_date',
          'accession_number', 'link_to_filing_details',
        ]);
        printPaginationHint(data.next_url);
      });
    }));

  ownership
    .command('transactions')
    .description('Fetch institutional transactions')
    .option('--cik <cik>', 'Institution CIK')
    .option('-i, --identifier <ticker>', 'Company ticker or CIK')
    .option('--start-date <date>', 'Start date')
    .option('--end-date <date>', 'End date')
    .option('--type <type>', 'Transaction type (new_buy, added, reduced, sold_out)')
    .option('--calendar-year <year>', 'Calendar year')
    .option('--calendar-quarter <q>', 'Calendar quarter')
    .option('-s, --sort <dir>', 'Sort direction', 'desc')
    .option('-l, --limit <n>', 'Max results', '100')
    .option('--offset <n>', 'Offset', '0')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      let data = await apiGet<{ transactions: any[]; next_url?: string }>({
        path: '/v1/institutional-ownership/transactions',
        params: {
          cik: cmdOpts.cik,
          identifier: cmdOpts.identifier,
          start_date: cmdOpts.startDate,
          end_date: cmdOpts.endDate,
          type: cmdOpts.type,
          calendar_year: cmdOpts.calendarYear,
          calendar_quarter: cmdOpts.calendarQuarter,
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
        formatTable(data.transactions, [
          'cik_institution', 'name_institution',
          'ticker_company', 'cik_company', 'name_company', 'cusip_company',
          'type', 'change_dollar_value',
          'change_shares_or_principal_amount_absolute', 'change_shares_or_principal_amount_percent',
          'shares_or_principal_amount_new', 'shares_or_principal_amount_old',
          'dollar_value', 'shares_or_principal_amount_type',
          'investment_discretion', 'put_call',
          'voting_authority_sole', 'voting_authority_shared', 'voting_authority_none',
          'calendar_year', 'calendar_quarter', 'period_end', 'filing_date',
          'accession_number',
        ]);
        printPaginationHint(data.next_url);
      });
    }));

  ownership
    .command('institutions')
    .description('List institutional investors')
    .option('--ciks <ciks>', 'Comma-separated CIKs')
    .option('-s, --sort <dir>', 'Sort direction', 'asc')
    .option('-l, --limit <n>', 'Max results', '100')
    .option('--offset <n>', 'Offset', '0')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      let data = await apiGet<{ institutions: any[]; next_url?: string }>({
        path: '/v1/institutional-ownership/institutions',
        params: { ciks: cmdOpts.ciks, sort: cmdOpts.sort, limit: cmdOpts.limit, offset: cmdOpts.offset },
      });
      if (opts.all && data.next_url) {
        data = await fetchAllPages(data,
          d => d.next_url,
          (acc, page) => ({ ...page, institutions: [...acc.institutions, ...page.institutions] }),
        );
      }
      output(data, opts, () => {
        formatTable(data.institutions, ['cik', 'name', 'street1', 'street2', 'city', 'state', 'zip_code', 'country']);
        printPaginationHint(data.next_url);
      });
    }));
}
