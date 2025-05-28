"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Phone, Mail, Clock, Users, Calendar, ExternalLink } from "lucide-react";

export default function WahlkreisbuerosPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Wahlkreisbüros</h1>
          <p className="text-muted-foreground">Übersicht und Verwaltung der Wahlkreisbüros</p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">In Entwicklung</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Diese Seite wird bald verfügbar sein. Hier wirst du deine Wahlkreisbüros verwalten, 
                Sprechstunden planen und Kontaktinformationen pflegen können.
              </p>
            </div>
            <Button variant="outline" disabled>
              <Calendar className="mr-2 h-4 w-4" />
              Bald verfügbar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview of planned features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Standorte verwalten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Übersicht aller Wahlkreisbüro-Standorte mit Adressen, Öffnungszeiten und Kontaktdaten.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sprechstunden planen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Terminplanung und -verwaltung für Bürgersprechstunden in den Wahlkreisbüros.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team verwalten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Übersicht der Mitarbeiter*innen in den Wahlkreisbüros und deren Verantwortlichkeiten.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Kontakt & Erreichbarkeit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Zentrale Verwaltung aller Kontaktinformationen und Erreichbarkeitszeiten.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Bürgeranfragen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Integration von Bürgeranfragen und deren Weiterleitung an die zuständigen Büros.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Öffentliche Darstellung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automatische Generierung von Wahlkreisbüro-Informationen für die Website.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Development Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Entwicklungsstand</h3>
            <p className="text-sm text-muted-foreground">
              Diese Funktionalität ist Teil der nächsten Entwicklungsphase der DIE LINKE Suite. 
              Bei Fragen oder Anregungen zu den geplanten Features wende dich an das Entwicklungsteam.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 