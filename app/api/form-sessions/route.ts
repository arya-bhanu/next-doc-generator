import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/form-sessions?userUid=<uid>
 *
 * Returns all form_sessions rows for the given authenticated user.
 * Lookup: form_sessions.user_id → ops_user.id where ops_user.uid = userUid
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userUid = searchParams.get('userUid');

    if (!userUid) {
      return NextResponse.json(
        { message: 'User UID diperlukan' },
        { status: 400 }
      );
    }

    // Resolve ops_user.id from auth uid
    const { data: opsUser, error: opsError } = await supabase
      .from('ops_user')
      .select('id')
      .eq('uid', userUid)
      .single();
      

    if (opsError || !opsUser) {
      return NextResponse.json(
        { message: 'User tidak ditemukan di ops_user' },
        { status: 404 }
      );
    }


    console.log(opsUser.id)

    const { data, error } = await supabase
      .from('form_sessions')
      .select('*')
      .eq('user_id', opsUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/form-sessions]', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    console.log(data)

    return NextResponse.json({ data: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/form-sessions] Unexpected error:', err);
    return NextResponse.json(
      { message: 'Terjadi kesalahan yang tidak terduga' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/form-sessions?id=<id>
 *
 * Deletes a single form_session row by primary key.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'Session ID diperlukan' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('form_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE /api/form-sessions]', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Session berhasil dihapus' },
      { status: 200 }
    );
  } catch (err) {
    console.error('[DELETE /api/form-sessions] Unexpected error:', err);
    return NextResponse.json(
      { message: 'Terjadi kesalahan yang tidak terduga' },
      { status: 500 }
    );
  }
}
