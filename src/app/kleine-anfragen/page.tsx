import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';
import { PageLayout } from '@/components/page-layout';
import MinorInquiriesList from "@/components/kleine-anfragen/minor-inquiries-list";

export default async function MyMinorInquiriesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/anmelden');
  }

  try {
    // Fetch all Kleine Anfragen for the authenticated user, sorted by creation date
    const { data: inquiries, error } = await supabase
      .from('ka_generator')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching kleine anfragen:', error);
      return (
        <PageLayout title="Meine Kleinen Anfragen">
          <p>Fehler beim Laden der Daten.</p>
        </PageLayout>
      );
    }

    // Convert to the format expected by the component
    const formattedInquiries = (inquiries || []).map((inquiry: any) => ({
      id: inquiry.id,
      fields: {
        'Titel': inquiry.Titel,
        'Prompt': inquiry.Prompt,
        'Result final': inquiry['Result final'],
        'Beteiligte MdB': inquiry['Beteiligte MdB'],
        'Rubrum': inquiry.Rubrum,
        'Signatur': inquiry.Signatur,
        'Hintergrundinfos': inquiry.Hintergrundinfos,
        'Politikfeld': inquiry.Politikfeld,
        'Vorblatt_Heading': inquiry['Vorblatt_Heading'],
        'Vorblatt': inquiry.Vorblatt,
        'Politische Zielsetzung': inquiry['Politische Zielsetzung'],
        'Öffentliche Botschaft': inquiry['Öffentliche Botschaft'],
        'Maßnahmen': inquiry.Maßnahmen,
        'Vorbemerkung': inquiry.Vorbemerkung,
        'Fragenteil': inquiry.Fragenteil,
        'content': inquiry.content,
        'category': inquiry.category || inquiry.Politikfeld,
        'drucksache': inquiry.drucksache,
        'date_submitted': inquiry.date_submitted,
        'answer_received': inquiry.answer_received,
        'Status': inquiry.answer_received ? 'Beantwortet' : 'Offen',
        'answer_content': inquiry.answer_content,
        'Created': inquiry.created_at,
        'Updated': inquiry.updated_at || inquiry.created_at,
      }
    }));

    if (formattedInquiries.length === 0) {
      return (
        <PageLayout
          title="Meine Kleinen Anfragen"
          description="Übersicht deiner erstellten Kleinen Anfragen"
        >
          <p>Du hast noch keine Kleinen Anfragen erstellt oder es konnten keine für dich gefunden werden.</p>
        </PageLayout>
      );
    }

    return (
      <PageLayout
        title="Meine Kleinen Anfragen"
        description="Übersicht deiner erstellten Kleinen Anfragen"
      >
        <MinorInquiriesList inquiries={formattedInquiries} />
      </PageLayout>
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return (
      <PageLayout title="Meine Kleinen Anfragen">
        <p>Ein unerwarteter Fehler ist aufgetreten.</p>
      </PageLayout>
    );
  }
} 