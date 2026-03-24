import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword, role } = body;

    // Backend validation
    const errors: { [key: string]: string } = {};

    // Validate required fields
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

    // Validate password matching (Backend validation)
    if (password && confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!role) {
      errors.role = 'Role is required';
    } else if (!['cs', 'ub'].includes(role)) {
      errors.role = 'Invalid role selected';
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { message: 'Validation failed', errors },
        { status: 400 }
      );
    }

    // Step 1: Create user in Supabase Auth (this generates the UUID)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    if (authError) {
      // Handle specific Supabase errors
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { message: 'Email already registered', errors: { email: 'Email already registered' } },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { message: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { message: 'Failed to create auth user' },
        { status: 500 }
      );
    }

    // Step 2: Insert user data into ops_user table with UID from auth.users
    const { data: userData, error: dbError } = await supabase
      .from('ops_user')
      .insert([
        {
          uid: authData.user.id, // Foreign key to auth.users
          name,
          email,
          password, // Password is already stored in auth.users, but keeping here if needed
          role,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Error saving user data to ops_user:', dbError);
      // If ops_user insert fails, you might want to delete the auth user
      // await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { message: 'Failed to create user profile', error: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: userData.id,
          uid: userData.uid,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
