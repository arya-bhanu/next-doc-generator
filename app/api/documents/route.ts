import { NextRequest, NextResponse } from 'next/server';
import { golangApi } from '@/lib/apiClient';

// ---------------------------------------------------------------------------
// Helper: extract the Bearer token from the incoming request's Authorization
// header and return an early 401 response when it is missing.
// ---------------------------------------------------------------------------
function extractToken(
  request: NextRequest
): { token: string } | { error: NextResponse } {
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';

  if (!token) {
    return {
      error: NextResponse.json(
        { message: 'Token autentikasi diperlukan' },
        { status: 401 }
      ),
    };
  }

  return { token };
}

// ---------------------------------------------------------------------------
// GET /api/documents?userUid=<uid>
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const auth = extractToken(request);
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const userUid = searchParams.get('userUid');

    if (!userUid) {
      return NextResponse.json(
        { message: 'User UID diperlukan' },
        { status: 400 }
      );
    }

    const res = await golangApi.get('/documents', {
      token: auth.token,
      params: { userUid },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[GET /api/documents] Unexpected error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan yang tidak terduga' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/documents  – create a document
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const auth = extractToken(request);
    if ('error' in auth) return auth.error;

    const { title, url, userUid } = await request.json();

    const errors: Record<string, string> = {};

    if (!title || !title.trim()) {
      errors.title = 'Judul wajib diisi';
    }

    if (!url || !url.trim()) {
      errors.url = 'URL wajib diisi';
    } else {
      try {
        new URL(url);
      } catch {
        errors.url = 'URL tidak valid';
      }
    }

    if (!userUid) {
      errors.general = 'User tidak terautentikasi';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const res = await golangApi.post('/documents', {
      token: auth.token,
      body: { title: title.trim(), url: url.trim(), userUid },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[POST /api/documents] Unexpected error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan yang tidak terduga' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/documents  – update a document
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  try {
    const auth = extractToken(request);
    if ('error' in auth) return auth.error;

    const { id, title, url } = await request.json();

    const errors: Record<string, string> = {};

    if (!id) {
      errors.general = 'Document ID diperlukan';
    }

    if (!title || !title.trim()) {
      errors.title = 'Judul wajib diisi';
    }

    if (!url || !url.trim()) {
      errors.url = 'URL wajib diisi';
    } else {
      try {
        new URL(url);
      } catch {
        errors.url = 'URL tidak valid';
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const res = await golangApi.put(`/documents/${id}`, {
      token: auth.token,
      body: { title: title.trim(), url: url.trim() },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[PUT /api/documents] Unexpected error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan yang tidak terduga' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/documents?id=<id>
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const auth = extractToken(request);
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'Document ID diperlukan' },
        { status: 400 }
      );
    }

    const res = await golangApi.delete(`/documents/${id}`, {
      token: auth.token,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[DELETE /api/documents] Unexpected error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan yang tidak terduga' },
      { status: 500 }
    );
  }
}
