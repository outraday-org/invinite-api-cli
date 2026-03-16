import { formatJson } from '../formatters/json-formatter.js';

export function output(data: unknown, opts: { json?: boolean }, tableFormatter?: (data: unknown) => void): void {
  if (opts.json) {
    formatJson(data);
  } else if (tableFormatter) {
    tableFormatter(data);
  } else {
    formatJson(data);
  }
}
