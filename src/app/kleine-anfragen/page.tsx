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
      .from('kleine_anfragen')
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
        'Titel': inquiry.title,
        'Text': inquiry.content,
        'Kategorie': inquiry.category,
        'Status': inquiry.answer_received ? 'Beantwortet' : 'Offen',
        'Created': inquiry.created_at,
        'Updated': inquiry.created_at,
      }
    }));

    return (
      <PageLayout
        title="Meine Kleinen Anfragen"
        description="Übersicht Ihrer erstellten Kleinen Anfragen"
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