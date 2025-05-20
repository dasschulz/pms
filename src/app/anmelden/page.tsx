"use client";

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/page-layout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AnmeldenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl: '/',
    });
    setIsLoading(false);
    if (res?.error) {
      // Map generic error codes to friendly messages
      const msg = res.error === 'CredentialsSignin'
        ? 'E-Mail oder Passwort ist falsch.'
        : res.error;
      setErrorMsg(msg);
    } else {
      router.push((res as any)?.url || '/');
    }
  };

  return (
    <PageLayout title="Anmelden" description="Bitte melden Sie sich an.">
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        <div>
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="max.mustermann@bundestag.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Passwort</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {errorMsg && <p className="text-red-600">{errorMsg}</p>}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Lädt...' : 'Anmelden'}
        </Button>
      </form>
    </PageLayout>
  );
} 