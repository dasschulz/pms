'use client';

import { useState } from 'react';
import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PageLayout } from '@/components/page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Search, FileText, Calendar, Building2, Users, Scale, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DIPDocument {
  id: string;
  title: string;
  subtitle?: string;
  documentType: string;
  date: string;
  drucksachetyp?: string;
  nummer?: string;
  wahlperiode?: string;
  herausgeber?: string;
  fundstelle?: {
    id?: string;
    pdf_url?: string;
    dokumentnummer?: string;
    datum?: string;
    drucksachetyp?: string;
    herausgeber?: string;
    seite?: string;
  };
  urheber?: Array<{
    titel: string;
  }>;
  bearbeitet?: string;
  aktualisiert?: string;
}

interface SearchFilters {
  documentType: string;
  wahlperiode: string;
  dateFrom: string;
  dateTo: string;
  urheber: string;
}

export default function DokumentensuchePage() {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<DIPDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    documentType: 'all',
    wahlperiode: 'all',
    dateFrom: '',
    dateTo: '',
    urheber: ''
  });
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  if (status === 'loading') {
    return (
      <PageLayout title="Dokumentensuche">
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageLayout>
    );
  }

  if (!session) {
    redirect('/anmelden');
  }

  const documentTypes = [
    { value: 'drucksache', label: 'Drucksachen' },
    { value: 'plenarprotokoll', label: 'Plenarprotokolle' },
    { value: 'aktivitaet', label: 'Aktivitäten' },
    { value: 'vorgang', label: 'Vorgänge' },
    { value: 'person', label: 'Personen' },
  ];

  const wahlperioden = Array.from({ length: 10 }, (_, i) => ({
    value: (20 - i).toString(),
    label: `${20 - i}. Wahlperiode`
  }));

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      // Filter out "all" values and empty strings
      const activeFilters = Object.entries(filters)
        .filter(([_, value]) => value && value !== 'all')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as Partial<SearchFilters>);

      // Build proper search filters for DIP API
      const searchFilters: any = {};
      
      // Map documentType to entitaet for DIP API
      if (activeFilters.documentType) {
        searchFilters.documentType = activeFilters.documentType;
      }
      
      // Add other filters directly
      if (activeFilters.wahlperiode) {
        searchFilters.wahlperiode = activeFilters.wahlperiode;
      }
      
      if (activeFilters.dateFrom) {
        searchFilters.dateFrom = activeFilters.dateFrom;
      }
      
      if (activeFilters.dateTo) {
        searchFilters.dateTo = activeFilters.dateTo;
      }
      
      if (activeFilters.urheber) {
        searchFilters.urheber = activeFilters.urheber;
      }

      const params = new URLSearchParams({
        q: searchQuery,
        f: JSON.stringify(searchFilters),
        num: '20',
        start: ((currentPage - 1) * 20).toString()
      });

      const response = await fetch(`/api/dip-search?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.documents || []);
        setTotalResults(data.numFound || 0);
      } else {
        console.error('Search failed:', data.error);
        setResults([]);
        setTotalResults(0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('de-DE');
    } catch {
      return dateString;
    }
  };

  return (
    <PageLayout
      title="Dokumentensuche"
      description="Durchsuche das Informationssystem für Parlamentsmaterialien (DIP) nach Drucksachen, Plenarprotokollen, Aktivitäten und Vorgängen."
    >
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Suche
          </CardTitle>
          <CardDescription>
            Suche nach Drucksachen, Plenarprotokollen, Aktivitäten und Vorgängen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search">Suchbegriff</Label>
              <Input
                id="search"
                placeholder="z.B. Klimaschutz, Digitalisierung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Suchen
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList>
              <TabsTrigger value="basic">Grundfilter</TabsTrigger>
              <TabsTrigger value="advanced">Erweiterte Filter</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="documentType">Dokumenttyp</Label>
                  <Select value={filters.documentType} onValueChange={(value) => setFilters(prev => ({ ...prev, documentType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Dokumenttypen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Dokumenttypen</SelectItem>
                      {documentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="wahlperiode">Wahlperiode</Label>
                  <Select value={filters.wahlperiode} onValueChange={(value) => setFilters(prev => ({ ...prev, wahlperiode: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Wahlperioden" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Wahlperioden</SelectItem>
                      {wahlperioden.map(wp => (
                        <SelectItem key={wp.value} value={wp.value}>
                          {wp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dateFrom">Von Datum</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="dateTo">Bis Datum</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="urheber">Urheber</Label>
                  <Input
                    id="urheber"
                    placeholder="z.B. Fraktion DIE LINKE"
                    value={filters.urheber}
                    onChange={(e) => setFilters(prev => ({ ...prev, urheber: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Search Results */}
      {(results.length > 0 || loading) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Suchergebnisse
              {totalResults > 0 && (
                <span className="text-muted-foreground">({totalResults} Treffer gefunden)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="p-4 border rounded-lg space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Keine Dokumente gefunden
                </h3>
                <p className="text-sm text-muted-foreground">
                  Versuche andere Suchbegriffe oder ändere deine Filter.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((doc) => (
                  <div key={doc.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg leading-tight mb-1">
                          {doc.title}
                        </h3>
                        {doc.subtitle && (
                          <p className="text-muted-foreground text-sm">
                            {doc.subtitle}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="default">
                          {doc.documentType}
                        </Badge>
                        {doc.drucksachetyp && doc.drucksachetyp !== doc.documentType && (
                          <Badge variant="secondary">
                            {doc.drucksachetyp}
                          </Badge>
                        )}
                        {doc.wahlperiode && (
                          <Badge variant="outline">
                            {doc.wahlperiode}. WP
                          </Badge>
                        )}
                        {doc.nummer && (
                          <Badge variant="outline">
                            Nr. {doc.nummer}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {doc.date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Datum: {formatDate(doc.date)}</span>
                          </div>
                        )}
                        {doc.herausgeber && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>Herausgeber: {doc.herausgeber}</span>
                          </div>
                        )}
                        {doc.urheber && doc.urheber.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>Urheber: {doc.urheber.map(u => u.titel).join(', ')}</span>
                          </div>
                        )}
                        {doc.bearbeitet && (
                          <div className="flex items-center gap-2">
                            <Scale className="h-4 w-4 text-muted-foreground" />
                            <span>Bearbeitet: {formatDate(doc.bearbeitet)}</span>
                          </div>
                        )}
                      </div>

                      {doc.fundstelle?.pdf_url && (
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.fundstelle!.pdf_url!, '_blank')}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            PDF öffnen
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalResults > 20 && (
                  <div className="flex justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentPage(Math.max(1, currentPage - 1));
                        handleSearch();
                      }}
                      disabled={currentPage === 1 || loading}
                    >
                      Vorherige
                    </Button>
                    <span className="flex items-center px-4 py-2 text-sm">
                      Seite {currentPage} von {Math.ceil(totalResults / 20)}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentPage(currentPage + 1);
                        handleSearch();
                      }}
                      disabled={currentPage >= Math.ceil(totalResults / 20) || loading}
                    >
                      Nächste
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
} 