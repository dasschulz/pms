
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react"; // Für Avatar Fallback

export default function SettingsPage() {
  // Placeholder-Daten - in einer echten App kämen diese vom Backend/Auth-Service
  const userFullName = "Max Mustermann";
  const userEmail = "max.mustermann@bundestag.de";
  const userConstituency = "Musterwahlkreis";
  const userProfileImageUrl = "https://placehold.co/100x100.png"; // Platzhalter-Profilbild

  return (
    <PageLayout
      title="Einstellungen"
      description="Verwalten Sie Ihre Anwendungseinstellungen und Kontodetails."
    >
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="lg:col-span-1 xl:col-span-2">
          <CardHeader>
            <CardTitle>Profilinformationen</CardTitle>
            <CardDescription>Aktualisieren Sie Ihre persönlichen Daten, Wahlkreisdetails und Ihr Profilbild.</CardDescription>
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
                <div>
                  <Label htmlFor="name">Vollständiger Name</Label>
                  <Input id="name" defaultValue={userFullName} />
                </div>
                <div>
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input id="email" type="email" defaultValue={userEmail} />
                </div>
                <div>
                  <Label htmlFor="electoralDistrict">Wahlkreis</Label>
                  <Input id="electoralDistrict" defaultValue={userConstituency} />
                </div>
              </div>
            </div>
            <Button>Änderungen speichern</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passwort ändern</CardTitle>
            <CardDescription>Aktualisieren Sie Ihr Anmelde-Passwort.</CardDescription>
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
            <CardTitle>Benachrichtigungseinstellungen</CardTitle>
            <CardDescription>Konfigurieren Sie, wie Sie Benachrichtigungen erhalten.</CardDescription>
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
            <CardTitle>Erscheinungsbild</CardTitle>
            <CardDescription>Passen Sie das Aussehen und Verhalten der Anwendung an.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Theme-Einstellungen (Hell-/Dunkelmodus) werden normalerweise von Ihrem Betriebssystem oder Browsereinstellungen gehandhabt. Erweiterte Darstellungseinstellungen könnten hier in Zukunft hinzugefügt werden.</p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
