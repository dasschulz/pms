"use client";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, FileSearch2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface NewsItem {
  id: string;
  title: string;
  source: string;
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
    imageUrl: "https://placehold.co/600x400",
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
    imageUrl: "https://placehold.co/600x300",
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
    imageUrl: "https://placehold.co/400x300",
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
    imageUrl: "https://placehold.co/500x350",
    politicalArea: "Bürgerdialog",
    link: "https://www.lokalanzeiger.de/artikel4",
    fullContent: "Der Bundestagsabgeordnete Müller nahm an einer von der lokalen Bürgerinitiative organisierten Diskussionsveranstaltung teil. Im Mittelpunkt standen Fragen zur Energiepolitik und zur Zukunft des ländlichen Raums. Müller betonte die Wichtigkeit des direkten Austauschs mit den Wählerinnen und Wählern und erläuterte die Positionen seiner Fraktion zu den angesprochenen Punkten. Die Veranstaltung war gut besucht und führte zu einem regen Austausch.",
    type: "person",
  }
];

export default function NewsPage() {
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
  const [contentType, setContentType] = useState<"topic" | "person">("topic");

  const filteredNews = placeholderNews.filter(item => item.type === contentType).slice(0, 4);

  return (
    <PageLayout
      title="Aktuelles (Nachrichten)"
      description="Bleiben Sie auf dem Laufenden mit aktuellen Google News-Ergebnissen zu Ihnen, Ihren Politikbereichen und DIE LINKE."
    >
      <Dialog open={!!selectedNewsItem} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setSelectedNewsItem(null);
        }
      }}>
        <div className="mb-6 flex justify-center">
          <ToggleGroup type="single" value={contentType} onValueChange={(value: "topic" | "person") => { if (value) setContentType(value); }} defaultValue="topic">
            <ToggleGroupItem value="topic" aria-label="Toggle Themen">
              Themen
            </ToggleGroupItem>
            <ToggleGroupItem value="person" aria-label="Toggle Personen">
              Personen
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {filteredNews.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {filteredNews.map((item) => (
              <Card key={item.id} className="flex flex-col justify-between h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg leading-tight font-heading-light mb-1">{item.title}</CardTitle>
                  <CardDescription className="font-body text-xs text-muted-foreground">
                    {item.source} - {item.date}
                  </CardDescription>
                  <div className="mt-2">
                    <Badge variant="secondary" className="font-body">{item.politicalArea}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow pt-1 pb-3">
                  <p className="text-sm text-muted-foreground font-body line-clamp-3">{item.snippet}</p>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2 pt-0">
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
            Keine Nachrichten vom Typ "{contentType === 'topic' ? 'Themen' : 'Personen'}" vorhanden.
          </div>
        )}

        {filteredNews.length > 0 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => e.preventDefault()} />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" onClick={(e) => e.preventDefault()}>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive onClick={(e) => e.preventDefault()}>
                    2
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" onClick={(e) => e.preventDefault()}>3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => e.preventDefault()} />
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
                {selectedNewsItem.source} - {selectedNewsItem.date}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap font-body">{selectedNewsItem.fullContent || selectedNewsItem.snippet}</p>
            </div>
            <DialogFooter className="sm:justify-start">
              <Link href={selectedNewsItem.link} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button variant="outline" className="font-body">
                  Vollständigen Artikel lesen <ExternalLink className="ml-2 h-4 w-4" />
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
