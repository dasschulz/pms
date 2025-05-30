"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Save, X, Plus, Trash2, Users, Clock, ChevronDown, ChevronRight, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { Wahlkreisbuero, WahlkreisbueroFormData } from '@/types/wahlkreisbuero';

interface WahlkreisbueroFormProps {
  wahlkreisbuero?: Wahlkreisbuero;
  onSuccess: () => void;
  onCancel: () => void;
  compact?: boolean;
}

interface InitialMitarbeiter {
  tempId: string;
  name: string;
  funktion: string;
  telefon?: string;
  email?: string;
}

interface InitialOeffnungszeit {
  tempId: string;
  wochentag: number;
  von_zeit: string;
  bis_zeit: string;
  geschlossen: boolean;
}

const funktionOptions = [
  'Mitarbeiter:in',
  'Büroleitung',
  'Sachbearbeitung',
  'Auszubildende:r',
  'Praktikant:in',
  'Assistenz'
];

const wochentagNamen = [
  'Montag',
  'Dienstag', 
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag'
];

export default function WahlkreisbueroForm({ 
  wahlkreisbuero, 
  onSuccess, 
  onCancel, 
  compact
}: WahlkreisbueroFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<WahlkreisbueroFormData>({
    name: wahlkreisbuero?.name || '',
    strasse: wahlkreisbuero?.strasse || '',
    hausnummer: wahlkreisbuero?.hausnummer || '',
    plz: wahlkreisbuero?.plz || '',
    ort: wahlkreisbuero?.ort || '',
    telefon: wahlkreisbuero?.telefon || '',
    email: wahlkreisbuero?.email || '',
    barrierefreiheit: wahlkreisbuero?.barrierefreiheit || false
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(wahlkreisbuero?.photo_url || null);
  
  // State for optional creation sections (only for new offices)
  const [showStaffSection, setShowStaffSection] = useState(false);
  const [showHoursSection, setShowHoursSection] = useState(false);
  const [initialMitarbeiter, setInitialMitarbeiter] = useState<InitialMitarbeiter[]>([]);
  const [initialOeffnungszeiten, setInitialOeffnungszeiten] = useState<InitialOeffnungszeit[]>([]);

  const isEditing = !!wahlkreisbuero;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Bitte wähle eine Bilddatei aus');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Die Datei ist zu groß. Maximale Größe: 5MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }
      
      return result.url;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Fehler beim Hochladen des Bildes');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.name || !formData.strasse || !formData.hausnummer || !formData.plz || !formData.ort) {
      setError('Bitte fülle alle Pflichtfelder aus.');
      setLoading(false);
      return;
    }

    // Validate initial staff
    for (const staff of initialMitarbeiter) {
      if (!staff.name.trim()) {
        setError('Alle Mitarbeiter müssen einen Namen haben.');
        setLoading(false);
        return;
      }
    }

    // Validate initial opening hours
    for (const hours of initialOeffnungszeiten) {
      if (!hours.geschlossen && (!hours.von_zeit || !hours.bis_zeit)) {
        setError('Öffnungszeiten müssen vollständig ausgefüllt sein.');
        setLoading(false);
        return;
      }
      if (!hours.geschlossen && hours.von_zeit >= hours.bis_zeit) {
        setError('Öffnungszeit muss vor der Schließungszeit liegen.');
        setLoading(false);
        return;
      }
    }

    try {
      let imageUrl = previewUrl;
      
      // Upload image if a new file was selected
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
        if (!imageUrl) {
          setLoading(false);
          return; // Upload failed, error already shown
        }
      }

      const url = isEditing ? `/api/wahlkreisbueros/${wahlkreisbuero.id}` : '/api/wahlkreisbueros';
      const method = isEditing ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        photo_url: imageUrl
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: result.error,
          result
        });
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const bueroId = result.data.id;

      // Create initial staff if any (only for new offices)
      if (!isEditing && initialMitarbeiter.length > 0) {
        for (const staff of initialMitarbeiter) {
          try {
            const staffResponse = await fetch(`/api/wahlkreisbueros/${bueroId}/mitarbeiter`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: staff.name,
                funktion: staff.funktion,
                telefon: staff.telefon || null,
                email: staff.email || null
              })
            });
            if (!staffResponse.ok) {
              console.warn('Failed to create staff member:', staff.name);
            }
          } catch (error) {
            console.warn('Error creating staff member:', error);
          }
        }
      }

      // Create initial opening hours if any (only for new offices)
      if (!isEditing && initialOeffnungszeiten.length > 0) {
        for (const hours of initialOeffnungszeiten) {
          try {
            const hoursResponse = await fetch(`/api/wahlkreisbueros/${bueroId}/oeffnungszeiten`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                wochentag: hours.wochentag,
                von_zeit: hours.geschlossen ? null : hours.von_zeit,
                bis_zeit: hours.geschlossen ? null : hours.bis_zeit,
                geschlossen: hours.geschlossen
              })
            });
            if (!hoursResponse.ok) {
              console.warn('Failed to create opening hours for day:', hours.wochentag);
            }
          } catch (error) {
            console.warn('Error creating opening hours:', error);
          }
        }
      }

      console.log('Successfully created/updated wahlkreisbuero:', result);
      toast.success(isEditing ? 'Wahlkreisbüro aktualisiert!' : 'Wahlkreisbüro erstellt!');
      onSuccess?.();
      onCancel();
    } catch (err) {
      console.error('Error creating/updating wahlkreisbuero:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(`Fehler beim ${isEditing ? 'Aktualisieren' : 'Erstellen'} des Wahlkreisbüros: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof WahlkreisbueroFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Staff management functions
  const addStaff = () => {
    const newStaff: InitialMitarbeiter = {
      tempId: `temp_${Date.now()}`,
      name: '',
      funktion: 'Mitarbeiter:in',
      telefon: '',
      email: ''
    };
    setInitialMitarbeiter(prev => [...prev, newStaff]);
  };

  const updateStaff = (tempId: string, field: keyof InitialMitarbeiter, value: string) => {
    setInitialMitarbeiter(prev => 
      prev.map(staff => 
        staff.tempId === tempId ? { ...staff, [field]: value } : staff
      )
    );
  };

  const removeStaff = (tempId: string) => {
    setInitialMitarbeiter(prev => prev.filter(staff => staff.tempId !== tempId));
  };

  // Opening hours management functions
  const addOpeningHours = () => {
    const usedDays = initialOeffnungszeiten.map(h => h.wochentag);
    const nextDay = [1, 2, 3, 4, 5, 6, 7].find(day => !usedDays.includes(day));
    
    if (!nextDay) {
      toast.error('Alle Wochentage sind bereits definiert');
      return;
    }

    const newHours: InitialOeffnungszeit = {
      tempId: `temp_${Date.now()}`,
      wochentag: nextDay,
      von_zeit: '09:00',
      bis_zeit: '17:00',
      geschlossen: false
    };
    setInitialOeffnungszeiten(prev => [...prev, newHours]);
  };

  const updateOpeningHours = (tempId: string, field: keyof InitialOeffnungszeit, value: string | number | boolean) => {
    setInitialOeffnungszeiten(prev => 
      prev.map(hours => 
        hours.tempId === tempId ? { ...hours, [field]: value } : hours
      )
    );
  };

  const removeOpeningHours = (tempId: string) => {
    setInitialOeffnungszeiten(prev => prev.filter(hours => hours.tempId !== tempId));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Grunddaten & Kontakt in kompakter 2-Spalten-Ansicht */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Grunddaten & Adresse */}
        <div className="space-y-6">
          <div>
            {!compact && <h3 className="text-lg font-semibold mb-4">Grunddaten & Adresse</h3>}
            
            {/* Name */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="name">Name des Büros *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="z.B. Wahlkreisbüro Berlin-Mitte"
                required
              />
            </div>

            {/* Adresse */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="strasse">Straße *</Label>
                  <Input
                    id="strasse"
                    value={formData.strasse}
                    onChange={(e) => handleInputChange('strasse', e.target.value)}
                    placeholder="z.B. Friedrichstraße"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hausnummer">Nr. *</Label>
                  <Input
                    id="hausnummer"
                    value={formData.hausnummer}
                    onChange={(e) => handleInputChange('hausnummer', e.target.value)}
                    placeholder="123a"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="plz">PLZ *</Label>
                  <Input
                    id="plz"
                    value={formData.plz}
                    onChange={(e) => handleInputChange('plz', e.target.value)}
                    placeholder="10117"
                    pattern="[0-9]{5}"
                    maxLength={5}
                    required
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="ort">Ort *</Label>
                  <Input
                    id="ort"
                    value={formData.ort}
                    onChange={(e) => handleInputChange('ort', e.target.value)}
                    placeholder="z.B. Berlin"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Kontakt & Details */}
        <div className="space-y-6">
          <div>
            {!compact && <h3 className="text-lg font-semibold mb-4">Kontakt & Details</h3>}
            
            {/* Kontakt */}
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="telefon">Telefon</Label>
                <Input
                  id="telefon"
                  value={formData.telefon || ''}
                  onChange={(e) => handleInputChange('telefon', e.target.value)}
                  placeholder="z.B. +49 30 123456"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="z.B. buero@bundestag.de"
                />
              </div>
            </div>

            {/* Barrierefreiheit */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="barrierefreiheit"
                  checked={formData.barrierefreiheit || false}
                  onCheckedChange={(checked) => handleInputChange('barrierefreiheit', checked)}
                />
                <Label htmlFor="barrierefreiheit">Barrierefrei</Label>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2 mt-6">
              <Label htmlFor="photo">Bürofoto (optional)</Label>
              <div className="space-y-3">
                {previewUrl && (
                  <div className="relative">
                    <img 
                      src={previewUrl} 
                      alt="Büro Preview" 
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeImage}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo')?.click()}
                    disabled={loading}
                    size="sm"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Bild auswählen
                  </Button>
                  {selectedFile && (
                    <span className="text-sm text-muted-foreground">
                      {selectedFile.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unterstützte Formate: JPG, PNG, GIF. Max. 5MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Optional sections for new offices only */}
      {!isEditing && (
        <>
          <Separator />

          {/* Initial Staff Section */}
          <Collapsible open={showStaffSection} onOpenChange={setShowStaffSection}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Mitarbeiter hinzufügen (optional)
                  {initialMitarbeiter.length > 0 && (
                    <Badge variant="secondary">{initialMitarbeiter.length}</Badge>
                  )}
                </div>
                {showStaffSection ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Du kannst bereits jetzt Mitarbeiter hinzufügen oder dies später in der Detailansicht machen.
              </p>
              
              {initialMitarbeiter.map((staff) => (
                <Card key={staff.tempId}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          value={staff.name}
                          onChange={(e) => updateStaff(staff.tempId, 'name', e.target.value)}
                          placeholder="Vor- und Nachname"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Funktion</Label>
                        <Select 
                          value={staff.funktion} 
                          onValueChange={(value) => updateStaff(staff.tempId, 'funktion', value)}
                        >
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
                      <div className="space-y-2">
                        <Label>Telefon</Label>
                        <Input
                          value={staff.telefon || ''}
                          onChange={(e) => updateStaff(staff.tempId, 'telefon', e.target.value)}
                          placeholder="z.B. +49 30 123456"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>E-Mail</Label>
                        <Input
                          type="email"
                          value={staff.email || ''}
                          onChange={(e) => updateStaff(staff.tempId, 'email', e.target.value)}
                          placeholder="beispiel@bundestag.de"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStaff(staff.tempId)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Entfernen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addStaff}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Mitarbeiter hinzufügen
              </Button>
            </CollapsibleContent>
          </Collapsible>

          {/* Initial Opening Hours Section */}
          <Collapsible open={showHoursSection} onOpenChange={setShowHoursSection}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Öffnungszeiten hinzufügen (optional)
                  {initialOeffnungszeiten.length > 0 && (
                    <Badge variant="secondary">{initialOeffnungszeiten.length}</Badge>
                  )}
                </div>
                {showHoursSection ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Du kannst bereits jetzt Öffnungszeiten definieren oder dies später in der Detailansicht machen.
              </p>
              
              {initialOeffnungszeiten
                .sort((a, b) => a.wochentag - b.wochentag)
                .map((hours) => (
                <Card key={hours.tempId}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="space-y-2">
                        <Label>Wochentag</Label>
                        <Select 
                          value={hours.wochentag.toString()} 
                          onValueChange={(value) => updateOpeningHours(hours.tempId, 'wochentag', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {wochentagNamen.map((tag, index) => (
                              <SelectItem 
                                key={index} 
                                value={(index + 1).toString()}
                                disabled={initialOeffnungszeiten.some(h => h.wochentag === index + 1 && h.tempId !== hours.tempId)}
                              >
                                {tag}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={hours.geschlossen}
                          onCheckedChange={(checked) => updateOpeningHours(hours.tempId, 'geschlossen', checked)}
                        />
                        <Label>Geschlossen</Label>
                      </div>

                      {!hours.geschlossen && (
                        <>
                          <div className="space-y-2">
                            <Label>Öffnung</Label>
                            <Input
                              type="time"
                              value={hours.von_zeit}
                              onChange={(e) => updateOpeningHours(hours.tempId, 'von_zeit', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Schließung</Label>
                            <Input
                              type="time"
                              value={hours.bis_zeit}
                              onChange={(e) => updateOpeningHours(hours.tempId, 'bis_zeit', e.target.value)}
                            />
                          </div>
                        </>
                      )}
                      
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOpeningHours(hours.tempId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addOpeningHours}
                className="w-full"
                disabled={initialOeffnungszeiten.length >= 7}
              >
                <Plus className="h-4 w-4 mr-2" />
                Öffnungszeit hinzufügen
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Speichern...' : isEditing ? 'Aktualisieren' : 'Erstellen'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Abbrechen
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>* Pflichtfelder</p>
        {!isEditing && (
          <p className="mt-2">
            Du kannst alle Einstellungen auch später in der Detailansicht des Büros vornehmen.
          </p>
        )}
      </div>
    </form>
  );
} 