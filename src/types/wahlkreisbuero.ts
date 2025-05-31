export interface Wahlkreisbuero {
  id: string;
  user_id: string;
  name: string;
  photo_url?: string;
  
  // Address
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  
  // Contact
  telefon?: string;
  email?: string;
  
  // Details
  barrierefreiheit?: boolean;
  
  // Coordinates
  latitude?: number;
  longitude?: number;
  
  // Relations
  mitarbeiter?: WahlkreisbueroMitarbeiter[];
  oeffnungszeiten?: WahlkreisbueroOeffnungszeiten[];
  sprechstunden?: WahlkreisbueroSprechstunden[];
  beratungen?: WahlkreisbueroBeratungen[];
  
  created_at: string;
  updated_at: string;
}

export interface WahlkreisbueroMitarbeiter {
  id: string;
  wahlkreisbuero_id: string;
  name: string;
  funktion: string;
  telefon?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface WahlkreisbueroOeffnungszeiten {
  id: string;
  wahlkreisbuero_id: string;
  wochentag: number; // 1=Montag, 7=Sonntag
  von_zeit?: string;
  bis_zeit?: string;
  geschlossen: boolean;
  created_at: string;
  updated_at: string;
}

export interface WahlkreisbueroSprechstunden {
  id: string;
  wahlkreisbuero_id: string;
  mdb_name: string;
  wochentag?: number; // NULL = nach Vereinbarung
  von_zeit?: string;
  bis_zeit?: string;
  beschreibung?: string;
  created_at: string;
  updated_at: string;
}

export type BeratungTyp = 'schuldenberatung' | 'buergergeldberatung' | 'mietrechtsberatung' | 'arbeitsrechtsberatung';

export interface WahlkreisbueroBeratungen {
  id: string;
  wahlkreisbuero_id: string;
  typ: BeratungTyp;
  anbieter: string;
  wochentag?: number; // NULL = nach Vereinbarung
  von_zeit?: string;
  bis_zeit?: string;
  beschreibung?: string;
  created_at: string;
  updated_at: string;
}

// Form types for creating/editing
export interface WahlkreisbueroFormData {
  name: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  barrierefreiheit?: boolean;
  photo?: File;
}

export interface MitarbeiterFormData {
  name: string;
  funktion: string;
  telefon?: string;
  email?: string;
}

export interface OeffnungszeitenFormData {
  wochentag: number;
  von_zeit?: string;
  bis_zeit?: string;
  geschlossen: boolean;
}

export interface SprechstundenFormData {
  mdb_name: string;
  wochentag?: number;
  von_zeit?: string;
  bis_zeit?: string;
  beschreibung?: string;
}

export interface BeratungsFormData {
  typ: BeratungTyp;
  anbieter: string;
  wochentag?: number;
  von_zeit?: string;
  bis_zeit?: string;
  beschreibung?: string;
}

// Utility types
export const WOCHENTAGE = [
  { value: 1, label: 'Montag' },
  { value: 2, label: 'Dienstag' },
  { value: 3, label: 'Mittwoch' },
  { value: 4, label: 'Donnerstag' },
  { value: 5, label: 'Freitag' },
  { value: 6, label: 'Samstag' },
  { value: 7, label: 'Sonntag' },
] as const;

export const BERATUNG_TYPEN = [
  { value: 'schuldenberatung', label: 'Schuldenberatung' },
  { value: 'buergergeldberatung', label: 'Bürgergeldberatung' },
  { value: 'mietrechtsberatung', label: 'Mietrechtsberatung' },
  { value: 'arbeitsrechtsberatung', label: 'Arbeitsrechtsberatung' },
] as const;

// Geocoding types
export interface GeocodeResult {
  latitude: number | null;
  longitude: number | null;
  success: boolean;
  message?: string;
} 