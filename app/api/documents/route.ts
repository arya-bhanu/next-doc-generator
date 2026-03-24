import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // Get ops_user.id from uid
    const { data: opsUser, error: opsUserError } = await supabase
      .from('ops_user')
      .select('id')
      .eq('uid', userUid)
      .single();

    if (opsUserError || !opsUser) {
      return NextResponse.json(
        { message: 'User tidak ditemukan di ops_user' },
        { status: 404 }
      );
    }

    // Get documents for this user
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', opsUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json(
        { message: 'Gagal mengambil dokumen', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan yang tidak terduga' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, url, userUid } = await request.json();

    // Validation
    const errors: { [key: string]: string } = {};

    if (!title || !title.trim()) {
      errors.title = 'Judul wajib diisi';
    }

    if (!url || !url.trim()) {
      errors.url = 'URL wajib diisi';
    } else {
      // Basic URL validation
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

    // Get ops_user.id from uid
    const { data: opsUser, error: opsUserError } = await supabase
      .from('ops_user')
      .select('id')
      .eq('uid', userUid)
      .single();

    if (opsUserError || !opsUser) {
      return NextResponse.json(
        { message: 'User tidak ditemukan di ops_user' },
        { status: 404 }
      );
    }

    // Insert document
    const { data, error } = await supabase
      .from('documents')
      .insert([
        {
          title: title.trim(),
          url: url.trim(),
          user_id: opsUser.id,
        },
      ])
      .select();

    if (error) {
      console.error('Error creating document:', error);
      return NextResponse.json(
        { message: 'Gagal menyimpan dokumen', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Dokumen berhasil dibuat', data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan yang tidak terduga' },
      { status: 500 }
    );
  }
}
