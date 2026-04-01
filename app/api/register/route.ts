import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { golangApi } from '@/lib/apiClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword, role } = body;
    const errors: Record<string, string> = {};

    // -----------------------------------------------------------------------
    // Input validation
    // -----------------------------------------------------------------------
    if (!name || !name.trim()) {
      errors.name = 'Name is required';
    }

    if (!email || !email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    }

    if (password && confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!role) {
      errors.role = 'Role is required';
    } else if (!['cs', 'ub'].includes(role)) {
      errors.role = 'Invalid role selected';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { message: 'Validation failed', errors },
        { status: 400 }
      );
    }

    // -----------------------------------------------------------------------
    // Step 1 – Create the Supabase auth user and obtain a session token
    // -----------------------------------------------------------------------
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          {
            message: 'Email already registered',
            errors: { email: 'Email already registered' },
          },
          { status: 400 }
        );
      }

      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { message: 'Failed to create auth user' },
        { status: 500 }
      );
    }

    // -----------------------------------------------------------------------
    // Step 2 – Call the Golang API to persist the user profile.
    //
    // After signUp(), Supabase may return a live session (email confirmation
    // disabled) or null (email confirmation required).  We use the session
    // access-token when available; otherwise we fall back to the anon key so
    // the request can still reach the Golang service.
    // -----------------------------------------------------------------------
    const accessToken =
      authData.session?.access_token ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      '';

    const golangRes = await golangApi.post('/users/register', {
      token: accessToken,
      body: {
        uid: authData.user.id,
        name: name.trim(),
        email: email.trim(),
        role,
      },
    });

    if (!golangRes.ok) {
      const golangError = await golangRes.json().catch(() => ({}));
      console.error('[POST /api/register] Golang API error:', golangError);
      return NextResponse.json(
        {
          message: 'Failed to create user profile',
          error: golangError,
        },
        { status: golangRes.status }
      );
    }

    const userData = await golangRes.json();

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          uid: authData.user.id,
          name: userData?.name ?? name,
          email: userData?.email ?? email,
          role: userData?.role ?? role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/register] Registration error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
