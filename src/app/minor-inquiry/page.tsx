import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { base } from '@/lib/airtable';
import { PageLayout } from '@/components/page-layout';
import MinorInquiriesList from '@/components/minor-inquiry/minor-inquiries-list';

export default async function MyMinorInquiriesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/anmelden');
  }

  // Fetch Airtable user record ID
  const userRecords = await base('Users')
    .select({ filterByFormula: `{UserID} = '${session.user.id}'`, maxRecords: 1 })
    .firstPage();
  const userAirtableId = userRecords[0]?.id;
  if (!userAirtableId) {
    return (
      <PageLayout title="Meine Kleinen Anfragen">
        <p>Benutzer nicht gefunden.</p>
      </PageLayout>
    );
  }

  // Fetch all Kleine Anfragen sorted by creation date
  const allRecords = await base('KA-Generator')
    .select({ sort: [{ field: 'Created', direction: 'desc' }] })
    .firstPage();
  // Filter records by linked User-ID field
  const records = allRecords.filter((record) => {
    const linked = record.fields['User-ID'];
    if (Array.isArray(linked)) {
      return linked.includes(userAirtableId);
    }
    return linked === userAirtableId;
  });

  const inquiries = records.map(record => ({ id: record.id, fields: record.fields }));
  return (
    <PageLayout
      title="Meine Kleinen Anfragen"
      description="Übersicht Ihrer erstellten Kleinen Anfragen"
    >
      <MinorInquiriesList inquiries={inquiries} />
    </PageLayout>
  );
} 