'use client';

import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Phone, Mail, Building, Edit2, Trash2 } from 'lucide-react';
import { ReferentModal } from '@/components/referentenpool/referent-modal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Referent {
  id: string;
  titel: string;
  vorname: string;
  nachname: string;
  fachbereich: string[];
  institution: string;
  email: string;
  telefon: string;
  ort: string;
  angelegt_von: string;
  hinzugefuegt_von: string;
  verfuegbar_fuer: string[];
  zustimmung_datenspeicherung: boolean;
  zustimmung_kontakt_andere_mdb: boolean;
  parteimitglied: boolean;
  created_at: string;
}

export default function ReferentenpoolPage() {
  const { data: session, status } = useSession();
  const [referents, setReferents] = useState<Referent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFachbereich, setSelectedFachbereich] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReferent, setSelectedReferent] = useState<Referent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [referentToDelete, setReferentToDelete] = useState<{ id: string; name: string } | null>(null);

  if (status === 'loading') {
    return (
      <PageLayout title="Referent:innen-Pool">
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

  useEffect(() => {
    fetchReferents();
  }, []);

  const fetchReferents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/referentenpool');
      if (response.ok) {
        const data = await response.json();
        setReferents(data);
      }
    } catch (error) {
      console.error('Error fetching referents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReferent = () => {
    setSelectedReferent(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditReferent = (referent: Referent) => {
    setSelectedReferent(referent);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteReferent = async (id: string) => {
    try {
      const response = await fetch(`/api/referentenpool/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchReferents();
      }
    } catch (error) {
      console.error('Error deleting referent:', error);
    }
  };

  const handleModalSave = async () => {
    setIsModalOpen(false);
    await fetchReferents();
  };

  const filteredReferents = referents.filter(referent => {
    const matchesSearch = searchTerm === '' || 
      `${referent.vorname} ${referent.nachname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referent.fachbereich.some(f => f.toLowerCase().includes(searchTerm.toLowerCase())) ||
      referent.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (referent.ort && referent.ort.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFachbereich = selectedFachbereich === 'all' || referent.fachbereich.includes(selectedFachbereich);
    
    return matchesSearch && matchesFachbereich;
  });

  const fachbereiche = [...new Set(referents.flatMap(r => r.fachbereich))].filter(Boolean);

  const stats = {
    gesamt: referents.length,
    anhoerung: referents.filter(r => r.verfuegbar_fuer.includes('Anhörung')).length,
    veranstaltung: referents.filter(r => r.verfuegbar_fuer.includes('Veranstaltung')).length,
    beratung: referents.filter(r => r.verfuegbar_fuer.includes('Beratung')).length,
  };

  return (
    <PageLayout
      title="Referent:innen-Pool"
      description="Verwalte deine und unsere Kontakte zu Expert:innen und Referent:innen aus verschiedenen Fachbereichen. Organisiere Fachwissen für Veranstaltungen, Anhörungen und Beratungen."
      headerActions={
        <Button onClick={handleCreateReferent} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Neue:n Referent:in hinzufügen
        </Button>
      }
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamt</p>
                <p className="text-2xl font-bold">{stats.gesamt}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Anhörungen</p>
                <p className="text-2xl font-bold">{stats.anhoerung}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Search className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Veranstaltungen</p>
                <p className="text-2xl font-bold">{stats.veranstaltung}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Building className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Beratung</p>
                <p className="text-2xl font-bold">{stats.beratung}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <Phone className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Nach Namen, Fachbereich oder Institution suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-64">
              <Select value={selectedFachbereich} onValueChange={setSelectedFachbereich}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Fachbereiche" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Fachbereiche</SelectItem>
                  {fachbereiche.map(fachbereich => (
                    <SelectItem key={fachbereich} value={fachbereich}>
                      {fachbereich}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Referent:innen ({filteredReferents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : filteredReferents.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Keine Referent:innen gefunden
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || selectedFachbereich
                  ? 'Versuche andere Suchkriterien oder füge eine:n neue:n Referent:in hinzu.'
                  : 'Füge deine erste:n Referent:in hinzu, um loszulegen.'
                }
              </p>
              <Button onClick={handleCreateReferent}>
                <Plus className="h-4 w-4 mr-2" />
                Neue:n Referent:in hinzufügen
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReferents.map((referent) => (
                <Card
                  key={referent.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {referent.titel && `${referent.titel} `}
                        {referent.vorname} {referent.nachname}
                      </h3>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditReferent(referent)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReferentToDelete({ 
                              id: referent.id, 
                              name: `${referent.titel ? referent.titel + ' ' : ''}${referent.vorname} ${referent.nachname}` 
                            });
                            setIsDeleteModalOpen(true);
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {referent.fachbereich.slice(0, 3).map(bereich => (
                          <Badge key={bereich} variant="secondary" className="text-xs">
                            {bereich}
                          </Badge>
                        ))}
                        {referent.fachbereich.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{referent.fachbereich.length - 3}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <p className="line-clamp-1">{referent.institution}</p>
                        {referent.ort && <p className="line-clamp-1">{referent.ort}</p>}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {referent.verfuegbar_fuer.map((verfuegbarkeit) => (
                          <Badge key={verfuegbarkeit} variant="outline" className="text-xs">
                            {verfuegbarkeit}
                          </Badge>
                        ))}
                      </div>
                      
                      {referent.parteimitglied && (
                        <Badge variant="default" className="text-xs bg-red-600 hover:bg-red-700 w-fit">
                          Die Linke
                        </Badge>
                      )}
                      
                      <div className="space-y-1">
                        {referent.email && (
                          <div className="flex items-center gap-1 text-xs">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <a 
                              href={`mailto:${referent.email}`} 
                              className="hover:underline text-muted-foreground line-clamp-1"
                            >
                              {referent.email}
                            </a>
                          </div>
                        )}
                        {referent.telefon && (
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <a 
                              href={`tel:${referent.telefon}`} 
                              className="hover:underline text-muted-foreground"
                            >
                              {referent.telefon}
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {referent.hinzugefuegt_von && (
                        <div className="text-xs text-muted-foreground">
                          Hinzugefügt von: {referent.hinzugefuegt_von}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ReferentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        referent={selectedReferent}
        isEditing={isEditing}
      />

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Referent:in löschen</DialogTitle>
            <DialogDescription>
              Bist du sicher, dass du <strong>{referentToDelete?.name}</strong> löschen möchtest? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (referentToDelete) {
                  handleDeleteReferent(referentToDelete.id);
                  setIsDeleteModalOpen(false);
                  setReferentToDelete(null);
                }
              }}
            >
              Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
} 