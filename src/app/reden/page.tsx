"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Play, Music } from "lucide-react";

export default function MySpeechesPage() {
  const { data: session } = useSession();
  const userName = session?.user.name;
  const [speeches, setSpeeches] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, perPage: 6, page: 1, maxPages: 1 });
  const [loading, setLoading] = useState(false);

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

  // Decode HTML entities in license string
  const decodeHtml = (html: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
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
                    <div className="relative w-full h-48 bg-[url('/images/categories/rede.jpg')] bg-cover bg-center">
                      <div className="absolute inset-0 flex flex-col justify-end items-start p-4">
                        <h3 className="text-white text-xl font-semibold">{speech.agendaItem || speech.title}</h3>
                        <p className="text-white text-sm">{speech.date ? new Date(speech.date).toLocaleDateString('de-DE') : ''}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* Session info (normal size) */}
                    <p className="mb-4 text-base">
                      WP {speech.electoralPeriodNumber} | {speech.sessionNumber}. Sitzung | {speech.officialTitle}
                    </p>
                    <div className="flex gap-2">
                      {speech.videoFileURI && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Play className="mr-1 h-4 w-4" /> Video
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Video abspielen</DialogTitle>
                            </DialogHeader>
                            <video controls src={speech.videoFileURI} className="w-full" />
                            <DialogFooter>
                              <DialogClose>Schließen</DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      {speech.audioFileURI && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Music className="mr-1 h-4 w-4" /> Audio
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Audio abspielen</DialogTitle>
                            </DialogHeader>
                            <audio controls src={speech.audioFileURI} className="w-full" />
                            <DialogFooter>
                              <DialogClose>Schließen</DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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
    </PageLayout>
  );
} 