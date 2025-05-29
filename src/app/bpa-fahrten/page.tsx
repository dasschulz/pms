"use client";

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { PlusCircle, Edit, Trash2, Eye, AlertTriangle, CalendarIcon, HelpCircle, Code, Copy, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BpaFahrt {
  id: string;
  fahrtDatumVon?: Date;
  fahrtDatumBis?: Date;
  zielort?: string;
  hotelName?: string;
  hotelAdresse?: string;
  kontingentMax?: number;
  aktuelleAnmeldungen?: number;
  bestaetigteAnmeldungen?: number;
  statusFahrt?: string;
  anmeldefrist?: Date;
  beschreibung?: string;
  zustaiegsorteConfig?: string;
  aktiv?: boolean;
}

const initialFahrtData: Partial<BpaFahrt> = {
  zielort: 'Berlin',
  statusFahrt: 'Planung',
  kontingentMax: 50,
  aktiv: true,
  beschreibung: '',
  hotelName: '',
  hotelAdresse: '',
  zustaiegsorteConfig: 'Hauptbahnhof Wahlkreisstadt, Berlin Hbf',
};

function BpaFahrtenCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 3 }, (_, index) => (
        <Card key={index} className="w-full">
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-32" />
            </CardTitle>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div>
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="flex justify-between pt-2">
              <Skeleton className="h-8 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InfoPopover({ content }: { content: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help ml-1" />
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <p className="text-sm text-muted-foreground">{content}</p>
      </PopoverContent>
    </Popover>
  );
}

export default function BpaFahrtenPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [fahrten, setFahrten] = useState<BpaFahrt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFahrtData, setNewFahrtData] = useState<Partial<BpaFahrt>>(initialFahrtData);
  const [isIframeCardOpen, setIsIframeCardOpen] = useState(false);
  const [isLinkCardOpen, setIsLinkCardOpen] = useState(false);

  // State for Edit Dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFahrtData, setEditingFahrtData] = useState<Partial<BpaFahrt> | null>(null);
  const [currentEditingFahrtId, setCurrentEditingFahrtId] = useState<string | null>(null);

  // Get user's last name for iframe code
  const userLastName = session?.user?.name?.split(' ').pop() || 'mustermann';

  const fetchFahrten = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bpa-fahrten');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Fehler beim Laden der Fahrten (${response.status})`);
      }
      const data = await response.json();
      
      // Convert string dates to Date objects
      const processedFahrten = (data.fahrten || []).map((fahrt: any) => ({
        ...fahrt,
        fahrtDatumVon: fahrt.fahrtDatumVon ? new Date(fahrt.fahrtDatumVon) : undefined,
        fahrtDatumBis: fahrt.fahrtDatumBis ? new Date(fahrt.fahrtDatumBis) : undefined,
        anmeldefrist: fahrt.anmeldefrist ? new Date(fahrt.anmeldefrist) : undefined,
      }));
      
      setFahrten(processedFahrten);
    } catch (error) {
      console.error('Error fetching BPA trips:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden der Fahrten';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFahrten();
  }, [fetchFahrten]);

  const handleCreateInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean | Date | undefined = value;

    if (type === 'checkbox') {
        processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
        processedValue = value === '' ? '' : parseInt(value, 10);
        if (value !== '' && isNaN(processedValue as number)) {
            processedValue = newFahrtData[name as keyof BpaFahrt] || '';
        }
    } else if (type === 'date') {
        processedValue = value ? new Date(value) : undefined;
    }
    
    setNewFahrtData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleCreateSelectChange = (name: keyof BpaFahrt, value: string) => {
    setNewFahrtData(prev => ({
        ...prev,
        [name]: value,
    }));
  };
  
 const handleCreateSwitchChange = (name: keyof BpaFahrt, checked: boolean) => {
    setNewFahrtData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleCreateFahrt = async () => {
    if (!newFahrtData.fahrtDatumVon || !newFahrtData.zielort || newFahrtData.kontingentMax === undefined || newFahrtData.kontingentMax === null) {
      toast.error("Bitte fülle alle Pflichtfelder aus: 'Fahrt Datum Von', 'Zielort' und 'Max. Kontingent'.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      // Convert Date objects to ISO strings for API
      const apiData = {
        ...newFahrtData,
        fahrtDatumVon: newFahrtData.fahrtDatumVon?.toISOString().split('T')[0],
        fahrtDatumBis: newFahrtData.fahrtDatumBis?.toISOString().split('T')[0],
        anmeldefrist: newFahrtData.anmeldefrist?.toISOString().split('T')[0],
        kontingentMax: Number(newFahrtData.kontingentMax)
      };
      const response = await fetch('/api/bpa-fahrten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Fehler beim Erstellen der Fahrt (${response.status})`);
      }
      await response.json(); 
      toast.success("BPA-Fahrt erfolgreich erstellt!");
      setIsCreateDialogOpen(false);
      // Add small delay to ensure Supabase has processed the new record
      setTimeout(() => {
        fetchFahrten(); 
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Erstellen der Fahrt.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateDialog = () => {
    setNewFahrtData(initialFahrtData);
    setError(null);
    setIsCreateDialogOpen(true);
  }

  // Functions for Edit Dialog
  const openEditDialog = (fahrt: BpaFahrt) => {
    setCurrentEditingFahrtId(fahrt.id);
    // Ensure all fields present in BpaFahrt are included, falling back to initial/empty if not present on fahrt object
    setEditingFahrtData({
      ...initialFahrtData, // Provide defaults for all fields
      ...fahrt, // Override with actual fahrt data
    });
    setError(null); // Clear previous errors
    setIsEditDialogOpen(true);
  };

  const handleEditInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean | Date | undefined = value;
    if (type === 'checkbox') {
        processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
        processedValue = value === '' ? '' : parseInt(value, 10);
        if (value !== '' && isNaN(processedValue as number)) {
            processedValue = editingFahrtData?.[name as keyof BpaFahrt] || '';
        }
    } else if (type === 'date') {
        processedValue = value ? new Date(value) : undefined;
    }
    setEditingFahrtData(prev => prev ? { ...prev, [name]: processedValue } : null);
  };

  const handleEditSelectChange = (name: keyof BpaFahrt, value: string) => {
    setEditingFahrtData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleEditSwitchChange = (name: keyof BpaFahrt, checked: boolean) => {
    setEditingFahrtData(prev => prev ? { ...prev, [name]: checked } : null);
  };

  const handleUpdateFahrt = async () => {
    if (!currentEditingFahrtId || !editingFahrtData) {
      toast.error("Keine Fahrt zum Bearbeiten ausgewählt oder Daten fehlen.");
      return;
    }
    if (!editingFahrtData.fahrtDatumVon || !editingFahrtData.zielort || editingFahrtData.kontingentMax === undefined || editingFahrtData.kontingentMax === null) {
      toast.error("Bitte fülle alle Pflichtfelder aus: 'Datum Von', 'Zielort' und 'Kontingent'.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      // Convert Date objects to ISO strings for API
      const apiData = {
        ...editingFahrtData,
        fahrtDatumVon: editingFahrtData.fahrtDatumVon?.toISOString().split('T')[0],
        fahrtDatumBis: editingFahrtData.fahrtDatumBis?.toISOString().split('T')[0],
        anmeldefrist: editingFahrtData.anmeldefrist?.toISOString().split('T')[0],
        kontingentMax: Number(editingFahrtData.kontingentMax)
      };
      const response = await fetch(`/api/bpa-fahrten/${currentEditingFahrtId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Fehler beim Aktualisieren der Fahrt (${response.status})`);
      }
      await response.json();
      toast.success("BPA-Fahrt erfolgreich aktualisiert!");
      setIsEditDialogOpen(false);
      setEditingFahrtData(null);
      setCurrentEditingFahrtId(null);
      // Add small delay to ensure Supabase has processed the updated record
      setTimeout(() => {
        fetchFahrten();
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Fahrt.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = (fahrtId: string) => {
    router.push(`/bpa-fahrten/${fahrtId}`);
  };

  if (isLoading && fahrten.length === 0 && !error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">BPA-Fahrten</h1>
          <Skeleton className="h-10 w-40" />
        </div>
        <BpaFahrtenCardsSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">BPA-Fahrten</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <PlusCircle className="mr-2 h-5 w-5" /> Neue Fahrt anlegen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Neue BPA-Fahrt anlegen</DialogTitle>
              <DialogDescription>
                Fülle die Details für die neue BPA-Fahrt aus. Mit * markierte Felder sind Pflichtfelder.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label>Datum Von*</Label>
                  <InfoPopover content="Startdatum der BPA-Fahrt. In Sitzungswochen ist der Besuch einer Plenardebatte, in der sitzungsfreien Zeit ein Vortrag im Plenarsaal über die Aufgaben und Funktionen des Parlaments sowie ein Museums- oder Ministerienbesuch vorgesehen." />
                </div>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newFahrtData.fahrtDatumVon && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newFahrtData.fahrtDatumVon ? (
                          format(newFahrtData.fahrtDatumVon, "PPP", { locale: de })
                        ) : (
                          <span>Datum auswählen</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newFahrtData.fahrtDatumVon || undefined}
                        onSelect={(date) => setNewFahrtData(prev => ({ ...prev, fahrtDatumVon: date || undefined }))}
                        locale={de}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label>Datum Bis</Label>
                  <InfoPopover content="Enddatum der BPA-Fahrt. Falls mehrtägig, wird ein kostenloses Mittagessen im Besucherrestaurant des Bundestags angeboten." />
                </div>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newFahrtData.fahrtDatumBis && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newFahrtData.fahrtDatumBis ? (
                          format(newFahrtData.fahrtDatumBis, "PPP", { locale: de })
                        ) : (
                          <span>Datum auswählen</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newFahrtData.fahrtDatumBis || undefined}
                        onSelect={(date) => setNewFahrtData(prev => ({ ...prev, fahrtDatumBis: date || undefined }))}
                        locale={de}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="zielort">Zielort*</Label>
                  <InfoPopover content="Zielort der BPA-Fahrt. Teilnehmer erhalten einen Fahrtkostenzuschuss. Wenn terminlich möglich, wird ein Treffen mit dem Abgeordneten organisiert." />
                </div>
                <Input id="zielort" name="zielort" value={newFahrtData.zielort || ''} onChange={handleCreateInputChange} required className="col-span-3" />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="hotelName">Hotel Name</Label>
                  <InfoPopover content="Name des Hotels für die Unterkunft der Teilnehmer. Das Hotel erhält nur Vor- und Nachnamen für die Reservierung." />
                </div>
                <Input id="hotelName" name="hotelName" value={newFahrtData.hotelName || ''} onChange={handleCreateInputChange} className="col-span-3" />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="hotelAdresse">Hotel Adresse</Label>
                  <InfoPopover content="Vollständige Adresse des Hotels für die Navigation und Kommunikation mit den Teilnehmern." />
                </div>
                <Textarea id="hotelAdresse" name="hotelAdresse" value={newFahrtData.hotelAdresse || ''} onChange={handleCreateInputChange} className="col-span-3" placeholder="Vollständige Adresse des Hotels..."/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="kontingentMax">Kontingent*</Label>
                  <InfoPopover content="Maximale Anzahl der Teilnehmer für diese Fahrt. Teilnehmer müssen in der Regel das 18. Lebensjahr vollendet haben und es muss sich um 'politisch Interessierte' aus dem Wahlkreis handeln." />
                </div>
                <Input type="number" id="kontingentMax" name="kontingentMax" value={newFahrtData.kontingentMax === undefined ? '' : newFahrtData.kontingentMax} onChange={handleCreateInputChange} required className="col-span-3" placeholder="z.B. 50"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="statusFahrt">Status*</Label>
                  <InfoPopover content="Aktueller Status der Fahrt. Bestimmt, ob Anmeldungen möglich sind und wie die Fahrt für Teilnehmer angezeigt wird." />
                </div>
                <Select name="statusFahrt" value={newFahrtData.statusFahrt || 'Planung'} onValueChange={(value) => handleCreateSelectChange('statusFahrt', value)} >
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Status auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Planung">Planung</SelectItem>
                        <SelectItem value="Anmeldung offen">Anmeldung offen</SelectItem>
                        <SelectItem value="Anmeldung geschlossen">Anmeldung geschlossen</SelectItem>
                        <SelectItem value="Fahrt läuft">Fahrt läuft</SelectItem>
                        <SelectItem value="Abgeschlossen">Abgeschlossen</SelectItem>
                        <SelectItem value="Storniert">Storniert</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label>Anmeldefrist</Label>
                  <InfoPopover content="Letzter Tag für Anmeldungen. Eine mehrmalige Teilnahme derselben Person innerhalb von 5 Jahren entspricht nicht den Richtlinien des BPA." />
                </div>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newFahrtData.anmeldefrist && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newFahrtData.anmeldefrist ? (
                          format(newFahrtData.anmeldefrist, "PPP", { locale: de })
                        ) : (
                          <span>Datum auswählen</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newFahrtData.anmeldefrist || undefined}
                        onSelect={(date) => setNewFahrtData(prev => ({ ...prev, anmeldefrist: date || undefined }))}
                        locale={de}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="beschreibung">Beschreibung</Label>
                  <InfoPopover content="Zusätzliche Informationen zur Fahrt. Teilnehmer können deutsche Staatsangehörige und ausländische Teilnehmer aus den EU-Staaten sein." />
                </div>
                <Textarea id="beschreibung" name="beschreibung" value={newFahrtData.beschreibung || ''} onChange={handleCreateInputChange} rows={3} className="col-span-3" placeholder="Optionale Beschreibung der Fahrt..."/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="zustaiegsorteConfig">Zustiegsorte</Label>
                  <InfoPopover content="Kommagetrennte Liste der Zustiegsorte für die Anreise. Hilft Teilnehmern bei der Planung der Anreise zum Treffpunkt." />
                </div>
                <Input id="zustaiegsorteConfig" name="zustaiegsorteConfig" value={newFahrtData.zustaiegsorteConfig || ''} onChange={handleCreateInputChange} className="col-span-3" placeholder="z.B. kommasepariert"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="aktiv">Formular Aktiv</Label>
                  <InfoPopover content="Bestimmt, ob das Anmeldeformular für Teilnehmer verfügbar ist. Personenbezogene Angaben werden ausschließlich im Zusammenhang mit den BPA-Fahrten genutzt und nach der Fahrt gelöscht." />
                </div>
                 <div className="col-span-3 flex items-center">
                    <Switch id="aktiv" name="aktiv" checked={newFahrtData.aktiv === true} onCheckedChange={(checked) => handleCreateSwitchChange('aktiv', checked)} />
                 </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button variant="outline" disabled={isSubmitting}>Abbrechen</Button>
              </DialogClose>
              <Button onClick={handleCreateFahrt} disabled={isSubmitting}>
                {isSubmitting ? 'Wird erstellt...' : 'Fahrt erstellen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && !isCreateDialogOpen && !isEditDialogOpen && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && fahrten.length === 0 && !error && (
        <div className="my-8">
          <BpaFahrtenCardsSkeleton />
        </div>
      )}
      
      {!isLoading && fahrten.length === 0 && !error && (
        <p className="text-center my-4">Du hast noch keine BPA-Fahrten angelegt. Klick oben rechts auf "Neue Fahrt anlegen", um zu starten.</p>
      )}

      {fahrten.length > 0 && (
        <div className={cn(
          "grid gap-6",
          fahrten.length === 1 ? "grid-cols-1 md:grid-cols-2" : 
          fahrten.length === 2 ? "grid-cols-1 md:grid-cols-2" :
          "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
        )}>
          {fahrten.map((fahrt) => (
            <Card key={fahrt.id} className="w-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl font-semibold">{fahrt.zielort}</span>
                  <div className="flex gap-2">
                    <Badge variant={fahrt.statusFahrt === 'Anmeldung offen' || fahrt.statusFahrt === 'Fahrt läuft' ? 'default' : fahrt.statusFahrt === 'Storniert' ? 'destructive' : 'outline'}>
                      {fahrt.statusFahrt}
                    </Badge>
                    <Badge variant={fahrt.aktiv ? 'default' : 'outline'}>
                      {fahrt.aktiv ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {fahrt.fahrtDatumVon && fahrt.fahrtDatumBis ? (
                    fahrt.fahrtDatumVon.toDateString() === fahrt.fahrtDatumBis.toDateString() ? 
                    format(fahrt.fahrtDatumVon, 'dd.MM.yyyy') :
                    `${format(fahrt.fahrtDatumVon, 'dd.MM.yyyy')} - ${format(fahrt.fahrtDatumBis, 'dd.MM.yyyy')}`
                  ) : fahrt.fahrtDatumVon ? (
                    format(fahrt.fahrtDatumVon, 'dd.MM.yyyy')
                  ) : (
                    'Datum nicht festgelegt'
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Kontingent</p>
                    <p className="text-lg font-semibold">{fahrt.kontingentMax || '-'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Anmeldungen</p>
                    <p className="text-lg font-semibold">
                      {fahrt.aktuelleAnmeldungen ?? 0} / {fahrt.bestaetigteAnmeldungen ?? 0}
                      <span className="text-xs text-muted-foreground ml-1">(akt./best.)</span>
                    </p>
                  </div>
                </div>

                {fahrt.anmeldefrist && (
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">Anmeldefrist</p>
                    <p className="text-sm">{format(fahrt.anmeldefrist, 'dd.MM.yyyy')}</p>
                  </div>
                )}

                {fahrt.hotelName && (
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">Hotel</p>
                    <p className="text-sm">{fahrt.hotelName}</p>
                    {fahrt.hotelAdresse && (
                      <p className="text-xs text-muted-foreground">{fahrt.hotelAdresse}</p>
                    )}
                  </div>
                )}

                {fahrt.beschreibung && (
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">Beschreibung</p>
                    <p className="text-sm text-muted-foreground">{fahrt.beschreibung}</p>
                  </div>
                )}

                {fahrt.zustaiegsorteConfig && (
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">Zustiegsorte</p>
                    <p className="text-sm text-muted-foreground">{fahrt.zustaiegsorteConfig}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewDetails(fahrt.id)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEditDialog(fahrt)} 
                      title="Fahrt bearbeiten"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Fahrt Dialog */}
      {editingFahrtData && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>BPA-Fahrt bearbeiten</DialogTitle>
              <DialogDescription>
                Aktualisiere die Details für die BPA-Fahrt "{editingFahrtData.zielort} - {editingFahrtData.fahrtDatumVon ? format(editingFahrtData.fahrtDatumVon, 'dd.MM.yyyy') : ''}".
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Date From */}
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label>Datum Von*</Label>
                  <InfoPopover content="Startdatum der BPA-Fahrt. In Sitzungswochen ist der Besuch einer Plenardebatte, in der sitzungsfreien Zeit ein Vortrag im Plenarsaal über die Aufgaben und Funktionen des Parlaments sowie ein Museums- oder Ministerienbesuch vorgesehen." />
                </div>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editingFahrtData.fahrtDatumVon && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingFahrtData.fahrtDatumVon ? (
                          format(editingFahrtData.fahrtDatumVon, "PPP", { locale: de })
                        ) : (
                          <span>Datum auswählen</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editingFahrtData.fahrtDatumVon || undefined}
                        onSelect={(date) => setEditingFahrtData(prev => prev ? { ...prev, fahrtDatumVon: date || undefined } : null)}
                        locale={de}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {/* Date To */}
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label>Datum Bis</Label>
                  <InfoPopover content="Enddatum der BPA-Fahrt. Falls mehrtägig, wird ein kostenloses Mittagessen im Besucherrestaurant des Bundestags angeboten." />
                </div>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editingFahrtData.fahrtDatumBis && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingFahrtData.fahrtDatumBis ? (
                          format(editingFahrtData.fahrtDatumBis, "PPP", { locale: de })
                        ) : (
                          <span>Datum auswählen</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editingFahrtData.fahrtDatumBis || undefined}
                        onSelect={(date) => setEditingFahrtData(prev => prev ? { ...prev, fahrtDatumBis: date || undefined } : null)}
                        locale={de}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {/* Zielort */}
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="editZielort">Zielort*</Label>
                  <InfoPopover content="Zielort der BPA-Fahrt. Teilnehmer erhalten einen Fahrtkostenzuschuss. Wenn terminlich möglich, wird ein Treffen mit dem Abgeordneten organisiert." />
                </div>
                <Input id="editZielort" name="zielort" value={editingFahrtData.zielort || ''} onChange={handleEditInputChange} required className="col-span-3" />
              </div>
              {/* Hotel Name */}
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="editHotelName">Hotel Name</Label>
                  <InfoPopover content="Name des Hotels für die Unterkunft der Teilnehmer. Das Hotel erhält nur Vor- und Nachnamen für die Reservierung." />
                </div>
                <Input id="editHotelName" name="hotelName" value={editingFahrtData.hotelName || ''} onChange={handleEditInputChange} className="col-span-3" />
              </div>
              {/* Hotel Adresse */}
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="editHotelAdresse">Hotel Adresse</Label>
                  <InfoPopover content="Vollständige Adresse des Hotels für die Navigation und Kommunikation mit den Teilnehmern." />
                </div>
                <Textarea id="editHotelAdresse" name="hotelAdresse" value={editingFahrtData.hotelAdresse || ''} onChange={handleEditInputChange} className="col-span-3" />
              </div>
              {/* Kontingent Max */}
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="editKontingentMax">Kontingent*</Label>
                  <InfoPopover content="Maximale Anzahl der Teilnehmer für diese Fahrt. Teilnehmer müssen in der Regel das 18. Lebensjahr vollendet haben und es muss sich um 'politisch Interessierte' aus dem Wahlkreis handeln." />
                </div>
                <Input type="number" id="editKontingentMax" name="kontingentMax" value={editingFahrtData.kontingentMax === undefined ? '' : editingFahrtData.kontingentMax} onChange={handleEditInputChange} required className="col-span-3" />
              </div>
              {/* Status Fahrt */}
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="editStatusFahrt">Status*</Label>
                  <InfoPopover content="Aktueller Status der Fahrt. Bestimmt, ob Anmeldungen möglich sind und wie die Fahrt für Teilnehmer angezeigt wird." />
                </div>
                <Select name="statusFahrt" value={editingFahrtData.statusFahrt || 'Planung'} onValueChange={(value) => handleEditSelectChange('statusFahrt', value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Status auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planung">Planung</SelectItem>
                    <SelectItem value="Anmeldung offen">Anmeldung offen</SelectItem>
                    <SelectItem value="Anmeldung geschlossen">Anmeldung geschlossen</SelectItem>
                    <SelectItem value="Fahrt läuft">Fahrt läuft</SelectItem>
                    <SelectItem value="Abgeschlossen">Abgeschlossen</SelectItem>
                    <SelectItem value="Storniert">Storniert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Anmeldefrist */}
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label>Anmeldefrist</Label>
                  <InfoPopover content="Letzter Tag für Anmeldungen. Eine mehrmalige Teilnahme derselben Person innerhalb von 5 Jahren entspricht nicht den Richtlinien des BPA." />
                </div>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editingFahrtData.anmeldefrist && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingFahrtData.anmeldefrist ? (
                          format(editingFahrtData.anmeldefrist, "PPP", { locale: de })
                        ) : (
                          <span>Datum auswählen</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editingFahrtData.anmeldefrist || undefined}
                        onSelect={(date) => setEditingFahrtData(prev => prev ? { ...prev, anmeldefrist: date || undefined } : null)}
                        locale={de}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {/* Beschreibung */}
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="editBeschreibung">Beschreibung</Label>
                  <InfoPopover content="Zusätzliche Informationen zur Fahrt. Teilnehmer können deutsche Staatsangehörige und ausländische Teilnehmer aus den EU-Staaten sein." />
                </div>
                <Textarea id="editBeschreibung" name="beschreibung" value={editingFahrtData.beschreibung || ''} onChange={handleEditInputChange} rows={3} className="col-span-3" />
              </div>
              {/* Zustiegsorte Config */}
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="editZustiegsorteConfig">Zustiegsorte</Label>
                  <InfoPopover content="Kommagetrennte Liste der Zustiegsorte für die Anreise. Hilft Teilnehmern bei der Planung der Anreise zum Treffpunkt." />
                </div>
                <Input id="editZustiegsorteConfig" name="zustaiegsorteConfig" value={editingFahrtData.zustaiegsorteConfig || ''} onChange={handleEditInputChange} className="col-span-3" />
              </div>
              {/* Aktiv Switch */}
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end">
                  <Label htmlFor="editAktiv">Formular Aktiv</Label>
                  <InfoPopover content="Bestimmt, ob das Anmeldeformular für Teilnehmer verfügbar ist. Personenbezogene Angaben werden ausschließlich im Zusammenhang mit den BPA-Fahrten genutzt und nach der Fahrt gelöscht." />
                </div>
                <div className="col-span-3 flex items-center">
                  <Switch id="editAktiv" name="aktiv" checked={editingFahrtData.aktiv === true} onCheckedChange={(checked) => handleEditSwitchChange('aktiv', checked)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isSubmitting} onClick={() => { setIsEditDialogOpen(false); setEditingFahrtData(null); setCurrentEditingFahrtId(null); } }>Abbrechen</Button>
              </DialogClose>
              <Button onClick={handleUpdateFahrt} disabled={isSubmitting}>
                {isSubmitting ? 'Wird gespeichert...' : 'Änderungen speichern'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="mt-8 flex justify-start gap-4">
        <div className="w-1/4">
          <Card className="bg-muted/50">
            <Collapsible open={isLinkCardOpen} onOpenChange={setIsLinkCardOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/70 transition-colors py-3 px-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-sm font-medium">Link zur Anmeldung</span>
                    </div>
                    {isLinkCardOpen ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3 pt-0 px-4 pb-4">
                  <p className="text-xs text-muted-foreground/80">
                    Hier ist der Link, mit dem sich Bürger:innen anmelden können.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="direct-link" className="text-xs font-medium">Direkter Link:</Label>
                    <div className="relative">
                      <code className="block p-2 bg-muted rounded-md text-xs overflow-x-auto">
                        {`${typeof window !== 'undefined' ? window.location.origin : ''}/bpa/${encodeURIComponent(userLastName)}`}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => {
                          const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/bpa/${encodeURIComponent(userLastName)}`;
                          navigator.clipboard.writeText(link);
                          toast.success("Link kopiert!");
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>
        <div className="w-1/4">
          <Card className="bg-muted/50">
            <Collapsible open={isIframeCardOpen} onOpenChange={setIsIframeCardOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/70 transition-colors py-3 px-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      <span className="text-sm font-medium">iFrame-Einbettung für Websites</span>
                    </div>
                    {isIframeCardOpen ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3 pt-0 px-4 pb-4">
                  <p className="text-xs text-muted-foreground/80">
                    Du kannst das BPA-Anmeldeformular in deine Website einbetten. 
                    Besucher können sich direkt von deiner Seite aus anmelden.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="iframe-code" className="text-xs font-medium">iFrame-Code:</Label>
                    <div className="relative">
                      <code className="block p-2 bg-muted rounded-md text-xs overflow-x-auto">
                        {`<iframe 
    src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/bpa-public/embed?lastName=${encodeURIComponent(userLastName)}" 
    width="100%" 
    height="400" 
    frameborder="0" 
    style="border: 1px solid #e2e8f0; border-radius: 8px;">
  </iframe>`}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => {
                          const code = `<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/bpa-public/embed?lastName=${encodeURIComponent(userLastName)}" width="100%" height="400" frameborder="0" style="border: 1px solid #e2e8f0; border-radius: 8px;"></iframe>`;
                          navigator.clipboard.writeText(code);
                          toast.success("iFrame-Code kopiert!");
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>
      </div>
    </div>
  );
} 