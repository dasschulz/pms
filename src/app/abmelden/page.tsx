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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Sie werden abgemeldet...</p>
      </div>
    </div>
  );
}

    