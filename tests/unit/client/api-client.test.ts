import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the config/auth modules before importing api-client
vi.mock('../../../src/config/auth.js', () => ({
  getApiKey: vi.fn().mockResolvedValue('test-api-key'),
}));

vi.mock('../../../src/config/config-manager.js', () => ({
  getBaseUrl: vi.fn().mockReturnValue('https://api.example.com'),
}));

vi.mock('../../../src/shared/spinner.js', () => ({
  createSpinner: vi.fn().mockReturnValue({
    succeed: vi.fn(),
    fail: vi.fn(),
  }),
}));

import { apiGet } from '../../../src/client/api-client.js';
import { ApiError } from '../../../src/shared/errors.js';

describe('apiGet', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should make GET request with auth header', async () => {
    const mockResponse = { status: 'ok' };
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await apiGet({ path: '/health' });
    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/health',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key',
        }),
      }),
    );
  });

  it('should build URL with query params', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiGet({ path: '/v1/company/search', params: { query: 'AAPL', limit: '10' } });
    const calledUrl = (fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('query=AAPL');
    expect(calledUrl).toContain('limit=10');
  });

  it('should exclude undefined params', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiGet({ path: '/v1/test', params: { a: 'val', b: undefined, c: '' } });
    const calledUrl = (fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('a=val');
    expect(calledUrl).not.toContain('b=');
    expect(calledUrl).not.toContain('c=');
  });

  it('should throw ApiError on non-200 response', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized', message: 'Invalid API key' }),
    });

    await expect(apiGet({ path: '/health' })).rejects.toThrow(ApiError);
    await expect(apiGet({ path: '/health' })).rejects.toMatchObject({
      statusCode: 401,
      errorType: 'Unauthorized',
    });
  });
});
