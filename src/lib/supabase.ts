import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create client for public operations (client-side and authenticated server-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create client for server-side operations that need admin privileges
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Creates a Supabase client with user context for RLS policies
 * This sets the user ID in headers for custom RLS policies
 */
export const createAuthenticatedSupabaseClient = async () => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('No authenticated session found');
  }

  // Create a client with custom headers for RLS
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        // Custom header for RLS policies to identify the user
        'X-User-ID': session.user.id,
        'X-User-Email': session.user.email || '',
      },
    },
  });

  return client;
};

/**
 * Utility function to get an authenticated client for API routes
 * Use this in your API routes instead of the regular supabase client
 */
export const getAuthenticatedSupabase = async () => {
  try {
    return await createAuthenticatedSupabaseClient();
  } catch (error) {
    console.error('Failed to create authenticated Supabase client:', error);
    throw error;
  }
};

// Database types - these will be generated from the schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          airtable_id?: string;
          user_id_auto?: number;
          name: string;
          email: string;
          password?: string;
          profile_picture_url?: string;
          wahlkreis?: string;
          plz?: string;
          heimatbahnhof?: string;
          landesverband?: string;
          active?: boolean;
          magic_link?: string;
          role?: 'MdB' | 'Landesverband' | 'Partei' | 'Verwaltung';
          is_fraktionsvorstand?: boolean;
          geschlecht?: string;
          tel_bueroleitung?: string;
          ausschuss_1?: string;
          ausschuss_2?: string;
          ausschuss_3?: string;
          rolle_ausschuss_1?: string[];
          rolle_ausschuss_2?: string[];
          rolle_ausschuss_3?: string[];
          parlament?: string;
          pm_generator?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          airtable_id?: string;
          user_id_auto?: number;
          name: string;
          email: string;
          password?: string;
          profile_picture_url?: string;
          wahlkreis?: string;
          plz?: string;
          heimatbahnhof?: string;
          landesverband?: string;
          active?: boolean;
          magic_link?: string;
          role?: 'MdB' | 'Landesverband' | 'Partei' | 'Verwaltung';
          is_fraktionsvorstand?: boolean;
          geschlecht?: string;
          tel_bueroleitung?: string;
          ausschuss_1?: string;
          ausschuss_2?: string;
          ausschuss_3?: string;
          rolle_ausschuss_1?: string[];
          rolle_ausschuss_2?: string[];
          rolle_ausschuss_3?: string[];
          parlament?: string;
          pm_generator?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          airtable_id?: string;
          user_id_auto?: number;
          name?: string;
          email?: string;
          password?: string;
          profile_picture_url?: string;
          wahlkreis?: string;
          plz?: string;
          heimatbahnhof?: string;
          landesverband?: string;
          active?: boolean;
          magic_link?: string;
          role?: 'MdB' | 'Landesverband' | 'Partei' | 'Verwaltung';
          is_fraktionsvorstand?: boolean;
          geschlecht?: string;
          tel_bueroleitung?: string;
          ausschuss_1?: string;
          ausschuss_2?: string;
          ausschuss_3?: string;
          rolle_ausschuss_1?: string[];
          rolle_ausschuss_2?: string[];
          rolle_ausschuss_3?: string[];
          parlament?: string;
          pm_generator?: string;
          created_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          airtable_id?: string;
          user_id: string;
          widget_order?: string[];
          active_widgets?: string[];
          theme_preference?: string;
          videoplanung_view_mode?: string;
          last_update?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          airtable_id?: string;
          user_id: string;
          widget_order?: string[];
          active_widgets?: string[];
          theme_preference?: string;
          videoplanung_view_mode?: string;
          last_update?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          airtable_id?: string;
          user_id?: string;
          widget_order?: string[];
          active_widgets?: string[];
          theme_preference?: string;
          videoplanung_view_mode?: string;
          last_update?: string;
          created_at?: string;
        };
      };
      task_manager: {
        Row: {
          id: string;
          airtable_id?: string;
          auto_id?: number;
          user_id: string;
          name: string;
          description?: string;
          priority?: 'Dringend' | 'Hoch' | 'Normal' | 'Niedrig' | '-';
          next_job?: 'Brainstorming' | 'Skript' | 'Dreh' | 'Schnitt' | 'Veröffentlichung' | 'Erledigt';
          deadline?: string;
          completed?: boolean;
          created_at?: string;
        };
        Insert: {
          id?: string;
          airtable_id?: string;
          auto_id?: number;
          user_id: string;
          name: string;
          description?: string;
          priority?: 'Dringend' | 'Hoch' | 'Normal' | 'Niedrig' | '-';
          next_job?: 'Brainstorming' | 'Skript' | 'Dreh' | 'Schnitt' | 'Veröffentlichung' | 'Erledigt';
          deadline?: string;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          airtable_id?: string;
          auto_id?: number;
          user_id?: string;
          name?: string;
          description?: string;
          priority?: 'Dringend' | 'Hoch' | 'Normal' | 'Niedrig' | '-';
          next_job?: 'Brainstorming' | 'Skript' | 'Dreh' | 'Schnitt' | 'Veröffentlichung' | 'Erledigt';
          deadline?: string;
          completed?: boolean;
          created_at?: string;
        };
      };
      bpa_fahrten: {
        Row: {
          id: string;
          airtable_id?: string;
          user_id: string;
          fahrt_datum_von?: string;
          fahrt_datum_bis?: string;
          zielort?: string;
          hotel_name?: string;
          hotel_adresse?: string;
          kontingent_max?: number;
          status_fahrt?: string;
          anmeldefrist?: string;
          beschreibung?: string;
          zustiegsorte_config?: string;
          aktiv?: boolean;
          created_at?: string;
        };
        Insert: {
          id?: string;
          airtable_id?: string;
          user_id: string;
          fahrt_datum_von?: string;
          fahrt_datum_bis?: string;
          zielort?: string;
          hotel_name?: string;
          hotel_adresse?: string;
          kontingent_max?: number;
          status_fahrt?: string;
          anmeldefrist?: string;
          beschreibung?: string;
          zustiegsorte_config?: string;
          aktiv?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          airtable_id?: string;
          user_id?: string;
          fahrt_datum_von?: string;
          fahrt_datum_bis?: string;
          zielort?: string;
          hotel_name?: string;
          hotel_adresse?: string;
          kontingent_max?: number;
          status_fahrt?: string;
          anmeldefrist?: string;
          beschreibung?: string;
          zustiegsorte_config?: string;
          aktiv?: boolean;
          created_at?: string;
        };
      };
      bpa_formular: {
        Row: {
          id: string;
          airtable_id?: string;
          user_id: string;
          fahrt_id: string;
          anschrift?: string;
          postleitzahl?: string;
          ort?: string;
          vorname?: string;
          nachname?: string;
          geburtsdatum?: string;
          geburtsort?: string;
          zeitraum_von?: string;
          zeitraum_bis?: string;
          zeitraum_alle?: string;
          themen?: string;
          essenspraeferenzen?: string;
          email?: string;
          telefonnummer?: string;
          zustieg?: string;
          status_teilnahme?: string;
          status?: string;
          teilnahme_5j?: boolean;
          parteimitglied?: boolean;
          einzelzimmer?: boolean;
          created_at?: string;
        };
        Insert: {
          id?: string;
          airtable_id?: string;
          user_id: string;
          fahrt_id: string;
          anschrift?: string;
          postleitzahl?: string;
          ort?: string;
          vorname?: string;
          nachname?: string;
          geburtsdatum?: string;
          geburtsort?: string;
          zeitraum_von?: string;
          zeitraum_bis?: string;
          zeitraum_alle?: string;
          themen?: string;
          essenspraeferenzen?: string;
          email?: string;
          telefonnummer?: string;
          zustieg?: string;
          status_teilnahme?: string;
          status?: string;
          teilnahme_5j?: boolean;
          parteimitglied?: boolean;
          einzelzimmer?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          airtable_id?: string;
          user_id?: string;
          fahrt_id?: string;
          anschrift?: string;
          postleitzahl?: string;
          ort?: string;
          vorname?: string;
          nachname?: string;
          geburtsdatum?: string;
          geburtsort?: string;
          zeitraum_von?: string;
          zeitraum_bis?: string;
          zeitraum_alle?: string;
          themen?: string;
          essenspraeferenzen?: string;
          email?: string;
          telefonnummer?: string;
          zustieg?: string;
          status_teilnahme?: string;
          status?: string;
          teilnahme_5j?: boolean;
          parteimitglied?: boolean;
          einzelzimmer?: boolean;
          created_at?: string;
        };
      };
      touranfragen: {
        Row: {
          id: string;
          airtable_id?: string;
          user_id: string;
          kreisverband?: string;
          landesverband?: string;
          kandidat_name?: string;
          zeitraum_von?: string;
          zeitraum_bis?: string;
          themen?: string;
          video?: boolean;
          ansprechpartner_1_name?: string;
          ansprechpartner_1_phone?: string;
          ansprechpartner_2_name?: string;
          ansprechpartner_2_phone?: string;
          programmvorschlag?: 'füge ich an' | 'möchte ich mit dem Büro klären';
          status?: 'Neu' | 'Eingegangen' | 'Terminiert' | 'Abgeschlossen';
          created_at?: string;
        };
        Insert: {
          id?: string;
          airtable_id?: string;
          user_id: string;
          kreisverband?: string;
          landesverband?: string;
          kandidat_name?: string;
          zeitraum_von?: string;
          zeitraum_bis?: string;
          themen?: string;
          video?: boolean;
          ansprechpartner_1_name?: string;
          ansprechpartner_1_phone?: string;
          ansprechpartner_2_name?: string;
          ansprechpartner_2_phone?: string;
          programmvorschlag?: 'füge ich an' | 'möchte ich mit dem Büro klären';
          status?: 'Neu' | 'Eingegangen' | 'Terminiert' | 'Abgeschlossen';
          created_at?: string;
        };
        Update: {
          id?: string;
          airtable_id?: string;
          user_id?: string;
          kreisverband?: string;
          landesverband?: string;
          kandidat_name?: string;
          zeitraum_von?: string;
          zeitraum_bis?: string;
          themen?: string;
          video?: boolean;
          ansprechpartner_1_name?: string;
          ansprechpartner_1_phone?: string;
          ansprechpartner_2_name?: string;
          ansprechpartner_2_phone?: string;
          programmvorschlag?: 'füge ich an' | 'möchte ich mit dem Büro klären';
          status?: 'Neu' | 'Eingegangen' | 'Terminiert' | 'Abgeschlossen';
          created_at?: string;
        };
      };
      touranfragen_links: {
        Row: {
          id: string;
          airtable_id?: string;
          user_id: string;
          token: string;
          active?: boolean;
          created_at?: string;
          expires_at?: string;
        };
        Insert: {
          id?: string;
          airtable_id?: string;
          user_id: string;
          token: string;
          active?: boolean;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          airtable_id?: string;
          user_id?: string;
          token?: string;
          active?: boolean;
          created_at?: string;
          expires_at?: string;
        };
      };
      ka_generator: {
        Row: {
          id: string;
          airtable_record_id?: string;
          Titel: string;
          Prompt?: string;
          'Result final'?: string;
          'Beteiligte MdB'?: string;
          Rubrum?: string;
          Signatur?: string;
          Hintergrundinfos?: string;
          Politikfeld?: string;
          'Vorblatt_Heading'?: string;
          Vorblatt?: string;
          'Politische Zielsetzung'?: string;
          'Öffentliche Botschaft'?: string;
          Maßnahmen?: string;
          Vorbemerkung?: string;
          Fragenteil?: string;
          user_id: string;
          content?: string;
          category?: string;
          drucksache?: string;
          date_submitted?: string;
          answer_received?: boolean;
          answer_content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          airtable_record_id?: string;
          Titel: string;
          Prompt?: string;
          'Result final'?: string;
          'Beteiligte MdB'?: string;
          Rubrum?: string;
          Signatur?: string;
          Hintergrundinfos?: string;
          Politikfeld?: string;
          'Vorblatt_Heading'?: string;
          Vorblatt?: string;
          'Politische Zielsetzung'?: string;
          'Öffentliche Botschaft'?: string;
          Maßnahmen?: string;
          Vorbemerkung?: string;
          Fragenteil?: string;
          user_id: string;
          content?: string;
          category?: string;
          drucksache?: string;
          date_submitted?: string;
          answer_received?: boolean;
          answer_content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          airtable_record_id?: string;
          Titel?: string;
          Prompt?: string;
          'Result final'?: string;
          'Beteiligte MdB'?: string;
          Rubrum?: string;
          Signatur?: string;
          Hintergrundinfos?: string;
          Politikfeld?: string;
          'Vorblatt_Heading'?: string;
          Vorblatt?: string;
          'Politische Zielsetzung'?: string;
          'Öffentliche Botschaft'?: string;
          Maßnahmen?: string;
          Vorbemerkung?: string;
          Fragenteil?: string;
          user_id?: string;
          content?: string;
          category?: string;
          drucksache?: string;
          date_submitted?: string;
          answer_received?: boolean;
          answer_content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      fraktionsruf_counter: {
        Row: {
          id: string;
          airtable_id?: string;
          user_id: string;
          month: number;
          year: number;
          created_at?: string;
        };
        Insert: {
          id?: string;
          airtable_id?: string;
          user_id: string;
          month: number;
          year: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          airtable_id?: string;
          user_id?: string;
          month?: number;
          year?: number;
          created_at?: string;
        };
      };
      feinddossier: {
        Row: {
          id: string;
          airtable_id?: string;
          user_id: string;
          gegner: string;
          notes?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          airtable_id?: string;
          user_id: string;
          gegner: string;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          airtable_id?: string;
          user_id?: string;
          gegner?: string;
          notes?: string;
          created_at?: string;
        };
      };
      schriftliche_fragen: {
        Row: {
          id: string;
          airtable_id?: string;
          user_id: string;
          question_number?: string;
          title: string;
          content?: string;
          minister?: string;
          date_submitted?: string;
          answer_received?: boolean;
          answer_content?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          airtable_id?: string;
          user_id: string;
          question_number?: string;
          title: string;
          content?: string;
          minister?: string;
          date_submitted?: string;
          answer_received?: boolean;
          answer_content?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          airtable_id?: string;
          user_id?: string;
          question_number?: string;
          title?: string;
          content?: string;
          minister?: string;
          date_submitted?: string;
          answer_received?: boolean;
          answer_content?: string;
          created_at?: string;
        };
      };
      // Add more table types as needed
    };
  };
};

// Helper function to get authenticated user from session
export const getCurrentUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return data;
};

// Helper function to check if user exists by email
export const getUserByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('active', true)
    .single();

  return { data, error };
};

// Helper function to authenticate user credentials
export const authenticateUser = async (email: string, password: string) => {
  const { data: user, error } = await getUserByEmail(email);
  
  if (error || !user) {
    return null;
  }

  // For now, we'll assume password checking is done in NextAuth
  // In the future, we might want to implement proper password hashing
  return user;
}; 