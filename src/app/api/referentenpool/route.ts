import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all referents from database (no RLS filtering)
    const { data, error } = await supabase
      .from('referenten')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referents:', error);
      return NextResponse.json({ error: 'Error fetching referents' }, { status: 500 });
    }

    // Apply privacy filtering in application logic
    const filteredData = (data || []).filter(referent => 
      referent.zustimmung_kontakt_andere_mdb === true || 
      referent.angelegt_von === session.user.id
    );

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('Unexpected error in GET /api/referentenpool:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      titel,
      vorname,
      nachname,
      fachbereich,
      institution,
      ort,
      email,
      telefon,
      verfuegbar_fuer,
      zustimmung_datenspeicherung,
      zustimmung_kontakt_andere_mdb,
      parteimitglied,
    } = body;

    // Validation
    if (!vorname || !nachname || !fachbereich || !institution || !verfuegbar_fuer || !zustimmung_datenspeicherung) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!Array.isArray(verfuegbar_fuer) || verfuegbar_fuer.length === 0) {
      return NextResponse.json({ error: 'verfuegbar_fuer must be a non-empty array' }, { status: 400 });
    }

    if (!Array.isArray(fachbereich) || fachbereich.length === 0) {
      return NextResponse.json({ error: 'fachbereich must be a non-empty array' }, { status: 400 });
    }

    // Get user's name for hinzugefuegt_von field
    let hinzugefuegt_von = 'Unbekannter Benutzer';
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', session.user.id)
        .single();

      if (!userError && userData?.name) {
        hinzugefuegt_von = userData.name;
      } else if (session.user.email) {
        // User doesn't exist in users table, create it
        const { error: createUserError } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            name: session.user.name || session.user.email,
            email: session.user.email,
          });
        
        if (!createUserError) {
          hinzugefuegt_von = session.user.name || session.user.email;
        } else {
          console.log('Failed to create user, using fallback:', createUserError);
          hinzugefuegt_von = session.user.email;
        }
      }
    } catch (error) {
      console.log('User lookup failed, using fallback:', error);
      // Use email as fallback
      hinzugefuegt_von = session.user.email || 'Unbekannter Benutzer';
    }

    const { data, error } = await supabase
      .from('referenten')
      .insert({
        titel: titel || null,
        vorname,
        nachname,
        fachbereich,
        institution,
        ort: ort || null,
        email: email || null,
        telefon: telefon || null,
        verfuegbar_fuer,
        zustimmung_datenspeicherung,
        zustimmung_kontakt_andere_mdb: zustimmung_kontakt_andere_mdb || false,
        parteimitglied: parteimitglied || false,
        angelegt_von: session.user.id,
        hinzugefuegt_von,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating referent:', error);
      return NextResponse.json({ error: 'Error creating referent' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/referentenpool:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 