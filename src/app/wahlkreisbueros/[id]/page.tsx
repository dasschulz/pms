"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WahlkreisbueroDetailPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/wahlkreisbueros');
  }, [router]);

  return null;
} 