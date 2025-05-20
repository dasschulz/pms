"use client";

import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react"; // Für Avatar Fallback
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  // Extract current user from session
  const user = session?.user;
  const userFullName = user?.name || "";
  const userEmail = user?.email || "";
  const userConstituency = user?.wahlkreis || "";
  const userProfileImageUrl = user?.image || "/images/default-avatar.png";
  const userLandesverband = user?.landesverband || "";

  const { theme, setTheme } = useTheme();
  // Ensure the component is mounted before using theme to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render nothing or a loading indicator until mounted
    // This helps prevent hydration mismatch with server-rendered theme class
    return null; 
  }

  return (
    <PageLayout
      title="Einstellungen"
      description="Verwalten Sie Ihre Anwendungseinstellungen und Kontodetails."
    >
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="lg:col-span-1 xl:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading-black">Profilinformationen</CardTitle>
            <CardDescription className="font-heading-light">Aktualisieren Sie Ihre persönlichen Daten, Wahlkreisdetails und Ihr Profilbild.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex flex-col items-center space-y-2">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userProfileImageUrl} alt={userFullName} data-ai-hint="user profile" />
                  <AvatarFallback>
                    <User className="h-12 w-12 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                {/* Für den Dateiupload wird eine komplexere Logik benötigt (react-hook-form, Server Action) */}
                <Button variant="outline" size="sm" onClick={() => alert("Profilbild ändern (Platzhalter)")}>
                  Bild ändern
                </Button>
                <Input id="profilePicture" type="file" className="hidden" /> 
                {/* Das Input-Feld kann versteckt und per Klick auf den Button getriggert werden */}
              </div>
              <div className="flex-grow space-y-4">
                <div className="flex gap-4">
                  <div className="basis-1/5 min-w-[90px]">
                    <Label htmlFor="title">Titel</Label>
                    <Select defaultValue="Dr.">
                      <SelectTrigger>
                        <SelectValue placeholder="Titel wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dr.">Dr.</SelectItem>
                        <SelectItem value="Prof.">Prof.</SelectItem>
                        <SelectItem value="Prof. Dr.">Prof. Dr.</SelectItem>
                        <SelectItem value="Dipl.-Ing.">Dipl.-Ing.</SelectItem>
                        <SelectItem value="Dipl.-Kfm.">Dipl.-Kfm.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="basis-4/5">
                    <Label htmlFor="name">Vollständiger Name</Label>
                    <Input id="name" defaultValue={userFullName} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input id="email" type="email" defaultValue={userEmail} />
                </div>
                <div className="flex gap-4">
                  <div className="basis-2/5 min-w-[120px]">
                    <Label htmlFor="stateAssociation">Landesverband</Label>
                    <Select defaultValue={userLandesverband}>
                      <SelectTrigger>
                        <SelectValue placeholder="Land wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baden-Württemberg">Baden-Württemberg</SelectItem>
                        <SelectItem value="Bayern">Bayern</SelectItem>
                        <SelectItem value="Berlin">Berlin</SelectItem>
                        <SelectItem value="Brandenburg">Brandenburg</SelectItem>
                        <SelectItem value="Bremen">Bremen</SelectItem>
                        <SelectItem value="Hamburg">Hamburg</SelectItem>
                        <SelectItem value="Hessen">Hessen</SelectItem>
                        <SelectItem value="Mecklenburg-Vorpommern">Mecklenburg-Vorpommern</SelectItem>
                        <SelectItem value="Niedersachsen">Niedersachsen</SelectItem>
                        <SelectItem value="Nordrhein-Westfalen">Nordrhein-Westfalen</SelectItem>
                        <SelectItem value="Rheinland-Pfalz">Rheinland-Pfalz</SelectItem>
                        <SelectItem value="Saarland">Saarland</SelectItem>
                        <SelectItem value="Sachsen">Sachsen</SelectItem>
                        <SelectItem value="Sachsen-Anhalt">Sachsen-Anhalt</SelectItem>
                        <SelectItem value="Schleswig-Holstein">Schleswig-Holstein</SelectItem>
                        <SelectItem value="Thüringen">Thüringen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="basis-3/5">
                    <Label htmlFor="electoralDistrict">Wahlkreis</Label>
                    <Input id="electoralDistrict" defaultValue={userConstituency} />
                  </div>
                </div>
              </div>
            </div>
            <Button>Änderungen speichern</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading-black">Passwort ändern</CardTitle>
            <CardDescription className="font-heading-light">Aktualisieren Sie Ihr Anmelde-Passwort.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div>
              <Label htmlFor="newPassword">Neues Passwort</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">Neues Passwort bestätigen</Label>
              <Input id="confirmNewPassword" type="password" />
            </div>
            <Button>Passwort speichern</Button>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1 xl:col-span-3"> {/* Nimmt volle Breite auf xl, halbe auf lg */}
          <CardHeader>
            <CardTitle className="font-heading-black">Benachrichtigungseinstellungen</CardTitle>
            <CardDescription className="font-heading-light">Konfigurieren Sie, wie Sie Benachrichtigungen erhalten.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications" className="flex flex-col space-y-1">
                <span>E-Mail-Benachrichtigungen</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Erhalten Sie Benachrichtigungen über wichtige Updates per E-Mail.
                </span>
              </Label>
              <Switch id="emailNotifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="inAppNotifications" className="flex flex-col space-y-1">
                <span>In-App-Benachrichtigungen</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Benachrichtigungen innerhalb der DIE LINKE Suite anzeigen.
                </span>
              </Label>
              <Switch id="inAppNotifications" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 xl:col-span-3">
          <CardHeader>
            <CardTitle className="font-heading-black">Erscheinungsbild</CardTitle>
            <CardDescription className="font-heading-light">Passen Sie das Aussehen und Verhalten der Anwendung an.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor="theme-toggle" className="text-sm font-medium">
                  Dunkelmodus
                </Label>
                <p className="text-xs text-muted-foreground">
                  Wechseln Sie zwischen hellem und dunklem Design.
                </p>
              </div>
              <Switch
                id="theme-toggle"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                aria-label="Dunkelmodus umschalten"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Die Standardeinstellung ist oft \\'system\\', welche die Einstellungen Ihres Betriebssystems widerspiegelt. Diese Option schaltet direkt zwischen Hell und Dunkel um.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
