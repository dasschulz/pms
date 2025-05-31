import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mitarbeiterId = params.id;
    const body = await request.json();
    const { zuordnungen, ...mitarbeiterData } = body;

    // Verify mitarbeiter belongs to current MdB
    const { data: existingZuordnung } = await supabase
      .from('mdb_mitarbeiter_zuordnungen')
      .select('id')
      .eq('mitarbeiter_id', mitarbeiterId)
      .eq('mdb_user_id', session.user.id)
      .single();

    if (!existingZuordnung) {
      return NextResponse.json({ error: 'Mitarbeiter nicht gefunden oder keine Berechtigung' }, { status: 404 });
    }

    // Update mitarbeiter data
    const { error: updateError } = await supabase
      .from('abgeordneten_mitarbeiter')
      .update(mitarbeiterData)
      .eq('id', mitarbeiterId);

    if (updateError) {
      console.error('Error updating mitarbeiter:', updateError);
      return NextResponse.json({ error: 'Fehler beim Aktualisieren des Mitarbeiters' }, { status: 500 });
    }

    // Delete existing zuordnungen for this MdB
    const { error: deleteError } = await supabase
      .from('mdb_mitarbeiter_zuordnungen')
      .delete()
      .eq('mitarbeiter_id', mitarbeiterId)
      .eq('mdb_user_id', session.user.id);

    if (deleteError) {
      console.error('Error deleting old zuordnungen:', deleteError);
      return NextResponse.json({ error: 'Fehler beim Aktualisieren der Zuordnungen' }, { status: 500 });
    }

    // Create new zuordnungen
    const zuordnungenData = zuordnungen.map((z: any) => ({
      mitarbeiter_id: mitarbeiterId,
      mdb_user_id: session.user.id,
      eingruppierung: z.eingruppierung,
      zustaendigkeit: z.zustaendigkeit,
      einstellungsdatum: z.einstellungsdatum,
      befristung_bis: z.befristung_bis,
      einsatzort: z.einsatzort
    }));

    const { error: insertError } = await supabase
      .from('mdb_mitarbeiter_zuordnungen')
      .insert(zuordnungenData);

    if (insertError) {
      console.error('Error creating new zuordnungen:', insertError);
      return NextResponse.json({ error: 'Fehler beim Erstellen der neuen Zuordnungen' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Mitarbeiter erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('Error in PUT /api/mitarbeitende/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mitarbeiterId = params.id;

    // Verify mitarbeiter belongs to current MdB
    const { data: existingZuordnung } = await supabase
      .from('mdb_mitarbeiter_zuordnungen')
      .select('id')
      .eq('mitarbeiter_id', mitarbeiterId)
      .eq('mdb_user_id', session.user.id)
      .single();

    if (!existingZuordnung) {
      return NextResponse.json({ error: 'Mitarbeiter nicht gefunden oder keine Berechtigung' }, { status: 404 });
    }

    // Check if mitarbeiter has zuordnungen to other MdBs
    const { data: otherZuordnungen } = await supabase
      .from('mdb_mitarbeiter_zuordnungen')
      .select('id')
      .eq('mitarbeiter_id', mitarbeiterId)
      .neq('mdb_user_id', session.user.id);

    if (otherZuordnungen && otherZuordnungen.length > 0) {
      // Only delete this MdB's zuordnungen, keep the mitarbeiter
      const { error: deleteZuordnungError } = await supabase
        .from('mdb_mitarbeiter_zuordnungen')
        .delete()
        .eq('mitarbeiter_id', mitarbeiterId)
        .eq('mdb_user_id', session.user.id);

      if (deleteZuordnungError) {
        console.error('Error deleting zuordnung:', deleteZuordnungError);
        return NextResponse.json({ error: 'Fehler beim Löschen der Zuordnung' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Zuordnung erfolgreich gelöscht'
      });
    } else {
      // Delete the entire mitarbeiter (will cascade delete zuordnungen)
      const { error: deleteMitarbeiterError } = await supabase
        .from('abgeordneten_mitarbeiter')
        .delete()
        .eq('id', mitarbeiterId);

      if (deleteMitarbeiterError) {
        console.error('Error deleting mitarbeiter:', deleteMitarbeiterError);
        return NextResponse.json({ error: 'Fehler beim Löschen des Mitarbeiters' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Mitarbeiter erfolgreich gelöscht'
      });
    }

  } catch (error) {
    console.error('Error in DELETE /api/mitarbeitende/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mitarbeiterId = params.id;

    // Get mitarbeiter with zuordnungen for the current MdB
    const { data: mitarbeiterData, error } = await supabase
      .from('mitarbeiter_vollstaendig')
      .select('*')
      .eq('id', mitarbeiterId)
      .eq('mdb_id', session.user.id);

    if (error) {
      console.error('Error fetching mitarbeiter:', error);
      return NextResponse.json({ error: 'Fehler beim Laden des Mitarbeiters' }, { status: 500 });
    }

    if (!mitarbeiterData || mitarbeiterData.length === 0) {
      return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 });
    }

    // Group zuordnungen
    const mitarbeiter = {
      id: mitarbeiterData[0].id,
      name: mitarbeiterData[0].name,
      strasse: mitarbeiterData[0].strasse,
      hausnummer: mitarbeiterData[0].hausnummer,
      plz: mitarbeiterData[0].plz,
      ort: mitarbeiterData[0].ort,
      geburtsdatum: mitarbeiterData[0].geburtsdatum,
      email: mitarbeiterData[0].email,
      bueronummer: mitarbeiterData[0].bueronummer,
      mobilnummer: mitarbeiterData[0].mobilnummer,
      profilbild_url: mitarbeiterData[0].profilbild_url,
      created_at: mitarbeiterData[0].created_at,
      updated_at: mitarbeiterData[0].updated_at,
      zuordnungen: mitarbeiterData.map(row => ({
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
      }))
    };

    return NextResponse.json({
      data: mitarbeiter
    });

  } catch (error) {
    console.error('Error in GET /api/mitarbeitende/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 