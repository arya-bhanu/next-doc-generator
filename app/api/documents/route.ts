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

export async function PUT(request: NextRequest) {
  try {
    const { id, title, url } = await request.json();

    const errors: { [key: string]: string } = {};

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

    const { data, error } = await supabase
      .from('documents')
      .update({ title: title.trim(), url: url.trim() })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating document:', error);
      return NextResponse.json(
        { message: 'Gagal memperbarui dokumen', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Dokumen berhasil diperbarui', data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan yang tidak terduga' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'Document ID diperlukan' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      return NextResponse.json(
        { message: 'Gagal menghapus dokumen', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Dokumen berhasil dihapus' },
      { status: 200 }
    );
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

    const errors: { [key: string]: string } = {};

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
