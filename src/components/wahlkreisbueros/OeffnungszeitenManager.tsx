'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Oeffnungszeit {
  id: string;
  wahlkreisbuero_id: string;
  wochentag: number; // 1 = Montag, 7 = Sonntag
  von_zeit: string | null;
  bis_zeit: string | null;
  geschlossen: boolean;
  created_at: string;
  updated_at: string;
}

interface OeffnungszeitenManagerProps {
  wahlkreisbueroId: string;
  wahlkreisbueroName: string;
  compact?: boolean; // When true, renders without card wrapper for modal usage
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

export default function OeffnungszeitenManager({ wahlkreisbueroId, wahlkreisbueroName, compact }: OeffnungszeitenManagerProps) {
  const [oeffnungszeiten, setOeffnungszeiten] = useState<Oeffnungszeit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingOeffnungszeit, setEditingOeffnungszeit] = useState<Oeffnungszeit | null>(null);
  const [oeffnungszeitToDelete, setOeffnungszeitToDelete] = useState<Oeffnungszeit | null>(null);
  const [formData, setFormData] = useState({
    wochentag: 1,
    von_zeit: '',
    bis_zeit: '',
    geschlossen: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOeffnungszeiten = async () => {
    try {
      const response = await fetch(`/api/wahlkreisbueros/${wahlkreisbueroId}/oeffnungszeiten`);
      if (response.ok) {
        const result = await response.json();
        setOeffnungszeiten(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching oeffnungszeiten:', error);
      toast.error('Fehler beim Laden der Öffnungszeiten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOeffnungszeiten();
  }, [wahlkreisbueroId]);

  const resetForm = () => {
    setFormData({
      wochentag: 1,
      von_zeit: '',
      bis_zeit: '',
      geschlossen: false
    });
    setEditingOeffnungszeit(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (oeffnungszeit: Oeffnungszeit) => {
    setFormData({
      wochentag: oeffnungszeit.wochentag,
      von_zeit: oeffnungszeit.von_zeit || '',
      bis_zeit: oeffnungszeit.bis_zeit || '',
      geschlossen: oeffnungszeit.geschlossen
    });
    setEditingOeffnungszeit(oeffnungszeit);
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    if (!formData.geschlossen) {
      if (!formData.von_zeit || !formData.bis_zeit) {
        toast.error('Öffnung und Schließung sind erforderlich, wenn nicht geschlossen');
        return false;
      }
      if (formData.von_zeit >= formData.bis_zeit) {
        toast.error('Öffnungszeit muss vor der Schließungszeit liegen');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const url = editingOeffnungszeit 
        ? `/api/wahlkreisbueros/${wahlkreisbueroId}/oeffnungszeiten/${editingOeffnungszeit.id}`
        : `/api/wahlkreisbueros/${wahlkreisbueroId}/oeffnungszeiten`;
      
      const method = editingOeffnungszeit ? 'PUT' : 'POST';
      
      const requestData = {
        ...formData,
        von_zeit: formData.geschlossen ? null : formData.von_zeit,
        bis_zeit: formData.geschlossen ? null : formData.bis_zeit
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Fehler beim Speichern');
      }

      toast.success(editingOeffnungszeit ? 'Öffnungszeit aktualisiert' : 'Öffnungszeit hinzugefügt');
      setIsDialogOpen(false);
      resetForm();
      fetchOeffnungszeiten();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Speichern';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!oeffnungszeitToDelete) return;

    try {
      const response = await fetch(`/api/wahlkreisbueros/${wahlkreisbueroId}/oeffnungszeiten/${oeffnungszeitToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Fehler beim Löschen');
      }

      toast.success('Öffnungszeit gelöscht');
      setIsDeleteDialogOpen(false);
      setOeffnungszeitToDelete(null);
      fetchOeffnungszeiten();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Löschen';
      toast.error(errorMessage);
    }
  };

  const openDeleteDialog = (oeffnungszeit: Oeffnungszeit) => {
    setOeffnungszeitToDelete(oeffnungszeit);
    setIsDeleteDialogOpen(true);
  };

  const formatTime = (time: string | null) => {
    if (!time) return '--:--';
    return time.substring(0, 5); // Remove seconds from HH:MM:SS
  };

  // Sort opening hours by weekday
  const sortedOeffnungszeiten = [...oeffnungszeiten].sort((a, b) => a.wochentag - b.wochentag);

  const renderContent = () => (
    <>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : sortedOeffnungszeiten.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Noch keine Öffnungszeiten definiert</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedOeffnungszeiten.map((oeffnungszeit) => (
            <div key={oeffnungszeit.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">{wochentagNamen[oeffnungszeit.wochentag - 1]}</h4>
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
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(oeffnungszeit)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteDialog(oeffnungszeit)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOeffnungszeit ? 'Öffnungszeit bearbeiten' : 'Neue Öffnungszeit hinzufügen'}
            </DialogTitle>
            <DialogDescription>
              {editingOeffnungszeit 
                ? 'Aktualisiere die Öffnungszeit für diesen Wochentag.'
                : 'Füge eine neue Öffnungszeit für einen Wochentag hinzu.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="wochentag">Wochentag</Label>
              <select
                id="wochentag"
                value={formData.wochentag}
                onChange={(e) => setFormData({ ...formData, wochentag: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md"
              >
                {wochentagNamen.map((tag, index) => (
                  <option key={index} value={index + 1}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="geschlossen"
                checked={formData.geschlossen}
                onCheckedChange={(checked) => setFormData({ ...formData, geschlossen: checked })}
              />
              <Label htmlFor="geschlossen">Geschlossen</Label>
            </div>

            {!formData.geschlossen && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="von_zeit">Öffnung</Label>
                    <Input
                      id="von_zeit"
                      type="time"
                      value={formData.von_zeit}
                      onChange={(e) => setFormData({ ...formData, von_zeit: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bis_zeit">Schließung</Label>
                    <Input
                      id="bis_zeit"
                      type="time"
                      value={formData.bis_zeit}
                      onChange={(e) => setFormData({ ...formData, bis_zeit: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Wird gespeichert...' : editingOeffnungszeit ? 'Aktualisieren' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Öffnungszeit löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du die Öffnungszeit für "{oeffnungszeitToDelete && wochentagNamen[oeffnungszeitToDelete.wochentag - 1]}" löschen möchtest? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={openCreateDialog} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Hinzufügen
          </Button>
        </div>
        {renderContent()}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Öffnungszeiten
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Öffnungszeiten von {wahlkreisbueroName}
            </p>
          </div>
          <Button onClick={openCreateDialog} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Öffnungszeit hinzufügen
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
} 