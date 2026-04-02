import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/auth/check-role
 *
 * Validates the bearer token via Supabase, then looks up the user's role
 * in the ops_user table (source of truth for role).
 *
 * Returns: { role: string }
 *
 * Used by both /login and /admin/login to enforce role-based access:
 *   - /login:        rejects users with role "admin"
 *   - /admin/login:  rejects users whose role is NOT "admin"
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

    // Step 1 – Validate JWT and resolve user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Step 2 – Look up role in ops_user table
    const { data: opsUser, error: dbError } = await supabase
      .from('ops_user')
      .select('role')
      .eq('uid', user.id)
      .single();

    if (dbError || !opsUser) {
      return NextResponse.json(
        { message: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ role: opsUser.role });
  } catch (error) {
    console.error('[GET /api/auth/check-role] Unexpected error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
