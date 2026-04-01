import { NextRequest, NextResponse } from 'next/server';
import { golangApi } from '@/lib/apiClient';

/**
 * POST /api/document/refresh
 *
 * Proxy to the Golang API endpoint:  POST {GOLANG_API_BASE_URL}/api/document/refresh
 *
 * Called on every dashboard page load (mount + visibility/focus change) to
 * refresh the user's document session on the backend.
 *
 * Requires:  Authorization: Bearer <supabase_access_token>
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';

    if (!token) {
      return NextResponse.json(
        { message: 'Token autentikasi diperlukan' },
        { status: 401 }
      );
    }

    // Forward any request body to the Golang API
    const body = await request.json().catch(() => undefined);

    const res = await golangApi.post('/api/document/refresh', { token, body });

    // Some refresh endpoints return 204 No Content – handle gracefully
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[POST /api/document/refresh] Unexpected error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan yang tidak terduga' },
      { status: 500 }
    );
  }
}
