'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, FileText, Search, Download, Users, CalendarDays, Tag, MessageSquare, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// Types to match our Supabase table structure
interface Attachment {
  id: string;
  file_name: string;
  storage_path: string;
  // We might need a way to get a public URL for download
  publicUrl?: string; 
}

interface MdbProfile {
  id: string;
  name: string | null;
  email: string | null;
  profile_picture_url: string | null;
  tel_bueroleitung: string | null;
}

interface CommunicationLine {
  id: string;
  created_at: string;
  hauptthema: string | null;
  beschreibung: string | null;
  argument_1: string | null;
  argument_2: string | null;
  argument_3: string | null;
  zahl_der_woche: string | null;
  zahl_der_woche_beschreibung: string | null;
  zustaendiges_mdb_user_id: string | null;
  further_reading: string[] | null;
  start_date: string | null;
  end_date: string | null;
  communication_line_attachments: Attachment[];
  users: MdbProfile | null; // For the responsible MdB
}

const ITEMS_PER_PAGE = 6;

export default function KommunikationslinienPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [currentLines, setCurrentLines] = useState<CommunicationLine[]>([]);
  const [pastLines, setPastLines] = useState<CommunicationLine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPagePast, setCurrentPagePast] = useState(1);

  const fetchCommunicationLines = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error: rpcError } = await supabase.rpc('get_communication_lines_with_details');
      
      if (rpcError) throw rpcError;
      if (!data) {
        setCurrentLines([]);
        setPastLines([]);
        throw new Error('Keine Daten empfangen.');
      }

      const allLines = data as CommunicationLine[];

      const active = allLines.filter(line => 
        (line.start_date && line.end_date && line.start_date <= today && line.end_date >= today) || 
        (line.start_date && !line.end_date && line.start_date <= today) // Active if start date is today or past, and no end date
      );
      const past = allLines.filter(line => 
        (line.end_date && line.end_date < today) || 
        (!line.start_date && !line.end_date) // Consider lines without dates as past or needing categorization
      );

      setCurrentLines(active);
      setPastLines(past);

    } catch (err: any) {
      console.error("Fehler beim Laden der Kommunikationslinien:", err);
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunicationLines();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]); // Dependency array might need supabase if its instance can change, though unlikely for client component client

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        setCurrentPagePast(1); // Reset to first page on new search
    };

    const filteredPastLines = pastLines.filter(line =>
        (line.hauptthema?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (line.beschreibung?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (line.zahl_der_woche?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPastPages = Math.ceil(filteredPastLines.length / ITEMS_PER_PAGE);
    const paginatedPastLines = filteredPastLines.slice((currentPagePast - 1) * ITEMS_PER_PAGE, currentPagePast * ITEMS_PER_PAGE);

    const getPublicUrl = async (filePath: string): Promise<string | null> => {
        try {
            const { data } = supabase.storage.from('communicationattachments').getPublicUrl(filePath);
            return data?.publicUrl || null;
        } catch (error) {
            console.error('Error getting public URL:', error);
            return null;
        }
    };

    // Skeleton Loader for Cards
    const LineSkeleton = () => (
      <Card className="overflow-hidden">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-8 w-1/3 mt-2" /> 
        </CardContent>
        <CardFooter>
            <Skeleton className="h-8 w-24" />
        </CardFooter>
      </Card>
    );

  const renderLineCard = (line: CommunicationLine, isCurrent: boolean) => (
    <Card key={line.id} className="overflow-hidden flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          {isCurrent ? <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" /> : <Info className="mr-2 h-5 w-5 text-gray-500" />}
          {line.hauptthema || 'Kein Hauptthema'}
        </CardTitle>
        <CardDescription className="flex items-center text-xs text-muted-foreground">
            <CalendarDays className="mr-1.5 h-3 w-3" />
            {line.start_date ? new Date(line.start_date).toLocaleDateString() : 'N/A'} - {line.end_date ? new Date(line.end_date).toLocaleDateString() : (isCurrent ? 'Unbegrenzt' : 'N/A')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="beschreibung">
                <AccordionTrigger className="text-sm font-semibold">Beschreibung</AccordionTrigger>
                <AccordionContent className="text-sm prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {line.beschreibung || 'Keine Beschreibung vorhanden.'}
                  </ReactMarkdown>
                </AccordionContent>
            </AccordionItem>
            {(line.argument_1 || line.argument_2 || line.argument_3) && (
            <AccordionItem value="argumente">
                <AccordionTrigger className="text-sm font-semibold">Argumente</AccordionTrigger>
                <AccordionContent className="text-sm prose dark:prose-invert max-w-none space-y-1">
                  {line.argument_1 && <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{`1. ${line.argument_1}`}</ReactMarkdown>}
                  {line.argument_2 && <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{`2. ${line.argument_2}`}</ReactMarkdown>}
                  {line.argument_3 && <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{`3. ${line.argument_3}`}</ReactMarkdown>}
                </AccordionContent>
            </AccordionItem>
            )}
            {line.zahl_der_woche && (
            <AccordionItem value="zahl">
                <AccordionTrigger className="text-sm font-semibold">Zahl der Woche: {line.zahl_der_woche}</AccordionTrigger>
                <AccordionContent className="text-sm prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {line.zahl_der_woche_beschreibung || 'Keine Beschreibung vorhanden.'}
                  </ReactMarkdown>
                </AccordionContent>
            </AccordionItem>
            )}
        </Accordion>
        
        {line.users && (
          <Card className="mt-4 bg-muted/50">
            <CardHeader className="p-3">
                <CardTitle className="text-sm flex items-center"><Users className="mr-2 h-4 w-4"/>Zuständiges MdB</CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex items-center space-x-3">
                <Avatar>
                    <AvatarImage src={line.users.profile_picture_url || undefined} alt={line.users.name || 'MdB'} />
                    <AvatarFallback>{line.users.name?.substring(0,2).toUpperCase() || 'MdB'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium">{line.users.name || 'N/A'}</p>
                    {line.users.email && <a href={`mailto:${line.users.email}`} className="text-xs text-primary hover:underline">{line.users.email}</a>}
                    {line.users.tel_bueroleitung && <p className="text-xs text-muted-foreground">Tel: {line.users.tel_bueroleitung}</p>}
                </div>
            </CardContent>
          </Card>
        )}

        {(line.further_reading && line.further_reading.length > 0) && (
          <div className="mt-3">
            <h4 className="text-sm font-semibold mb-1 flex items-center"><ExternalLink className="mr-2 h-4 w-4"/>Weiterführende Links</h4>
            <ul className="list-none space-y-1">
              {line.further_reading.map((link, index) => (
                <li key={index} className="text-xs">
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(line.communication_line_attachments && line.communication_line_attachments.length > 0) && (
          <div className="mt-3">
            <h4 className="text-sm font-semibold mb-1 flex items-center"><FileText className="mr-2 h-4 w-4"/>Anhänge</h4>
            <ul className="list-none space-y-1">
              {line.communication_line_attachments.map(async (att) => {
                const url = await getPublicUrl(att.storage_path);
                return (
                  <li key={att.id} className="text-xs">
                    {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" download={att.file_name} className="text-primary hover:underline flex items-center">
                           <Download className="mr-1 h-3 w-3"/> {att.file_name}
                        </a>
                    ) : (
                        <span>{att.file_name} (URL nicht verfügbar)</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
      {/* <CardFooter className="mt-auto pt-3">
        <Button variant="outline" size="sm">Details</Button> // Placeholder for future detail page
      </CardFooter> */} 
    </Card>
  );

    if (error) {
        return (
        <div className="container mx-auto p-4">
            <Card className="mt-6">
            <CardHeader><CardTitle className="text-red-500 flex items-center"><XCircle className="mr-2"/>Fehler</CardTitle></CardHeader>
            <CardContent><p>{error}</p><Button onClick={fetchCommunicationLines} className="mt-4">Erneut versuchen</Button></CardContent>
            </Card>
        </div>
        );
    }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center"><MessageSquare className="mr-3 h-8 w-8"/>Kommunikationslinien</h1>
            <p className="text-muted-foreground">Aktuelle und vergangene Themen und Argumentationshilfen.</p>
        </div>
        <Button disabled>
          <Download className="mr-2 h-4 w-4" /> Aktuelle Linien als PDF (TODO)
        </Button>
      </div>

      {/* Current Communication Lines */} 
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-4 flex items-center">
            <CheckCircle2 className="mr-2 h-6 w-6 text-green-500"/> Aktuelle Linien
        </h2>
        {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => <LineSkeleton key={`current-skel-${i}`} />)}
            </div>
        )}
        {!isLoading && currentLines.length === 0 && <p className="text-muted-foreground">Keine aktuellen Kommunikationslinien vorhanden.</p>}
        {!isLoading && currentLines.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentLines.map(line => renderLineCard(line, true))}
          </div>
        )}
      </section>

      {/* Past Communication Lines */} 
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-4 flex items-center">
            <Info className="mr-2 h-6 w-6 text-gray-500"/> Vergangene Linien
        </h2>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Suche in vergangenen Linien..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 w-full md:w-1/2 lg:w-1/3"
          />
        </div>
        {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(ITEMS_PER_PAGE)].map((_, i) => <LineSkeleton key={`past-skel-${i}`} />)}
            </div>
        )}
        {!isLoading && filteredPastLines.length === 0 && searchTerm && <p className="text-muted-foreground">Keine Ergebnisse für "{searchTerm}".</p>}
        {!isLoading && pastLines.length === 0 && !searchTerm && <p className="text-muted-foreground">Keine vergangenen Kommunikationslinien vorhanden.</p>}
        {!isLoading && paginatedPastLines.length > 0 && (
            <> 
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedPastLines.map(line => renderLineCard(line, false))}
                </div>
                {totalPastPages > 1 && (
                    <div className="mt-6 flex justify-center items-center space-x-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCurrentPagePast(prev => Math.max(1, prev - 1))} 
                            disabled={currentPagePast === 1}
                        >
                            Zurück
                        </Button>
                        <span className="text-sm">Seite {currentPagePast} von {totalPastPages}</span>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCurrentPagePast(prev => Math.min(totalPastPages, prev + 1))} 
                            disabled={currentPagePast === totalPastPages}
                        >
                            Weiter
                        </Button>
                    </div>
                )}
            </>
        )}
      </section>
    </div>
  );
} 