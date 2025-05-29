"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { AppLayout } from "./app-layout";
import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function ConditionalLayout({ children }: PropsWithChildren) {
  // All hooks are called at the top level
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Helper function to check if the current path is a public route
  const isPublicRoute = (path: string) => {
    return path === "/anmelden" || 
           path === "/abmelden" || 
           path.startsWith("/bpa/") || 
           path.startsWith("/bpa-form/") ||
           path.startsWith("/tour-form/");
  };
  
  useEffect(() => {
    // Effect logic remains, but its call is unconditional at the top level
    if (status === "unauthenticated" && !isPublicRoute(pathname)) {
      setIsRedirecting(true);
      router.push("/anmelden");
    } else if (status === "authenticated") {
      setIsRedirecting(false); // Clear redirecting state if authenticated
    }
  }, [status, pathname, router]); // Removed session from deps as status and pathname cover the redirect logic sufficiently
  
  // Conditional rendering logic now follows all hook calls
  if (isPublicRoute(pathname)) {
    return <>{children}</>;
  }
  
  // Show loading spinner while checking authentication initially or if redirecting
  if (status === "loading" || (status === "unauthenticated" && !isPublicRoute(pathname)) || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // If user is authenticated, show the app layout
  if (session) {
    return <AppLayout>{children}</AppLayout>;
  }
  
  // Fallback for any other unhandled cases (e.g. if not loading, not redirecting, and not authenticated yet)
  // This should ideally not be hit if logic is correct, but acts as a safety net.
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
} 