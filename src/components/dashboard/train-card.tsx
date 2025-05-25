"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Train, Clock, MapPin, AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Journey {
  departure: string;
  arrival: string;
  duration: number;
  transfers: number;
  products: string[];
  delay: number;
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

  const fetchConnections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/train-connections');
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
    // Refresh every 5 minutes, but extend interval if there are repeated failures
    const baseInterval = 5 * 60 * 1000; // 5 minutes
    const intervalMultiplier = Math.min(retryCount, 3); // Max 3x multiplier
    const refreshInterval = baseInterval * (1 + intervalMultiplier * 0.5); // Increase by 50% per retry
    
    const interval = setInterval(fetchConnections, refreshInterval);
    return () => clearInterval(interval);
  }, [retryCount]);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
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
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
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

  const renderJourney = (journey: Journey, direction: 'to' | 'from') => (
    <div key={`${journey.departure}-${journey.arrival}`} className="space-y-2 p-3 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold">
            {formatTime(journey.departure)} → {formatTime(journey.arrival)}
          </span>
          {journey.delay > 0 && (
            <Badge variant="destructive" className="text-xs">
              +{journey.delay}min
            </Badge>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {formatDuration(journey.duration)}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {journey.products.slice(0, 2).map((product, idx) => (
            <Badge 
              key={idx} 
              variant="outline" 
              className={`text-xs ${getProductBadgeColor(product)}`}
            >
              {product.toUpperCase()}
            </Badge>
          ))}
          {journey.products.length > 2 && (
            <span className="text-xs text-muted-foreground">+{journey.products.length - 2}</span>
          )}
        </div>
        {journey.transfers > 0 && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3" />
            <span>{journey.transfers} Umstieg{journey.transfers > 1 ? 'e' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading && !connections) {
    return (
      <Card className={className}>
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
      <Card className={className}>
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
            onClick={fetchConnections}
            className="w-full"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Erneut versuchen
          </Button>
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Nächster automatischer Versuch in {Math.round(5 * (1 + (retryCount * 0.5)))} Minuten
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
    <Card className={className}>
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
            onClick={fetchConnections}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription className="flex items-center space-x-2">
          <MapPin className="w-4 h-4" />
          <span>{connections.heimatbahnhof} ↔ {connections.berlinHbf}</span>
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
            <h4 className="font-medium text-sm mb-2 text-muted-foreground">
              Nächste Fahrt nach Berlin
            </h4>
            {renderJourney(nextToBerlin, 'to')}
          </div>
        )}
        
        {nextFromBerlin && (
          <div>
            <h4 className="font-medium text-sm mb-2 text-muted-foreground">
              Nächste Fahrt nach {connections.heimatbahnhof.split(' ')[0]}
            </h4>
            {renderJourney(nextFromBerlin, 'from')}
          </div>
        )}

        {!hasData && (
          <div className="text-center py-6">
            <WifiOff className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {connections.status === 'offline' 
                ? 'DB-Service ist momentan nicht verfügbar'
                : 'Derzeit keine Verbindungen verfügbar'
              }
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchConnections}
              className="mt-2"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center pt-2 border-t flex items-center justify-center space-x-2">
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