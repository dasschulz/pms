"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLayout } from "@/components/page-layout";
import { Plus, User, MapPin, Phone, Mail, Calendar, Building2, Filter, Search, Edit, Trash2, Eye } from "lucide-react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import MitarbeiterForm from '../../components/mitarbeitende/MitarbeiterForm';
import MitarbeiterDetails from '../../components/mitarbeitende/MitarbeiterDetails';

export interface AbgeordnetenMitarbeiter {
  id: string;
  name: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  geburtsdatum: string;
  email: string;
  bueronummer?: string;
  mobilnummer?: string;
  profilbild_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MitarbeiterZuordnung {
  id: string;
  mitarbeiter_id: string;
  mdb_user_id: string;
  eingruppierung: 'Bürokraft' | 'Sekretär:in' | 'Sachbearbeiter:in' | 'Wissenschaftliche:r Mitarbeiter:in';
  zustaendigkeit: string;
  einstellungsdatum: string;
  befristung_bis?: string;
  einsatzort: string;
  created_at: string;
  updated_at: string;
}

export interface MitarbeiterVollstaendig extends AbgeordnetenMitarbeiter {
  zuordnungen: (MitarbeiterZuordnung & {
    mdb_name: string;
  })[];
}

function MitarbeiterCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div>
            <Skeleton className="h-4 w-12 mb-1" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

const eingruppierungColors = {
  'Bürokraft': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Sekretär:in': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', 
  'Sachbearbeiter:in': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'Wissenschaftliche:r Mitarbeiter:in': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
};

export default function MitarbeitendePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [mitarbeiter, setMitarbeiter] = useState<MitarbeiterVollstaendig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMitarbeiter, setEditingMitarbeiter] = useState<MitarbeiterVollstaendig | null>(null);
  const [viewingMitarbeiter, setViewingMitarbeiter] = useState<MitarbeiterVollstaendig | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mitarbeiterToDelete, setMitarbeiterToDelete] = useState<MitarbeiterVollstaendig | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEingruppierung, setFilterEingruppierung] = useState("all");
  const [filterEinsatzort, setFilterEinsatzort] = useState("all");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push('/anmelden');
      return;
    }
    loadMitarbeiter();
  }, [status, router]);

  const loadMitarbeiter = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mitarbeitende');
      const result = await response.json();
      
      if (response.ok && result.data) {
        setMitarbeiter(result.data);
      } else {
        console.error('Error loading mitarbeiter:', result.error);
        toast.error('Fehler beim Laden der Mitarbeitenden');
      }
    } catch (error) {
      console.error('Error loading mitarbeiter:', error);
      toast.error('Fehler beim Laden der Mitarbeitenden');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (mitarbeiter: MitarbeiterVollstaendig) => {
    setMitarbeiterToDelete(mitarbeiter);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!mitarbeiterToDelete) return;

    try {
      const response = await fetch(`/api/mitarbeitende/${mitarbeiterToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Mitarbeiter erfolgreich gelöscht');
        await loadMitarbeiter();
      } else {
        const result = await response.json();
        toast.error(result.error || 'Fehler beim Löschen des Mitarbeiters');
      }
    } catch (error) {
      console.error('Error deleting mitarbeiter:', error);
      toast.error('Fehler beim Löschen des Mitarbeiters');
    } finally {
      setDeleteDialogOpen(false);
      setMitarbeiterToDelete(null);
    }
  };

  const handleEditClick = (mitarbeiter: MitarbeiterVollstaendig) => {
    setEditingMitarbeiter(mitarbeiter);
    setShowForm(true);
  };

  const handleViewClick = (mitarbeiter: MitarbeiterVollstaendig) => {
    setViewingMitarbeiter(mitarbeiter);
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingMitarbeiter(null);
    await loadMitarbeiter();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingMitarbeiter(null);
  };

  // Filter logic
  const filteredMitarbeiter = mitarbeiter.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEingruppierung = filterEingruppierung === "all" || 
                                 m.zuordnungen.some((z: MitarbeiterZuordnung & { mdb_name: string }) => z.eingruppierung === filterEingruppierung);
    
    const matchesEinsatzort = filterEinsatzort === "all" || 
                             m.zuordnungen.some((z: MitarbeiterZuordnung & { mdb_name: string }) => z.einsatzort === filterEinsatzort);

    return matchesSearch && matchesEingruppierung && matchesEinsatzort;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getEinsatzorte = () => {
    const einsatzorte = new Set<string>();
    mitarbeiter.forEach(m => {
      m.zuordnungen.forEach((z: MitarbeiterZuordnung & { mdb_name: string }) => {
        einsatzorte.add(z.einsatzort);
      });
    });
    return Array.from(einsatzorte);
  };

  return (
    <PageLayout 
      title="Mitarbeitende"
      description="Verwalte deine Mitarbeitenden und ihre Zuordnungen"
      headerActions={
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Neuer Mitarbeiter
        </Button>
      }
    >
      <div className="container mx-auto py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name oder E-Mail suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterEingruppierung} onValueChange={setFilterEingruppierung}>
                <SelectTrigger>
                  <SelectValue placeholder="Eingruppierung filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Eingruppierungen</SelectItem>
                  <SelectItem value="Bürokraft">Bürokraft</SelectItem>
                  <SelectItem value="Sekretär:in">Sekretär:in</SelectItem>
                  <SelectItem value="Sachbearbeiter:in">Sachbearbeiter:in</SelectItem>
                  <SelectItem value="Wissenschaftliche:r Mitarbeiter:in">Wissenschaftliche:r Mitarbeiter:in</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterEinsatzort} onValueChange={setFilterEinsatzort}>
                <SelectTrigger>
                  <SelectValue placeholder="Einsatzort filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Einsatzorte</SelectItem>
                  {getEinsatzorte().map(einsatzort => (
                    <SelectItem key={einsatzort} value={einsatzort}>{einsatzort}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterEingruppierung('all');
                  setFilterEinsatzort('all');
                }}
                className="w-full"
              >
                Filter zurücksetzen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gesamt</p>
                  <p className="text-2xl font-bold">{filteredMitarbeiter.length}</p>
                </div>
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {Object.entries(eingruppierungColors).map(([eingruppierung, colorClass]) => {
            const count = filteredMitarbeiter.filter(m => 
              m.zuordnungen.some((z: MitarbeiterZuordnung & { mdb_name: string }) => z.eingruppierung === eingruppierung)
            ).length;
            
            return (
              <Card key={eingruppierung}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{eingruppierung}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    <Badge className={colorClass}>{count}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mitarbeiter List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <MitarbeiterCardSkeleton key={i} />
            ))
          ) : filteredMitarbeiter.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-12 text-center">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine Mitarbeitenden gefunden</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterEingruppierung || filterEinsatzort 
                      ? "Versuche deine Filter anzupassen."
                      : "Erstelle deinen ersten Mitarbeiter-Eintrag."
                    }
                  </p>
                  {!searchTerm && !filterEingruppierung && !filterEinsatzort && (
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Mitarbeiter hinzufügen
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredMitarbeiter.map((mitarbeiter) => (
              <Card key={mitarbeiter.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                        {mitarbeiter.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{mitarbeiter.name}</h3>
                        <p className="text-sm text-muted-foreground">{mitarbeiter.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewClick(mitarbeiter)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(mitarbeiter)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(mitarbeiter)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {mitarbeiter.strasse} {mitarbeiter.hausnummer}, {mitarbeiter.plz} {mitarbeiter.ort}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(mitarbeiter.geburtsdatum)}</span>
                    </div>
                    {mitarbeiter.mobilnummer && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{mitarbeiter.mobilnummer}</span>
                      </div>
                    )}
                    {mitarbeiter.bueronummer && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Büro {mitarbeiter.bueronummer}</span>
                      </div>
                    )}
                  </div>

                  {/* Zuordnungen */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Zuordnungen:</h4>
                    <div className="flex flex-wrap gap-2">
                      {mitarbeiter.zuordnungen.map((zuordnung) => (
                        <div key={zuordnung.id} className="flex flex-col gap-1">
                          <Badge className={eingruppierungColors[zuordnung.eingruppierung]}>
                            {zuordnung.eingruppierung}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            <div>{zuordnung.einsatzort}</div>
                            <div>{zuordnung.zustaendigkeit}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={handleFormClose}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMitarbeiter ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
              </DialogTitle>
            </DialogHeader>
            <MitarbeiterForm
              mitarbeiter={editingMitarbeiter}
              onSuccess={handleFormSuccess}
              onCancel={handleFormClose}
            />
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={!!viewingMitarbeiter} onOpenChange={() => setViewingMitarbeiter(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mitarbeiter Details</DialogTitle>
            </DialogHeader>
            {viewingMitarbeiter && (
              <MitarbeiterDetails 
                mitarbeiter={viewingMitarbeiter}
                onEdit={() => {
                  setEditingMitarbeiter(viewingMitarbeiter);
                  setViewingMitarbeiter(null);
                  setShowForm(true);
                }}
                onClose={() => setViewingMitarbeiter(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mitarbeiter löschen</AlertDialogTitle>
              <AlertDialogDescription>
                Bist du sicher, dass du {mitarbeiterToDelete?.name} löschen möchtest? 
                Diese Aktion kann nicht rückgängig gemacht werden und löscht auch alle Zuordnungen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageLayout>
  );
} 