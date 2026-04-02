import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/admin/verify
 *
 * Verifies that the bearer token belongs to a user with role "admin"
 * stored in Supabase user_metadata. No external API call required.
 *
 * Expects:  Authorization: Bearer <supabase_access_token>
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

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const role = user.user_metadata?.role;

    if (role !== 'admin') {
      return NextResponse.json(
        { message: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ role, message: 'Access granted' });
  } catch (error) {
    console.error('[GET /api/admin/verify] Unexpected error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
