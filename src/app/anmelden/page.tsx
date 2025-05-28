"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ThreeDMarquee } from '@/components/ui/3d-marquee';
import { LoginModal } from '@/components/ui/login-modal';

export default function AnmeldenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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
      
      {/* ThreeDMarquee Container - properly constrained */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <ThreeDMarquee
          className="pointer-events-none !h-full !w-full !rounded-none"
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