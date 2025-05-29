"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, AlertTriangle, Users, CheckCircle, XCircle, Clock, HelpCircle, MinusCircle } from "lucide-react";
import { toast } from "sonner";

interface BpaFahrt {
  id: string;
  fahrtDatumVon?: string;
  fahrtDatumBis?: string;
  zielort?: string;
  hotelName?: string;
  hotelAdresse?: string;
  kontingentMax?: number;
  aktuelleAnmeldungen?: number;
  bestaetigteAnmeldungen?: number;
  statusFahrt?: string;
  anmeldefrist?: string;
  beschreibung?: string;
  zustaiegsorteConfig?: string;
  aktiv?: boolean;
  // Other fields from the Supabase schema as needed for display
}

type TeilnahmeStatus = 'Angefragt' | 'Bestätigt' | 'Abgesagt' | 'Nachrücker';

interface Anmeldung {
  id: string;
  Vorname?: string;
  Nachname?: string;
  Email?: string;
  Telefon?: string;
  Strasse?: string;
  Hausnummer?: string;
  PLZ?: string;
  Ort?: string;
  Geburtsdatum?: string;
  Status_Teilnahme?: TeilnahmeStatus;
  Notizen_intern?: string;
  // Add other relevant fields from BPA_Formular
}

const teilnahmeStatusOptions: TeilnahmeStatus[] = ['Angefragt', 'Bestätigt', 'Abgesagt', 'Nachrücker'];

export default function BpaFahrtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fahrtId = params.fahrtId as string;

  const [fahrtDetails, setFahrtDetails] = useState<BpaFahrt | null>(null);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldung[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatusAnmeldungId, setUpdatingStatusAnmeldungId] = useState<string | null>(null);

  const fetchFahrtDetailsAndAnmeldungen = useCallback(async (showLoadingSpinner = true) => {
    if (!fahrtId) return;
    if (showLoadingSpinner) setIsLoading(true);
    // setError(null); // Keep existing errors for main page load, but clear for re-fetches perhaps?

    try {
      const fahrtResponse = await fetch(`/api/bpa-fahrten/${fahrtId}`);
      if (!fahrtResponse.ok) {
        const errorData = await fahrtResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Fehler beim Laden der Fahrtdetails (${fahrtResponse.status})`);
      }
      const fahrtData = await fahrtResponse.json();
      setFahrtDetails(fahrtData.fahrt);

      const anmeldungenResponse = await fetch(`/api/bpa-anmeldungen?fahrtId=${fahrtId}`);
      if (!anmeldungenResponse.ok) {
        const errorData = await anmeldungenResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Fehler beim Laden der Anmeldungen (${anmeldungenResponse.status})`);
      }
      const anmeldungenData = await anmeldungenResponse.json();
      setAnmeldungen(anmeldungenData.anmeldungen || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.';
      // Set error only if it is the initial load, not for background refreshes
      if (showLoadingSpinner) {
        setError(errorMessage);
        toast.error(errorMessage); 
      }
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  }, [fahrtId]);

  useEffect(() => {
    fetchFahrtDetailsAndAnmeldungen(true); // Initial load with spinner
  }, [fetchFahrtDetailsAndAnmeldungen]);

  const handleAnmeldungStatusChange = async (anmeldungId: string, newStatus: TeilnahmeStatus) => {
    setUpdatingStatusAnmeldungId(anmeldungId);
    try {
      const response = await fetch(`/api/bpa-anmeldungen/${anmeldungId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status_Teilnahme: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Fehler beim Aktualisieren des Status (${response.status})`);
      }
      
      // Optimistically update UI
      setAnmeldungen(prevAnmeldungen => 
        prevAnmeldungen.map(anm => anm.id === anmeldungId ? { ...anm, Status_Teilnahme: newStatus } : anm)
      );
      toast.success("Status der Anmeldung erfolgreich aktualisiert.");
      
      // Re-fetch fahrt details to update counts like 'bestaetigteAnmeldungen'
      // This is a background refresh, so no full loading spinner for the page
      await fetchFahrtDetailsAndAnmeldungen(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Status.';
      toast.error(errorMessage);
      // Optionally revert optimistic update here if needed, or re-fetch all anmeldungen
      await fetchFahrtDetailsAndAnmeldungen(false); // Re-fetch to ensure data consistency on error
    } finally {
      setUpdatingStatusAnmeldungId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (isLoading && !fahrtDetails) {
    return <div className="container mx-auto p-4 text-center">Lade Fahrtdetails...</div>;
  }

  if (error && !fahrtDetails) {
    return (
      <div className="container mx-auto p-4">
        <Button variant="outline" onClick={() => router.push('/bpa-fahrten')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zur Übersicht
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!fahrtDetails) {
    return (
      <div className="container mx-auto p-4">
        <Button variant="outline" onClick={() => router.push('/bpa-fahrten')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zur Übersicht
        </Button>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Fahrt nicht gefunden</AlertTitle>
          <AlertDescription>Die angeforderte BPA-Fahrt konnte nicht gefunden werden.</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const getStatusBadgeVariant = (status?: TeilnahmeStatus) => {
    switch (status) {
      case 'Bestätigt': return 'default';
      case 'Angefragt': return 'outline';
      case 'Nachrücker': return 'secondary';
      case 'Abgesagt': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status?: TeilnahmeStatus) => {
    switch (status) {
      case 'Bestätigt': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Angefragt': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'Nachrücker': return <HelpCircle className="h-4 w-4 text-yellow-600" />;
      case 'Abgesagt': return <MinusCircle className="h-4 w-4 text-slate-500" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Button variant="outline" onClick={() => router.push('/bpa-fahrten')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zur Übersicht
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Details zur BPA-Fahrt: {fahrtDetails.zielort}</CardTitle>
          <CardDescription>
            {formatDate(fahrtDetails.fahrtDatumVon)} - {formatDate(fahrtDetails.fahrtDatumBis)}
            <Badge variant={fahrtDetails.aktiv ? 'default' : 'outline'} className="ml-2">
              {fahrtDetails.aktiv ? 'Formular Aktiv' : 'Formular Inaktiv'}
            </Badge>
             <Badge variant={fahrtDetails.statusFahrt === 'Anmeldung offen' || fahrtDetails.statusFahrt === 'Fahrt läuft' ? 'default' : fahrtDetails.statusFahrt === 'Storniert' ? 'destructive' : 'outline'} className="ml-2">
                {fahrtDetails.statusFahrt}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><span className="font-semibold">Hotel:</span> {fahrtDetails.hotelName || '-'}</div>
          <div><span className="font-semibold">Hotel Adresse:</span> {fahrtDetails.hotelAdresse || '-'}</div>
          <div><span className="font-semibold">Max. Kontingent:</span> {fahrtDetails.kontingentMax}</div>
          <div>
            <span className="font-semibold">Anmeldungen:</span> {fahrtDetails.aktuelleAnmeldungen ?? 0} / {fahrtDetails.kontingentMax} 
            ({fahrtDetails.bestaetigteAnmeldungen ?? 0} bestätigt)
          </div>
          <div><span className="font-semibold">Anmeldefrist:</span> {formatDate(fahrtDetails.anmeldefrist)}</div>
          <div><span className="font-semibold">Zustiegsorte:</span> {fahrtDetails.zustaiegsorteConfig || '-'}</div>
          {fahrtDetails.beschreibung && (
            <div className="md:col-span-2"><span className="font-semibold">Beschreibung:</span> {fahrtDetails.beschreibung}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teilnehmeranmeldungen ({anmeldungen.length})</CardTitle>
          <CardDescription>Verwalten Sie die Anmeldungen für diese Fahrt.</CardDescription>
        </CardHeader>
        <CardContent>
          {anmeldungen.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Ort</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktion (Status ändern)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anmeldungen.map((anmeldung) => (
                  <TableRow key={anmeldung.id}>
                    <TableCell>{anmeldung.Vorname} {anmeldung.Nachname}</TableCell>
                    <TableCell className="hidden md:table-cell">{anmeldung.Email}</TableCell>
                    <TableCell className="hidden lg:table-cell">{anmeldung.PLZ} {anmeldung.Ort}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(anmeldung.Status_Teilnahme)} className="flex items-center">
                         {getStatusIcon(anmeldung.Status_Teilnahme)}
                         <span className="ml-1">{anmeldung.Status_Teilnahme || 'Unbekannt'}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Select 
                          value={anmeldung.Status_Teilnahme}
                          onValueChange={(newStatus) => handleAnmeldungStatusChange(anmeldung.id, newStatus as TeilnahmeStatus)}
                          disabled={updatingStatusAnmeldungId === anmeldung.id}
                        >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status ändern" />
                        </SelectTrigger>
                        <SelectContent>
                            {teilnahmeStatusOptions.map(status => (
                                <SelectItem key={status} value={status}>
                                    {getStatusIcon(status)} <span className="ml-2">{status}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>Für diese Fahrt liegen noch keine Anmeldungen vor.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 