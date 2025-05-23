"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Play, Music, FileText } from "lucide-react";

// Component for enhanced media modal with transcript
function MediaModal({ 
  isOpen, 
  onClose, 
  mediaType, 
  mediaUrl, 
  transcript, 
  transcriptSentences,
  title,
  speechData
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  mediaType: 'video' | 'audio'; 
  mediaUrl: string; 
  transcript: string; 
  transcriptSentences?: Array<{text: string, timeStart: number, timeEnd: number, speaker?: string}>;
  title: string;
  speechData?: any;
}) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [highlightedSentence, setHighlightedSentence] = useState(0);

  // Use timestamped sentences if available, otherwise split plain text
  const sentences = transcriptSentences && transcriptSentences.length > 0 
    ? transcriptSentences 
    : transcript.split(/(?<=[.!?])\s+/).filter(s => s.trim()).map(text => ({ text, timeStart: 0, timeEnd: 0, speaker: '' }));

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
      
      // Use actual timestamps if available
      if (transcriptSentences && transcriptSentences.length > 0) {
        // Find the sentence that should be highlighted at current time
        let currentSentenceIndex = transcriptSentences.findIndex(
          sentence => media.currentTime >= sentence.timeStart && media.currentTime <= sentence.timeEnd
        );
        
        // If no exact match, find the closest previous sentence
        if (currentSentenceIndex === -1) {
          for (let i = transcriptSentences.length - 1; i >= 0; i--) {
            if (media.currentTime >= transcriptSentences[i].timeStart) {
              currentSentenceIndex = i;
              break;
            }
          }
        }
        
        // Fallback to first sentence if still no match
        if (currentSentenceIndex === -1) {
          currentSentenceIndex = 0;
        }
        
        setHighlightedSentence(currentSentenceIndex);
      } else {
        // Fallback to estimation for plain text
        if (duration > 0) {
          const progress = media.currentTime / duration;
          const sentenceIndex = Math.floor(progress * sentences.length);
          setHighlightedSentence(Math.min(sentenceIndex, sentences.length - 1));
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(media.duration);
    };

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [duration, sentences.length, transcriptSentences]);

  // Auto-scroll to keep highlighted sentence visible
  useEffect(() => {
    if (transcriptRef.current && highlightedSentence >= 0) {
      const highlightedElement = transcriptRef.current.children[highlightedSentence] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [highlightedSentence]);

  const jumpToSentence = (sentenceIndex: number) => {
    const media = mediaRef.current;
    if (!media) return;
    
    // Immediately update the highlighted sentence
    setHighlightedSentence(sentenceIndex);
    
    const sentence = sentences[sentenceIndex];
    if (sentence && sentence.timeStart > 0) {
      // Use actual timestamp if available
      media.currentTime = sentence.timeStart;
    } else if (duration > 0) {
      // Fallback to estimation
      const targetTime = (sentenceIndex / sentences.length) * duration;
      media.currentTime = targetTime;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{mediaType === 'video' ? 'Video' : 'Audio'} abspielen - {title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Media Player and Information */}
          <div className="space-y-4 flex flex-col">
            {mediaType === 'video' ? (
              <video 
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                controls 
                src={mediaUrl} 
                className="w-full max-h-96 rounded-lg object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-96 rounded-lg">
                <audio 
                  ref={mediaRef as React.RefObject<HTMLAudioElement>}
                  controls 
                  src={mediaUrl} 
                  className="w-full"
                />
              </div>
            )}
            
            {/* Progress indicator */}
            <div className="text-sm text-muted-foreground">
              {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
            </div>

            {/* Additional Information */}
            {speechData && (
              <div className="space-y-4 text-sm">
                {/* Electoral Period & Session */}
                {(speechData.electoralPeriod || speechData.session) && (
                  <div className="bg-gray-100 dark:bg-muted/20 rounded-lg p-3">
                    <h4 className="font-medium mb-2">Sitzungsdetails</h4>
                    {speechData.electoralPeriod && (
                      <p><strong>Wahlperiode:</strong> {speechData.electoralPeriod.label}</p>
                    )}
                    {speechData.session && (
                      <p><strong>Sitzung:</strong> {speechData.session.label}</p>
                    )}
                    {speechData.session?.date && (
                      <p><strong>Datum:</strong> {new Date(speechData.session.date).toLocaleDateString('de-DE')}</p>
                    )}
                    {speechData.session?.location && (
                      <p><strong>Ort:</strong> {speechData.session.location}</p>
                    )}
                  </div>
                )}

                {/* Topic & Context */}
                {(speechData.topic || speechData.context) && (
                  <div className="bg-gray-100 dark:bg-muted/20 rounded-lg p-3">
                    <h4 className="font-medium mb-2">Thema & Kontext</h4>
                    {speechData.topic && (
                      <p><strong>Tagesordnungspunkt:</strong> {speechData.topic}</p>
                    )}
                    {speechData.context && (
                      <p><strong>Kontext:</strong> {speechData.context}</p>
                    )}
                  </div>
                )}

                {/* Documents */}
                {speechData.documents && speechData.documents.length > 0 && (
                  <div className="bg-gray-100 dark:bg-muted/20 rounded-lg p-3">
                    <h4 className="font-medium mb-2">Verwandte Dokumente</h4>
                    <ul className="space-y-1">
                      {speechData.documents.slice(0, 3).map((doc: any, index: number) => (
                        <li key={index} className="text-xs">
                          <span className="font-medium">{doc.title}</span>
                          {doc.abstract && <span className="text-muted-foreground"> - {doc.abstract.slice(0, 100)}...</span>}
                        </li>
                      ))}
                      {speechData.documents.length > 3 && (
                        <li className="text-xs text-muted-foreground">
                          und {speechData.documents.length - 3} weitere Dokumente
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transcript */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4" />
              <h3 className="font-semibold">Transkript</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-muted/20 rounded-lg p-4 space-y-2 min-h-0" ref={transcriptRef}>
              {transcript ? (
                sentences.map((sentence, index) => {
                  const currentSpeaker = typeof sentence === 'object' && sentence.speaker ? sentence.speaker : '';
                  const previousSpeaker = index > 0 && typeof sentences[index - 1] === 'object' && sentences[index - 1].speaker ? sentences[index - 1].speaker : '';
                  const showSpeaker = currentSpeaker && currentSpeaker !== previousSpeaker;
                  
                  return (
                    <div key={index}>
                      {showSpeaker && (
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-3 mb-1 first:mt-0">
                          {currentSpeaker}:
                        </div>
                      )}
                      <p
                        className={`cursor-pointer transition-all duration-200 ${
                          index === highlightedSentence 
                            ? 'bg-gray-300 text-gray-900 dark:bg-primary/20 dark:text-primary font-medium p-2 rounded' 
                            : 'text-gray-700 dark:text-inherit hover:bg-gray-200 dark:hover:bg-muted/50 p-2 rounded'
                        }`}
                        onClick={() => jumpToSentence(index)}
                      >
                        {typeof sentence === 'string' ? sentence : sentence.text}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 dark:text-muted-foreground italic">
                  Kein Transkript verfügbar für diese Rede.
                </p>
              )}
            </div>
            
            {transcript && (
              <div className="text-xs text-muted-foreground mt-2">
                Klicke auf einen Satz, um zu dieser Stelle im {mediaType === 'video' ? 'Video' : 'Audio'} zu springen.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Schließen</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MySpeechesPage() {
  const { data: session } = useSession();
  const userName = session?.user.name;
  const [speeches, setSpeeches] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, perPage: 6, page: 1, maxPages: 1 });
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [activeModal, setActiveModal] = useState<{
    type: 'video' | 'audio';
    url: string;
    transcript: string;
    transcriptSentences: any[];
    title: string;
    speechData?: any;
  } | null>(null);

  const fetchSpeeches = async (page: number) => {
    if (!userName) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reden?name=${encodeURIComponent(userName)}&page=${page}`);
      const json = await res.json();
      if (res.ok) {
        setSpeeches(json.speeches);
        setMeta(json.meta);
      } else {
        console.error("Error fetching speeches:", json.error || json);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpeeches(meta.page);
  }, [userName, meta.page]);

  const handlePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.maxPages) {
      setMeta((m) => ({ ...m, page: newPage }));
    }
  };

  const openMediaModal = (type: 'video' | 'audio', url: string, transcript: string, transcriptSentences: any[], title: string, speechData?: any) => {
    setActiveModal({ type, url, transcript, transcriptSentences, title, speechData });
  };

  const closeMediaModal = () => {
    setActiveModal(null);
  };

  return (
    <PageLayout 
      title="Meine Reden" 
      description={
        <span>
          Hier kannst du deine letzten Reden ansehen, anhören, nachlesen und dir Feedback geben lassen. 
          Quelle für alle Reden ist der Deutsche Bundestag (
          <a 
            href="https://www.bundestag.de/nutzungsbedingungen" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Nutzungsbedingungen
          </a>
          ).
        </span>
      }
    >
      {!userName && <p>Bitte melde dich an, um deine Reden einzusehen.</p>}

      {userName && (
        <>
          {loading && <Skeleton className="h-8 w-64 mb-4" />}

          {!loading && speeches.length === 0 && <p>Keine Reden gefunden.</p>}

          {!loading && speeches.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {speeches.map((speech: any) => (
                <Card key={speech.id}>
                  <CardHeader className="p-0">
                    <div className="relative w-full h-48 overflow-hidden">
                      <img 
                        src={speech.thumbnailURI || '/images/categories/rede.jpg'} 
                        alt={speech.agendaItem || speech.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to default image if thumbnail fails to load
                          (e.target as HTMLImageElement).src = '/images/categories/rede.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end items-start p-4">
                        <h3 className="text-white text-xl font-semibold leading-tight">{speech.agendaItem || speech.title}</h3>
                        <p className="text-white text-sm">{speech.date ? new Date(speech.date).toLocaleDateString('de-DE') : ''}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* Session info (normal size) */}
                    <p className="mb-4 text-base leading-tight">
                      WP {speech.electoralPeriodNumber} | {speech.sessionNumber}. Sitzung | {speech.officialTitle}
                    </p>
                    <div className="flex gap-2">
                      {speech.videoFileURI && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openMediaModal(
                            'video', 
                            speech.videoFileURI, 
                            speech.text || '', 
                            speech.transcriptSentences || [],
                            speech.agendaItem || speech.title,
                            speech
                          )}
                        >
                              <Play className="mr-1 h-4 w-4" /> Video
                            </Button>
                      )}
                      {speech.audioFileURI && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openMediaModal(
                            'audio', 
                            speech.audioFileURI, 
                            speech.text || '', 
                            speech.transcriptSentences || [],
                            speech.agendaItem || speech.title,
                            speech
                          )}
                        >
                              <Music className="mr-1 h-4 w-4" /> Audio
                            </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {meta.maxPages > 1 && (
            <Pagination className="mt-4">
              <PaginationPrevious
                onClick={() => handlePage(meta.page - 1)}
                aria-disabled={meta.page === 1}
                className={meta.page === 1 ? "pointer-events-none opacity-50" : ""}
              />
              <PaginationContent>
                {Array.from({ length: meta.maxPages }, (_, i) => i + 1).map((n) => (
                  <PaginationItem key={n}>
                    <PaginationLink
                      isActive={n === meta.page}
                      onClick={() => handlePage(n)}
                    >
                      {n}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              </PaginationContent>
              <PaginationNext
                onClick={() => handlePage(meta.page + 1)}
                aria-disabled={meta.page === meta.maxPages}
                className={meta.page === meta.maxPages ? "pointer-events-none opacity-50" : ""}
              />
            </Pagination>
          )}
        </>
      )}

      {/* Enhanced Media Modal */}
      {activeModal && (
        <MediaModal
          isOpen={true}
          onClose={closeMediaModal}
          mediaType={activeModal.type}
          mediaUrl={activeModal.url}
          transcript={activeModal.transcript}
          transcriptSentences={activeModal.transcriptSentences}
          title={activeModal.title}
          speechData={activeModal.speechData}
        />
      )}
    </PageLayout>
  );
} 