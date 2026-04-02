import { NextRequest, NextResponse } from 'next/server';
import { golangApi } from '@/lib/apiClient';

/**
 * GET /api/admin/oauth/authenticate
 *
 * Proxy → GET {GOLANG_API_BASE_URL}/api/admin/oauth/authenticate
 *
 * Returns the Google OAuth auth_url that the client should redirect to.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';

    if (!token) {
      return NextResponse.json(
        { message: 'Authentication token required' },
        { status: 401 }
      );
    }

    const res = await golangApi.get('/api/admin/oauth/authenticate', { token });
    const data = await res.json().catch(() => ({}));

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[GET /api/admin/oauth/authenticate] Unexpected error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
