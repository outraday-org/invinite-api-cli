import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('formatTable', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should print "No results." for empty rows', async () => {
    const { formatTable } = await import('../../../src/formatters/table-formatter.js');
    formatTable([]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should print header and rows', async () => {
    const { formatTable } = await import('../../../src/formatters/table-formatter.js');
    formatTable([{ name: 'Apple', ticker: 'AAPL' }], ['name', 'ticker']);
    expect(consoleSpy).toHaveBeenCalledTimes(3); // header + separator + 1 row
  });
});
