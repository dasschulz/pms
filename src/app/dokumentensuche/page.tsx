'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, FileText, Calendar, Building2, Users, Scale } from 'lucide-react';
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Dokumentensuche</h1>
          <p className="text-muted-foreground">
            Durchsuche das Informationssystem für Parlamentsmaterialien (DIP)
          </p>
        </div>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Suche</span>
          </CardTitle>
          <CardDescription>
            Suche nach Drucksachen, Plenarprotokollen, Aktivitäten und Vorgängen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
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
                  <Label>Dokumenttyp</Label>
                  <Select value={filters.documentType} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, documentType: value }))
                  }>
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
                  <Label>Wahlperiode</Label>
                  <Select value={filters.wahlperiode} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, wahlperiode: value }))
                  }>
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
                    placeholder="z.B. Bundesregierung"
                    value={filters.urheber}
                    onChange={(e) => setFilters(prev => ({ ...prev, urheber: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results */}
      {totalResults > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Suchergebnisse ({totalResults.toLocaleString('de-DE')})</span>
              <Badge variant="secondary">
                Seite {currentPage} von {Math.ceil(totalResults / 20)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                          {doc.title}
                        </h3>
                        {doc.subtitle && (
                          <p className="text-muted-foreground mb-2 line-clamp-1">
                            {doc.subtitle}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-4">
                        {doc.documentType}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                      {doc.date && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(doc.date)}</span>
                        </div>
                      )}
                      
                      {doc.wahlperiode && (
                        <div className="flex items-center space-x-1">
                          <Building2 className="h-4 w-4" />
                          <span>{doc.wahlperiode}. WP</span>
                        </div>
                      )}
                      
                      {doc.nummer && (
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4" />
                          <span>Nr. {doc.nummer}</span>
                        </div>
                      )}

                      {doc.fundstelle?.dokumentnummer &&
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4" />
                          <span>Drs.-Nr.: {doc.fundstelle.dokumentnummer}</span>
                        </div>
                      }
                      
                      {doc.urheber && doc.urheber.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{doc.urheber[0].titel}</span>
                          {doc.urheber.length > 1 && (
                            <span>+{doc.urheber.length - 1}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {doc.fundstelle && (
                      <div className="mt-3 flex items-center gap-x-4">
                        {doc.fundstelle.pdf_url && (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => { doc.fundstelle?.pdf_url && window.open(doc.fundstelle.pdf_url, '_blank')}}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            PDF öffnen
                          </Button>
                        )}
                        {doc.fundstelle.seite && 
                          <span className="text-xs text-muted-foreground">Seite: {doc.fundstelle.seite}</span>
                        }
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Pagination */}
            {Math.ceil(totalResults / 20) > 1 && (
              <div className="flex justify-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Vorherige
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= Math.ceil(totalResults / 20)}
                >
                  Nächste
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No results */}
      {!loading && results.length === 0 && searchQuery && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Ergebnisse gefunden</h3>
            <p className="text-muted-foreground">
              Versuche es mit anderen Suchbegriffen oder passe die Filter an.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 