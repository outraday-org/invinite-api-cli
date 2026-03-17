import { Command } from 'commander';
import { apiGet } from '../client/api-client.js';
import { fetchAllPages } from '../client/pagination.js';
import { withErrorHandling } from '../shared/errors.js';
import { output } from '../shared/output.js';
import { formatTable, printPaginationHint } from '../formatters/table-formatter.js';
import { formatTree } from '../formatters/tree-formatter.js';
import { setJsonMode } from '../shared/spinner.js';
import chalk from 'chalk';

function buildStatementPath(source: string, statement: string, variant: string): string {
  const base = `/v1/${source}/${statement}`;
  return variant ? `${base}/${variant}` : base;
}

function registerStatementCommand(
  parent: Command,
  program: Command,
  cliName: string,
  description: string,
  apiPathSegment: string,
): void {
  parent
    .command(cliName)
    .description(description)
    .requiredOption('-i, --identifier <ticker>', 'Ticker symbol or CIK')
    .requiredOption('-p, --period <type>', 'Fiscal period type (quarterly, annual, ytd, ttm)')
    .option('-s, --sort <dir>', 'Sort direction', 'desc')
    .option('-l, --limit <n>', 'Max results', '10')
    .option('--offset <n>', 'Offset', '0')
    .option('--detailed', 'Include formula, accession number, and html tag info')
    .option('--presentation', 'Return nested tree structure')
    .option('--as-reported', 'Use as-reported data instead of standardized')
    .option('--with-formula', 'Include formula info (only with --detailed)')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);

      // Validate mutually exclusive options
      if (cmdOpts.detailed && cmdOpts.presentation) {
        console.error(chalk.red('Error: --detailed and --presentation are mutually exclusive'));
        process.exit(1);
      }

      const source = cmdOpts.asReported ? 'as-reported' : 'standardized';
      const variant = cmdOpts.detailed ? 'detailed' : cmdOpts.presentation ? 'presentation' : '';
      const path = buildStatementPath(source, apiPathSegment, variant);

      let data = await apiGet<{ companies: any[] }>({
        path,
        params: {
          identifier: cmdOpts.identifier,
          fiscal_period_type: cmdOpts.period,
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
            if (cmdOpts.presentation && Array.isArray(period.facts)) {
              formatTree(period.facts, 2);
            } else if (typeof period.facts === 'object' && !Array.isArray(period.facts)) {
              if (cmdOpts.detailed && Array.isArray(Object.values(period.facts)[0])) {
                // Detailed: facts is { metric_id: [{ value, formula?, ... }] }
                const rows: any[] = [];
                for (const [metricId, values] of Object.entries(period.facts)) {
                  for (const v of values as any[]) {
                    rows.push({ metric_id: metricId, ...v });
                  }
                }
                formatTable(rows);
              } else {
                // Base: facts is { metric_id: value }
                const rows = Object.entries(period.facts).map(([k, v]) => ({ metric: k, value: v }));
                formatTable(rows, ['metric', 'value']);
              }
            }
          }
          printPaginationHint(c.next_url);
        }
      });
    }));
}

function registerSnapshotCommand(parent: Command, program: Command): void {
  parent
    .command('snapshot')
    .description('Fetch latest complete financial statements snapshot')
    .requiredOption('-i, --identifiers <tickers>', 'Comma-separated ticker symbols or CIKs')
    .requiredOption('-p, --period <type>', 'Fiscal period type (quarterly, annual, ytd, ttm)')
    .option('--calendar-year <year>', 'Calendar year')
    .option('--calendar-quarter <q>', 'Calendar quarter (1-4)')
    .option('--detailed', 'Include detailed info')
    .option('--presentation', 'Return nested tree structure')
    .option('--as-reported', 'Use as-reported data instead of standardized')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);

      if (cmdOpts.detailed && cmdOpts.presentation) {
        console.error(chalk.red('Error: --detailed and --presentation are mutually exclusive'));
        process.exit(1);
      }

      const source = cmdOpts.asReported ? 'as-reported' : 'standardized';
      const variant = cmdOpts.detailed ? 'detailed' : cmdOpts.presentation ? 'presentation' : '';
      const path = buildStatementPath(source, 'snapshot', variant);

      const data = await apiGet<{ companies: any[] }>({
        path,
        params: {
          identifiers: cmdOpts.identifiers,
          fiscal_period_type: cmdOpts.period,
          calendar_year: cmdOpts.calendarYear,
          calendar_quarter: cmdOpts.calendarQuarter,
        },
      });

      output(data, opts, () => {
        for (const c of data.companies) {
          console.log(chalk.bold(`\n${c.ticker} (${c.cik}) - ${c.fiscal_period_type} FY${c.fiscal_year} Q${c.fiscal_quarter} (CY${c.calendar_year} Q${c.calendar_quarter})`));
          console.log(chalk.dim(`  Period end: ${c.period_end}`));
          if (c.statements) {
            for (const [stmtName, stmt] of Object.entries(c.statements)) {
              if (stmt) {
                console.log(chalk.cyan(`\n  ${stmtName}:`));
                const s = stmt as any;
                if (s.facts) {
                  if (Array.isArray(s.facts)) {
                    formatTree(s.facts, 2);
                  } else {
                    const rows = Object.entries(s.facts).map(([k, v]) => ({ metric: k, value: v }));
                    formatTable(rows, ['metric', 'value']);
                  }
                }
              }
            }
          } else if (c.periods) {
            // presentation/detailed snapshot has periods array
            for (const period of c.periods) {
              console.log(chalk.cyan(`\n  Period: ${period.period_end}`));
              if (Array.isArray(period.facts)) {
                formatTree(period.facts, 2);
              }
            }
          }
        }
      });
    }));
}

export function registerFinancialsCommands(program: Command): void {
  const financials = program
    .command('financials')
    .description('Financial statements (standardized & as-reported)');

  registerStatementCommand(financials, program, 'income-statement', 'Fetch income statement data', 'income-statement');
  registerStatementCommand(financials, program, 'balance-sheet', 'Fetch balance sheet data', 'balance-sheet');
  registerStatementCommand(financials, program, 'cash-flow', 'Fetch cash flow statement data', 'cash-flow-statement');
  registerSnapshotCommand(financials, program);
}
