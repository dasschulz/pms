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
    "/public/images/anmelden/01.jpg",
    "/public/images/anmelden/02.jpg",
    "/public/images/anmelden/03.jpg",
    "/public/images/anmelden/04.jpg",
    "/public/images/anmelden/05.jpg",
    "/public/images/anmelden/06.jpg",
    "/public/images/anmelden/07.jpg",
    "/public/images/anmelden/08.jpg",
    "/public/images/anmelden/09.jpg",
    "/public/images/anmelden/10.jpg",
    "https://assets.aceternity.com/cloudinary_bkp/Spotlight_ar5jpr.png",
    "https://assets.aceternity.com/cloudinary_bkp/Parallax_Scroll_pzlatw_anfkh7.png",
    "https://assets.aceternity.com/tabs.png",
    "https://assets.aceternity.com/cloudinary_bkp/Tracing_Beam_npujte.png",
    "https://assets.aceternity.com/cloudinary_bkp/typewriter-effect.png",
    "https://assets.aceternity.com/glowing-effect.webp",
    "https://assets.aceternity.com/hover-border-gradient.png",
    "https://assets.aceternity.com/cloudinary_bkp/Infinite_Moving_Cards_evhzur.png",
    "https://assets.aceternity.com/cloudinary_bkp/Lamp_hlq3ln.png",
    "https://assets.aceternity.com/macbook-scroll.png",
    "https://assets.aceternity.com/cloudinary_bkp/Meteors_fye3ys.png",
    "https://assets.aceternity.com/cloudinary_bkp/Moving_Border_yn78lv.png",
    "https://assets.aceternity.com/multi-step-loader.png",
    "https://assets.aceternity.com/vortex.png",
    "https://assets.aceternity.com/wobble-card.png",
    "https://assets.aceternity.com/world-map.webp",
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-background">
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
      <ThreeDMarquee
        className="pointer-events-none absolute inset-x-0 inset-y-0 h-[120vh] w-screen"
        images={images}
      />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onOpenChange={setIsLoginModalOpen} 
      />
    </div>
  );
} 