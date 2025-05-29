"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, AlertCircle, MapPin, HelpCircle } from "lucide-react";

interface MdbDetails {
  id: string; // Supabase UUID from users table
  name: string; // Full name
  wahlkreis: string;
  // lastName: string; // Already available from URL param if needed directly
}

interface BpaFahrtOption {
  id: string; // Supabase UUID from bpa_fahrten table
  name: string; // e.g., "Berlinfahrt Mai 2024", or a generated title
  startDate?: string; // Add optional date fields
  endDate?: string;
  anmeldefrist?: string; // Add deadline field
  // Add other relevant trip details if needed for selection display
}

export default function BpaDirectFormPage() {
  const params = useParams();
  const lastName = params.lastName as string;

  const [mdbDetails, setMdbDetails] = useState<MdbDetails | null>(null);
  const [activeTrips, setActiveTrips] = useState<BpaFahrtOption[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formStartTime, setFormStartTime] = useState(Date.now());

  const [formData, setFormData] = useState({
    vorname: '',
    nachname: '',
    geburtsdatum: '',
    email: '',
    telefon: '',
    anschrift: '',
    postleitzahl: '',
    ort: '',
    parteimitglied: false,
    teilnahme5Jahre: false,
    einzelzimmer: false,
    zustieg: '',
    essenspraeferenz: '',
    // Honeypot fields (should remain empty)
    website: '',
    phone_number: '',
    company: '',
    fax: '',
    // Add other fields from BPA_Formular as needed
  });

  useEffect(() => {
    if (lastName) {
      const fetchMdbAndTripDetails = async () => {
        setLoading(true);
        setError(null);
        setMdbDetails(null);
        setActiveTrips([]);
        setSelectedTripId('');

        try {
          // Step 1: Fetch MdB details by lastName
          const mdbResponse = await fetch(`/api/bpa-public/mdb-details?lastName=${encodeURIComponent(lastName)}`);
          if (!mdbResponse.ok) {
            const errorData = await mdbResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'MdB nicht gefunden oder Fehler beim Laden.');
          }
          const mdbData = await mdbResponse.json();
          setMdbDetails({
            id: mdbData.id, // Store Supabase UUID for MdB
            name: mdbData.name,
            wahlkreis: mdbData.wahlkreis
          });

          // Step 2: Fetch active BPA trips for this MdB using their Supabase UUID
          const tripsResponse = await fetch(`/api/bpa-public/active-trips?userId=${mdbData.id}`);
          if (!tripsResponse.ok) {
            const errorData = await tripsResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Fehler beim Laden der Fahrtenliste.');
          }
          const tripsData = await tripsResponse.json();
          setActiveTrips(tripsData.activeTrips || []);

          if (tripsData.activeTrips && tripsData.activeTrips.length === 1) {
            setSelectedTripId(tripsData.activeTrips[0].id);
          }

        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.');
          setMdbDetails(null);
          setActiveTrips([]);
        }
        setLoading(false);
      };
      fetchMdbAndTripDetails();
    }
  }, [lastName]);

  // Helper component for info popovers
  const InfoPopover = ({ content }: { content: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="ml-1 text-white/60 hover:text-white/80 transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-sm text-sm bg-white/95 backdrop-blur-sm border border-white/20 text-black">
        {content}
      </PopoverContent>
    </Popover>
  );

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mdbDetails || !mdbDetails.id) {
      setError("MdB Details nicht korrekt geladen. Bitte versuche es später erneut.");
      return;
    }
    if (activeTrips.length > 1 && !selectedTripId) {
      setError("Bitte wähle eine Fahrt aus.");
      return;
    }
    if (!validateEmail(formData.email)) {
      setError("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }
    if (formData.teilnahme5Jahre) {
      setError("Eine mehrmalige Teilnahme derselben Person innerhalb von 5 Jahren entspricht nicht den Richtlinien des BPA.");
      return;
    }
    
    // Basic client-side timing check
    const timeDiff = Date.now() - formStartTime;
    if (timeDiff < 3000) {
      setError("Bitte nehmen Sie sich etwas mehr Zeit beim Ausfüllen des Formulars.");
      return;
    }
    
    const finalTripId = activeTrips.length === 1 && activeTrips[0] ? activeTrips[0].id : selectedTripId;
    if (!finalTripId) {
        setError("Keine gültige Fahrt ausgewählt oder verfügbar. Bitte lade die Seite neu.");
        return;
    }

    setLoading(true); // Indicate submission is in progress
    setError(null);

    try {
      const response = await fetch('/api/bpa-public/submit-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mdbUserId: mdbDetails.id, // This is the MdB's Supabase UUID
          fahrtId: finalTripId,     // This is the Supabase UUID of the selected BPA_Fahrt
          startTime: formStartTime, // Send form start time for server-side validation
          formData: formData,       // Include honeypot fields for server validation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Fehler beim Senden der Anmeldung.');
      }

      setIsSubmitted(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist beim Senden der Anmeldung aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  // Get selected trip for date display
  const selectedTrip = activeTrips.find(trip => trip.id === selectedTripId) || (activeTrips.length === 1 ? activeTrips[0] : null);

  if (isSubmitted) {
    return (
      <div 
        className="px-4 py-16 min-h-screen text-white"
        style={{
          backgroundColor: 'hsl(0 100% 50%)',
          backgroundImage: `
            radial-gradient(circle at 20% 30%, hsl(326 100% 22%) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, hsl(326 100% 22%) 0%, transparent 60%),
            radial-gradient(circle at 60% 20%, hsl(326 100% 22%) 0%, transparent 45%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")
          `
        }}
      >
        <div className="container mx-auto max-w-2xl text-center">
          <Card className="bg-background/5 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-white/10">
            <CardContent className="pt-6">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Anmeldung erfolgreich gesendet!</h1>
                <p className="text-white/80">
                  Deine BPA-Fahrt-Anmeldung wurde erfolgreich an {mdbDetails?.name} gesendet. 
                  Du erhältst eine Bestätigung an die angegebene E-Mail-Adresse.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading && !mdbDetails) { // Show initial loading for MdB details
    return (
      <div 
        className="py-10 min-h-screen text-white"
        style={{
          backgroundColor: 'hsl(0 100% 50%)',
          backgroundImage: `
            radial-gradient(circle at 20% 30%, hsl(326 100% 22%) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, hsl(326 100% 22%) 0%, transparent 60%),
            radial-gradient(circle at 60% 20%, hsl(326 100% 22%) 0%, transparent 45%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")
          `
        }}
      >
        <div className="container mx-auto text-center pt-20">
          <h1 className="text-4xl font-bold">Lade Informationen für {decodeURIComponent(lastName)}...</h1>
        </div>
      </div>
    );
  }

  if (error && !mdbDetails) {
    return (
      <div 
        className="py-10 min-h-screen text-white"
        style={{
          backgroundColor: 'hsl(0 100% 50%)',
          backgroundImage: `
            radial-gradient(circle at 20% 30%, hsl(326 100% 22%) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, hsl(326 100% 22%) 0%, transparent 60%),
            radial-gradient(circle at 60% 20%, hsl(326 100% 22%) 0%, transparent 45%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")
          `
        }}
      >
        <div className="container mx-auto text-center">
          <Card className="bg-background/5 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-white/10 max-w-2xl mx-auto mt-20">
            <CardContent className="pt-6">
              <div className="text-center text-red-400">
                <AlertCircle className="w-16 h-16 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Fehler aufgetreten</h1>
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!mdbDetails) {
    return (
      <div 
        className="py-10 min-h-screen text-white"
        style={{
          backgroundColor: 'hsl(0 100% 50%)',
          backgroundImage: `
            radial-gradient(circle at 20% 30%, hsl(326 100% 22%) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, hsl(326 100% 22%) 0%, transparent 60%),
            radial-gradient(circle at 60% 20%, hsl(326 100% 22%) 0%, transparent 45%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")
          `
        }}
      >
        <div className="container mx-auto text-center">
          <Card className="bg-background/5 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-white/10 max-w-2xl mx-auto mt-20">
            <CardContent className="pt-6">
              <div className="text-center text-white">
                <MapPin className="w-16 h-16 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Nicht gefunden</h1>
                <p>Keine Informationen für den Abgeordneten "{decodeURIComponent(lastName)}" gefunden.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="px-4 py-8 min-h-screen text-white"
      style={{
        backgroundColor: 'hsl(0 100% 50%)',
        backgroundImage: `
          radial-gradient(circle at 20% 30%, hsl(326 100% 22%) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, hsl(326 100% 22%) 0%, transparent 60%),
          radial-gradient(circle at 60% 20%, hsl(326 100% 22%) 0%, transparent 45%),
          url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")
        `
      }}
    >
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-left text-6xl md:text-8xl font-black font-work-sans mb-2 text-white leading-none">
            BPA-Fahrt<br />
            nach Berlin<br />
            buchen!
          </h1>
          <p className="text-xl text-white/80 mt-4">
            Eine Einladung von <strong>{mdbDetails.name}</strong> (MdB, {mdbDetails.wahlkreis})
          </p>
        </div>

        {activeTrips.length === 0 && !loading && (
          <Card className="bg-background/5 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-white/10 mb-8">
            <CardContent className="pt-6">
              <Alert className="bg-yellow-500/10 backdrop-blur-xl border-yellow-500/20">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-100">
                  <strong className="font-bold">Keine Fahrten verfügbar:</strong>
                  <span className="block sm:inline"> Für {mdbDetails.name} sind aktuell keine BPA-Fahrten zur Anmeldung ausgeschrieben.</span>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {(activeTrips.length > 0 || loading) && (
          <Card className="bg-background/5 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-white/10">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white text-xl mb-0">
                    Besuch im Bundestag
                  </CardTitle>
                  {selectedTrip && (
                    <div className="text-white/80 text-lg font-medium">
                      {selectedTrip.startDate && selectedTrip.endDate ? (
                        <>{new Date(selectedTrip.startDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - {new Date(selectedTrip.endDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</>
                      ) : selectedTrip.startDate ? (
                        <>ab {new Date(selectedTrip.startDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</>
                      ) : selectedTrip.endDate ? (
                        <>bis {new Date(selectedTrip.endDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</>
                      ) : (
                        <>Fahrt nach Berlin</>
                      )}
                    </div>
                  )}
                </div>
                {selectedTrip && selectedTrip.anmeldefrist && (
                  <div className="text-right">
                    <div className="text-white text-xl mb-0">Anmeldefrist:</div>
                    <div className="text-white/80 text-lg font-medium">
                      {new Date(selectedTrip.anmeldefrist).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert className="bg-destructive/10 backdrop-blur-xl border-destructive/20">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">{error}</AlertDescription>
                  </Alert>
                )}

                {activeTrips.length > 1 && (
                  <div className="space-y-2">
                    <Label className="text-white">Verfügbare Fahrten</Label>
                    <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                      <SelectTrigger className="bg-background/10 backdrop-blur-xl border-white/20 text-white">
                        <SelectValue placeholder="Bitte eine Fahrt auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeTrips.map(trip => (
                          <SelectItem key={trip.id} value={trip.id}>{trip.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light font-work-sans text-white border-b border-white/20 pb-2">Persönliche Angaben</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center h-6">
                        <Label htmlFor="vorname" className="text-white">Vorname</Label>
                        <InfoPopover content="Vor- und Nachname sowie das Geburtsdatum werden ausschließlich an die jeweiligen Besucherdienste übermittelt. Die Polizei beim Deutschen Bundestag führt auf Grundlage des § 2 Absatz 6c der Hausordnung des Deutschen Bundestages eine Zuverlässigkeitsüberprüfung durch. Ihre Daten werden nach Beendigung des Besuches gelöscht." />
                      </div>
                      <Input 
                        type="text" 
                        name="vorname" 
                        id="vorname" 
                        value={formData.vorname} 
                        onChange={handleChange} 
                        required 
                        className="bg-background/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60" 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center h-6">
                        <Label htmlFor="nachname" className="text-white">Nachname</Label>
                      </div>
                      <Input 
                        type="text" 
                        name="nachname" 
                        id="nachname" 
                        value={formData.nachname} 
                        onChange={handleChange} 
                        required 
                        className="bg-background/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center h-6">
                        <Label htmlFor="geburtsdatum" className="text-white">Geburtsdatum</Label>
                        <InfoPopover content="Teilnehmer:innen müssen das 18. Lebensjahr vollendet haben." />
                      </div>
                      <Input 
                        type="text" 
                        name="geburtsdatum" 
                        id="geburtsdatum" 
                        placeholder="TT.MM.JJJJ"
                        value={formData.geburtsdatum} 
                        onChange={handleChange} 
                        required 
                        className="bg-background/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60" 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center h-6">
                        <Label htmlFor="email" className="text-white">E-Mail-Adresse</Label>
                      </div>
                      <Input 
                        type="email" 
                        name="email" 
                        id="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                        className="bg-background/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60" 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center h-6">
                        <Label htmlFor="telefon" className="text-white">Telefonnummer</Label>
                      </div>
                      <Input 
                        type="tel" 
                        name="telefon" 
                        id="telefon" 
                        value={formData.telefon} 
                        onChange={handleChange} 
                        required 
                        className="bg-background/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60" 
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light font-work-sans text-white border-b border-white/20 pb-2">Anschrift</h3>
                  <div className="space-y-2">
                    <Label htmlFor="anschrift" className="text-white">Straße, Hausnummer</Label>
                    <Input 
                      type="text" 
                      name="anschrift" 
                      id="anschrift" 
                      value={formData.anschrift} 
                      onChange={handleChange} 
                      required 
                      className="bg-background/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60" 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postleitzahl" className="text-white">Postleitzahl</Label>
                      <Input 
                        type="text" 
                        name="postleitzahl" 
                        id="postleitzahl" 
                        value={formData.postleitzahl} 
                        onChange={handleChange} 
                        required 
                        pattern="[0-9]{5}" 
                        title="Bitte gib eine 5-stellige Postleitzahl ein." 
                        className="bg-background/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ort" className="text-white">Ort</Label>
                      <Input 
                        type="text" 
                        name="ort" 
                        id="ort" 
                        value={formData.ort} 
                        onChange={handleChange} 
                        required 
                        className="bg-background/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60" 
                      />
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light font-work-sans text-white border-b border-white/20 pb-2">Fahrtdetails</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label htmlFor="zustieg" className="text-white">Zustiegspunkt</Label>
                        <InfoPopover content="Die Anreise erfolgt mit der Deutschen Bahn. Im Berliner Stadtgebiet steht der Reisegruppe ein eigener Bus zur Verfügung." />
                      </div>
                      <Select value={formData.zustieg} onValueChange={(value) => setFormData(prev => ({ ...prev, zustieg: value }))}>
                        <SelectTrigger className="bg-background/10 backdrop-blur-xl border-white/20 text-white">
                          <SelectValue placeholder="Bitte auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Osnabrück">Osnabrück</SelectItem>
                          <SelectItem value="Hannover">Hannover</SelectItem>
                          <SelectItem value="Berlin">Berlin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label htmlFor="essenspraeferenz" className="text-white">Essenspräferenz</Label>
                        <InfoPopover content="Die Reise- und Übernachtungskosten werden komplett übernommen, die Verpflegungskosten in begrenztem Umfang: Aus Einspargründen hat der Bundestag beschlossen, ab 2023 pro Fahrt nur noch die Kosten für drei Essen zu übernehmen. Das heißt, die Teilnehmer:innen müssen zwei Essen pro Fahrt selbst bezahlen." />
                      </div>
                      <Select value={formData.essenspraeferenz} onValueChange={(value) => setFormData(prev => ({ ...prev, essenspraeferenz: value }))}>
                        <SelectTrigger className="bg-background/10 backdrop-blur-xl border-white/20 text-white">
                          <SelectValue placeholder="Bitte auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alles">Alles</SelectItem>
                          <SelectItem value="Vegetarisch">Vegetarisch</SelectItem>
                          <SelectItem value="Vegan">Vegan</SelectItem>
                          <SelectItem value="Kosher">Kosher</SelectItem>
                          <SelectItem value="Halal">Halal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="parteimitglied" 
                        checked={formData.parteimitglied} 
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, parteimitglied: checked === true }))}
                        className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
                      />
                      <div className="flex items-center">
                        <Label htmlFor="parteimitglied" className="text-white">Ich bin Mitglied der Partei Die Linke</Label>
                        <InfoPopover content="Nur zu Informationszwecken; KEINE Bedingung." />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="einzelzimmer" 
                        checked={formData.einzelzimmer} 
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, einzelzimmer: checked === true }))}
                        className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
                      />
                      <div className="flex items-center">
                        <Label htmlFor="einzelzimmer" className="text-white">Einzelzimmer gewünscht</Label>
                        <InfoPopover content="Die Unterbringung erfolgt grundsätzlich in Doppelzimmern. Einzelzimmerwünsche können zwar berücksichtigt werden, hängen aber von der jeweiligen Kapazität des Hotels ab. Der Einzelzimmerzuschlag ist aus eigener Tasche zu leisten." />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="teilnahme5Jahre" 
                      checked={formData.teilnahme5Jahre} 
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, teilnahme5Jahre: checked === true }))}
                      className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                    <div className="flex items-center">
                      <Label htmlFor="teilnahme5Jahre" className="text-white">Ich habe in den letzten 5 Jahren an einer BPA-Fahrt teilgenommen</Label>
                      <InfoPopover content="Eine mehrmalige Teilnahme derselben Person innerhalb von 5 Jahren entspricht nicht den Richtlinien des BPA." />
                    </div>
                  </div>
                </div>

                {/* Honeypot fields - hidden from users but visible to bots */}
                <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                  <Input 
                    type="text" 
                    name="website" 
                    value={formData.website} 
                    onChange={handleChange} 
                    tabIndex={-1}
                    autoComplete="off"
                    placeholder="Leave this field empty"
                  />
                  <Input 
                    type="text" 
                    name="phone_number" 
                    value={formData.phone_number} 
                    onChange={handleChange} 
                    tabIndex={-1}
                    autoComplete="off"
                    placeholder="Leave this field empty"
                  />
                  <Input 
                    type="text" 
                    name="company" 
                    value={formData.company} 
                    onChange={handleChange} 
                    tabIndex={-1}
                    autoComplete="off"
                    placeholder="Leave this field empty"
                  />
                  <Input 
                    type="text" 
                    name="fax" 
                    value={formData.fax} 
                    onChange={handleChange} 
                    tabIndex={-1}
                    autoComplete="off"
                    placeholder="Leave this field empty"
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading || formData.teilnahme5Jahre}
                    className={`w-full font-semibold py-3 text-lg ${
                      formData.teilnahme5Jahre 
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                        : 'bg-white text-black hover:bg-white/90'
                    }`}
                  >
                    <Send className="mr-2 h-5 w-5" />
                    {loading ? 'Wird gesendet...' : 'Verbindlich anmelden'}
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-background/10 backdrop-blur-xl border border-white/20 rounded-lg">
                  <p className="text-xs text-white/80 leading-relaxed">
                    <strong>Datenschutzhinweis:</strong> Deine personenbezogenen Angaben werden ausschließlich im Zusammenhang mit den BPA-Fahrten genutzt.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <Card className="bg-background/5 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-white/10">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-sm text-white/80 mb-0">
                    <strong>Weitere Informationen</strong>
                  </p>
                  <a 
                    href="https://www.bundestag.de/besuche/fuehrung/besuchaufeinladungeinesabgeordneten"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/90 hover:text-white underline underline-offset-2 transition-colors"
                  >
                    Besuch auf Einladung eines Abgeordneten - Deutscher Bundestag
                  </a>
                </div>
                <img 
                  src="/images/btg.png" 
                  alt="Bundestag" 
                  className="w-12 h-12 object-contain"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 