import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/client/api-client.js', () => ({
  apiGet: vi.fn(),
}));

vi.mock('../../../src/shared/spinner.js', () => ({
  createSpinner: vi.fn().mockReturnValue({
    succeed: vi.fn(),
    fail: vi.fn(),
  }),
}));

import { fetchAllPages } from '../../../src/client/pagination.js';
import { apiGet } from '../../../src/client/api-client.js';

describe('fetchAllPages', () => {
  it('should return initial data when no next_url', async () => {
    const data = { items: [1, 2], next_url: undefined as string | undefined };
    const result = await fetchAllPages(
      data,
      d => d.next_url,
      (acc, page) => ({ ...page, items: [...acc.items, ...page.items] }),
    );
    expect(result).toEqual(data);
  });

  it('should follow next_url and merge results', async () => {
    const page2 = { items: [3, 4], next_url: undefined as string | undefined };
    (apiGet as any).mockResolvedValueOnce(page2);

    const initial = { items: [1, 2], next_url: 'https://api.example.com/test?offset=2&limit=2' };
    const result = await fetchAllPages(
      initial,
      d => d.next_url,
      (acc, page) => ({ ...page, items: [...acc.items, ...page.items] }),
    );
    expect(result.items).toEqual([1, 2, 3, 4]);
  });
});
