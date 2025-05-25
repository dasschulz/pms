"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { CachedAvatar } from "@/components/ui/cached-avatar";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const { data: session } = useSession();
  
  return (
    <header 
      className={cn(
        "sticky top-0 z-50 flex items-center justify-between px-4 h-16 border-b",
        // Enhanced glassmorphism effect
        "bg-background/30 backdrop-blur-lg supports-[backdrop-filter]:bg-background/30",
        "shadow-sm border-border/50",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <SidebarTrigger />
      </div>
      
      {/* Breadcrumbs will take up the central space */}
      <Breadcrumbs />
      
      <div className="flex items-center gap-4">
        {/* Profile section */}
        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-sm font-medium text-foreground/90">
              {session.user.name || "Unbekannte/r Nutzer/in"}
            </div>
            <CachedAvatar 
              src={session.user.image || undefined}
              alt={session.user.name || "Profilbild"}
              fallbackText={session.user.name || undefined}
              size="md"
            />
          </div>
        )}
      </div>
    </header>
  );
} 