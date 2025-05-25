"use client";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, FileSearch2, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { NewsImage } from "@/components/dashboard/NewsImage";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  source_icon?: string | null;
  date: string;
  snippet: string;
  imageUrl: string;
  fullContent?: string;
  link: string;
  politicalArea: string;
  type: "topic" | "person";
}

const placeholderNews: NewsItem[] = [
  {
    id: "1",
    title: "Debatte über Wohnungspolitik verschärft sich im Bundestag",
    source: "Tagesschau",
    date: "Vor 2 Stunden",
    snippet: "Abgeordnete stritten heute über vorgeschlagene Änderungen der nationalen Wohnraumvorschriften, wobei DIE LINKE starken Widerstand äußerte...",
    imageUrl: "/images/categories/pm.jpeg",
    politicalArea: "Wohnen",
    link: "https://www.tagesschau.de",
    fullContent: "Die Debatte konzentrierte sich auf Maßnahmen zur Mietpreisbindung und Investitionen in den sozialen Wohnungsbau. DIE LINKE argumentierte, dass die aktuellen Vorschläge nicht weit genug gehen, um die Wohnungskrise in deutschen Großstädten zu bewältigen. Sie forderten einen bundesweiten Mietendeckel und eine deutliche Aufstockung der öffentlichen Mittel für bezahlbaren Wohnraum. Andere Parteien äußerten Bedenken hinsichtlich der wirtschaftlichen Auswirkungen solcher Maßnahmen.",
    type: "topic",
  },
  {
    id: "2",
    title: "Neuer Bericht über Auswirkungen des Klimawandels veröffentlicht",
    source: "Spiegel Online",
    date: "Vor 5 Stunden",
    snippet: "Ein neuer Regierungsbericht beleuchtet die zunehmenden Risiken des Klimawandels für Deutschland und löst Forderungen nach beschleunigtem Handeln von Umweltverbänden und DIE LINKE aus...",
    imageUrl: "/images/categories/pm.jpeg",
    politicalArea: "Umwelt",
    link: "https://www.spiegel.de",
    fullContent: "Der Bericht detailliert prognostizierte Zunahmen extremer Wetterereignisse, steigende Meeresspiegel, die Küstenregionen betreffen, und Auswirkungen auf die Landwirtschaft. Der umweltpolitische Sprecher von DIE LINKE erklärte, der Bericht unterstreiche die Dringlichkeit des Übergangs zu einer kohlenstoffneutralen Wirtschaft und forderte verbindliche Ziele sowie erhebliche Investitionen in erneuerbare Energien und nachhaltige Infrastruktur.",
    type: "topic",
  },
  {
    id: "3",
    title: "Diskussion über Mindestlohnanpassungen läuft",
    source: "Zeit Online",
    date: "Vor 1 Tag",
    snippet: "Die Koalitionsregierung diskutiert derzeit mögliche Anpassungen des nationalen Mindestlohns. DIE LINKE setzt sich für eine deutliche Erhöhung ein...",
    imageUrl: "/images/categories/pm.jpeg",
    politicalArea: "Arbeit & Soziales",
    link: "https://www.zeit.de",
    fullContent: "DIE LINKE drängt auf eine Erhöhung auf 15 Euro pro Stunde und argumentiert, dass der aktuelle Mindestlohn nicht ausreiche, um die Lebenshaltungskosten insbesondere in städtischen Gebieten zu decken. Sie verweisen auf Studien zu Armutsquoten und Einkommensungleichheit. Wirtschaftsverbände warnten, eine drastische Erhöhung könne zu Arbeitsplatzverlusten führen, während Gewerkschaften eine deutliche Anhebung unterstützen.",
    type: "topic",
  },
  {
    id: "4",
    title: "Abgeordneter Müller zu Gast bei lokaler Diskussionsrunde",
    source: "LokalAnzeiger",
    date: "Gestern Abend",
    snippet: "MdB Müller diskutierte mit Bürgern über aktuelle politische Themen und stand Rede und Antwort zu seiner Arbeit im Bundestag.",
    imageUrl: "/images/categories/pm.jpeg",
    politicalArea: "Bürgerdialog",
    link: "https://www.lokalanzeiger.de/artikel4",
    fullContent: "Der Bundestagsabgeordnete Müller nahm an einer von der lokalen Bürgerinitiative organisierten Diskussionsveranstaltung teil. Im Mittelpunkt standen Fragen zur Energiepolitik und zur Zukunft des ländlichen Raums. Müller betonte die Wichtigkeit des direkten Austauschs mit den Wählerinnen und Wählern und erläuterte die Positionen seiner Fraktion zu den angesprochenen Punkten. Die Veranstaltung war gut besucht und führte zu einem regen Austausch.",
    type: "person",
  }
];

export default function NewsPage() {
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
  const [contentType, setContentType] = useState<"topic" | "person">("topic");
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const { data: session } = useSession();
  const userName = session?.user.name || "";
  const [allPersonNewsItems, setAllPersonNewsItems] = useState<NewsItem[]>([]);
  const [currentPersonNewsPageItems, setCurrentPersonNewsPageItems] = useState<NewsItem[]>([]);
  const [totalPersonNewsItems, setTotalPersonNewsItems] = useState(0);
  const [nextPageCursorPerson, setNextPageCursorPerson] = useState<string | null>(null);
  const [loadingPersonNews, setLoadingPersonNews] = useState(false);

  useEffect(() => {
    if (contentType === "topic" || (contentType === "person" && !userName)) {
      setAllPersonNewsItems([]);
      setCurrentPersonNewsPageItems([]);
      setTotalPersonNewsItems(0);
      setNextPageCursorPerson(null);
      setPage(1);
      return;
    }

    if (contentType === "person" && userName) {
      const loadPersonNews = async () => {
        setLoadingPersonNews(true);
        const searchTerm = `${userName} Die Linke`;
        const alreadyFetchedCount = allPersonNewsItems.length;
        const itemsNeededUpToCurrentPage = page * itemsPerPage;

        let shouldFetchNewBatch = alreadyFetchedCount < itemsNeededUpToCurrentPage || page === 1;
        if (page > 1 && !nextPageCursorPerson && alreadyFetchedCount >= totalPersonNewsItems) {
          shouldFetchNewBatch = false;
        }
        if (page > 1 && !nextPageCursorPerson && alreadyFetchedCount < totalPersonNewsItems && alreadyFetchedCount >= itemsNeededUpToCurrentPage) {
          shouldFetchNewBatch = false;
        }

        console.log(`Person News: page ${page}, itemsPerPage ${itemsPerPage}, alreadyFetched ${alreadyFetchedCount}, totalItems ${totalPersonNewsItems}, nextPageCursor ${nextPageCursorPerson}, shouldFetchNewBatch ${shouldFetchNewBatch}`);

        if (shouldFetchNewBatch) {
          let apiUrl = `/api/news?query=${encodeURIComponent(searchTerm)}`;
          const isInitialFetchForCurrentQuery = allPersonNewsItems.length === 0 && !nextPageCursorPerson;
          if (nextPageCursorPerson && !isInitialFetchForCurrentQuery) {
             apiUrl += `&nextPageCursor=${nextPageCursorPerson}`;
          }

          console.log(`Fetching person news from: ${apiUrl}`);
          try {
            const res = await fetch(apiUrl);
            const data: { items: NewsItem[], totalItems: number, nextPageCursor: string | null } = await res.json();
            console.log("Received data from /api/news:", data);

            if (!data || !Array.isArray(data.items) || typeof data.totalItems !== 'number') {
              console.error('News API error: Invalid data structure', data);
              setLoadingPersonNews(false);
              return;
            }
            setAllPersonNewsItems(prevItems => page === 1 && isInitialFetchForCurrentQuery ? [...data.items] : [...prevItems, ...data.items]);
            setTotalPersonNewsItems(data.totalItems);
            setNextPageCursorPerson(data.nextPageCursor);

          } catch (error) {
            console.error('News API fetch error:', error);
          } finally {
            setLoadingPersonNews(false);
          }
        } else {
          setLoadingPersonNews(false); 
        }
      };
      loadPersonNews();
    }
  }, [contentType, userName, page, itemsPerPage]);

  useEffect(() => {
    if (contentType === "person") {
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setCurrentPersonNewsPageItems(allPersonNewsItems.slice(startIndex, endIndex));
      console.log(`Updated currentPersonNewsPageItems: ${allPersonNewsItems.slice(startIndex, endIndex).length} items for page ${page}. Total allPersonNewsItems: ${allPersonNewsItems.length}`);
    }
  }, [allPersonNewsItems, page, itemsPerPage, contentType]);

  const allItemsForCurrentView = contentType === "topic"
    ? placeholderNews.filter(item => item.type === "topic")
    : currentPersonNewsPageItems;
  
  const sortedItems = [...allItemsForCurrentView].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateB - dateA;
  });
  
  const totalItemsSourceCount = contentType === "topic" 
    ? placeholderNews.filter(item => item.type === "topic").length 
    : totalPersonNewsItems;
  const totalPages = Math.max(1, Math.ceil(totalItemsSourceCount / itemsPerPage));
  
  const currentItems = sortedItems;

  const renderSkeletonCard = () => (
    <Card className="flex flex-col justify-between h-full">
      <Skeleton className="w-full h-40 rounded-t-md" />
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-3/4 mb-1" />
        <Skeleton className="h-4 w-1/2" />
        <Separator className="my-2" />
        <Skeleton className="h-4 w-1/4" />
      </CardHeader>
      <CardContent className="flex-grow pt-1 pb-3">
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 pt-0">
        <Skeleton className="h-8 w-full" />
      </CardFooter>
    </Card>
  );

  return (
    <PageLayout
      title="Aktuelle Nachrichten"
      description="Bleib auf dem Laufenden mit aktuellen Google News-Ergebnissen zu dir, deinen Politikbereichen und DIE LINKE."
    >
      <Dialog open={!!selectedNewsItem} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setSelectedNewsItem(null);
        }
      }}>
        <div className="mb-6 flex flex-col items-center">
          <ToggleGroup type="single" value={contentType} onValueChange={(value: "topic" | "person") => {
            if (value) {
              setContentType(value);
              setPage(1);
              setAllPersonNewsItems([]);
              setCurrentPersonNewsPageItems([]);
              setTotalPersonNewsItems(0);
              setNextPageCursorPerson(null);
            }
          }} defaultValue="topic" className="mb-2">
            <ToggleGroupItem 
              value="topic" 
              aria-label="Toggle Meine Themen"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
            >
              Meine Themen
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="person" 
              aria-label="Toggle Über mich"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
            >
              Über mich
            </ToggleGroupItem>
          </ToggleGroup>
          {contentType === 'person' && (
            <div className="flex items-center text-xs text-muted-foreground bg-accent p-2 rounded-md">
              <Info className="h-4 w-4 mr-2 text-blue-500" />
              <span>Nachrichten für "Über mich" umfassen i.d.R. die letzten 48 Stunden.</span>
            </div>
          )}
        </div>

        {loadingPersonNews && contentType === 'person' ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: itemsPerPage }).map((_, index) => <div key={index}>{renderSkeletonCard()}</div>)}
          </div>
        ) : currentItems.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {currentItems.map((item) => (
              <Card key={item.id} className="flex flex-col justify-between h-full bg-card text-card-foreground rounded-lg border shadow-sm">
                <div className="relative w-full h-48 rounded-t-md overflow-hidden">
                  {item.imageUrl && (
                    <NewsImage
                      src={item.imageUrl}
                      alt={item.title}
                      width={600}
                      height={400}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  {!item.imageUrl && (
                    <div className="absolute inset-0 w-full h-full bg-muted flex items-center justify-center">
                      {/* Optional: text or icon for missing image */}
                    </div>
                  )}
                  {/* Source Icon Overlay - top-left */}
                  {item.source_icon && (
                    <img 
                      src={item.source_icon} 
                      alt={`${item.source || 'Source'} icon`}
                      className="absolute top-2 left-2 w-8 h-8 p-1 bg-white/80 rounded object-contain shadow"
                      onError={(e: any) => { e.target.style.display = 'none' }} // Hide if icon fails to load
                    />
                  )}
                  {/* Title Overlay - positioned on top of the image */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <CardTitle className="text-lg leading-tight text-white font-heading-light mb-1 line-clamp-2">{item.title}</CardTitle>
                  </div>
                </div>
                <CardHeader className="pt-3 pb-2 px-4">
                  <CardDescription className="font-body text-xs text-muted-foreground">
                    {item.type === 'topic'
                      ? item.date
                      : `${new Date(item.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}${item.source ? `, ${item.source}` : ''}`}
                  </CardDescription>
                  <Separator className="my-2" />
                  <div className="text-xs text-muted-foreground font-body">{item.politicalArea}</div>
                </CardHeader>
                <CardContent className="flex-grow pt-1 pb-3 px-4">
                  <p className="text-sm text-muted-foreground font-body line-clamp-3">{item.snippet}</p>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2 pt-0 px-4 pb-4">
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full font-body" onClick={() => setSelectedNewsItem(item)}>
                      Mehr anzeigen
                    </Button>
                  </DialogTrigger>
                  {item.type === "topic" && (
                    <Link href="/minor-inquiry/generate" passHref legacyBehavior className="w-full">
                      <Button asChild variant="secondary" size="sm" className="w-full font-body">
                        <a><FileSearch2 className="mr-2 h-4 w-4" /> Kleine Anfrage vorschlagen</a>
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground font-body">
            Keine Nachrichten vom Typ "{contentType === 'topic' ? 'Meine Themen' : 'Über mich'}" vorhanden.
          </div>
        )}

        {totalPages > 1 && !loadingPersonNews && (
          <div className="mt-8 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }} />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={page === i + 1}
                      onClick={(e) => { e.preventDefault(); setPage(i + 1); }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {selectedNewsItem && (
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle className="font-heading-light">{selectedNewsItem.title}</DialogTitle>
              <DialogDescription className="font-body">
                 {selectedNewsItem.type === 'topic'
                   ? selectedNewsItem.date 
                   : `${new Date(selectedNewsItem.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}${selectedNewsItem.source ? `, ${selectedNewsItem.source}` : ''}`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap font-body">{selectedNewsItem.fullContent || selectedNewsItem.snippet}</p>
            </div>
            <DialogFooter className="sm:justify-start">
              <Link href={selectedNewsItem.link} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button variant="outline" className="font-body">
                  Auf Website lesen <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <DialogClose asChild>
                <Button type="button" variant="secondary" className="w-full sm:w-auto font-body">
                  Schließen
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </PageLayout>
  );
}
