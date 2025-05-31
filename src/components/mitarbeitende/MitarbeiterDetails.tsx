"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CachedAvatar } from "@/components/ui/cached-avatar";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MapPin, Phone, Mail, Calendar, Building2, User, Edit } from "lucide-react";
import type { MitarbeiterVollstaendig } from '../../app/mitarbeitende/page';

interface MitarbeiterDetailsProps {
  mitarbeiter: MitarbeiterVollstaendig;
  onEdit: () => void;
  onClose: () => void;
}

const eingruppierungColors = {
  'Bürokraft': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Sekretär:in': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', 
  'Sachbearbeiter:in': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'Wissenschaftliche:r Mitarbeiter:in': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
};

export default function MitarbeiterDetails({ mitarbeiter, onEdit, onClose }: MitarbeiterDetailsProps) {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP", { locale: de });
  };

  return (
    <div className="space-y-6">
      {/* Header with Profile Picture and Basic Info */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <CachedAvatar 
          src={mitarbeiter.profilbild_url}
          alt={mitarbeiter.name}
          fallbackText={mitarbeiter.name}
          size="lg"
          className="w-24 h-24"
        />
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">{mitarbeiter.name}</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${mitarbeiter.email}`} className="hover:text-foreground">
                {mitarbeiter.email}
              </a>
            </div>
            {mitarbeiter.mobilnummer && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a href={`tel:${mitarbeiter.mobilnummer}`} className="hover:text-foreground">
                  {mitarbeiter.mobilnummer}
                </a>
              </div>
            )}
            {mitarbeiter.bueronummer && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Büro {mitarbeiter.bueronummer}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onEdit} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Bearbeiten
          </Button>
        </div>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Persönliche Daten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Adresse</h4>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p>{mitarbeiter.strasse} {mitarbeiter.hausnummer}</p>
                  <p>{mitarbeiter.plz} {mitarbeiter.ort}</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Geburtsdatum</h4>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(mitarbeiter.geburtsdatum)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>MdB-Zuordnungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mitarbeiter.zuordnungen.map((zuordnung) => (
              <div key={zuordnung.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium">{zuordnung.mdb_name}</h4>
                    <p className="text-sm text-muted-foreground">{zuordnung.zustaendigkeit}</p>
                  </div>
                  <Badge className={eingruppierungColors[zuordnung.eingruppierung]}>
                    {zuordnung.eingruppierung}
                  </Badge>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Einsatzort:</span>
                    <p>{zuordnung.einsatzort}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Einstellung:</span>
                    <p>{formatDate(zuordnung.einstellungsdatum)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Befristung:</span>
                    <p>{zuordnung.befristung_bis ? formatDate(zuordnung.befristung_bis) : 'Unbefristet'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadaten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Erstellt:</span>
              <p>{formatDate(mitarbeiter.created_at)}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Letzte Änderung:</span>
              <p>{formatDate(mitarbeiter.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onClose}>
          Schließen
        </Button>
        <Button onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Bearbeiten
        </Button>
      </div>
    </div>
  );
} 