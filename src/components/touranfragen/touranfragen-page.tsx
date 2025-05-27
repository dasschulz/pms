'use client';

import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Plus, Calendar, MapPin, User, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  status?: 'Neu' | 'Eingegangen' | 'Terminiert' | 'Abgeschlossen';
}

const tourStatusOptions = ['Neu', 'Eingegangen', 'Terminiert', 'Abgeschlossen'] as const;

// Color schemes for tour request statuses - matching videoplanung style
const getTourStatusColor = (status: string) => {
  switch (status) {
    case 'Neu':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700';
    case 'Eingegangen':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700';
    case 'Terminiert':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
    case 'Abgeschlossen':
      return 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-700';
    default:
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700';
  }
};

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
        const requests = data.requests || [];
        
        // Auto-update "Neu" status to "Eingegangen" on first retrieval
        const requestsToUpdate = requests.filter((req: TourRequest) => req.status === 'Neu');
        
        if (requestsToUpdate.length > 0) {
          // Update all "Neu" requests to "Eingegangen" in parallel
          await Promise.all(
            requestsToUpdate.map((req: TourRequest) => 
              updateRequestStatus(req.id, 'Eingegangen', false) // false = don't show toast
            )
          );
          
          // Update local state with new status
          const updatedRequests = requests.map((req: TourRequest) => 
            req.status === 'Neu' ? { ...req, status: 'Eingegangen' as const } : req
          );
          setRequests(updatedRequests);
        } else {
          setRequests(requests);
        }
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
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const updateRequestStatus = async (requestId: string, newStatus: TourRequest['status'], showToast = true) => {
    try {
      const response = await fetch('/api/touranfragen', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: requestId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        // Update local state
        setRequests(prev => 
          prev.map(req => 
            req.id === requestId ? { ...req, status: newStatus } : req
          )
        );
        
        if (showToast) {
          toast({
            title: 'Status aktualisiert',
            description: `Status wurde auf "${newStatus}" gesetzt.`,
          });
        }
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      if (showToast) {
        toast({
          title: 'Fehler',
          description: 'Status konnte nicht aktualisiert werden.',
          variant: 'destructive',
        });
      }
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
                <Card key={request.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{request.kandidatName}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(request.createdAt)}
                        </div>
                      </div>
                      
                      {/* Status Select Field - styled like NextJob in videoplanung */}
                      <div 
                        className={cn(
                          "h-9 px-3 py-2 text-sm",
                          "flex items-center justify-center",
                          getTourStatusColor(request.status || 'Neu'),
                          "rounded-md border border-input",
                          "cursor-pointer hover:opacity-80",
                          "min-w-[120px]"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          value={request.status || 'Neu'}
                          onValueChange={(value: string) => {
                            updateRequestStatus(request.id, value as TourRequest['status']);
                          }}
                        >
                          <SelectTrigger className={cn(
                            "h-full w-full border-none bg-transparent p-0 text-sm",
                            "hover:opacity-80",
                            "[&>svg]:hidden", // Hide the chevron indicator
                            "justify-center", // Center the content
                            "[&>span]:flex [&>span]:items-center [&>span]:justify-center [&>span]:w-full"
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tourStatusOptions.map((option) => (
                              <SelectItem 
                                key={option} 
                                value={option} 
                                className={cn(
                                  "text-sm data-[highlighted]:opacity-75 focus:bg-transparent",
                                  getTourStatusColor(option)
                                )}
                              >
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Info Section */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Kandidat:</span>
                        <span className="font-medium text-foreground">{request.kandidatName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Ort:</span>
                        <span className="font-medium text-foreground">{request.kreisverband}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">LV:</span>
                        <span className="font-medium text-foreground">{request.landesverband}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Wann:</span>
                        <span className="font-medium text-foreground">{formatDate(request.zeitraumVon)} - {formatDate(request.zeitraumBis)}</span>
                      </div>
                    </div>

                    {/* Ansprechpartner Section - Higher in hierarchy */}
                    <div className="space-y-2 border-t pt-3">
                      <p className="font-semibold text-base text-foreground">Ansprechpartner:</p>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">{request.ansprechpartner1Name}</span>
                          <span className="text-muted-foreground ml-2">{request.ansprechpartner1Phone}</span>
                        </p>
                        {request.ansprechpartner2Name && (
                          <p className="text-sm">
                            <span className="font-medium">{request.ansprechpartner2Name}</span>
                            <span className="text-muted-foreground ml-2">{request.ansprechpartner2Phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Themen Section */}
                    {request.themen && (
                      <div className="text-sm border-t pt-3">
                        <p className="font-medium text-muted-foreground mb-1">Themen:</p>
                        <p className="text-xs bg-muted p-2 rounded">
                          {request.themen.length > 100 
                            ? `${request.themen.substring(0, 100)}...` 
                            : request.themen
                          }
                        </p>
                      </div>
                    )}

                    {/* Status Chips and Actions */}
                    <div className="flex flex-wrap gap-2 border-t pt-3">
                      {request.video === 'Ja' && (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          Video gewünscht
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
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