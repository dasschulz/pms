"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CachedAvatar } from "@/components/ui/cached-avatar";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MitarbeiterVollstaendig, MitarbeiterZuordnung } from '../../app/mitarbeitende/page';

interface MitarbeiterFormProps {
  mitarbeiter?: MitarbeiterVollstaendig | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface Wahlkreisbuero {
  id: string;
  name: string;
  ort: string;
}

interface FormData {
  name: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  geburtsdatum: Date | undefined;
  email: string;
  bueronummer: string;
  mobilnummer: string;
  profilbild_url: string;
}

interface ZuordnungFormData {
  id?: string;
  eingruppierung: string;
  zustaendigkeit: string;
  einstellungsdatum: Date | undefined;
  befristung_bis: Date | undefined;
  einsatzort: string;
}

const initialFormData: FormData = {
  name: '',
  strasse: '',
  hausnummer: '',
  plz: '',
  ort: '',
  geburtsdatum: undefined,
  email: '',
  bueronummer: '',
  mobilnummer: '',
  profilbild_url: ''
};

const initialZuordnung: ZuordnungFormData = {
  eingruppierung: '',
  zustaendigkeit: '',
  einstellungsdatum: undefined,
  befristung_bis: undefined,
  einsatzort: 'Bundestag'
};

const eingruppierungOptions = [
  'Bürokraft',
  'Sekretär:in',
  'Sachbearbeiter:in',
  'Wissenschaftliche:r Mitarbeiter:in'
];

// Custom DateInput component that supports both typing and calendar picker
interface DateInputProps {
  label: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  defaultMonth?: Date;
}

function DateInput({ label, value, onChange, placeholder = "DD.MM.YYYY", required = false, error, defaultMonth }: DateInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Update input value when external value changes
  useEffect(() => {
    if (value) {
      setInputValue(format(value, "dd.MM.yyyy"));
    } else {
      setInputValue('');
    }
  }, [value]);

  const parseDate = (dateString: string): Date | null => {
    // Remove any spaces and validate format
    const cleaned = dateString.replace(/\s/g, '');
    
    // Check if it matches DD.MM.YYYY format
    const dateRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
    const match = cleaned.match(dateRegex);
    
    if (!match) return null;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    // Basic validation
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    
    try {
      const parsedDate = parse(cleaned, "dd.MM.yyyy", new Date());
      
      // Check if the parsed date is valid and matches input
      if (isNaN(parsedDate.getTime())) return null;
      if (parsedDate.getDate() !== day || parsedDate.getMonth() + 1 !== month || parsedDate.getFullYear() !== year) {
        return null;
      }
      
      return parsedDate;
    } catch {
      return null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Try to parse the date if it looks complete
    if (newValue.length >= 8) {
      const parsedDate = parseDate(newValue);
      if (parsedDate) {
        onChange(parsedDate);
      } else if (newValue.length === 10) {
        // Only show error for complete inputs
        onChange(undefined);
      }
    } else {
      onChange(undefined);
    }
  };

  const handleInputBlur = () => {
    if (inputValue && !value) {
      // Try one more time to parse on blur
      const parsedDate = parseDate(inputValue);
      if (parsedDate) {
        onChange(parsedDate);
      }
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange(date);
    setIsCalendarOpen(false);
  };

  return (
    <div>
      <Label>{label} {required && '*'}</Label>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={cn("flex-1", error && "border-red-500")}
        />
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="px-3"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleCalendarSelect}
              initialFocus
              locale={de}
              defaultMonth={defaultMonth}
            />
          </PopoverContent>
        </Popover>
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function MitarbeiterForm({ mitarbeiter, onSuccess, onCancel }: MitarbeiterFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [zuordnungen, setZuordnungen] = useState<ZuordnungFormData[]>([initialZuordnung]);
  const [wahlkreisbueros, setWahlkreisbueros] = useState<Wahlkreisbuero[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadWahlkreisbueros();
    
    if (mitarbeiter) {
      setFormData({
        name: mitarbeiter.name,
        strasse: mitarbeiter.strasse,
        hausnummer: mitarbeiter.hausnummer,
        plz: mitarbeiter.plz,
        ort: mitarbeiter.ort,
        geburtsdatum: new Date(mitarbeiter.geburtsdatum),
        email: mitarbeiter.email,
        bueronummer: mitarbeiter.bueronummer || '',
        mobilnummer: mitarbeiter.mobilnummer || '',
        profilbild_url: mitarbeiter.profilbild_url || ''
      });
      
      // Set preview URL for existing profile picture
      setPreviewUrl(mitarbeiter.profilbild_url || null);
      
      if (mitarbeiter.zuordnungen.length > 0) {
        setZuordnungen(mitarbeiter.zuordnungen.map(z => ({
          id: z.id,
          eingruppierung: z.eingruppierung,
          zustaendigkeit: z.zustaendigkeit,
          einstellungsdatum: new Date(z.einstellungsdatum),
          befristung_bis: z.befristung_bis ? new Date(z.befristung_bis) : undefined,
          einsatzort: z.einsatzort
        })));
      }
    }
  }, [mitarbeiter]);

  const loadWahlkreisbueros = async () => {
    try {
      const response = await fetch('/api/wahlkreisbueros');
      const result = await response.json();
      if (response.ok && result.data) {
        setWahlkreisbueros(result.data);
      }
    } catch (error) {
      console.error('Error loading wahlkreisbueros:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.name.trim()) newErrors.name = 'Name ist erforderlich';
    if (!formData.strasse.trim()) newErrors.strasse = 'Straße ist erforderlich';
    if (!formData.hausnummer.trim()) newErrors.hausnummer = 'Hausnummer ist erforderlich';
    if (!formData.plz.trim()) newErrors.plz = 'PLZ ist erforderlich';
    if (formData.plz && !/^\d{5}$/.test(formData.plz)) newErrors.plz = 'PLZ muss 5 Ziffern haben';
    if (!formData.ort.trim()) newErrors.ort = 'Ort ist erforderlich';
    if (!formData.geburtsdatum) newErrors.geburtsdatum = 'Geburtsdatum ist erforderlich';
    if (!formData.email.trim()) newErrors.email = 'E-Mail ist erforderlich';
    if (formData.email && !formData.email.includes('@bundestag.de')) {
      newErrors.email = 'E-Mail muss @bundestag.de Domain haben';
    }

    // Zuordnungen validation
    zuordnungen.forEach((zuordnung, index) => {
      if (!zuordnung.eingruppierung) {
        newErrors[`zuordnung_${index}_eingruppierung`] = 'Eingruppierung ist erforderlich';
      }
      if (!zuordnung.zustaendigkeit.trim()) {
        newErrors[`zuordnung_${index}_zustaendigkeit`] = 'Zuständigkeit ist erforderlich';
      }
      if (!zuordnung.einstellungsdatum) {
        newErrors[`zuordnung_${index}_einstellungsdatum`] = 'Einstellungsdatum ist erforderlich';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        geburtsdatum: formData.geburtsdatum?.toISOString().split('T')[0],
        zuordnungen: zuordnungen.map(z => ({
          ...z,
          einstellungsdatum: z.einstellungsdatum?.toISOString().split('T')[0],
          befristung_bis: z.befristung_bis?.toISOString().split('T')[0] || null
        }))
      };

      const url = mitarbeiter ? `/api/mitarbeitende/${mitarbeiter.id}` : '/api/mitarbeitende';
      const method = mitarbeiter ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(mitarbeiter ? 'Mitarbeiter aktualisiert' : 'Mitarbeiter erstellt');
        onSuccess();
      } else {
        toast.error(result.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Error saving mitarbeiter:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const updateZuordnung = (index: number, field: keyof ZuordnungFormData, value: any) => {
    const newZuordnungen = [...zuordnungen];
    newZuordnungen[index] = { ...newZuordnungen[index], [field]: value };
    setZuordnungen(newZuordnungen);
  };

  const getEinsatzortOptions = () => {
    const options = ['Bundestag'];
    wahlkreisbueros.forEach(wb => {
      options.push(`Wahlkreisbüro ${wb.name}`);
    });
    return options;
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Bitte wähle eine Bilddatei aus");
      return;
    }

    // Check if file size exceeds 2MB or if image dimensions are not square
    const maxSizeBytes = 2 * 1024 * 1024; // 2MB
    const needsProcessing = file.size > maxSizeBytes;
    
    // Check image dimensions
    const img = new Image();
    img.onload = () => {
      const isSquare = img.naturalWidth === img.naturalHeight;
      
      if (needsProcessing || !isSquare) {
        // Show crop dialog for processing
        setPendingImageFile(file);
        setCropDialogOpen(true);
      } else {
        // File is already good, upload directly
        uploadProfilePicture(file);
      }
    };
    
    img.src = URL.createObjectURL(file);
  };

  // Upload profile picture (either original file or cropped base64)
  const uploadProfilePicture = async (file?: File, base64String?: string) => {
    try {
      let profilePictureUrl: string;
      
      if (base64String) {
        profilePictureUrl = base64String;
      } else if (file) {
        // Convert file to base64
        const reader = new FileReader();
        profilePictureUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      } else {
        throw new Error("No file or base64 string provided");
      }
      
      // Update form data and preview
      setFormData(prev => ({ ...prev, profilbild_url: profilePictureUrl }));
      setPreviewUrl(profilePictureUrl);
      toast.success("Profilbild erfolgreich aktualisiert");
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error("Fehler beim Hochladen des Profilbilds");
    }
  };

  // Handle crop completion
  const handleCropComplete = (croppedImageBase64: string) => {
    uploadProfilePicture(undefined, croppedImageBase64);
    setPendingImageFile(null);
  };

  // Remove profile picture
  const removeProfilePicture = () => {
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, profilbild_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Persönliche Daten */}
      <Card>
        <CardHeader>
          <CardTitle>Persönliche Daten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="vorname.nachname@bundestag.de"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Profilbild Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Profilbild</h3>
            <div className="flex items-center space-x-4">
              <CachedAvatar 
                src={previewUrl}
                alt="Profilbild"
                fallbackText={formData.name}
                size="lg"
                className="w-20 h-20"
              />
              <div className="flex flex-col space-y-2">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  disabled={loading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Bild hochladen
                </Button>
                {previewUrl && (
                  <Button
                    type="button"
                    onClick={removeProfilePicture}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Entfernen
                  </Button>
                )}
                <p className="text-sm text-muted-foreground">
                  JPG, PNG oder GIF. Maximal 2MB.
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleProfilePictureUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="strasse">Straße *</Label>
              <Input
                id="strasse"
                value={formData.strasse}
                onChange={(e) => setFormData({ ...formData, strasse: e.target.value })}
                className={errors.strasse ? 'border-red-500' : ''}
              />
              {errors.strasse && <p className="text-sm text-red-500 mt-1">{errors.strasse}</p>}
            </div>

            <div>
              <Label htmlFor="hausnummer">Hausnummer *</Label>
              <Input
                id="hausnummer"
                value={formData.hausnummer}
                onChange={(e) => setFormData({ ...formData, hausnummer: e.target.value })}
                className={errors.hausnummer ? 'border-red-500' : ''}
              />
              {errors.hausnummer && <p className="text-sm text-red-500 mt-1">{errors.hausnummer}</p>}
            </div>

            <div>
              <Label htmlFor="plz">PLZ *</Label>
              <Input
                id="plz"
                value={formData.plz}
                onChange={(e) => setFormData({ ...formData, plz: e.target.value })}
                placeholder="12345"
                maxLength={5}
                className={errors.plz ? 'border-red-500' : ''}
              />
              {errors.plz && <p className="text-sm text-red-500 mt-1">{errors.plz}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ort">Ort *</Label>
              <Input
                id="ort"
                value={formData.ort}
                onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
                className={errors.ort ? 'border-red-500' : ''}
              />
              {errors.ort && <p className="text-sm text-red-500 mt-1">{errors.ort}</p>}
            </div>

            <div>
              <DateInput
                label="Geburtsdatum"
                value={formData.geburtsdatum}
                onChange={(date) => setFormData({ ...formData, geburtsdatum: date })}
                required={true}
                error={errors.geburtsdatum}
                defaultMonth={new Date(1980, 0)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bueronummer">Büronummer</Label>
              <Input
                id="bueronummer"
                value={formData.bueronummer}
                onChange={(e) => setFormData({ ...formData, bueronummer: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="mobilnummer">Mobilnummer</Label>
              <Input
                id="mobilnummer"
                value={formData.mobilnummer}
                onChange={(e) => setFormData({ ...formData, mobilnummer: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zuordnungen */}
      <Card>
        <CardHeader>
          <CardTitle>MdB-Zuordnung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {zuordnungen.slice(0, 1).map((zuordnung, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Eingruppierung *</Label>
                  <Select
                    value={zuordnung.eingruppierung}
                    onValueChange={(value) => updateZuordnung(index, 'eingruppierung', value)}
                  >
                    <SelectTrigger className={errors[`zuordnung_${index}_eingruppierung`] ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Eingruppierung wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {eingruppierungOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[`zuordnung_${index}_eingruppierung`] && (
                    <p className="text-sm text-red-500 mt-1">{errors[`zuordnung_${index}_eingruppierung`]}</p>
                  )}
                </div>

                <div>
                  <Label>Einsatzort</Label>
                  <Select
                    value={zuordnung.einsatzort}
                    onValueChange={(value) => updateZuordnung(index, 'einsatzort', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getEinsatzortOptions().map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Zuständigkeit *</Label>
                <Input
                  value={zuordnung.zustaendigkeit}
                  onChange={(e) => updateZuordnung(index, 'zustaendigkeit', e.target.value)}
                  placeholder="z.B. Büroorganisation, Wissenschaftliche Mitarbeit..."
                  className={errors[`zuordnung_${index}_zustaendigkeit`] ? 'border-red-500' : ''}
                />
                {errors[`zuordnung_${index}_zustaendigkeit`] && (
                  <p className="text-sm text-red-500 mt-1">{errors[`zuordnung_${index}_zustaendigkeit`]}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <DateInput
                    label="Einstellungsdatum"
                    value={zuordnung.einstellungsdatum}
                    onChange={(date) => updateZuordnung(index, 'einstellungsdatum', date)}
                    required={true}
                    error={errors[`zuordnung_${index}_einstellungsdatum`]}
                  />
                </div>

                <div>
                  <DateInput
                    label="Befristung bis (optional)"
                    value={zuordnung.befristung_bis}
                    onChange={(date) => updateZuordnung(index, 'befristung_bis', date)}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Speichere...' : (mitarbeiter ? 'Aktualisieren' : 'Erstellen')}
        </Button>
      </div>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageFile={pendingImageFile}
        onCropComplete={handleCropComplete}
        maxSizeBytes={2 * 1024 * 1024} // 2MB
        targetDimensions={{ width: 400, height: 400 }}
      />
    </form>
  );
} 