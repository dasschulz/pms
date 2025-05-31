"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit, Save, X, HelpCircle, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import type { WahlkreisbueroBeratungen, BeratungsFormData, BeratungTyp } from '@/types/wahlkreisbuero';
import { BERATUNG_TYPEN, WOCHENTAGE } from '@/types/wahlkreisbuero';

interface BeratungsManagerProps {
  wahlkreisbueroId: string;
  wahlkreisbueroName: string;
  compact?: boolean;
}

const getBeratungTypeLabel = (typ: BeratungTyp): string => {
  const typeObj = BERATUNG_TYPEN.find(t => t.value === typ);
  return typeObj ? typeObj.label : typ;
};

const getWochentagLabel = (wochentag: number): string => {
  const day = WOCHENTAGE.find(w => w.value === wochentag);
  return day ? day.label : `Tag ${wochentag}`;
};

export default function BeratungsManager({ 
  wahlkreisbueroId, 
  wahlkreisbueroName, 
  compact 
}: BeratungsManagerProps) {
  const [beratungen, setBeratungen] = useState<WahlkreisbueroBeratungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [beratungToDelete, setBeratungToDelete] = useState<WahlkreisbueroBeratungen | null>(null);
  const [formData, setFormData] = useState<BeratungsFormData>({
    typ: 'schuldenberatung',
    anbieter: '',
    wochentag: undefined,
    von_zeit: '',
    bis_zeit: '',
    beschreibung: ''
  });

  useEffect(() => {
    loadBeratungen();
  }, [wahlkreisbueroId]);

  const loadBeratungen = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/wahlkreisbueros/${wahlkreisbueroId}/beratungen`);
      const result = await response.json();
      
      if (response.ok && result.data) {
        setBeratungen(result.data);
      } else {
        console.error('Error loading beratungen:', result.error);
        toast.error('Fehler beim Laden der Beratungsangebote');
      }
    } catch (error) {
      console.error('Error loading beratungen:', error);
      toast.error('Fehler beim Laden der Beratungsangebote');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      typ: 'schuldenberatung',
      anbieter: '',
      wochentag: undefined,
      von_zeit: '',
      bis_zeit: '',
      beschreibung: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (beratung: WahlkreisbueroBeratungen) => {
    setFormData({
      typ: beratung.typ,
      anbieter: beratung.anbieter,
      wochentag: beratung.wochentag || undefined,
      von_zeit: beratung.von_zeit || '',
      bis_zeit: beratung.bis_zeit || '',
      beschreibung: beratung.beschreibung || ''
    });
    setEditingId(beratung.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.typ || !formData.anbieter) {
      toast.error('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    if (formData.wochentag && (!formData.von_zeit || !formData.bis_zeit)) {
      toast.error('Wenn ein Wochentag ausgewählt ist, müssen auch Uhrzeiten angegeben werden');
      return;
    }

    if (formData.von_zeit && formData.bis_zeit && formData.von_zeit >= formData.bis_zeit) {
      toast.error('Die Anfangszeit muss vor der Endzeit liegen');
      return;
    }

    try {
      const url = editingId 
        ? `/api/wahlkreisbueros/${wahlkreisbueroId}/beratungen/${editingId}`
        : `/api/wahlkreisbueros/${wahlkreisbueroId}/beratungen`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(editingId ? 'Beratungsangebot aktualisiert' : 'Beratungsangebot hinzugefügt');
        loadBeratungen();
        resetForm();
      } else {
        toast.error(result.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Error saving beratung:', error);
      toast.error('Fehler beim Speichern des Beratungsangebots');
    }
  };

  const handleDelete = async () => {
    if (!beratungToDelete) return;

    try {
      const response = await fetch(
        `/api/wahlkreisbueros/${wahlkreisbueroId}/beratungen/${beratungToDelete.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast.success('Beratungsangebot gelöscht');
        loadBeratungen();
      } else {
        const result = await response.json();
        toast.error(result.error || 'Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Error deleting beratung:', error);
      toast.error('Fehler beim Löschen des Beratungsangebots');
    } finally {
      setDeleteDialogOpen(false);
      setBeratungToDelete(null);
    }
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return '';
    return time.substring(0, 5); // Remove seconds
  };

  if (loading) {
    return (
      <Card className={compact ? '' : 'mt-6'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Beratungsangebote
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={compact ? '' : 'mt-6'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Beratungsangebote
            {!compact && <span className="text-sm font-normal text-muted-foreground">für {wahlkreisbueroName}</span>}
          </CardTitle>
          <Button
            onClick={() => setShowForm(true)}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Beratung hinzufügen
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {beratungen.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Noch keine Beratungsangebote hinzugefügt</p>
            <p className="text-sm mt-1">Füge Angebote wie Schulden- oder Bürgergeldberatung hinzu</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {beratungen.map((beratung) => (
              <Card key={beratung.id} className="relative">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          {getBeratungTypeLabel(beratung.typ)}
                        </Badge>
                        {beratung.wochentag && (
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {getWochentagLabel(beratung.wochentag)}
                          </Badge>
                        )}
                      </div>
                      
                      <h4 className="font-medium mb-1">{beratung.anbieter}</h4>
                      
                      {beratung.wochentag && beratung.von_zeit && beratung.bis_zeit ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <Clock className="h-4 w-4" />
                          {formatTime(beratung.von_zeit)} - {formatTime(beratung.bis_zeit)} Uhr
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground mb-2">
                          Nach Vereinbarung
                        </div>
                      )}
                      
                      {beratung.beschreibung && (
                        <p className="text-sm text-muted-foreground">
                          {beratung.beschreibung}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(beratung)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setBeratungToDelete(beratung);
                          setDeleteDialogOpen(true);
                        }}
                        className="gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showForm && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingId ? 'Beratungsangebot bearbeiten' : 'Neues Beratungsangebot'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="typ">Beratungstyp*</Label>
                    <Select 
                      value={formData.typ} 
                      onValueChange={(value: BeratungTyp) => setFormData({ ...formData, typ: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BERATUNG_TYPEN.map((typ) => (
                          <SelectItem key={typ.value} value={typ.value}>
                            {typ.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="anbieter">Anbieter*</Label>
                    <Input
                      id="anbieter"
                      value={formData.anbieter}
                      onChange={(e) => setFormData({ ...formData, anbieter: e.target.value })}
                      placeholder="z.B. Caritas, Verbraucherzentrale..."
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="wochentag">Wochentag</Label>
                    <Select 
                      value={formData.wochentag?.toString() || 'none'} 
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        wochentag: value === 'none' ? undefined : parseInt(value) 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nach Vereinbarung" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nach Vereinbarung</SelectItem>
                        {WOCHENTAGE.map((tag) => (
                          <SelectItem key={tag.value} value={tag.value.toString()}>
                            {tag.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="von_zeit">Von (Uhrzeit)</Label>
                    <Input
                      id="von_zeit"
                      type="time"
                      value={formData.von_zeit}
                      onChange={(e) => setFormData({ ...formData, von_zeit: e.target.value })}
                      disabled={!formData.wochentag}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bis_zeit">Bis (Uhrzeit)</Label>
                    <Input
                      id="bis_zeit"
                      type="time"
                      value={formData.bis_zeit}
                      onChange={(e) => setFormData({ ...formData, bis_zeit: e.target.value })}
                      disabled={!formData.wochentag}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="beschreibung">Beschreibung (optional)</Label>
                  <Textarea
                    id="beschreibung"
                    value={formData.beschreibung}
                    onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                    placeholder="Zusätzliche Informationen zur Beratung..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="gap-2">
                    <Save className="h-4 w-4" />
                    {editingId ? 'Aktualisieren' : 'Hinzufügen'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="gap-2">
                    <X className="h-4 w-4" />
                    Abbrechen
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Beratungsangebot löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du das Beratungsangebot "{beratungToDelete?.anbieter}" 
              für {beratungToDelete ? getBeratungTypeLabel(beratungToDelete.typ) : ''} löschen möchtest?
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
    </Card>
  );
} 