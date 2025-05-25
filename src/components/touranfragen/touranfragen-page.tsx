'use client';

import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Plus, Calendar, MapPin, User, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TourRequest {
  id: string;
  createdAt: string;
  kreisverband: string;
  landesverband: string;
  kandidatName: string;
  zeitraumVon: string;
  zeitraumBis: string;
  themen: string;
  video: 'Ja' | 'Nein';
  ansprechpartner1Name: string;
  ansprechpartner1Phone: string;
  ansprechpartner2Name?: string;
  ansprechpartner2Phone?: string;
  programmvorschlag: 'füge ich an' | 'möchte ich mit dem Büro klären';
  status?: 'neu' | 'bearbeitet' | 'abgeschlossen';
}

export function TouranfragenPage() {
  const [formLink, setFormLink] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [requests, setRequests] = useState<TourRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/touranfragen');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching tour requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFormLink = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/touranfragen/generate-link', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setFormLink(data.link);
        toast({
          title: 'Formularlink generiert',
          description: 'Der Link wurde erfolgreich erstellt.',
        });
      } else {
        throw new Error('Failed to generate link');
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Der Formularlink konnte nicht generiert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formLink);
    toast({
      title: 'Link kopiert',
      description: 'Der Formularlink wurde in die Zwischenablage kopiert.',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getStatusColor = (status?: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'neu': return 'bg-blue-100 text-blue-800';
      case 'bearbeitet': return 'bg-yellow-100 text-yellow-800';
      case 'abgeschlossen': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PageLayout
      title="Touranfragen"
      description="Es ist Wahlkampf und die Orga geht drunter und drüber? Das muss nicht sein. Koordiniere deine Wahlkampfeinsätze mit Struktur. Deine Büroleitung wird es dir danken. Wirklich. Das macht alles einfacher."
    >
      <div className="space-y-8">
        {/* Upper Section: Generate Form Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Neuen Formularlink erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Erstelle einen personalisierten Formularlink, den Kreisverbände und Kandidierende nutzen können, 
              um dich für Wahlkampfbesuche anzufragen.
            </p>
            
            <div className="flex gap-4">
              <Button 
                onClick={generateFormLink} 
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {isGenerating ? 'Generiere...' : 'Link generieren'}
              </Button>
            </div>

            {formLink && (
              <div className="flex gap-2 items-center p-3 bg-muted rounded-lg">
                <code className="flex-1 text-sm break-all">{formLink}</code>
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lower Section: Incoming Requests */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Eingegangene Anfragen</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Lade Anfragen...</p>
            </div>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Noch keine Touranfragen eingegangen.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {requests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{request.kandidatName}</CardTitle>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status?.toLowerCase() || 'neu'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(request.createdAt)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{request.kreisverband}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{request.landesverband}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{request.zeitraumVon} - {request.zeitraumBis}</span>
                    </div>

                    {request.themen && (
                      <div className="text-sm">
                        <p className="font-medium text-muted-foreground mb-1">Themen:</p>
                        <p className="text-xs bg-muted p-2 rounded">
                          {request.themen.length > 100 
                            ? `${request.themen.substring(0, 100)}...` 
                            : request.themen
                          }
                        </p>
                      </div>
                    )}

                    {request.video === 'Ja' && (
                      <Badge variant="secondary" className="text-xs">
                        Video gewünscht
                      </Badge>
                    )}

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><strong>Ansprechpartner:</strong> {request.ansprechpartner1Name}</p>
                      <p>{request.ansprechpartner1Phone}</p>
                      {request.ansprechpartner2Name && (
                        <>
                          <p>{request.ansprechpartner2Name}</p>
                          <p>{request.ansprechpartner2Phone}</p>
                        </>
                      )}
                    </div>

                    <div className="text-xs">
                      <Badge variant="outline">
                        Programm: {request.programmvorschlag}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
} 