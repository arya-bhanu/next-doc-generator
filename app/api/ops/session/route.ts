import { NextRequest, NextResponse } from 'next/server';
import { golangApi } from '@/lib/apiClient';

/**
 * DELETE /api/ops/session?id=<session_id>
 *
 * Proxy → DELETE {GOLANG_API_BASE_URL}/api/ops/session
 *
 * Passes the session id as a query parameter to the Golang service
 * which handles the actual deletion.
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'Session ID diperlukan' },
        { status: 400 }
      );
    }

    const res = await golangApi.delete('/api/ops/session', {
      token,
      params: { id },
    });

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[DELETE /api/ops/session] Unexpected error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan yang tidak terduga' },
      { status: 500 }
    );
  }
}
