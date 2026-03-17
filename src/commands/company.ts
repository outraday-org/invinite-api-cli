import { Command } from 'commander';
import { apiGet } from '../client/api-client.js';
import { fetchAllPages } from '../client/pagination.js';
import { withErrorHandling } from '../shared/errors.js';
import { output } from '../shared/output.js';
import { formatTable, formatKeyValue, printPaginationHint } from '../formatters/table-formatter.js';
import { setJsonMode } from '../shared/spinner.js';

export function registerCompanyCommands(program: Command): void {
  const company = program
    .command('company')
    .description('Company information');

  // list
  company
    .command('list')
    .description('List all available companies')
    .action(withErrorHandling(async () => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      const data = await apiGet<{ count: number; companies: any[] }>({ path: '/v1/company/available-companies' });
      output(data, opts, () => {
        console.log(`Total companies: ${data.count}\n`);
        formatTable(data.companies, ['ticker', 'cik', 'name']);
      });
    }));

  // search
  company
    .command('search')
    .description('Search companies by ticker or name')
    .requiredOption('-q, --query <text>', 'Search text')
    .option('-l, --limit <n>', 'Max results', '10')
    .option('--offset <n>', 'Offset', '0')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      let data = await apiGet<{ count: number; companies: any[]; next_url?: string }>({
        path: '/v1/company/search',
        params: { query: cmdOpts.query, limit: cmdOpts.limit, offset: cmdOpts.offset },
      });
      if (opts.all && data.next_url) {
        data = await fetchAllPages(data,
          d => d.next_url,
          (acc, page) => ({ ...page, companies: [...acc.companies, ...page.companies], count: page.count }),
        );
      }
      output(data, opts, () => {
        formatTable(data.companies, ['ticker', 'cik', 'name', 'logo_url']);
        printPaginationHint(data.next_url);
      });
    }));

  // details
  company
    .command('details')
    .description('Fetch company details')
    .requiredOption('-i, --identifier <ticker>', 'Ticker symbol or CIK')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      const data = await apiGet<{ companies: any[] }>({
        path: '/v1/company/details',
        params: { identifier: cmdOpts.identifier },
      });
      output(data, opts, () => {
        for (const c of data.companies) {
          console.log(`\n${c.name} (${c.ticker})\n`);
          if (c.description) {
            console.log(`  ${c.description}\n`);
          }
          formatKeyValue({
            CIK: c.cik,
            Category: c.category,
            Exchange: c.exchange,
            Sector: c.sector,
            Industry: c.industry,
            SIC: c.sic,
            'SIC Sector': c.sic_sector,
            'SIC Industry': c.sic_industry,
            'Fama Sector': c.fama_sector || undefined,
            'Fama Industry': c.fama_industry || undefined,
            Currency: c.currency,
            CUSIP: c.cusip,
            'Composite FIGI': c.composite_figi,
            'Market Cap': c.market_cap,
            'Shares Outstanding': c.shares_outstanding,
            Employees: c.employees,
            'Insider Own %': c.insider_own_pct,
            'Insider Own Shares': c.insider_own_shares,
            'Inst Own %': c.inst_own_pct,
            'Inst Own Shares': c.inst_own_shares,
            'Short Float %': c.short_float_pct,
            'Short Float Shares': c.short_float_shares,
            'List Date': c.list_date,
            Delisted: c.is_delisted,
            Website: c.homepage_url,
            'Investor Relations': c.investor_relations_url,
            'Logo URL': c.logo_url,
            'Brand Colors': c.brand_colors?.length ? c.brand_colors.join(', ') : undefined,
            Address: [c.street, c.city, c.state, c.zip_code, c.country_code].filter(Boolean).join(', '),
          });
        }
      });
    }));

  // dividends
  company
    .command('dividends')
    .description('Fetch stock dividends')
    .requiredOption('-i, --identifier <ticker>', 'Ticker symbol or CIK')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('-s, --sort <dir>', 'Sort direction', 'desc')
    .option('-l, --limit <n>', 'Max results', '40')
    .option('--offset <n>', 'Offset', '0')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      let data = await apiGet<{ companies: any[] }>({
        path: '/v1/company/dividends',
        params: {
          identifier: cmdOpts.identifier,
          start_date: cmdOpts.startDate,
          end_date: cmdOpts.endDate,
          sort: cmdOpts.sort,
          limit: cmdOpts.limit,
          offset: cmdOpts.offset,
        },
      });
      if (opts.all) {
        data = await fetchAllPages(data,
          d => d.companies?.[0]?.next_url,
          (acc, page) => ({
            companies: acc.companies.map((c: any, i: number) => ({
              ...c,
              dividends: [...c.dividends, ...(page.companies[i]?.dividends || [])],
              next_url: page.companies[i]?.next_url,
            })),
          }),
        );
      }
      output(data, opts, () => {
        for (const c of data.companies) {
          console.log(`\n${c.ticker} (${c.cik}) Dividends:\n`);
          formatTable(c.dividends, ['ex_dividend_date', 'declaration_date', 'cash_amount', 'dividend_type', 'frequency', 'pay_date', 'record_date']);
          printPaginationHint(c.next_url);
        }
      });
    }));

  // fiscal-periods
  company
    .command('fiscal-periods')
    .description('Fetch available fiscal periods')
    .requiredOption('-i, --identifier <ticker>', 'Ticker symbol or CIK')
    .option('-s, --sort <dir>', 'Sort direction', 'desc')
    .option('-l, --limit <n>', 'Max results', '40')
    .option('--offset <n>', 'Offset', '0')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      let data = await apiGet<{ companies: any[] }>({
        path: '/v1/company/fiscal-periods',
        params: {
          identifier: cmdOpts.identifier,
          sort: cmdOpts.sort,
          limit: cmdOpts.limit,
          offset: cmdOpts.offset,
        },
      });
      if (opts.all) {
        data = await fetchAllPages(data,
          d => d.companies?.[0]?.next_url,
          (acc, page) => ({
            companies: acc.companies.map((c: any, i: number) => ({
              ...c,
              periods: [...c.periods, ...(page.companies[i]?.periods || [])],
              next_url: page.companies[i]?.next_url,
            })),
          }),
        );
      }
      output(data, opts, () => {
        for (const c of data.companies) {
          console.log(`\n${c.ticker} (${c.cik}) Fiscal Periods:\n`);
          formatTable(c.periods, ['fiscal_year', 'fiscal_quarter', 'calendar_year', 'calendar_quarter', 'period_end']);
          printPaginationHint(c.next_url);
        }
      });
    }));

  // splits
  company
    .command('splits')
    .description('Fetch stock splits')
    .requiredOption('-i, --identifier <ticker>', 'Ticker symbol or CIK')
    .option('-s, --sort <dir>', 'Sort direction', 'desc')
    .option('-l, --limit <n>', 'Max results', '40')
    .option('--offset <n>', 'Offset', '0')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      let data = await apiGet<{ companies: any[] }>({
        path: '/v1/company/splits',
        params: {
          identifier: cmdOpts.identifier,
          sort: cmdOpts.sort,
          limit: cmdOpts.limit,
          offset: cmdOpts.offset,
        },
      });
      if (opts.all) {
        data = await fetchAllPages(data,
          d => d.companies?.[0]?.next_url,
          (acc, page) => ({
            companies: acc.companies.map((c: any, i: number) => ({
              ...c,
              splits: [...c.splits, ...(page.companies[i]?.splits || [])],
              next_url: page.companies[i]?.next_url,
            })),
          }),
        );
      }
      output(data, opts, () => {
        for (const c of data.companies) {
          console.log(`\n${c.ticker} (${c.cik}) Stock Splits:\n`);
          formatTable(c.splits, ['execution_date', 'split_from', 'split_to']);
          printPaginationHint(c.next_url);
        }
      });
    }));
}
