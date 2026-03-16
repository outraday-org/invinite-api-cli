import { Command } from 'commander';
import { apiGet } from '../client/api-client.js';
import { fetchAllPages } from '../client/pagination.js';
import { withErrorHandling } from '../shared/errors.js';
import { output } from '../shared/output.js';
import { formatTable, printPaginationHint } from '../formatters/table-formatter.js';
import { setJsonMode } from '../shared/spinner.js';
import chalk from 'chalk';

export function registerSegmentsCommands(program: Command): void {
  const segments = program
    .command('segments')
    .description('Segmented financials');

  segments
    .command('list')
    .description('Fetch segmented financial data')
    .requiredOption('-i, --identifier <ticker>', 'Ticker or CIK')
    .requiredOption('-p, --period <type>', 'Fiscal period type')
    .option('--segment-id <id>', 'Filter by segment ID')
    .option('--detailed', 'Include detailed metadata')
    .option('-s, --sort <dir>', 'Sort direction', 'desc')
    .option('-l, --limit <n>', 'Max results', '10')
    .option('--offset <n>', 'Offset', '0')
    .action(withErrorHandling(async (cmdOpts) => {
      const opts = program.opts();
      if (opts.json) setJsonMode(true);
      const path = cmdOpts.detailed ? '/v1/segmented-financials/detailed' : '/v1/segmented-financials';
      let data = await apiGet<{ companies: any[] }>({
        path,
        params: {
          identifier: cmdOpts.identifier,
          fiscal_period_type: cmdOpts.period,
          segment_id: cmdOpts.segmentId,
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
          console.log(chalk.bold(`\n${c.ticker}`));
          for (const period of c.periods) {
            console.log(chalk.cyan(`\n  ${period.period_end} (${period.fiscal_period_type})`));
            for (const [metricId, segments] of Object.entries(period.facts as Record<string, any[]>)) {
              console.log(chalk.dim(`    ${metricId}:`));
              formatTable(segments, cmdOpts.detailed
                ? ['segment_id', 'value', 'axis', 'member', 'metric', 'accession_number']
                : ['segment_id', 'value', 'axis', 'member']);
            }
          }
          printPaginationHint(c.next_url);
        }
      });
    }));
}
