import { NextRequest, NextResponse } from 'next/server';
import { golangApi } from '@/lib/apiClient';

/**
 * POST /api/ops/on-login
 *
 * Proxy → POST {GOLANG_API_BASE_URL}/api/ops/on-login
 *
 * Called once per login / page-load to retrieve the dynamic ops form fields
 * that the user must fill in before using the dashboard.
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

    const body = await request.json().catch(() => undefined);

    const res = await golangApi.post('/api/ops/on-login', { token, body });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[POST /api/ops/on-login] Unexpected error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan yang tidak terduga' },
      { status: 500 }
    );
  }
}
