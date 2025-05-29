'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Save, Plus } from 'lucide-react';

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

interface ReferentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  referent?: Referent | null;
  isEditing: boolean;
}

const verfuegbarkeitOptions = ['Anhörung', 'Veranstaltung', 'Beratung'];

const fachbereichOptions = [
  'Wirtschaft',
  'Umwelt',
  'Soziales',
  'Bildung',
  'Gesundheit',
  'Digitalisierung',
  'Verkehr',
  'Energie',
  'Arbeitsmarkt',
  'Außenpolitik',
  'Innenpolitik',
  'Justiz',
  'Kultur',
  'Sport',
  'Landwirtschaft',
  'Wissenschaft',
  'Europa',
  'Entwicklungspolitik'
];

export function ReferentModal({ isOpen, onClose, onSave, referent, isEditing }: ReferentModalProps) {
  const [formData, setFormData] = useState({
    titel: '',
    vorname: '',
    nachname: '',
    fachbereich: [] as string[],
    neuer_fachbereich: '',
    institution: '',
    ort: '',
    email: '',
    telefon: '',
    verfuegbar_fuer: [] as string[],
    zustimmung_datenspeicherung: false,
    zustimmung_kontakt_andere_mdb: false,
    parteimitglied: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showNeuerFachbereich, setShowNeuerFachbereich] = useState(false);

  useEffect(() => {
    if (referent && isEditing) {
      setFormData({
        titel: referent.titel || '',
        vorname: referent.vorname || '',
        nachname: referent.nachname || '',
        fachbereich: referent.fachbereich || [],
        neuer_fachbereich: '',
        institution: referent.institution || '',
        ort: referent.ort || '',
        email: referent.email || '',
        telefon: referent.telefon || '',
        verfuegbar_fuer: referent.verfuegbar_fuer || [],
        zustimmung_datenspeicherung: referent.zustimmung_datenspeicherung || false,
        zustimmung_kontakt_andere_mdb: referent.zustimmung_kontakt_andere_mdb || false,
        parteimitglied: referent.parteimitglied || false,
      });
    } else {
      // Reset form for new referent
      setFormData({
        titel: '',
        vorname: '',
        nachname: '',
        fachbereich: [],
        neuer_fachbereich: '',
        institution: '',
        ort: '',
        email: '',
        telefon: '',
        verfuegbar_fuer: [],
        zustimmung_datenspeicherung: false,
        zustimmung_kontakt_andere_mdb: false,
        parteimitglied: false,
      });
    }
    setShowNeuerFachbereich(false);
  }, [referent, isEditing, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const finalFachbereiche = showNeuerFachbereich && formData.neuer_fachbereich.trim() 
        ? [...formData.fachbereich, formData.neuer_fachbereich.trim()]
        : formData.fachbereich;
      
      const submitData = {
        titel: formData.titel,
        vorname: formData.vorname,
        nachname: formData.nachname,
        fachbereich: finalFachbereiche,
        institution: formData.institution,
        ort: formData.ort,
        email: formData.email,
        telefon: formData.telefon,
        verfuegbar_fuer: formData.verfuegbar_fuer,
        zustimmung_datenspeicherung: formData.zustimmung_datenspeicherung,
        zustimmung_kontakt_andere_mdb: formData.zustimmung_kontakt_andere_mdb,
        parteimitglied: formData.parteimitglied,
      };

      const url = isEditing && referent ? `/api/referentenpool/${referent.id}` : '/api/referentenpool';
      const method = isEditing ? 'PUT' : 'POST';

      console.log('Submitting data:', submitData);
      console.log('URL:', url, 'Method:', method);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        onSave();
        onClose();
      } else {
        const responseText = await response.text();
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          responseText,
          url,
          method
        });
        
        try {
          const errorData = JSON.parse(responseText);
          console.error('Parsed error data:', errorData);
          alert(`Fehler beim Speichern: ${errorData.error || response.statusText || 'Unbekannter Fehler'}`);
        } catch (parseError) {
          console.error('Could not parse error response as JSON:', parseError);
          alert(`Fehler beim Speichern: ${response.statusText || 'Unbekannter Fehler'} (Status: ${response.status})`);
        }
      }
    } catch (error) {
      console.error('Error saving referent:', error);
      alert('Fehler beim Speichern der Daten. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerfuegbarkeitToggle = (option: string) => {
    setFormData(prev => ({
      ...prev,
      verfuegbar_fuer: prev.verfuegbar_fuer.includes(option)
        ? prev.verfuegbar_fuer.filter(item => item !== option)
        : [...prev.verfuegbar_fuer, option]
    }));
  };

  const handleFachbereichToggle = (bereich: string) => {
    setFormData(prev => ({
      ...prev,
      fachbereich: prev.fachbereich.includes(bereich)
        ? prev.fachbereich.filter(item => item !== bereich)
        : [...prev.fachbereich, bereich]
    }));
  };

  const handleFachbereichChange = (value: string) => {
    if (value === 'new') {
      setShowNeuerFachbereich(true);
      setFormData(prev => ({ ...prev, neuer_fachbereich: '' }));
    } else {
      setShowNeuerFachbereich(false);
      setFormData(prev => ({ ...prev, neuer_fachbereich: '' }));
    }
  };

  const isFormValid = 
    formData.vorname.trim() &&
    formData.nachname.trim() &&
    (formData.fachbereich.length > 0 || (showNeuerFachbereich && formData.neuer_fachbereich.trim())) &&
    formData.institution.trim() &&
    formData.verfuegbar_fuer.length > 0 &&
    formData.zustimmung_datenspeicherung;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Referent:in bearbeiten' : 'Neue:n Referent:in hinzufügen'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Bearbeite die Daten des:der Referent:in und speichere deine Änderungen.'
              : 'Füge eine:n neue:n Expert:in zu deinem Referent:innen-Pool hinzu.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="titel">Titel (optional)</Label>
              <Input
                id="titel"
                value={formData.titel}
                onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
                placeholder="z.B. Dr., Prof."
              />
            </div>
            <div>
              <Label htmlFor="vorname">Vorname *</Label>
              <Input
                id="vorname"
                value={formData.vorname}
                onChange={(e) => setFormData({ ...formData, vorname: e.target.value })}
                placeholder="Vorname"
                required
              />
            </div>
            <div>
              <Label htmlFor="nachname">Nachname *</Label>
              <Input
                id="nachname"
                value={formData.nachname}
                onChange={(e) => setFormData({ ...formData, nachname: e.target.value })}
                placeholder="Nachname"
                required
              />
            </div>
          </div>

          {/* Fachbereich */}
          <div>
            <Label htmlFor="fachbereich">Fachbereich *</Label>
            <div className="flex flex-wrap gap-3">
              {fachbereichOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`fachbereich-${option}`}
                    checked={formData.fachbereich.includes(option)}
                    onCheckedChange={() => handleFachbereichToggle(option)}
                  />
                  <Label htmlFor={`fachbereich-${option}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            
            {/* Add new fachbereich button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNeuerFachbereich(!showNeuerFachbereich)}
              className="mt-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              {showNeuerFachbereich ? 'Abbrechen' : 'Neuen Fachbereich hinzufügen'}
            </Button>
            
            {showNeuerFachbereich && (
              <Input
                className="mt-2"
                value={formData.neuer_fachbereich}
                onChange={(e) => setFormData({ ...formData, neuer_fachbereich: e.target.value })}
                placeholder="Neuen Fachbereich eingeben"
              />
            )}
            
            {/* Show selected fachbereiche */}
            {formData.fachbereich.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {formData.fachbereich.map(bereich => (
                  <Badge key={bereich} variant="secondary" className="text-xs">
                    {bereich}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Institution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="institution">Institution *</Label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="z.B. Universität Berlin, Forschungsinstitut..."
                required
              />
            </div>

            {/* Ort */}
            <div>
              <Label htmlFor="ort">Ort</Label>
              <Input
                id="ort"
                value={formData.ort}
                onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
                placeholder="z.B. Berlin"
              />
            </div>
          </div>

          {/* Parteimitglied */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="parteimitglied"
              checked={formData.parteimitglied}
              onCheckedChange={(checked) => setFormData({ ...formData, parteimitglied: !!checked })}
            />
            <Label htmlFor="parteimitglied" className="text-sm">
              Parteimitglied
            </Label>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@beispiel.de"
              />
            </div>
            <div>
              <Label htmlFor="telefon">Telefonnummer</Label>
              <Input
                id="telefon"
                value={formData.telefon}
                onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                placeholder="+49 30 123456789"
              />
            </div>
          </div>

          {/* Verfügbarkeit */}
          <div>
            <Label className="text-sm font-medium">Verfügbar für *</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Wähle aus, für welche Arten von Terminen diese:r Referent:in verfügbar ist.
            </p>
            <div className="flex flex-wrap gap-3">
              {verfuegbarkeitOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`verfuegbar-${option}`}
                    checked={formData.verfuegbar_fuer.includes(option)}
                    onCheckedChange={() => handleVerfuegbarkeitToggle(option)}
                  />
                  <Label htmlFor={`verfuegbar-${option}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {formData.verfuegbar_fuer.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {formData.verfuegbar_fuer.map(item => (
                  <Badge key={item} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium text-sm">Einverständniserklärungen *</h3>
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="datenspeicherung"
                checked={formData.zustimmung_datenspeicherung}
                onCheckedChange={(checked) => setFormData({ ...formData, zustimmung_datenspeicherung: !!checked })}
                required
              />
              <Label htmlFor="datenspeicherung" className="text-sm leading-5">
                Zustimmung zur Datenspeicherung: Ich stimme der Speicherung und Verarbeitung meiner Daten zu.
              </Label>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="kontakt-andere"
                checked={formData.zustimmung_kontakt_andere_mdb}
                onCheckedChange={(checked) => setFormData({ ...formData, zustimmung_kontakt_andere_mdb: !!checked })}
              />
              <div className="space-y-1">
                <Label htmlFor="kontakt-andere" className="text-sm leading-5">
                  Zustimmung zur Kontaktierung durch andere MdB: Ich stimme zu, dass auch andere Mitglieder des Bundestags mich kontaktieren dürfen.
                </Label>
                <p className="text-xs text-muted-foreground">
                  Wenn nicht angekreuzt, wird diese:r Referent:in ausschließlich dir angezeigt.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Speichern...' : (isEditing ? 'Änderungen speichern' : 'Referent:in hinzufügen')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 