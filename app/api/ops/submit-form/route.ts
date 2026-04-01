import { NextRequest, NextResponse } from 'next/server';
import { golangApi } from '@/lib/apiClient';

/**
 * POST /api/ops/submit-form
 *
 * Proxy → POST {GOLANG_API_BASE_URL}/api/ops/submit-form
 *
 * Accepts an array of ops field answers:
 * [{ label, variable, answer }, ...]
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

    const body = await request.json().catch(() => []);

    const res = await golangApi.post('/api/ops/submit-form', { token, body });

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[POST /api/ops/submit-form] Unexpected error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan yang tidak terduga' },
      { status: 500 }
    );
  }
}
