import { Command } from 'commander';
import { apiGet } from '../client/api-client.js';
import { fetchAllPages } from '../client/pagination.js';
import { withErrorHandling } from '../shared/errors.js';
import { output } from '../shared/output.js';
import { formatTable, printPaginationHint } from '../formatters/table-formatter.js';
import { setJsonMode } from '../shared/spinner.js';
import chalk from 'chalk';

export function registerMetricsCommands(program: Command): void {
  const metrics = program
    .command('metrics')
    .description('Financial metrics, ratios, and growth');

  // ratios
  metrics
    .command('ratios')
    .description('Fetch financial ratios')
    .requiredOption('-i, --identifier <ticker>', 'Ticker or CIK')
    .requiredOption('-p, --period <type>', 'Fiscal period type')
    .option('--category <cat>', 'Ratio category (valuation, profitability, liquidity, solvency)')
    .option('-s, --sort <dir>', 'Sort direction', 'desc')
    .option('-l, --limit <n>', 'Max results', '10')
    .option('--offset <n>', 'Offset', '0')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      let data = await apiGet<{ companies: any[] }>({
        path: '/v1/financial-metrics/ratios',
        params: {
          identifier: cmdOpts.identifier,
          fiscal_period_type: cmdOpts.period,
          category: cmdOpts.category,
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
          console.log(chalk.bold(`\n${c.ticker} (${c.cik})`));
          for (const period of c.periods) {
            console.log(chalk.cyan(`\n  ${period.fiscal_period_type} FY${period.fiscal_year} Q${period.fiscal_quarter} (CY${period.calendar_year} Q${period.calendar_quarter}, ending ${period.period_end})`));
            for (const [category, metrics] of Object.entries(period.facts as Record<string, Record<string, number>>)) {
              console.log(chalk.dim(`    ${category}:`));
              const rows = Object.entries(metrics).map(([k, v]) => ({ metric: k, value: v }));
              formatTable(rows, ['metric', 'value']);
            }
          }
          printPaginationHint(c.next_url);
        }
      });
    }));

  // cagr
  metrics
    .command('cagr')
    .description('Fetch CAGR metrics')
    .requiredOption('-i, --identifier <ticker>', 'Ticker or CIK')
    .option('--period-years <years>', 'CAGR period (3, 5, 10)')
    .option('-s, --sort <dir>', 'Sort direction', 'desc')
    .option('-l, --limit <n>', 'Max results', '10')
    .option('--offset <n>', 'Offset', '0')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      let data = await apiGet<{ companies: any[] }>({
        path: '/v1/financial-metrics/cagr',
        params: {
          identifier: cmdOpts.identifier,
          period_years: cmdOpts.periodYears,
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
          console.log(chalk.bold(`\n${c.ticker} (${c.cik}) CAGR`));
          for (const period of c.periods) {
            console.log(chalk.cyan(`\n  FY${period.fiscal_year} Q${period.fiscal_quarter} (CY${period.calendar_year} Q${period.calendar_quarter}, ending ${period.period_end})`));
            for (const [years, metrics] of Object.entries(period.facts as Record<string, Record<string, number>>)) {
              console.log(chalk.dim(`    ${years}-year CAGR:`));
              const rows = Object.entries(metrics).map(([k, v]) => ({ metric: k, value: v }));
              formatTable(rows, ['metric', 'value']);
            }
          }
          printPaginationHint(c.next_url);
        }
      });
    }));

  // growth
  metrics
    .command('growth')
    .description('Fetch growth metrics')
    .requiredOption('-i, --identifier <ticker>', 'Ticker or CIK')
    .requiredOption('-p, --period <type>', 'Fiscal period type')
    .option('--growth-type <type>', 'Growth type (year_over_year, quarter_over_quarter)')
    .option('-s, --sort <dir>', 'Sort direction', 'desc')
    .option('-l, --limit <n>', 'Max results', '10')
    .option('--offset <n>', 'Offset', '0')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      let data = await apiGet<{ companies: any[] }>({
        path: '/v1/financial-metrics/growth',
        params: {
          identifier: cmdOpts.identifier,
          fiscal_period_type: cmdOpts.period,
          growth_type: cmdOpts.growthType,
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
          console.log(chalk.bold(`\n${c.ticker} (${c.cik}) Growth`));
          for (const period of c.periods) {
            console.log(chalk.cyan(`\n  ${period.fiscal_period_type} FY${period.fiscal_year} Q${period.fiscal_quarter} (CY${period.calendar_year} Q${period.calendar_quarter}, ending ${period.period_end})`));
            for (const [growthType, metrics] of Object.entries(period.facts as Record<string, Record<string, number>>)) {
              console.log(chalk.dim(`    ${growthType}:`));
              const rows = Object.entries(metrics).map(([k, v]) => ({ metric: k, value: v }));
              formatTable(rows, ['metric', 'value']);
            }
          }
          printPaginationHint(c.next_url);
        }
      });
    }));
}
