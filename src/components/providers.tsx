"use client";

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Create a QueryClient instance with optimized settings
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Increase stale time to reduce redundant requests
        staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
        // Reduce automatic refetching to minimize API spam
        refetchOnWindowFocus: false, // Don't refetch when window gets focus
        refetchOnMount: false, // Don't refetch when component mounts if data exists
        refetchOnReconnect: true, // Still refetch when network reconnects
        // Retry failed requests with backoff
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Keep data in cache longer
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
      },
    },
  }));

  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Only check session every 5 minutes instead of default 4 minutes
      refetchOnWindowFocus={false} // Don't refetch when window gains focus
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
          <SonnerToaster />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
} 