'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, User, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface Mitarbeiter {
  id: string;
  wahlkreisbuero_id: string;
  name: string;
  funktion: string;
  telefon?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

interface MitarbeiterManagerProps {
  wahlkreisbueroId: string;
  wahlkreisbueroName: string;
  compact?: boolean;
}

const funktionOptions = [
  'Mitarbeiter:in',
  'Büroleitung',
  'Sachbearbeitung',
  'Auszubildende:r',
  'Praktikant:in',
  'Assistenz'
];

export default function MitarbeiterManager({ wahlkreisbueroId, wahlkreisbueroName, compact }: MitarbeiterManagerProps) {
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingMitarbeiter, setEditingMitarbeiter] = useState<Mitarbeiter | null>(null);
  const [mitarbeiterToDelete, setMitarbeiterToDelete] = useState<Mitarbeiter | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    funktion: 'Mitarbeiter:in',
    telefon: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMitarbeiter = async () => {
    try {
      const response = await fetch(`/api/wahlkreisbueros/${wahlkreisbueroId}/mitarbeiter`);
      if (response.ok) {
        const result = await response.json();
        setMitarbeiter(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching mitarbeiter:', error);
      toast.error('Fehler beim Laden der Mitarbeiter');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMitarbeiter();
  }, [wahlkreisbueroId]);

  const resetForm = () => {
    setFormData({
      name: '',
      funktion: 'Mitarbeiter:in',
      telefon: '',
      email: ''
    });
    setEditingMitarbeiter(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (mitarbeiter: Mitarbeiter) => {
    setFormData({
      name: mitarbeiter.name,
      funktion: mitarbeiter.funktion,
      telefon: mitarbeiter.telefon || '',
      email: mitarbeiter.email || ''
    });
    setEditingMitarbeiter(mitarbeiter);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Name ist erforderlich');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingMitarbeiter 
        ? `/api/wahlkreisbueros/${wahlkreisbueroId}/mitarbeiter/${editingMitarbeiter.id}`
        : `/api/wahlkreisbueros/${wahlkreisbueroId}/mitarbeiter`;
      
      const method = editingMitarbeiter ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Fehler beim Speichern');
      }

      toast.success(editingMitarbeiter ? 'Person aktualisiert' : 'Person hinzugefügt');
      setIsDialogOpen(false);
      resetForm();
      fetchMitarbeiter();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Speichern';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!mitarbeiterToDelete) return;

    try {
      const response = await fetch(`/api/wahlkreisbueros/${wahlkreisbueroId}/mitarbeiter/${mitarbeiterToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Fehler beim Löschen');
      }

      toast.success('Person gelöscht');
      setIsDeleteDialogOpen(false);
      setMitarbeiterToDelete(null);
      fetchMitarbeiter();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Löschen';
      toast.error(errorMessage);
    }
  };

  const openDeleteDialog = (mitarbeiter: Mitarbeiter) => {
    setMitarbeiterToDelete(mitarbeiter);
    setIsDeleteDialogOpen(true);
  };

  const renderContent = () => (
    <>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : mitarbeiter.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Noch keine Personen hinzugefügt</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mitarbeiter.map((person) => (
            <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium">{person.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {person.funktion}
                    </Badge>
                  </div>
                </div>
                {(person.telefon || person.email) && (
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    {person.telefon && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {person.telefon}
                      </div>
                    )}
                    {person.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {person.email}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(person)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteDialog(person)}
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
              {editingMitarbeiter ? 'Person bearbeiten' : 'Neue Person hinzufügen'}
            </DialogTitle>
            <DialogDescription>
              {editingMitarbeiter 
                ? 'Aktualisiere die Informationen der Person.'
                : 'Füge eine neue Person zu diesem Wahlkreisbüro hinzu.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Vor- und Nachname"
              />
            </div>
            <div>
              <Label htmlFor="funktion">Funktion</Label>
              <Select value={formData.funktion} onValueChange={(value) => setFormData({ ...formData, funktion: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {funktionOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="telefon">Telefon</Label>
              <Input
                id="telefon"
                value={formData.telefon}
                onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                placeholder="z.B. +49 30 123456"
              />
            </div>
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="beispiel@bundestag.de"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Wird gespeichert...' : editingMitarbeiter ? 'Aktualisieren' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Person löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du "{mitarbeiterToDelete?.name}" löschen möchtest? 
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
              <User className="h-5 w-5" />
              Personal
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Personal von {wahlkreisbueroName}
            </p>
          </div>
          <Button onClick={openCreateDialog} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Person hinzufügen
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
} 