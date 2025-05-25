import { TourRequestForm } from '@/components/touranfragen/tour-request-form';
import { base } from '@/lib/airtable';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    token: string;
  };
}

async function getUserDataForToken(token: string) {
  try {
    // First, find the link record with this token
    const linkRecords = await base('Touranfragen_Links')
      .select({
        filterByFormula: `AND({Token} = '${token}', {Active} = TRUE())`,
        maxRecords: 1,
      })
      .firstPage();

    if (linkRecords.length === 0) {
      return null;
    }

    const linkRecord = linkRecords[0];
    const userIdArray = linkRecord.get('UserID') as string[];
    
    if (!userIdArray || userIdArray.length === 0) {
      return null;
    }
    
    const userAirtableId = userIdArray[0]; // Get the first (and should be only) linked record ID

    // Now get user details using the Airtable record ID directly
    const userRecord = await base('Users').find(userAirtableId);

    if (!userRecord) {
      return null;
    }

    const name = userRecord.get('Name') as string;
    const profilePicture = userRecord.get('Profile Picture') as any[] | undefined;
    const email = userRecord.get('Email') as string;
    const userIdNumber = userRecord.get('UserID') as number;

    // Extract profile picture URL if available
    const profilePictureUrl = profilePicture && profilePicture.length > 0 
      ? profilePicture[0].url 
      : null;

    // Extract first name from full name
    const firstName = name ? name.split(' ')[0] : '';

    return {
      userId: userAirtableId, // Use Airtable record ID for linking
      userIdNumber: String(userIdNumber), // Keep the UserID number for reference
      name,
      firstName,
      email,
      profilePictureUrl,
      linkRecordId: linkRecord.id,
    };
  } catch (error) {
    console.error('Error fetching user data for token:', error);
    return null;
  }
}

export default async function TourFormPage({ params }: PageProps) {
  const userData = await getUserDataForToken(params.token);

  if (!userData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <TourRequestForm 
        userData={userData}
        token={params.token}
      />
    </div>
  );
} 