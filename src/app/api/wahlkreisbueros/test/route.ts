import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Try to check if the table exists by querying it
    const { data, error } = await supabaseAdmin
      .from('wahlkreisbueros')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[Test] Error accessing wahlkreisbueros table:', error);
      return NextResponse.json({
        tableExists: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: 'Table does not exist or is not accessible'
      });
    }

    return NextResponse.json({
      tableExists: true,
      recordCount: data?.length || 0,
      message: 'Table exists and is accessible',
      data: data
    });
  } catch (error) {
    console.error('[Test] Unexpected error:', error);
    return NextResponse.json({
      error: 'Unexpected error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 