import { TourRequestForm } from '@/components/touranfragen/tour-request-form';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    token: string;
  };
}

export default async function TourFormPage({ params }: PageProps) {
  // The form component will handle token validation internally
  // since we have the validation logic in our migrated API endpoints
  // For now, pass minimal userData structure that the component expects
  
  const userData = {
    userId: 'token-based', // Will be resolved by the form component
    userIdNumber: '',
    name: '',
    firstName: '',
    email: '',
    profilePictureUrl: undefined,
    linkRecordId: params.token, // Use token as reference
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <TourRequestForm 
        userData={userData}
        token={params.token}
      />
    </div>
  );
} 