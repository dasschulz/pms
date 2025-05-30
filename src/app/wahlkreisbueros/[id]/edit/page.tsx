'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PageLayout } from '@/components/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WahlkreisbueroEditPage({ params }: PageProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Unwrap params Promise for Next.js 15 compatibility
  const { id } = use(params);

  useEffect(() => {
    // Redirect to detail page where the edit modal is now available
    router.replace(`/wahlkreisbueros/${id}`);
  }, [id, router]);

  if (!session) {
    return (
      <PageLayout
        title="Wahlkreisbüro bearbeiten"
        description="Bitte melde dich an, um diese Seite zu nutzen"
      >
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Du musst angemeldet sein, um diese Seite zu nutzen.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Weiterleitung..."
      description="Du wirst zur Detailansicht weitergeleitet"
      headerActions={
        <Button 
          variant="outline" 
          onClick={() => router.push('/wahlkreisbueros')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Übersicht
        </Button>
      }
    >
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Bearbeitung wurde vereinfacht</h2>
              <p className="text-muted-foreground mb-4">
                Die Bearbeitungsfunktion ist jetzt direkt in der Detailansicht verfügbar.
              </p>
              <Button onClick={() => router.push(`/wahlkreisbueros/${id}`)}>
                Zur Detailansicht
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
} 