import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WeatherCard } from "./weather-card";
import { QuickLinkCard } from "./quicklink-card";
import { navItems } from "@/lib/nav-items";
import Link from "next/link";
import type { NavItem } from "@/lib/nav-items";
import { base } from '@/lib/airtable';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const coreFeatures: NavItem[] = navItems.filter(item => item.href && item.href !== '/' && !item.isHeader && !item.children);
const inquiryFeaturesParent: NavItem | undefined = navItems.find(item => item.title === 'Kleine Anfrage');
const inquiryFeatures: NavItem[] = inquiryFeaturesParent?.children || [];

export async function DashboardPage() {
  // Get authenticated user from NextAuth
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name ?? 'Unbekannte/r Nutzer/in';

  // Fetch image attachments from Airtable Picture-Records table
  const [pmRecords, skriptRecords, kaRecords] = await Promise.all([
    base('Picture-Records')
      .select({ filterByFormula: "{Status} = 'PM'", maxRecords: 1 })
      .firstPage(),
    base('Picture-Records')
      .select({ filterByFormula: "{Status} = 'skript'", maxRecords: 1 })
      .firstPage(),
    base('Picture-Records')
      .select({ filterByFormula: "{Status} = 'KA'", maxRecords: 1 })
      .firstPage(),
  ]);
  const pmImageField = pmRecords[0]?.get('Status');
  const skriptImageField = skriptRecords[0]?.get('Status');
  const kaImageField = kaRecords[0]?.get('Status');
  const pmImageSrc = Array.isArray(pmImageField) ? pmImageField[0]?.url : undefined;
  const skriptImageSrc = Array.isArray(skriptImageField) ? skriptImageField[0]?.url : undefined;
  const kaImageSrc = Array.isArray(kaImageField) ? kaImageField[0]?.url : undefined;

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
              {[...coreFeatures, ...inquiryFeatures].map((item) => {
                if (!item.href) return null;
                // Determine image source based on route
                let imageSrc: string | undefined;
                if (item.href === '/pressemitteilung') imageSrc = pmImageSrc;
                else if (item.href === '/skriptgenerator') imageSrc = skriptImageSrc;
                else if (item.href.startsWith('/kleine-anfragen')) imageSrc = kaImageSrc;
                return (
                  <Link href={item.href} key={item.href} className="group">
                    <QuickLinkCard
                      title={item.title}
                      Icon={item.icon}
                      description={`Greifen Sie auf das ${item.title.toLowerCase()} Werkzeug zu.`}
                      imageSrc={imageSrc}
                    />
                  </Link>
                );
              })}
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
