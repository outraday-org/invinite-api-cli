import chalk from 'chalk';

export function formatTable(rows: Record<string, unknown>[], columns?: string[]): void {
  if (rows.length === 0) {
    console.log(chalk.yellow('No results.'));
    return;
  }

  const cols = columns || Object.keys(rows[0]);
  const widths: Record<string, number> = {};

  for (const col of cols) {
    widths[col] = col.length;
    for (const row of rows) {
      const val = formatValue(row[col]);
      widths[col] = Math.max(widths[col], val.length);
    }
  }

  // Header
  const header = cols.map(c => chalk.bold(c.padEnd(widths[c]))).join('  ');
  console.log(header);
  console.log(cols.map(c => '─'.repeat(widths[c])).join('  '));

  // Rows
  for (const row of rows) {
    const line = cols.map(c => formatValue(row[c]).padEnd(widths[c])).join('  ');
    console.log(line);
  }
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') return formatNumber(val);
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return String(val);
}

function formatNumber(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) >= 1000) {
    return n.toLocaleString('en-US');
  }
  if (!Number.isInteger(n)) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  return String(n);
}

export function formatKeyValue(data: Record<string, unknown>): void {
  const maxKeyLen = Math.max(...Object.keys(data).map(k => k.length));
  for (const [key, value] of Object.entries(data)) {
    const label = chalk.bold(key.padEnd(maxKeyLen));
    console.log(`  ${label}  ${formatValue(value)}`);
  }
}

export function printPaginationHint(nextUrl?: string): void {
  if (nextUrl) {
    console.log(chalk.dim('\nMore results available. Use --all to fetch all pages, or --offset/--limit to paginate.'));
  }
}
