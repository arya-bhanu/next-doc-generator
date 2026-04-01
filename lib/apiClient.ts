/**
 * Golang API Client
 *
 * A lightweight, server-side HTTP client for communicating with the external
 * Golang API service. Every outbound request includes:
 *
 *   Authorization: Bearer <supabase_access_token>
 *   X-App-Identity: Basic <BASIC_GOLANG_AUTH>
 *
 * Base URL is configured via the GOLANG_API_BASE_URL environment variable
 * (defaults to http://localhost:8080).
 */

const BASE_URL =
  process.env.GOLANG_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:8080';

const BASIC_AUTH = process.env.BASIC_GOLANG_AUTH ?? '';

// ---------------------------------------------------------------------------
// Header builder
// ---------------------------------------------------------------------------

/**
 * Builds the mandatory headers required by the Golang API for every request.
 *
 * @param token  The Supabase JWT access-token for the authenticated user.
 */
export function buildGolangHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-App-Identity': `Basic ${BASIC_AUTH}`,
  };
}

// ---------------------------------------------------------------------------
// Core fetch helper
// ---------------------------------------------------------------------------

interface RequestOptions {
  /** Supabase JWT access-token. */
  token: string;
  /** Optional JSON-serialisable request body (for POST / PUT). */
  body?: unknown;
  /** Optional query-string parameters. */
  params?: Record<string, string>;
}

async function request(
  method: string,
  path: string,
  { token, body, params }: RequestOptions
): Promise<Response> {
  // Ensure the path starts with "/"
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  let url = `${BASE_URL}${normalizedPath}`;

  if (params && Object.keys(params).length > 0) {
    url += `?${new URLSearchParams(params).toString()}`;
  }

  const init: RequestInit = {
    method,
    headers: buildGolangHeaders(token),
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  return fetch(url, init);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Typed, method-specific wrappers around the Golang API.
 *
 * @example
 * const res = await golangApi.get('/documents', { token, params: { userUid } });
 * const json = await res.json();
 */
export const golangApi = {
  get(path: string, opts: RequestOptions): Promise<Response> {
    return request('GET', path, opts);
  },

  post(path: string, opts: RequestOptions): Promise<Response> {
    return request('POST', path, opts);
  },

  put(path: string, opts: RequestOptions): Promise<Response> {
    return request('PUT', path, opts);
  },

  delete(path: string, opts: RequestOptions): Promise<Response> {
    return request('DELETE', path, opts);
  },
};
