import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/document-templates
 *
 * Fetches all rows from the `stored_document_templates` Supabase table,
 * returning: id, title, description, google_file_id, link.
 * Results are ordered alphabetically by title.
 */
export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('stored_document_templates')
      .select('id, title, description, google_file_id, link')
      .order('title', { ascending: true });

    if (error) {
      console.error('[GET /api/document-templates]', error);
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/document-templates] Unexpected error:', err);
    return NextResponse.json(
      { message: 'Terjadi kesalahan yang tidak terduga' },
      { status: 500 }
    );
  }
}
