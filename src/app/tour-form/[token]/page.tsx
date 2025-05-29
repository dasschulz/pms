import { TourRequestForm } from '@/components/touranfragen/tour-request-form';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    token: string;
  };
}

async function fetchMdBDetails(token: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002'}/api/tour-form/mdb-details?token=${encodeURIComponent(token)}`,
      { 
        cache: 'no-store', // Always fetch fresh data for token validation
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch MdB details:', response.status, response.statusText);
      return null;
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching MdB details:', error);
    return null;
  }
}

export default async function TourFormPage({ params }: PageProps) {
  const { token } = params;

  // Fetch MdB details using the token
  const userData = await fetchMdBDetails(token);

  // If we can't fetch user data (invalid token, expired token, etc.), show 404
  if (!userData) {
    console.log('Tour form page: Invalid token or failed to fetch MdB details for token:', token);
    notFound();
  }

  console.log('Tour form page: Successfully loaded MdB details for:', userData.name);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <TourRequestForm 
        userData={userData}
        token={token}
      />
    </div>
  );
} 