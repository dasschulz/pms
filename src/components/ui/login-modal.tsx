"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: '/',
      });
      
      if (res?.error) {
        const msg = res.error === 'CredentialsSignin'
          ? 'E-Mail oder Passwort ist falsch.'
          : res.error;
        setErrorMsg(msg);
      } else if (res?.ok) {
        onOpenChange(false);
        router.push('/');
      }
    } catch (error) {
      setErrorMsg('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
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