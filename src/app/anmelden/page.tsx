"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ThreeDMarquee } from '@/components/ui/3d-marquee';
import { LoginModal } from '@/components/ui/login-modal';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Separate component for search params that will be wrapped in Suspense
function SearchParamsHandler({ 
  setIsLoginModalOpen, 
  setIsReset, 
  setAuthError 
}: {
  setIsLoginModalOpen: (open: boolean) => void;
  setIsReset: (reset: boolean) => void;
  setAuthError: (error: string | null) => void;
}) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const isReset = searchParams.get('reset') === 'true';
    const authError = searchParams.get('error');
    
    setIsReset(isReset);
    setAuthError(authError);
    
    // Auto-open login modal if there's an error or reset parameter
    if (isReset || authError) {
      setIsLoginModalOpen(true);
    }
  }, [searchParams, setIsLoginModalOpen, setIsReset, setAuthError]);

  return null;
}

export default function AnmeldenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  const images = [
    "/images/anmelden/01.jpg",
    "/images/anmelden/02.jpg",
    "/images/anmelden/03.jpg",
    "/images/anmelden/04.jpg",
    "/images/anmelden/05.jpg",
    "/images/anmelden/06.jpg",
    "/images/anmelden/07.jpg",
    "/images/anmelden/08.jpg",
    "/images/anmelden/09.jpg",
    "/images/anmelden/10.jpg",
    "/images/anmelden/11.jpg",
    "/images/anmelden/12.jpg",
    "/images/anmelden/13.jpg",
    "/images/anmelden/14.jpg",
    "/images/anmelden/15.jpg",
    "/images/anmelden/16.jpg",
    "/images/anmelden/17.jpg",
    "/images/anmelden/18.jpg",
    "/images/anmelden/19.jpg",
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div 
      className="dark relative mx-auto flex h-screen w-full flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: 'hsl(326 100% 22%)',
        backgroundImage: `
          radial-gradient(circle at 20% 30%, hsl(0 100% 50%) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, hsl(0 100% 50%) 0%, transparent 40%),
          radial-gradient(circle at 60% 80%, hsl(0 100% 50%) 0%, transparent 45%),
          radial-gradient(circle at 10% 70%, hsl(0 100% 50%) 0%, transparent 35%)
        `
      }}
    >
      {/* Search params handler wrapped in Suspense */}
      <Suspense fallback={null}>
        <SearchParamsHandler 
          setIsLoginModalOpen={setIsLoginModalOpen}
          setIsReset={setIsReset}
          setAuthError={setAuthError}
        />
      </Suspense>

      <h1 className="relative z-20 mx-auto max-w-4xl text-center text-3xl font-bold text-balance text-foreground md:text-5xl lg:text-7xl font-work-sans font-black">
        Deine Webapp für den Bundestag:{" "}
        <span className="relative z-20 inline-block rounded-xl bg-primary/20 px-4 py-1 text-white backdrop-blur-sm">
          Linksfraktion
        </span>{" "}
        Studio.
      </h1>
      <p className="relative z-20 mx-auto max-w-2xl py-8 text-center text-sm text-white md:text-base">
        Deine zentrale Anlaufstelle für politische Arbeit und Kommunikation.
        Nutze unsere professionellen Tools für deinen politischen Alltag.
      </p>

      {/* Authentication Issue Alert */}
      {(isReset || authError) && (
        <div className="relative z-20 mx-auto max-w-lg mb-6">
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <AlertDescription>
              {isReset ? (
                <div className="text-center space-y-2">
                  <p className="font-semibold text-blue-800 dark:text-blue-200">
                    ✅ Authentication Reset Complete
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Your session has been cleared. Please log in again with your credentials.
                  </p>
                </div>
              ) : authError ? (
                <div className="text-center space-y-2">
                  <p className="font-semibold text-orange-800 dark:text-orange-200">
                    🔑 Authentication Required
                  </p>
                  <p className="text-orange-700 dark:text-orange-300 text-sm">
                    Please log in to continue. If you were having issues, they should now be resolved.
                  </p>
                </div>
              ) : null}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="relative z-20 flex flex-wrap items-center justify-center gap-4 pt-4">
        <button 
          onClick={() => setIsLoginModalOpen(true)}
          className="rounded-md border border-border bg-background/10 px-6 py-2.5 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-background/20 hover:border-red-500 focus:ring-2 focus:ring-border focus:ring-offset-2 focus:ring-offset-background focus:outline-none"
        >
          Anmelden
        </button>
      </div>

      {/* overlay */}
      <div className="absolute inset-0 z-10 h-full w-full bg-background/80 dark:bg-background/40" />
      
      {/* ThreeDMarquee Container - full page coverage with overflow */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <ThreeDMarquee
          className="pointer-events-none !h-[120%] !w-[120%] !rounded-none"
          images={images}
        />
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onOpenChange={setIsLoginModalOpen} 
      />
    </div>
  );
} 