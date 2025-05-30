import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface OrgNode {
  id: string;
  name: string;
  position: string;
  email?: string;
  phone?: string;
  roomNumber?: string;
  isAbteilungHeader?: boolean;
  isHiddenConceptualRoot?: boolean;
  isSharedUnderCoLeaders?: boolean;
  children?: OrgNode[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'partei' or 'fraktion'

    if (!type || !['partei', 'fraktion'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    const { data: organigramm, error } = await supabase
      .from('organigramme')
      .select('data')
      .eq('type', type)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching organigramm:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!organigramm || !organigramm.data) {
      const defaultData = getDefaultOrganigramm(type);
      return NextResponse.json({ data: defaultData } as { data: OrgNode });
    }

    return NextResponse.json({ data: organigramm.data as OrgNode });
  } catch (error) {
    console.error('Error in GET /api/organigramme:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body as { type: string; data: OrgNode };

    if (!type || !['partei', 'fraktion'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Missing data parameter' }, { status: 400 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('organigramme')
      .select('id')
      .eq('type', type)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking for existing organigramm:', fetchError);
        return NextResponse.json({ error: 'Database error while checking existing' }, { status: 500 });
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from('organigramme')
        .update({
          data,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('type', type);

      if (updateError) {
        console.error('Error updating organigramm:', updateError);
        return NextResponse.json({ error: 'Database error on update' }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabase
        .from('organigramme')
        .insert({
          type,
          data,
          created_by: user.id,
          updated_by: user.id
        });

      if (insertError) {
        console.error('Error inserting organigramm:', insertError);
        return NextResponse.json({ error: 'Database error on insert' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/organigramme:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getDefaultOrganigramm(type: string): OrgNode {
  if (type === 'partei') {
    return {
      id: "conceptual-root-partei-default",
      name: "Conceptual Root Partei - Default",
      position: "",
      isHiddenConceptualRoot: true,
      children: [
        { 
          id: "p-janine-wissler-default", 
          name: "Janine Wissler", 
          position: "Parteivorsitzende",
          email: "janine.wissler@die-linke.de",
          phone: "100"
        },
        { 
          id: "p-martin-schirdewan-default", 
          name: "Martin Schirdewan", 
          position: "Parteivorsitzender",
          email: "martin.schirdewan@die-linke.de",
          phone: "101"
        }
      ]
    };
  } else { // fraktion
    return {
      id: "conceptual-root-fraktion-default",
      name: "Conceptual Root Fraktion - Default",
      position: "",
      isHiddenConceptualRoot: true,
      children: [
        {
          id: "f-amira-mohamed-ali-default",
          name: "Amira Mohamed Ali", 
          position: "Fraktionsvorsitzende",
          email: "amira.mohamedali@bundestag.de",
          phone: "79235",
          roomNumber: "JGH I 840"
        },
        {
          id: "f-dietmar-bartsch-default",
          name: "Dietmar Bartsch", 
          position: "Fraktionsvorsitzender",
          email: "dietmar.bartsch@bundestag.de",
          phone: "71734",
          roomNumber: "JGH I 734"
        }
      ]
    };
  }
} 