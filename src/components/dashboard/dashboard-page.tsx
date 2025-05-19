
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WeatherCard } from "./weather-card";
import { QuickLinkCard } from "./quicklink-card";
import { navItems } from "@/lib/nav-items";
import Link from "next/link";
import type { NavItem } from "@/lib/nav-items";

const coreFeatures: NavItem[] = navItems.filter(item => item.href && item.href !== '/' && !item.isHeader && !item.children);
const inquiryFeaturesParent: NavItem | undefined = navItems.find(item => item.title === 'Kleine Anfrage');
const inquiryFeatures: NavItem[] = inquiryFeaturesParent?.children || [];


export function DashboardPage() {
  // Placeholder - in einer echten Anwendung käme der Name aus Authentifizierungsdaten
  const userName = "Max Mustermann"; 

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Willkommen zurück, {userName}!</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Schnellzugriff Werkzeuge</CardTitle>
              <CardDescription>Navigieren Sie zu den Hauptfunktionen der Suite.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {[...coreFeatures, ...inquiryFeatures].map((item) => (
                item.href ? ( 
                  <Link href={item.href} key={item.href} className="group">
                    <QuickLinkCard
                      title={item.title}
                      Icon={item.icon}
                      description={`Greifen Sie auf das ${item.title.toLowerCase()} Werkzeug zu.`}
                    />
                  </Link>
                ) : null
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-1 space-y-6">
            <WeatherCard city="Berlin" electoralDistrict="Musterwahlkreis" />
            <Card>
                <CardHeader>
                <CardTitle>Letzte Aktivitäten</CardTitle>
                <CardDescription>Übersicht Ihrer zuletzt generierten Dokumente.</CardDescription>
                </CardHeader>
                <CardContent>
                <p className="text-sm text-muted-foreground">Keine kürzlichen Aktivitäten. Generierte Dokumente werden hier erscheinen.</p>
                {/* Placeholder for recent activity list */}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
