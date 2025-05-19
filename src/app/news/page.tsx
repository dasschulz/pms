
"use client";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, FileSearch2 } from "lucide-react";
import { useState } from "react";

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
    fullContent: "Die Debatte konzentrierte sich auf Maßnahmen zur Mietpreisbindung und Investitionen in den sozialen Wohnungsbau. DIE LINKE argumentierte, dass die aktuellen Vorschläge nicht weit genug gehen, um die Wohnungskrise in deutschen Großstädten zu bewältigen. Sie forderten einen bundesweiten Mietendeckel und eine deutliche Aufstockung der öffentlichen Mittel für bezahlbaren Wohnraum. Andere Parteien äußerten Bedenken hinsichtlich der wirtschaftlichen Auswirkungen solcher Maßnahmen."
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
    fullContent: "Der Bericht detailliert prognostizierte Zunahmen extremer Wetterereignisse, steigende Meeresspiegel, die Küstenregionen betreffen, und Auswirkungen auf die Landwirtschaft. Der umweltpolitische Sprecher von DIE LINKE erklärte, der Bericht unterstreiche die Dringlichkeit des Übergangs zu einer kohlenstoffneutralen Wirtschaft und forderte verbindliche Ziele sowie erhebliche Investitionen in erneuerbare Energien und nachhaltige Infrastruktur."
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
    fullContent: "DIE LINKE drängt auf eine Erhöhung auf 15 Euro pro Stunde und argumentiert, dass der aktuelle Mindestlohn nicht ausreiche, um die Lebenshaltungskosten insbesondere in städtischen Gebieten zu decken. Sie verweisen auf Studien zu Armutsquoten und Einkommensungleichheit. Wirtschaftsverbände warnten, eine drastische Erhöhung könne zu Arbeitsplatzverlusten führen, während Gewerkschaften eine deutliche Anhebung unterstützen."
  },
];

export default function NewsPage() {
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {placeholderNews.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <div className="aspect-[16/9] relative w-full rounded-t-md overflow-hidden mb-2">
                  <Image 
                      src={item.imageUrl} 
                      alt={item.title} 
                      layout="fill" 
                      objectFit="cover"
                      data-ai-hint="news article" 
                  />
                </div>
                <CardTitle className="text-lg leading-tight font-heading-light">{item.title}</CardTitle>
                <CardDescription className="font-body">
                  {item.source} - {item.date} <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm ml-1">{item.politicalArea}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground font-body">{item.snippet}</p>
              </CardContent>
              <CardFooter className="flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4">
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-grow font-body" onClick={() => setSelectedNewsItem(item)}>
                    Mehr anzeigen
                  </Button>
                </DialogTrigger>
                <Link href="/minor-inquiry/generate" passHref legacyBehavior>
                  <Button asChild variant="secondary" className="flex-grow font-body">
                    <a><FileSearch2 className="mr-2 h-4 w-4" /> Kleine Anfrage vorschlagen</a>
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {selectedNewsItem && (
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle className="font-heading-light">{selectedNewsItem.title}</DialogTitle>
              <DialogDescription className="font-body">
                {selectedNewsItem.source} - {selectedNewsItem.date}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
                <div className="aspect-[16/9] relative w-full rounded-md overflow-hidden mb-2">
                    <Image 
                        src={selectedNewsItem.imageUrl} 
                        alt={selectedNewsItem.title} 
                        layout="fill" 
                        objectFit="cover" 
                        data-ai-hint="news article detail"
                    />
                </div>
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
