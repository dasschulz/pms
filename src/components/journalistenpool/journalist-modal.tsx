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

interface Journalist {
  id: string;
  titel: string;
  vorname: string;
  nachname: string;
  haus: string;
  funktion: string;
  email: string;
  telefon: string;
  medium: string;
  ressort: string;
  zustaendig_fuer: string;
  land: string;
  region: string;
  schwerpunkt: string;
  themen: string[];
  zustimmung_datenspeicherung: boolean;
  angelegt_von: string;
  hinzugefuegt_von: string;
  created_at: string;
  avg_zuverlaessigkeit: number;
  avg_gewogenheit_linke: number;
  avg_nimmt_texte_an: number;
  avg_freundlichkeit: number;
  rating_count: number;
  region_display: string;
}

interface JournalistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  journalist?: Journalist | null;
  isEditing: boolean;
}

const mediumOptions = ['Presse', 'Radio', 'Fernsehen', 'Podcast', 'Video', 'Social Media'];

const schwerpunktOptions = ['Partei', 'Thema'];

const zustaendigFuerOptions = ['Bundespolitik', 'Landespolitik', 'Lokalpolitik'];

const laenderOptions = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
  'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen',
  'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'
];

const defaultRessorts = [
  'Innenpolitik', 'Außenpolitik', 'Soziales', 'Wirtschaft', 'Umwelt', 'Bildung',
  'Gesundheit', 'Digitalisierung', 'Verkehr', 'Energie', 'Arbeitsmarkt', 'Justiz',
  'Kultur', 'Sport', 'Landwirtschaft', 'Wissenschaft', 'Europa', 'Entwicklungspolitik'
];

const defaultThemen = [
  'Klimawandel', 'Arbeitsrechte', 'Mindestlohn', 'Rente', 'Gesundheitsreform',
  'Bildungspolitik', 'Verkehrswende', 'Energiewende', 'Mietpreisbremse', 'Steuerpolitik',
  'Europapolitik', 'Migrationspolitik', 'Digitalisierung', 'Corona-Politik', 'Außenpolitik'
];

export function JournalistModal({ isOpen, onClose, onSave, journalist, isEditing }: JournalistModalProps) {
  const [formData, setFormData] = useState({
    titel: '',
    vorname: '',
    nachname: '',
    haus: '',
    funktion: '',
    email: '',
    telefon: '',
    medium: '',
    ressort: '',
    neues_ressort: '',
    zustaendig_fuer: '',
    land: '',
    region: '',
    schwerpunkt: '',
    themen: [] as string[],
    neues_thema: '',
    zustimmung_datenspeicherung: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showNeuesRessort, setShowNeuesRessort] = useState(false);
  const [showNeuesThema, setShowNeuesThema] = useState(false);
  const [availableRessorts, setAvailableRessorts] = useState(defaultRessorts);
  const [availableThemen, setAvailableThemen] = useState(defaultThemen);

  useEffect(() => {
    if (journalist && isEditing) {
      setFormData({
        titel: journalist.titel || '',
        vorname: journalist.vorname || '',
        nachname: journalist.nachname || '',
        haus: journalist.haus || '',
        funktion: journalist.funktion || '',
        email: journalist.email || '',
        telefon: journalist.telefon || '',
        medium: journalist.medium || '',
        ressort: journalist.ressort || '',
        neues_ressort: '',
        zustaendig_fuer: journalist.zustaendig_fuer || '',
        land: journalist.land || '',
        region: journalist.region || '',
        schwerpunkt: journalist.schwerpunkt || '',
        themen: journalist.themen || [],
        neues_thema: '',
        zustimmung_datenspeicherung: journalist.zustimmung_datenspeicherung || false,
      });
    } else {
      // Reset form for new journalist
      setFormData({
        titel: '',
        vorname: '',
        nachname: '',
        haus: '',
        funktion: '',
        email: '',
        telefon: '',
        medium: '',
        ressort: '',
        neues_ressort: '',
        zustaendig_fuer: '',
        land: '',
        region: '',
        schwerpunkt: '',
        themen: [],
        neues_thema: '',
        zustimmung_datenspeicherung: false,
      });
    }
    setShowNeuesRessort(false);
    setShowNeuesThema(false);
    loadDynamicOptions();
  }, [journalist, isEditing, isOpen]);

  const loadDynamicOptions = async () => {
    try {
      // Load dynamic ressorts and themen from the database
      const [ressortsResponse, themenResponse] = await Promise.all([
        fetch('/api/journalistenpool/ressorts'),
        fetch('/api/journalistenpool/themen')
      ]);

      if (ressortsResponse.ok) {
        const ressorts = await ressortsResponse.json();
        const dbRessorts = ressorts.map((r: any) => r.name);
        // Create unique list by combining defaults and database ressorts
        const uniqueRessorts = [...new Set([...defaultRessorts, ...dbRessorts])];
        setAvailableRessorts(uniqueRessorts);
      }

      if (themenResponse.ok) {
        const themen = await themenResponse.json();
        const dbThemen = themen.map((t: any) => t.name);
        // Create unique list by combining defaults and database themen
        const uniqueThemen = [...new Set([...defaultThemen, ...dbThemen])];
        setAvailableThemen(uniqueThemen);
      }
    } catch (error) {
      console.error('Error loading dynamic options:', error);
      // Keep defaults if loading fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const finalRessort = showNeuesRessort && formData.neues_ressort.trim() 
        ? formData.neues_ressort.trim()
        : formData.ressort;

      const finalThemen = showNeuesThema && formData.neues_thema.trim() 
        ? [...formData.themen, formData.neues_thema.trim()]
        : formData.themen;
      
      const submitData = {
        titel: formData.titel,
        vorname: formData.vorname,
        nachname: formData.nachname,
        haus: formData.haus,
        funktion: formData.funktion,
        email: formData.email,
        telefon: formData.telefon,
        medium: formData.medium,
        ressort: finalRessort,
        zustaendig_fuer: formData.zustaendig_fuer,
        land: formData.zustaendig_fuer === 'Landespolitik' ? formData.land : '',
        region: formData.zustaendig_fuer === 'Lokalpolitik' ? formData.region : '',
        schwerpunkt: formData.schwerpunkt,
        themen: finalThemen,
        zustimmung_datenspeicherung: formData.zustimmung_datenspeicherung,
      };

      const url = isEditing && journalist ? `/api/journalistenpool/${journalist.id}` : '/api/journalistenpool';
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
      console.error('Error saving journalist:', error);
      alert('Fehler beim Speichern der Daten. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemaToggle = (thema: string) => {
    setFormData(prev => ({
      ...prev,
      themen: prev.themen.includes(thema)
        ? prev.themen.filter(item => item !== thema)
        : [...prev.themen, thema]
    }));
  };

  const removeThema = (thema: string) => {
    setFormData(prev => ({
      ...prev,
      themen: prev.themen.filter(item => item !== thema)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Journalist:in bearbeiten' : 'Neue:n Journalist:in hinzufügen'}
          </DialogTitle>
          <DialogDescription>
            Fülle die erforderlichen Felder aus. Mit * markierte Felder sind Pflichtfelder.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titel">Titel</Label>
              <Input
                id="titel"
                value={formData.titel}
                onChange={(e) => setFormData(prev => ({ ...prev, titel: e.target.value }))}
                placeholder="Dr., Prof., etc."
              />
            </div>
            <div>
              <Label htmlFor="vorname">Vorname *</Label>
              <Input
                id="vorname"
                value={formData.vorname}
                onChange={(e) => setFormData(prev => ({ ...prev, vorname: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="nachname">Nachname *</Label>
            <Input
              id="nachname"
              value={formData.nachname}
              onChange={(e) => setFormData(prev => ({ ...prev, nachname: e.target.value }))}
              required
            />
          </div>

          {/* Organization Information */}
          <div>
            <Label htmlFor="haus">Haus/Medium *</Label>
            <Input
              id="haus"
              value={formData.haus}
              onChange={(e) => setFormData(prev => ({ ...prev, haus: e.target.value }))}
              placeholder="z.B. Süddeutsche Zeitung, ARD, etc."
              required
            />
          </div>

          <div>
            <Label htmlFor="funktion">Funktion</Label>
            <Input
              id="funktion"
              value={formData.funktion}
              onChange={(e) => setFormData(prev => ({ ...prev, funktion: e.target.value }))}
              placeholder="z.B. Redakteur:in, Korrespondent:in, etc."
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="journalist@medium.de"
              />
            </div>
            <div>
              <Label htmlFor="telefon">Telefonnummer</Label>
              <Input
                id="telefon"
                value={formData.telefon}
                onChange={(e) => setFormData(prev => ({ ...prev, telefon: e.target.value }))}
                placeholder="+49 30 123456789"
              />
            </div>
          </div>

          {/* Media Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="medium">Medium *</Label>
              <Select value={formData.medium} onValueChange={(value) => setFormData(prev => ({ ...prev, medium: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Medium auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {mediumOptions.map(medium => (
                    <SelectItem key={medium} value={medium}>
                      {medium}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="ressort">Ressort *</Label>
              <div className="space-y-2">
                <Select value={formData.ressort} onValueChange={(value) => setFormData(prev => ({ ...prev, ressort: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ressort auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRessorts.map(ressort => (
                      <SelectItem key={ressort} value={ressort}>
                        {ressort}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowNeuesRessort(!showNeuesRessort)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Neues Ressort hinzufügen
                </Button>
                {showNeuesRessort && (
                  <Input
                    placeholder="Neues Ressort eingeben"
                    value={formData.neues_ressort}
                    onChange={(e) => setFormData(prev => ({ ...prev, neues_ressort: e.target.value }))}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Regional Responsibility */}
          <div>
            <Label htmlFor="zustaendig_fuer">Zuständig für *</Label>
            <Select value={formData.zustaendig_fuer} onValueChange={(value) => setFormData(prev => ({ ...prev, zustaendig_fuer: value, land: '', region: '' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Zuständigkeit auswählen" />
              </SelectTrigger>
              <SelectContent>
                {zustaendigFuerOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.zustaendig_fuer === 'Landespolitik' && (
            <div>
              <Label htmlFor="land">Bundesland *</Label>
              <Select value={formData.land} onValueChange={(value) => setFormData(prev => ({ ...prev, land: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Bundesland auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {laenderOptions.map(land => (
                    <SelectItem key={land} value={land}>
                      {land}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.zustaendig_fuer === 'Lokalpolitik' && (
            <div>
              <Label htmlFor="region">Region *</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                placeholder="z.B. Köln, Ruhrgebiet, Oberbayern"
                required
              />
            </div>
          )}

          {/* Focus */}
          <div>
            <Label htmlFor="schwerpunkt">Schwerpunkt *</Label>
            <Select value={formData.schwerpunkt} onValueChange={(value) => setFormData(prev => ({ ...prev, schwerpunkt: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Schwerpunkt auswählen" />
              </SelectTrigger>
              <SelectContent>
                {schwerpunktOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Topics */}
          <div>
            <Label>Themen *</Label>
            <div className="space-y-3">
              {formData.themen.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.themen.map(thema => (
                    <Badge key={thema} variant="secondary" className="flex items-center gap-1">
                      {thema}
                      <button
                        type="button"
                        onClick={() => removeThema(thema)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                {availableThemen.map((thema, index) => (
                  <div key={`thema-${thema}-${index}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`thema-${thema}-${index}`}
                      checked={formData.themen.includes(thema)}
                      onCheckedChange={() => handleThemaToggle(thema)}
                    />
                    <label htmlFor={`thema-${thema}-${index}`} className="text-sm">
                      {thema}
                    </label>
                  </div>
                ))}
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setShowNeuesThema(!showNeuesThema)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Neues Thema hinzufügen
              </Button>
              
              {showNeuesThema && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Neues Thema eingeben"
                    value={formData.neues_thema}
                    onChange={(e) => setFormData(prev => ({ ...prev, neues_thema: e.target.value }))}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (formData.neues_thema.trim()) {
                        handleThemaToggle(formData.neues_thema.trim());
                        setFormData(prev => ({ ...prev, neues_thema: '' }));
                        setShowNeuesThema(false);
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Data Consent */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="zustimmung_datenspeicherung"
              checked={formData.zustimmung_datenspeicherung}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, zustimmung_datenspeicherung: checked as boolean }))}
              required
            />
            <Label htmlFor="zustimmung_datenspeicherung" className="text-sm">
              Zustimmung zur Datenspeicherung erhalten *
            </Label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                'Speichere...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Aktualisieren' : 'Hinzufügen'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 