import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all mitarbeiter with their zuordnungen for the current MdB
    const { data: mitarbeiterData, error } = await supabase
      .from('mitarbeiter_vollstaendig')
      .select('*')
      .eq('mdb_id', session.user.id);

    if (error) {
      console.error('Error fetching mitarbeiter:', error);
      return NextResponse.json({ error: 'Fehler beim Laden der Mitarbeitenden' }, { status: 500 });
    }

    // Group by mitarbeiter and collect zuordnungen
    const mitarbeiterMap = new Map();
    
    mitarbeiterData?.forEach((row: any) => {
      const mitarbeiterId = row.id;
      
      if (!mitarbeiterMap.has(mitarbeiterId)) {
        mitarbeiterMap.set(mitarbeiterId, {
          id: row.id,
          name: row.name,
          strasse: row.strasse,
          hausnummer: row.hausnummer,
          plz: row.plz,
          ort: row.ort,
          geburtsdatum: row.geburtsdatum,
          email: row.email,
          bueronummer: row.bueronummer,
          mobilnummer: row.mobilnummer,
          profilbild_url: row.profilbild_url,
          created_at: row.created_at,
          updated_at: row.updated_at,
          zuordnungen: []
        });
      }
      
      // Add zuordnung if it exists
      if (row.eingruppierung) {
        mitarbeiterMap.get(mitarbeiterId).zuordnungen.push({
          id: row.zuordnung_id,
          mitarbeiter_id: row.id,
          mdb_user_id: row.mdb_id,
          eingruppierung: row.eingruppierung,
          zustaendigkeit: row.zustaendigkeit,
          einstellungsdatum: row.einstellungsdatum,
          befristung_bis: row.befristung_bis,
          einsatzort: row.einsatzort,
          created_at: row.zuordnung_created_at,
          updated_at: row.zuordnung_updated_at,
          mdb_name: row.mdb_name
        });
      }
    });

    const mitarbeiter = Array.from(mitarbeiterMap.values());

    return NextResponse.json({
      data: mitarbeiter,
      count: mitarbeiter.length
    });

  } catch (error) {
    console.error('Error in GET /api/mitarbeitende:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { zuordnungen, ...mitarbeiterData } = body;

    // Check if a mitarbeiter with the same name and birth date already exists
    const { data: existingMitarbeiter, error: searchError } = await supabase
      .from('abgeordneten_mitarbeiter')
      .select('id')
      .eq('name', mitarbeiterData.name)
      .eq('geburtsdatum', mitarbeiterData.geburtsdatum)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('Error searching for existing mitarbeiter:', searchError);
      return NextResponse.json({ error: 'Fehler beim Prüfen bestehender Mitarbeiter' }, { status: 500 });
    }

    let mitarbeiterId: string;

    if (existingMitarbeiter) {
      // Use existing mitarbeiter
      mitarbeiterId = existingMitarbeiter.id;
      
      // Check if this MdB already has a zuordnung for this mitarbeiter
      const { data: existingZuordnung } = await supabase
        .from('mdb_mitarbeiter_zuordnungen')
        .select('id')
        .eq('mitarbeiter_id', mitarbeiterId)
        .eq('mdb_user_id', session.user.id)
        .single();

      if (existingZuordnung) {
        return NextResponse.json({ error: 'Diesem Mitarbeiter ist bereits eine Zuordnung zu dir zugewiesen' }, { status: 400 });
      }
    } else {
      // Create new mitarbeiter
      const { data: newMitarbeiter, error: mitarbeiterError } = await supabase
        .from('abgeordneten_mitarbeiter')
        .insert([mitarbeiterData])
        .select()
        .single();

      if (mitarbeiterError) {
        console.error('Error creating mitarbeiter:', mitarbeiterError);
        return NextResponse.json({ error: 'Fehler beim Erstellen des Mitarbeiters' }, { status: 500 });
      }

      mitarbeiterId = newMitarbeiter.id;
    }

    // Create zuordnungen
    const zuordnungenData = zuordnungen.map((z: any) => ({
      mitarbeiter_id: mitarbeiterId,
      mdb_user_id: session.user.id,
      eingruppierung: z.eingruppierung,
      zustaendigkeit: z.zustaendigkeit,
      einstellungsdatum: z.einstellungsdatum,
      befristung_bis: z.befristung_bis,
      einsatzort: z.einsatzort
    }));

    const { error: zuordnungError } = await supabase
      .from('mdb_mitarbeiter_zuordnungen')
      .insert(zuordnungenData);

    if (zuordnungError) {
      console.error('Error creating zuordnungen:', zuordnungError);
      
      // Only cleanup if we created a new mitarbeiter
      if (!existingMitarbeiter) {
        await supabase
          .from('abgeordneten_mitarbeiter')
          .delete()
          .eq('id', mitarbeiterId);
      }
      
      return NextResponse.json({ error: 'Fehler beim Erstellen der Zuordnungen' }, { status: 500 });
    }

    return NextResponse.json({
      data: { id: mitarbeiterId },
      message: existingMitarbeiter 
        ? 'Zuordnung zu bestehendem Mitarbeiter erfolgreich erstellt'
        : 'Mitarbeiter erfolgreich erstellt'
    });

  } catch (error) {
    console.error('Error in POST /api/mitarbeitende:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 