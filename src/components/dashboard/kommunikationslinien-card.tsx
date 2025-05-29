"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createBrowserClient } from '@supabase/ssr';

interface CommunicationLine {
  id: string;
  hauptthema: string | null;
  zahl_der_woche: string | null;
  zahl_der_woche_beschreibung: string | null;
  end_date: string | null;
}

export function KommunikationslinienCard({ className }: { className?: string }) {
  const [currentLine, setCurrentLine] = useState<CommunicationLine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchCurrentCommunicationLine = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error: rpcError } = await supabase.rpc('get_communication_lines_with_details');
        
        if (rpcError) throw rpcError;
        if (!data) {
          setCurrentLine(null);
          return;
        }

        const allLines = data as CommunicationLine[];
        
        // Find the most current active communication line
        const activeLine = allLines.find(line => 
          (line.end_date && line.end_date >= today) || 
          (!line.end_date) // Consider lines without end date as current
        );

        setCurrentLine(activeLine || null);
      } catch (err: any) {
        console.error("Fehler beim Laden der Kommunikationslinie:", err);
        setError(err.message || 'Fehler beim Laden');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentCommunicationLine();
  }, [supabase]);

  if (isLoading) {
    return (
      <Card className={`shadow-lg ${className || ""}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Aktuelle Kommunikationslinien</span>
          </CardTitle>
          <CardDescription>Lade aktuelle Argumentationshilfen...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-px bg-border"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !currentLine) {
    return (
      <Card className={`shadow-lg ${className || ""}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Aktuelle Kommunikationslinien</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {error || 'Keine aktuellen Kommunikationslinien verfügbar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/kommunikationslinien">
            <Button variant="outline" className="w-full">
              <MessageCircle className="w-4 h-4 mr-2" />
              Alle Kommunikationslinien
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-lg ${className || ""}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span>Aktuelle Kommunikationslinien</span>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Gültig bis: {currentLine.end_date 
            ? new Date(currentLine.end_date).toLocaleDateString("de-DE", { 
                day: "numeric", 
                month: "long", 
                year: "numeric" 
              })
            : "unbegrenzt"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Hauptthema */}
        <div>
          <h3 className="font-semibold text-lg line-clamp-2">
            {currentLine.hauptthema || "Kein Hauptthema angegeben"}
          </h3>
        </div>

        <Separator />

        {/* Zahl der Woche */}
        <div className="space-y-2">
          <h4 className="font-semibold text-base">
            Zahl der Woche
          </h4>
          <div className="text-2xl font-bold text-primary">
            {currentLine.zahl_der_woche || "—"}
          </div>
        </div>

        {/* Button */}
        <Link href="/kommunikationslinien">
          <Button variant="outline" className="w-full">
            Zu den Argumenten
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
} 