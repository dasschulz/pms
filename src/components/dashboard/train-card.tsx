"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Train, Clock, MapPin, AlertCircle, RefreshCw, Wifi, WifiOff, Home, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface JourneyLeg {
  origin: {
    name: string;
    id?: string;
    platform?: string;
  };
  destination: {
    name: string;
    id?: string;
    platform?: string;
  };
  departure: string;
  arrival: string;
  direction?: string;
  line: {
    name?: string;
    product?: string;
    number?: string;
    operator?: string;
    direction?: string;
    rawLine?: any;
  };
  duration?: number;
  distance?: number;
  walking: boolean;
  delay: {
    departure: number;
    arrival: number;
  };
}

interface Journey {
  departure: string;
  arrival: string;
  duration: number | null;
  transfers: number;
  products: string[];
  delay: number;
  legs: JourneyLeg[];
  price?: any;
  departurePlatform?: string;
  arrivalPlatform?: string;
  rawJourney?: any;
}

interface TrainConnections {
  heimatbahnhof: string;
  berlinHbf: string;
  connections: {
    toBerlin: Journey[];
    fromBerlin: Journey[];
  };
  lastUpdated: string;
  status?: 'online' | 'offline' | 'partial';
  cacheInfo?: {
    cached: boolean;
    validUntil: string;
  };
}

interface TrainCardProps {
  className?: string;
}

export function TrainCard({ className }: TrainCardProps) {
  const [connections, setConnections] = useState<TrainConnections | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [retryCount, setRetryCount] = useState(0);
  const [expandedJourneys, setExpandedJourneys] = useState<Set<string>>(new Set());

  const fetchConnections = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = forceRefresh ? '/api/train-connections?refresh=true' : '/api/train-connections';
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Train API Response:', { status: response.status, data }); // Debug log
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(data.message || 'Station nicht gefunden');
        } else if (response.status === 503) {
          // Service unavailable - show fallback data if available
          if (data.fallback) {
            setConnections(data.fallback);
            setLastRefresh(new Date());
          }
          throw new Error(data.message || 'Service momentan nicht verfügbar');
        }
        throw new Error(`HTTP ${response.status}: ${data.message || data.error || 'Fehler beim Laden der Verbindungen'}`);
      }
      
      setConnections(data);
      setLastRefresh(new Date());
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error fetching train connections:', error);
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler');
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
    
    // Much more conservative refresh intervals to respect 15-minute backend cache
    // Base interval: 16 minutes (slightly longer than cache TTL to avoid unnecessary calls)
    const baseInterval = 16 * 60 * 1000; // 16 minutes
    
    // If there are failures, back off more aggressively
    const backoffMultiplier = Math.min(retryCount, 3); // Max 3x multiplier
    const refreshInterval = baseInterval * (1 + backoffMultiplier); // 16min, 32min, 48min, 64min max
    
    console.log(`🔄 Next train data refresh in ${refreshInterval / 1000 / 60} minutes`);
    
    const interval = setInterval(() => fetchConnections(), refreshInterval);
    return () => clearInterval(interval);
  }, [retryCount]);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number | null) => {
    // Handle invalid/NaN duration values
    if (!minutes || isNaN(minutes) || minutes <= 0) {
      return null; // Return null instead of "unbekannt" so we can hide it
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  // Calculate departure time from now in minutes
  const getTimeUntilDeparture = (departureString: string) => {
    const now = new Date();
    const departure = new Date(departureString);
    const diffMs = departure.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins <= 0) {
      return "jetzt";
    } else if (diffMins < 60) {
      return `in ${diffMins} Min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `in ${hours}h ${mins}min`;
    }
  };

  const getProductBadgeColor = (product: string) => {
    switch (product?.toLowerCase()) {
      case 'nationalexpress':
      case 'ice':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'national':
      case 'ic':
      case 'ec':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'regionalexp':
      case 're':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'regional':
      case 'rb':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'suburban':
      case 's':
      case 's-bahn':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Filter out unknown products and clean up product names
  const cleanProducts = (products: string[]) => {
    const filtered = products
      .filter(product => 
        product && 
        product.trim() !== '' && 
        !['unknown', 'null', 'undefined'].includes(product.toLowerCase().trim())
      )
      .map(product => {
        // Map common product variations to standard names
        const productLower = product.toLowerCase().trim();
        if (productLower === 'nationalexpress') return 'ICE';
        if (productLower === 'national') return 'IC';
        if (productLower === 'regionalexp') return 'RE';
        if (productLower === 'regional') return 'RE';
        if (productLower === 'suburban') return 'S-Bahn';
        if (productLower.includes('ice')) return 'ICE';
        if (productLower.includes('ic') && !productLower.includes('ice')) return 'IC';
        if (productLower.includes('re')) return 'RE';
        if (productLower.includes('rb')) return 'RB';
        if (productLower.includes('s-') || productLower === 's') return 'S-Bahn';
        if (productLower.includes('ec')) return 'EC';
        return product.toUpperCase();
      });
      
    // Remove duplicates
    return [...new Set(filtered)];
  };

  const getStatusIndicator = () => {
    if (!connections) return null;
    
    const status = connections.status || 'online';
    switch (status) {
      case 'online':
        return <Wifi className="w-3 h-3 text-green-600" />;
      case 'partial':
        return <Wifi className="w-3 h-3 text-yellow-600" />;
      case 'offline':
        return <WifiOff className="w-3 h-3 text-red-600" />;
      default:
        return null;
    }
  };

  const renderJourney = (journey: Journey, direction: 'to' | 'from') => {
    const cleanedProducts = cleanProducts(journey.products);
    const journeyKey = `${journey.departure}-${journey.arrival}-${direction}`;
    const isExpanded = expandedJourneys.has(journeyKey);
    const duration = formatDuration(journey.duration);
    
    // Calculate total journey time manually if API duration is invalid
    const calculateTotalTime = () => {
      if (duration) return duration; // Use API duration if valid
      
      if (journey.legs && journey.legs.length > 0) {
        const firstLeg = journey.legs[0];
        const lastLeg = journey.legs[journey.legs.length - 1];
        const startTime = new Date(firstLeg.departure);
        const endTime = new Date(lastLeg.arrival);
        const totalMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        return formatDuration(totalMinutes);
      }
      
      return null;
    };
    
    const totalTime = calculateTotalTime();

    return (
      <div key={journeyKey} className="space-y-2 border rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden">
        {/* Main journey overview - clickable */}
        <div 
          className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => toggleJourneyExpansion(journeyKey)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
              <span className="font-semibold">
                {formatTime(journey.departure)} → {formatTime(journey.arrival)}
              </span>
              {journey.delay > 0 && (
                <Badge variant="destructive" className="text-[11px] px-1.5 py-0.5">
                  +{journey.delay}min
                </Badge>
              )}
              {/* Platform information */}
              {journey.departurePlatform && (
                <Badge variant="outline" className="text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Gleis {journey.departurePlatform}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-accent dark:text-white">
                {getTimeUntilDeparture(journey.departure)}
              </div>
              {totalTime && (
                <div className="text-xs text-gray-400 dark:text-muted-foreground">
                  {totalTime}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-1 flex-wrap">
              {cleanedProducts.slice(0, 2).map((product, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className={`text-xs ${getProductBadgeColor(product)}`}
                >
                  {product}
                </Badge>
              ))}
              {cleanedProducts.length > 2 && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  +{cleanedProducts.length - 2}
                </Badge>
              )}
              {cleanedProducts.length === 0 && (
                <Badge variant="outline" className="text-xs">
                  Regional
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {journey.transfers > 0 && (
                <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-muted-foreground">
                  <RefreshCw className="w-3 h-3" />
                  <span>{journey.transfers} Umstieg{journey.transfers > 1 ? 'e' : ''}</span>
                </div>
              )}
              <div className="text-xs text-gray-400 dark:text-muted-foreground">
                {isExpanded ? '▼' : '▶'} Details
              </div>
            </div>
          </div>
        </div>

        {/* Expanded journey details */}
        {isExpanded && (
          <div className="border-t bg-gray-50 dark:bg-gray-700 p-3 space-y-3">
            <h5 className="font-medium text-sm text-gray-400 dark:text-muted-foreground">Detaillierte Verbindung:</h5>
            {journey.legs.map((leg, idx) => (
              <div key={idx} className="space-y-2">
                {/* Departure info */}
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-16 text-xs text-gray-400 dark:text-muted-foreground text-right">
                    {formatTime(leg.departure)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{leg.origin.name}</span>
                      {leg.origin.platform && (
                        <Badge variant="outline" className="text-[11px] px-1.5 py-0.5">
                          Gl. {leg.origin.platform}
                        </Badge>
                      )}
                      {leg.delay.departure > 0 && (
                        <Badge variant="destructive" className="text-[11px] px-1.5 py-0.5">
                          +{leg.delay.departure}min
                        </Badge>
                      )}
                    </div>
                    
                    {/* Train information */}
                    {leg.line.name && !leg.walking && (
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          {leg.line.name && (
                            <span className="text-xs font-medium text-gray-400 dark:text-muted-foreground">
                              {leg.line.name}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-muted-foreground">
                          → Richtung: <span className="font-medium">{leg.direction || leg.destination.name}</span>
                          {leg.duration && formatDuration(leg.duration) && (
                            <span> • Fahrtzeit: {formatDuration(leg.duration)}</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Walking segment */}
                    {leg.walking && (
                      <div className="text-xs text-gray-400 dark:text-muted-foreground mt-1">
                        🚶 Fußweg nach {leg.destination.name}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Arrival info - show for all legs */}
                <div className="flex items-center space-x-3 text-sm border-l-2 border-gray-200 ml-8 pl-3">
                  <div className="w-16 text-xs text-gray-400 dark:text-muted-foreground text-right">
                    {formatTime(leg.arrival)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{leg.destination.name}</span>
                      {leg.destination.platform && (
                        <Badge variant="outline" className="text-[11px] px-1.5 py-0.5">
                          Gl. {leg.destination.platform}
                        </Badge>
                      )}
                      {leg.delay.arrival > 0 && (
                        <Badge variant="destructive" className="text-[11px] px-1.5 py-0.5">
                          +{leg.delay.arrival}min
                        </Badge>
                      )}
                    </div>
                    {idx < journey.legs.length - 1 && (() => {
                      const transferMinutes = Math.round((new Date(journey.legs[idx + 1].departure).getTime() - new Date(leg.arrival).getTime()) / (1000 * 60));
                      return transferMinutes > 0 && (
                        <div className="text-xs text-accent dark:text-white mt-1">
                          Umstieg • {transferMinutes} Min
                        </div>
                      );
                    })()}
                    {idx === journey.legs.length - 1 && (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                        Ankunft am Ziel
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Separator between legs */}
                {idx < journey.legs.length - 1 && (
                  <div className="border-t border-dashed border-gray-200 my-2"></div>
                )}
              </div>
            ))}
            
            {/* Journey summary */}
            <div className="border-t pt-2 mt-3">
              <div className="text-xs text-gray-400 dark:text-muted-foreground space-y-1">
                <div>
                  <span className="font-medium">Gesamtfahrtzeit:</span> {totalTime || 'unbekannt'}
                </div>
                <div>
                  <span className="font-medium">Umstiege:</span> {journey.transfers === 0 ? 'Direktverbindung' : `${journey.transfers} Umstieg${journey.transfers > 1 ? 'e' : ''}`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const toggleJourneyExpansion = (journeyKey: string) => {
    const newExpanded = new Set(expandedJourneys);
    if (newExpanded.has(journeyKey)) {
      newExpanded.delete(journeyKey);
    } else {
      newExpanded.add(journeyKey);
    }
    setExpandedJourneys(newExpanded);
  };

  if (isLoading && !connections) {
    return (
      <Card className={`shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Train className="w-5 h-5" />
            <span>Zugverbindungen</span>
          </CardTitle>
          <CardDescription>Lade Verbindungen...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !connections) {
    return (
      <Card className={`shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Train className="w-5 h-5" />
            <span>Zugverbindungen</span>
          </CardTitle>
          <CardDescription className="text-destructive">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchConnections(true)}
            className="w-full"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Erneut versuchen
          </Button>
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Nächster automatischer Versuch in {Math.round(16 * (1 + retryCount))} Minuten
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!connections) {
    return null;
  }

  const nextToBerlin = connections.connections.toBerlin[0];
  const nextFromBerlin = connections.connections.fromBerlin[0];
  const hasData = nextToBerlin || nextFromBerlin;

  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Train className="w-5 h-5" />
            <span>Zugverbindungen</span>
            {getStatusIndicator()}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchConnections(true)}
            disabled={isLoading}
            title="Manuell aktualisieren (überschreibt Cache)"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription className="flex items-start space-x-2">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="break-words leading-relaxed">
            {connections.heimatbahnhof} ↔ {connections.berlinHbf}
          </span>
        </CardDescription>
        {error && connections.status === 'offline' && (
          <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {nextToBerlin && (
          <div>
            <h4 className="font-medium text-sm mb-2 text-gray-400 dark:text-muted-foreground flex items-center space-x-1">
              <Building2 className="w-4 h-4" />
              <span>Nächste Fahrt nach {connections.berlinHbf}</span>
            </h4>
            {renderJourney(nextToBerlin, 'to')}
          </div>
        )}
        
        {nextFromBerlin && (
          <div>
            <h4 className="font-medium text-sm mb-2 text-gray-400 dark:text-muted-foreground flex items-center space-x-1">
              <Home className="w-4 h-4" />
              <span>Nächste Fahrt nach {connections.heimatbahnhof}</span>
            </h4>
            {renderJourney(nextFromBerlin, 'from')}
          </div>
        )}

        {!hasData && (
          <div className="text-center py-6">
            <WifiOff className="w-8 h-8 text-gray-400 dark:text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-muted-foreground">
              {connections.status === 'offline' 
                ? 'DB-Service ist momentan nicht verfügbar'
                : 'Derzeit keine Verbindungen verfügbar'
              }
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchConnections(true)}
              className="mt-2"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>
        )}

        <div className="text-xs text-gray-400 dark:text-muted-foreground text-center pt-2 border-t flex items-center justify-center space-x-2">
          <span>Zuletzt aktualisiert: {lastRefresh.toLocaleTimeString('de-DE')}</span>
          {connections.status === 'offline' && (
            <Badge variant="outline" className="text-xs">
              Offline-Modus
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 