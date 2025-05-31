"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLayout } from "@/components/page-layout";
import { Plus, Building2, MapPin, ExternalLink, Trash2, Edit, Clock, User, Phone, Mail, Users, HelpCircle, Calendar } from "lucide-react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Wahlkreisbuero, WahlkreisbueroOeffnungszeiten, WahlkreisbueroBeratungen } from '@/types/wahlkreisbuero';
import WahlkreisbueroForm from '@/components/wahlkreisbueros/WahlkreisbueroForm';
import OeffnungszeitenManager from '@/components/wahlkreisbueros/OeffnungszeitenManager';
import BeratungsManager from '@/components/wahlkreisbueros/BeratungsManager';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BERATUNG_TYPEN } from '@/types/wahlkreisbuero';

interface WahlkreisbueroWithDetails extends Omit<Wahlkreisbuero, 'oeffnungszeiten' | 'beratungen'> {
  oeffnungszeiten: WahlkreisbueroOeffnungszeiten[];
  beratungen: WahlkreisbueroBeratungen[];
}

const wochentagNamen = [
  'Montag',
  'Dienstag', 
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag'
];

function WahlkreisbueroCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Photo Skeleton */}
      <Skeleton className="h-48 w-full" />
      
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="px-3">
              {/* Title */}
              <Skeleton className="h-6 w-3/4 mb-3" />
              
              {/* Address Section */}
              <div className="mb-4">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </div>

              {/* Contact Information Grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Skeleton className="h-4 w-12 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div>
                  <Skeleton className="h-4 w-10 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 ml-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-6">
        {/* Opening Hours Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <div>
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WahlkreisbueroPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wahlkreisbueros, setWahlkreisbueros] = useState<WahlkreisbueroWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bueroToDelete, setBueroToDelete] = useState<WahlkreisbueroWithDetails | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push('/anmelden');
      return;
    }
    loadWahlkreisbueros();
  }, [status, router]);

  const loadWahlkreisbueros = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wahlkreisbueros');
      const result = await response.json();
      
      if (response.ok && result.data) {
        // Fetch additional details for each wahlkreisbuero
        const wahlkreisbuerosWithDetails = await Promise.all(
          result.data.map(async (buero: Wahlkreisbuero) => {
            try {
              // Fetch opening hours
              const hoursResponse = await fetch(`/api/wahlkreisbueros/${buero.id}/oeffnungszeiten`);
              const hoursData = hoursResponse.ok ? await hoursResponse.json() : { data: [] };
              
              // Fetch beratungen
              const beratungenResponse = await fetch(`/api/wahlkreisbueros/${buero.id}/beratungen`);
              const beratungenData = beratungenResponse.ok ? await beratungenResponse.json() : { data: [] };
              
              return {
                ...buero,
                oeffnungszeiten: Array.isArray(hoursData.data) ? hoursData.data : [],
                beratungen: Array.isArray(beratungenData.data) ? beratungenData.data : []
              };
            } catch (error) {
              console.warn('Error fetching details for buero:', buero.id, error);
              return {
                ...buero,
                oeffnungszeiten: [],
                beratungen: []
              };
            }
          })
        );
        
        setWahlkreisbueros(wahlkreisbuerosWithDetails);
      } else {
        console.error('Error loading wahlkreisbueros:', result.error);
        toast.error('Fehler beim Laden der Wahlkreisbüros');
      }
    } catch (error) {
      console.error('Error loading wahlkreisbueros:', error);
      toast.error('Fehler beim Laden der Wahlkreisbüros');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    loadWahlkreisbueros();
    setShowForm(false);
    setEditModalOpen(null);
  };

  const handleDeleteClick = (buero: WahlkreisbueroWithDetails) => {
    setBueroToDelete(buero);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bueroToDelete) return;

    try {
      const response = await fetch(`/api/wahlkreisbueros/${bueroToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Wahlkreisbüro gelöscht!');
        loadWahlkreisbueros();
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Error deleting wahlkreisbuero:', error);
      toast.error('Fehler beim Löschen des Wahlkreisbüros');
    } finally {
      setDeleteDialogOpen(false);
      setBueroToDelete(null);
    }
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return '--:--';
    return time.substring(0, 5); // Remove seconds from HH:MM:SS
  };

  const isOwner = (buero: WahlkreisbueroWithDetails) => session?.user?.id === buero.user_id;

  if (status === "loading" || loading) {
    return (
      <PageLayout 
        title="Wahlkreisbüros"
        description="Verwalte deine Wahlkreisbüros, Öffnungszeiten, Sprechstunden und Sozialberatungsangebote. Inhalte werden im Wahlkreisbürofinder der Fraktion öffentlich angezeigt."
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <WahlkreisbueroCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Wahlkreisbüros"
      description="Verwalte deine Wahlkreisbüros, Öffnungszeiten, Sprechstunden und Sozialberatungsangebote. Inhalte werden im Wahlkreisbürofinder der Fraktion öffentlich angezeigt. Personal wird zentral über den Bereich 'Mitarbeitende' verwaltet."
      headerActions={
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Büro hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-md bg-background/95 border-muted">
            <DialogHeader>
              <DialogTitle>Neues Wahlkreisbüro erstellen</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <WahlkreisbueroForm
                onSuccess={handleFormSuccess}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        {wahlkreisbueros.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Wahlkreisbüros vorhanden</h3>
              <p className="text-muted-foreground mb-4">
                Erstelle dein erstes Wahlkreisbüro, um loszulegen.
              </p>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Erstes Büro erstellen
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-md bg-background/95 border-muted">
                  <DialogHeader>
                    <DialogTitle>Neues Wahlkreisbüro erstellen</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <WahlkreisbueroForm
                      onSuccess={handleFormSuccess}
                      onCancel={() => setShowForm(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wahlkreisbueros.map((buero) => (
              <Card key={buero.id} className="overflow-hidden">
                {/* Office Photo with Overlay Badge */}
                {buero.photo_url ? (
                  <div className="relative h-48 w-full">
                    <img 
                      src={buero.photo_url} 
                      alt={buero.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge 
                        variant={buero.barrierefreiheit ? "default" : "destructive"} 
                        className={`backdrop-blur-sm ${buero.barrierefreiheit ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : 'bg-red-600 hover:bg-red-700 text-white border-red-600'}`}
                      >
                        <HelpCircle className="mr-1 h-3 w-3" />
                        {buero.barrierefreiheit ? 'Barrierefrei' : 'Nicht barrierefrei'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  // Default background when no image is available
                  <div className="relative h-48 w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-primary/20" />
                    <div className="absolute top-3 left-3">
                      <Badge 
                        variant={buero.barrierefreiheit ? "default" : "destructive"}
                        className={buero.barrierefreiheit ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : 'bg-red-600 hover:bg-red-700 text-white border-red-600'}
                      >
                        <HelpCircle className="mr-1 h-3 w-3" />
                        {buero.barrierefreiheit ? 'Barrierefrei' : 'Nicht barrierefrei'}
                      </Badge>
                    </div>
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="px-3">
                        <CardTitle className="text-xl mb-3">{buero.name}</CardTitle>
                        
                        {/* Horizontal Divider */}
                        <hr className="mb-3 border-muted" />
                        
                        {/* Address */}
                        <div>
                          <p className="font-medium">Adresse</p>
                          <p className="text-muted-foreground">
                            {buero.strasse} {buero.hausnummer}
                            <br />
                            {buero.plz} {buero.ort}
                          </p>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-1">
                          {buero.oeffnungszeiten.length > 0 && (
                            <Badge variant="secondary">
                              <Clock className="mr-1 h-3 w-3" />
                              {buero.oeffnungszeiten.length} Öffnungszeiten
                            </Badge>
                          )}
                          {buero.beratungen.length > 0 && (
                            <Badge variant="secondary">
                              <HelpCircle className="mr-1 h-3 w-3" />
                              {buero.beratungen.length} Beratungsangebote
                            </Badge>
                          )}
                          {buero.latitude && buero.longitude && (
                            <Badge variant="outline">
                              <MapPin className="mr-1 h-3 w-3" />
                              Koordinaten verfügbar
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 ml-4">
                      {isOwner(buero) && (
                        <Dialog 
                          open={editModalOpen === buero.id} 
                          onOpenChange={(open) => setEditModalOpen(open ? buero.id : null)}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto backdrop-blur-md bg-background/95 border-muted">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                {buero.name} bearbeiten
                              </DialogTitle>
                            </DialogHeader>

                            <Tabs defaultValue="basic" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic" className="gap-2">
                                  <Building2 className="h-4 w-4" />
                                  Grunddaten
                                </TabsTrigger>
                                <TabsTrigger value="hours" className="gap-2">
                                  <Clock className="h-4 w-4" />
                                  Öffnungszeiten
                                </TabsTrigger>
                                <TabsTrigger value="consultations" className="gap-2">
                                  <HelpCircle className="h-4 w-4" />
                                  Beratungen
                                </TabsTrigger>
                              </TabsList>

                              <TabsContent value="basic" className="mt-6 h-[500px] overflow-y-auto">
                                <Card>
                                  <CardContent className="pt-6">
                                    <WahlkreisbueroForm
                                      wahlkreisbuero={{
                                        id: buero.id,
                                        user_id: buero.user_id,
                                        name: buero.name,
                                        photo_url: buero.photo_url,
                                        strasse: buero.strasse,
                                        hausnummer: buero.hausnummer,
                                        plz: buero.plz,
                                        ort: buero.ort,
                                        barrierefreiheit: buero.barrierefreiheit,
                                        latitude: buero.latitude,
                                        longitude: buero.longitude,
                                        created_at: buero.created_at,
                                        updated_at: buero.updated_at
                                      }}
                                      onSuccess={handleFormSuccess}
                                      onCancel={() => setEditModalOpen(null)}
                                      compact={true}
                                    />
                                  </CardContent>
                                </Card>
                              </TabsContent>

                              <TabsContent value="hours" className="mt-6 h-[500px] overflow-y-auto">
                                <OeffnungszeitenManager 
                                  wahlkreisbueroId={buero.id} 
                                  wahlkreisbueroName={buero.name}
                                  compact={true}
                                />
                              </TabsContent>

                              <TabsContent value="consultations" className="mt-6 h-[500px] overflow-y-auto">
                                <BeratungsManager 
                                  wahlkreisbueroId={buero.id} 
                                  wahlkreisbueroName={buero.name}
                                  compact={true}
                                />
                              </TabsContent>
                            </Tabs>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(buero)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-6">
                  {/* Opening Hours Section */}
                  {buero.oeffnungszeiten.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">Öffnungszeiten</h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        {buero.oeffnungszeiten
                          .sort((a, b) => a.wochentag - b.wochentag)
                          .map((oeffnungszeit) => (
                          <div key={oeffnungszeit.id} className="flex items-center justify-between border rounded-lg p-3">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{wochentagNamen[oeffnungszeit.wochentag - 1]}</div>
                                {oeffnungszeit.geschlossen ? (
                                  <Badge variant="destructive" className="text-xs">
                                    Geschlossen
                                  </Badge>
                                ) : (
                                  <div className="text-sm text-muted-foreground">
                                    {formatTime(oeffnungszeit.von_zeit)} - {formatTime(oeffnungszeit.bis_zeit)} Uhr
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Staff Reference Note */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm">Personal</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Mitarbeitende werden zentral über den Bereich{' '}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm text-primary underline"
                        onClick={() => router.push('/mitarbeitende')}
                      >
                        'Mitarbeitende'
                      </Button>
                      {' '}verwaltet und können dort Wahlkreisbüros als Einsatzort zugeordnet werden.
                    </p>
                  </div>

                  {/* Empty State Messages */}
                  {buero.oeffnungszeiten.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Noch keine Öffnungszeiten hinzugefügt</p>
                      {isOwner(buero) && (
                        <p className="text-xs mt-1">Klicke auf "Bearbeiten" um Details hinzuzufügen</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wahlkreisbüro löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du das Wahlkreisbüro "{bueroToDelete?.name}" löschen möchtest?
              Diese Aktion kann nicht rückgängig gemacht werden und löscht auch alle zugehörigen Öffnungszeiten und Beratungsangebote.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
} 