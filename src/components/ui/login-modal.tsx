"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ isOpen, onOpenChange }: LoginModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Supabase client (keeping for potential future use)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    console.log('LoginModal handleSubmit triggered for:', email);

    try {
      // Step 1: Try to sign in with Supabase directly
      console.log('LoginModal: Attempting Supabase direct login for:', email);
      const { data: supabaseLoginData, error: supabaseLoginError } = await supabase.auth.signInWithPassword({
        email: email, // value from state
        password: password, // value from state
      });

      if (supabaseLoginError) {
        console.warn('LoginModal: Supabase direct login failed for:', email, supabaseLoginError.message);
        // If Supabase direct login fails, it might be a user that needs migration via temp_password
        // or the password is truly incorrect for an already migrated user.
        // Fallback to NextAuth credentials provider for migration or final failure.
        console.log('LoginModal: Falling back to NextAuth signIn (credentials) for:', email);
        const result = await signIn('credentials', {
          email: email, // value from state
          password: password, // value from state
          redirect: false, // Important: handle redirect manually
        });

        if (result?.error) {
          console.error('LoginModal: NextAuth signIn (credentials) failed after Supabase fail for:', email, result.error);
          const msg = result.error === 'CredentialsSignin' || result.error.includes('Custom error') // Check for custom error from authorize
            ? 'E-Mail oder Passwort ist falsch oder das Konto konnte nicht migriert werden.'
            : result.error;
          setErrorMsg(msg);
          setIsLoading(false);
          return;
        }

        if (result?.ok) {
          console.log('LoginModal: NextAuth signIn (credentials) successful (migration likely) for:', email);
          // Migration was successful via NextAuth credentials provider.
          // Now, attempt Supabase login again with the same credentials to set sb-* cookies.
          console.log('LoginModal: Attempting Supabase login post-migration to set cookies for:', email);
          const { error: postMigrationSupabaseError } = await supabase.auth.signInWithPassword({
            email: email, // value from state
            password: password, // value from state
          });

          if (postMigrationSupabaseError) {
            console.warn(
              'LoginModal: Supabase login FAILED after successful migration for:',
              email,
              postMigrationSupabaseError.message
            );
            // Log this, but proceed with NextAuth session. sb-* cookies might be missing.
            // Consider if setErrorMsg should be set here to inform the user of partial success.
            // For now, we prioritize completing the NextAuth login.
          } else {
            console.log('LoginModal: Supabase login post-migration successful, sb-* cookies should be set for:', email);
          }
          
          onOpenChange(false); // Close modal
          router.push('/'); // Redirect
        }
      } else if (supabaseLoginData?.user && supabaseLoginData?.session) {
        console.log('LoginModal: Supabase direct login successful for:', email, 'User ID:', supabaseLoginData.user.id);
        // Supabase login successful. sb-* cookies are set.
        // NOW, we need to establish the NextAuth session.
        console.log('LoginModal: Supabase direct login succeeded. Attempting NextAuth signIn to establish session for:', email);
        const nextAuthSyncResult = await signIn('credentials', {
          email: email, // value from state
          password: password, // value from state - Sending password again. Ideal: use a different provider or token.
          redirect: false,
        });

        if (nextAuthSyncResult?.error) {
          console.error('LoginModal: NextAuth signIn (for session sync) FAILED after Supabase direct login for:', email, nextAuthSyncResult.error);
          // This is problematic. Supabase login worked, but NextAuth session couldn't be established.
          setErrorMsg('Supabase-Anmeldung erfolgreich, aber die Synchronisierung der Sitzung mit dem Hauptsystem ist fehlgeschlagen. Bitte kontaktieren Sie den Support.');
          setIsLoading(false);
          // Potentially sign out of Supabase if NextAuth sync is critical and failed.
          // await supabase.auth.signOut();
          return;
        }
        console.log('LoginModal: NextAuth signIn (for session sync) successful after Supabase direct login for:', email);
        onOpenChange(false); // Close modal
        router.push('/'); // Redirect
      } else {
         console.error('LoginModal: Supabase direct login returned no error but no user/session. Email:', email);
         setErrorMsg('Ein unerwarteter Fehler ist bei der Supabase-Anmeldung aufgetreten.');
         setIsLoading(false);
         return;
      }
    } catch (e: any) {
      console.error('LoginModal: Global error during login process for:', email, e);
      setErrorMsg(e.message || 'Ein unbekannter Fehler ist aufgetreten.');
    } finally {
      // Ensure isLoading is set to false only if no redirect is happening or after all operations.
      // router.push might unmount the component before finally executes if not handled carefully.
      // For simplicity, we rely on the return statements above to stop execution if there's an error.
      // If we reached here and didn't return, it implies a success path that will redirect.
      // If an error occurred and we returned, this still runs.
      // If no error and success, redirect happens, then this might run or not depending on unmount.
      // It's generally safe to set it here. If already unmounted, it won't do anything.
      setIsLoading(false); 
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setErrorMsg(null);
    setIsLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background/10 backdrop-blur-sm border border-border !text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold font-work-sans font-black !text-white">
            Linksfraktion Studio
          </DialogTitle>
          <DialogDescription className="text-center !text-white">
            Politische Werkzeugsammlung
          </DialogDescription>
        </DialogHeader>
        
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-work-sans !text-white">Anmelden</CardTitle>
            <CardDescription className="!text-white">
              Bitte melde dich mit deinen Zugangsdaten an.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal-email" className="!text-white">E-Mail</Label>
                <Input
                  id="modal-email"
                  type="email"
                  placeholder="max.mustermann@bundestag.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-background/20 backdrop-blur-sm border-border !text-white placeholder:!text-white/70"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-password" className="!text-white">Passwort</Label>
                <Input
                  id="modal-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-background/20 backdrop-blur-sm border-border !text-white placeholder:!text-white/70"
                />
              </div>
              
              {errorMsg && (
                <Alert variant="destructive" className="bg-destructive/10 backdrop-blur-sm border-destructive/20">
                  <AlertDescription className="!text-white">{errorMsg}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-background/10 backdrop-blur-sm border border-border !text-white hover:bg-background/20 transition-colors" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin !text-white" />
                    Lädt...
                  </>
                ) : (
                  'Anmelden'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
} 