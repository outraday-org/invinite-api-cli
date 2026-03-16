import { getApiKey } from '../config/auth.js';
import { getBaseUrl } from '../config/config-manager.js';
import { ApiError } from '../shared/errors.js';
import { createSpinner } from '../shared/spinner.js';

export interface RequestOptions {
  path: string;
  params?: Record<string, string | undefined>;
  silent?: boolean;
}

function buildUrl(path: string, params?: Record<string, string | undefined>): string {
  const base = getBaseUrl().replace(/\/+$/, '');
  const url = new URL(`${base}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}

export async function apiGet<T = unknown>(opts: RequestOptions): Promise<T> {
  const spinner = opts.silent ? null : createSpinner('Fetching data...');
  try {
    const apiKey = await getApiKey();
    const url = buildUrl(opts.path, opts.params);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    const body = await response.json() as any;

    if (!response.ok) {
      throw new ApiError(
        response.status,
        body?.error || 'Unknown Error',
        body?.message || `Request failed with status ${response.status}`,
      );
    }

    spinner?.succeed('Done');
    return body as T;
  } catch (error) {
    spinner?.fail('Failed');
    throw error;
  }
}
