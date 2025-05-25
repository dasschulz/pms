"use client";

import { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AbmeldenPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      if (session) {
        await signOut({ 
          callbackUrl: '/anmelden',
          redirect: true 
        });
      } else {
        // If no session, redirect directly to login
        router.push('/anmelden');
      }
    };

    handleSignOut();
  }, [session, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-2xl font-semibold mb-2">Abmeldung</h1>
      <p className="text-muted-foreground">Du wirst abgemeldet...</p>
    </div>
  );
}

    