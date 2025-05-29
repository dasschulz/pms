'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react'; // Import useSession
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CalendarIcon } from 'lucide-react'; // For loading spinner
import { Skeleton } from '@/components/ui/skeleton';
import { PageLayout } from '@/components/page-layout';
import { toast } from 'sonner'; // Assuming sonner is used for toasts like in fraktionsruf
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type UserProfile = {
  id: string;
  name: string | null;
  is_fraktionsvorstand: boolean | null;
};

type MdbUser = {
  id: string;
  name: string | null;
};

export default function AgendaSettingPage() {
  const { data: session, status: sessionStatus } = useSession(); // Use NextAuth session
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true); // Combined loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null); // Keep for form-specific errors
  // No longer need currentUser state directly derived from Supabase auth, will use session and profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mdbUsers, setMdbUsers] = useState<MdbUser[]>([]);

  // Form state
  const [hauptthema, setHauptthema] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [argument1, setArgument1] = useState('');
  const [argument2, setArgument2] = useState('');
  const [argument3, setArgument3] = useState('');
  const [zahlDerWoche, setZahlDerWoche] = useState('');
  const [zahlDerWocheBeschreibung, setZahlDerWocheBeschreibung] = useState('');
  const [zustaendigesMdbUserId, setZustaendigesMdbUserId] = useState<string | undefined>(undefined);
  const [furtherReading, setFurtherReading] = useState<string[]>(['']);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (sessionStatus === 'loading') {
      setIsLoading(true);
      return;
    }

    console.log('AgendaSettingPage: Session status:', sessionStatus);
    console.log('AgendaSettingPage: NextAuth session object:', session);

    if (sessionStatus === 'unauthenticated' || !session) {
      toast.error('Authentifizierung erforderlich.');
      router.push('/anmelden');
      return;
    }

    // Session is authenticated, now fetch user profile from Supabase DB
    const fetchUserProfile = async () => {
      setIsLoading(true); // Keep loading true until profile is fetched
      if (!session.user?.id) {
        toast.error('Benutzer-ID nicht in der NextAuth-Sitzung gefunden.');
        setError('Benutzer-ID nicht in der NextAuth-Sitzung gefunden.');
        console.error('AgendaSettingPage: Critical - session.user.id is missing in NextAuth session:', session?.user);
        setIsLoading(false);
        router.push('/anmelden'); // Or a generic error page
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, name, is_fraktionsvorstand')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        console.error('AgendaSettingPage: Profile fetch error or no profile. ProfileError:', profileError, 'Profile data:', profile);
        toast.error('Fehler beim Abrufen des Benutzerprofils.');
        setError('Benutzerprofil nicht gefunden oder Fehler beim Abrufen.');
        setUserProfile(null);
        setIsLoading(false);
        // Decide if redirect is needed or just show error. For now, allow page but disable actions.
        // router.push('/'); // Example: redirect to home on critical profile error
        return;
      }
      
      setUserProfile(profile as UserProfile);
      console.log('AgendaSettingPage: User profile fetched:', profile);

      if (!profile.is_fraktionsvorstand) {
        toast.error('Zugriff verweigert. Diese Seite ist nur für den Fraktionsvorstand zugänglich.');
        setError('Zugriff verweigert. Diese Seite ist nur für den Fraktionsvorstand zugänglich.');
        // No router.push here, shows error message on page as per original logic, form will be disabled.
        setIsLoading(false);
        return; // Stop further execution if not Fraktionsvorstand
      }

      // User is Fraktionsvorstand, proceed to fetch MDBs
      console.log('AgendaSettingPage: User is Fraktionsvorstand. Access granted. Fetching MDBs...');
      
      try {
        const response = await fetch('/api/users/mdb-list');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const mdbs = await response.json();
        setMdbUsers(mdbs as MdbUser[]);
      } catch (fetchError: any) {
        toast.error('Fehler beim Laden der MdB-Liste.');
        setError('Fehler beim Laden der MdB-Liste.');
        console.error('MDB fetch error:', fetchError);
      }
      setIsLoading(false);
    };

    fetchUserProfile();

  }, [session, sessionStatus, supabase, router]);

  const handleAddFurtherReading = () => {
    setFurtherReading([...furtherReading, '']);
  };

  const handleFurtherReadingChange = (index: number, value: string) => {
    const updatedReading = [...furtherReading];
    updatedReading[index] = value;
    setFurtherReading(updatedReading);
  };

  const handleRemoveFurtherReading = (index: number) => {
    const updatedReading = furtherReading.filter((_, i) => i !== index);
    setFurtherReading(updatedReading);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAttachments(Array.from(event.target.files));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !userProfile?.is_fraktionsvorstand) {
      toast.error('Aktion nicht erlaubt. Fehlende Berechtigungen.');
      setError('Aktion nicht erlaubt.');
      return;
    }
    setIsSubmitting(true);
    setError(null); // Clear previous form errors

    try {
      const { data: communicationLineData, error: communicationLineError } = await supabase
        .from('communication_lines')
        .insert({
          user_id: session.user.id, // Use user ID from NextAuth session
          hauptthema,
          beschreibung,
          argument_1: argument1,
          argument_2: argument2,
          argument_3: argument3,
          zahl_der_woche: zahlDerWoche,
          zahl_der_woche_beschreibung: zahlDerWocheBeschreibung,
          zustaendiges_mdb_user_id: zustaendigesMdbUserId,
          further_reading: furtherReading.filter(link => link.trim() !== ''),
          start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
          end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        })
        .select()
        .single();

      if (communicationLineError) throw communicationLineError;
      if (!communicationLineData) throw new Error('Failed to create communication line entry.');
      
      const communicationLineId = communicationLineData.id;

      if (attachments.length > 0 && userProfile?.id) { // Check userProfile.id for storage path
        const attachmentUploadPromises = attachments.map(async (file) => {
          // Use userProfile.id (which is the Supabase user ID) for the path
          const filePath = `${userProfile.id}/${communicationLineId}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('communicationattachments')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { error: attachmentDbError } = await supabase
            .from('communication_line_attachments')
            .insert({
              communication_line_id: communicationLineId,
              file_name: file.name,
              storage_path: filePath,
              user_id: userProfile.id, // Use userProfile.id for the uploader
            });
          if (attachmentDbError) throw attachmentDbError;
        });
        await Promise.all(attachmentUploadPromises);
      }

      toast.success('Kommunikationslinie erfolgreich erstellt!');
      // Reset form
      setHauptthema('');
      setBeschreibung('');
      // ... reset other form fields ...
      setFurtherReading(['']);
      setAttachments([]);
      setStartDate(null);
      setEndDate(null);
      setZustaendigesMdbUserId(undefined);
      setArgument1('');
      setArgument2('');
      setArgument3('');
      setZahlDerWoche('');
      setZahlDerWocheBeschreibung('');
      // router.push('/kommunikationslinien'); // Optional: redirect
      
    } catch (err: any) {
      console.error('Submission error:', err);
      toast.error(err.message || 'Ein Fehler ist beim Erstellen aufgetreten.');
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Skeleton loading component for the form
  function AgendaSettingSkeleton() {
    return (
      <PageLayout
        title="Neue Kommunikationslinie erstellen"
        description="Definiere hier neue Themen und Argumentationshilfen für die Kommunikation."
      >
        {/* Outer container for the form sections, mimicking the new form structure */}
        <div className="space-y-8">
          {/* Main Grid for Top Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column 1 (Top Part) - Skeleton */}
            <div className="space-y-6">
              {/* Hauptthema */}
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              {/* Beschreibung */}
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-32 w-full" />
              </div>
              {/* Arguments Grid - Taller */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-44 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-44 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-44 w-full" />
                </div>
              </div>
            </div>

            {/* Column 2 (Top Part) - Skeleton */}
            <div className="space-y-6">
              {/* Zahl der Woche */}
              <div>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              {/* Zahl der Woche Beschreibung */}
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-32 w-full" />
              </div>
              {/* Zuständiges MdB */}
              <div>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              {/* Weiterführende Links - Skeleton */}
              <div> 
                <Skeleton className="h-4 w-32 mb-2" />
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </div>
          </div>

          {/* New Sub-Grid for Anhänge and Start/End-Datum - Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sub-Grid Column 1: Anhänge - Skeleton */}
            <div className="space-y-6">
              <div> 
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            {/* Sub-Grid Column 2: Start/End-Datum - Skeleton */}
            <div className="space-y-6">
              <div> 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Erstellen Button - Skeleton */}
          <div className="pt-4">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (isLoading || sessionStatus === 'loading') {
    return <AgendaSettingSkeleton />;
  }

  // Error display logic - simplified based on `error` state and userProfile check for Fraktionsvorstand
  // This will show if setError was called, e.g., for access denied or MDB fetch error
  if (error && (!userProfile?.is_fraktionsvorstand && error === 'Zugriff verweigert. Diese Seite ist nur für den Fraktionsvorstand zugänglich.')) {
    return (
      <PageLayout title="Fehler" description="">
        <p className="text-red-600">{error}</p>
        <Button onClick={() => router.push('/')} className="mt-4">Zur Startseite</Button>
      </PageLayout>
    );
  }
  
  // If profile exists but user is not Fraktionsvorstand, and error is set for access denied
  if (userProfile && !userProfile.is_fraktionsvorstand && error === 'Zugriff verweigert. Diese Seite ist nur für den Fraktionsvorstand zugänglich.'){
    // The above general error block might already catch this.
    // This explicit check ensures the message for non-Fraktionsvorstand is shown if not already handled.
     return (
      <PageLayout title="Zugriff verweigert" description="">
        <p className="text-red-600">Diese Seite ist nur für den Fraktionsvorstand zugänglich.</p>
        <Button onClick={() => router.push('/')} className="mt-4">Zur Startseite</Button>
      </PageLayout>
    );
  }

  // Fallback for other critical errors if not Fraktionsvorstand specifically
  if (error && userProfile === null) { // E.g. profile fetch completely failed
       return (
      <PageLayout title="Fehler" description="">
        <p className="text-red-600">{error}</p>
         <Button onClick={() => router.push('/anmelden')} className="mt-4">Erneut anmelden</Button>
      </PageLayout>
    );
  }


  return (
    <PageLayout
      title="Neue Kommunikationslinie erstellen"
      description="Definiere hier neue Themen und Argumentationshilfen für die Kommunikation."
    >
      {/* Ensure userProfile exists and is Fraktionsvorstand before rendering form */}
      {(!userProfile || !userProfile.is_fraktionsvorstand) && !isLoading && !error && (
         <p className="text-red-500">Du hast keine Berechtigung, diese Seite anzuzeigen oder Aktionen auszuführen.</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-8"> {/* Changed to space-y-8 for overall form spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column 1 (Top Part) */}
          <div className="space-y-6">
            <div>
              <Label htmlFor="hauptthema">Hauptthema</Label>
              <Input id="hauptthema" value={hauptthema} onChange={(e) => setHauptthema(e.target.value)} required disabled={!userProfile?.is_fraktionsvorstand} />
            </div>

            <div>
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <Textarea id="beschreibung" value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} rows={5} placeholder="Markdown..." disabled={!userProfile?.is_fraktionsvorstand}/>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="argument1">Argument 1</Label>
                <Textarea id="argument1" value={argument1} onChange={(e) => setArgument1(e.target.value)} rows={7} placeholder="Markdown für Formatierung." disabled={!userProfile?.is_fraktionsvorstand} />
              </div>
              <div>
                <Label htmlFor="argument2">Argument 2</Label>
                <Textarea id="argument2" value={argument2} onChange={(e) => setArgument2(e.target.value)} rows={7} placeholder="Markdown für Formatierung." disabled={!userProfile?.is_fraktionsvorstand} />
              </div>
              <div>
                <Label htmlFor="argument3">Argument 3</Label>
                <Textarea id="argument3" value={argument3} onChange={(e) => setArgument3(e.target.value)} rows={7} placeholder="Markdown für Formatierung." disabled={!userProfile?.is_fraktionsvorstand} />
              </div>
            </div>
          </div>

          {/* Column 2 (Top Part) */}
          <div className="space-y-6">
            <div>
              <Label htmlFor="zahlDerWoche">Zahl der Woche</Label>
              <Input id="zahlDerWoche" value={zahlDerWoche} onChange={(e) => setZahlDerWoche(e.target.value)} disabled={!userProfile?.is_fraktionsvorstand} />
            </div>

            <div>
              <Label htmlFor="zahlDerWocheBeschreibung">Beschreibung</Label>
              <Textarea id="zahlDerWocheBeschreibung" value={zahlDerWocheBeschreibung} onChange={(e) => setZahlDerWocheBeschreibung(e.target.value)} rows={5} placeholder="Markdown für Formatierung." disabled={!userProfile?.is_fraktionsvorstand} />
            </div>

            <div>
              <Label htmlFor="zustaendigesMdbUserId">Zuständiges MdB</Label>
              <Select value={zustaendigesMdbUserId} onValueChange={setZustaendigesMdbUserId} disabled={!userProfile?.is_fraktionsvorstand}>
                <SelectTrigger id="zustaendigesMdbUserId">
                  <SelectValue placeholder="MdB auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {mdbUsers.map(mdb => (
                    <SelectItem key={mdb.id} value={mdb.id}>
                      {mdb.name || 'Unbenannter User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Weiterführende Links - Now in Column 2, above the new sub-grid row */}
            <div> 
              <Label>Weiterführende Links</Label>
              <div>
                {furtherReading.map((link, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <Input
                      type="url"
                      value={link}
                      onChange={(e) => handleFurtherReadingChange(index, e.target.value)}
                      placeholder="https://beispiel.de"
                      disabled={!userProfile?.is_fraktionsvorstand}
                    />
                    {furtherReading.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFurtherReading(index)} disabled={!userProfile?.is_fraktionsvorstand}>Entfernen</Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddFurtherReading} disabled={!userProfile?.is_fraktionsvorstand}>Link hinzufügen</Button>
              </div>
            </div>
          </div>
        </div>

        {/* New Sub-Grid for Anhänge and Start/End-Datum */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sub-Grid Column 1: Anhänge */}
          <div className="space-y-6">
            <div> 
              <Label htmlFor="attachments">Anhänge</Label>
              <Input id="attachments" type="file" multiple accept=".pdf" onChange={handleFileChange} disabled={!userProfile?.is_fraktionsvorstand} />
              {attachments.length > 0 && (
                <ul className="mt-2 list-disc list-inside">
                  {attachments.map((file, index) => <li key={index}>{file.name}</li>)}
                </ul>
              )}
            </div>
          </div>

          {/* Sub-Grid Column 2: Start/End-Datum */}
          <div className="space-y-6">
            <div> 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start-Datum</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                        disabled={!userProfile?.is_fraktionsvorstand}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "PPP", { locale: de })
                        ) : (
                          <span>Datum auswählen</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate || undefined}
                        onSelect={(date) => setStartDate(date || null)}
                        locale={de}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="endDate">End-Datum</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                        disabled={!userProfile?.is_fraktionsvorstand}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, "PPP", { locale: de })
                        ) : (
                          <span>Datum auswählen</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate || undefined}
                        onSelect={(date) => setEndDate(date || null)}
                        locale={de}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Erstellen Button - In its own section below the sub-grid, effectively in Column 1 flow */}
        <div className="pt-4"> {/* Added pt-4 for some spacing */}
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <Button type="submit" disabled={isSubmitting || !userProfile?.is_fraktionsvorstand}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichern...</> : 'Erstellen'}
          </Button>
        </div>
      </form>
    </PageLayout>
  );
} 