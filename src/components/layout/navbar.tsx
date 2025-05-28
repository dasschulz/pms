"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { CachedAvatar } from "@/components/ui/cached-avatar";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [isFunktionModalOpen, setIsFunktionModalOpen] = useState(false);
  const [funktionMdContent, setFunktionMdContent] = useState("");
  const [currentPageTitle, setCurrentPageTitle] = useState("");

  const handleProfileClick = () => {
    router.push('/einstellungen');
  };

  const fetchFunktionMd = async () => {
    if (!pathname) return;

    let apiPath = pathname.split('/').filter(p => p && !p.startsWith('[') && !p.endsWith(']')).join('/');
    if (pathname.includes('[')) {
        const segments = pathname.split('/');
        const dynamicSegmentIndex = segments.findIndex(segment => segment.startsWith('[') && segment.endsWith(']'));
        if (dynamicSegmentIndex > 0) {
            apiPath = segments.slice(0, dynamicSegmentIndex).join('/');
        }
    }
    const pageModulePath = apiPath || '/';
    
    const titleSegments = pageModulePath.split('/').filter(Boolean);
    const title = titleSegments.length > 0 ? titleSegments[titleSegments.length - 1] : "Homepage";
    setCurrentPageTitle(title.charAt(0).toUpperCase() + title.slice(1));

    try {
      const response = await fetch(`/api/funktion-md?pathname=${encodeURIComponent(pageModulePath)}`);
      if (response.ok) {
        const data = await response.json();
        setFunktionMdContent(data.content);
        setIsFunktionModalOpen(true);
      } else {
        setFunktionMdContent("Fehler beim Laden der Funktionsbeschreibung oder für diese Seite nicht vorhanden.");
        setIsFunktionModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching funktion.md:", error);
      setFunktionMdContent("Fehler beim Laden der Funktionsbeschreibung.");
      setIsFunktionModalOpen(true);
    }
  };
  
  useEffect(() => {
    if (!isFunktionModalOpen) {
      setFunktionMdContent("");
    }
  }, [isFunktionModalOpen]);

  return (
    <>
      <header 
        className={cn(
          "sticky top-0 z-50 flex items-center justify-between px-4 h-16 border-b",
          "bg-background/30 backdrop-blur-lg supports-[backdrop-filter]:bg-background/30",
          "shadow-sm border-border/50",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Button variant="ghost" size="icon" onClick={fetchFunktionMd} title="Funktionsbeschreibung anzeigen">
            <Info className="h-5 w-5" />
          </Button>
        </div>
        
        <Breadcrumbs />
        
        <div className="flex items-center gap-4">
          {session?.user && (
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity rounded-lg px-2 py-1"
              onClick={handleProfileClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleProfileClick();
                }
              }}
            >
              <div className="hidden sm:block text-sm font-medium text-foreground/90">
                {session.user.name || "Unbekannte/r Nutzer/in"}
              </div>
              <div className="relative">
                <CachedAvatar 
                  src={session.user.image || undefined}
                  alt={session.user.name || "Profilbild"}
                  fallbackText={session.user.name || undefined}
                  size="md"
                />
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </header>

      <Dialog open={isFunktionModalOpen} onOpenChange={setIsFunktionModalOpen}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Funktionsweise: {currentPageTitle}</DialogTitle>
            <DialogDescription>
              Hier ist die Beschreibung der aktuellen Seite und ihrer Funktionen.
            </DialogDescription>
          </DialogHeader>
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{funktionMdContent}</ReactMarkdown>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Schließen
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 