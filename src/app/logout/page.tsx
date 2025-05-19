
"use client";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    // In a real application, you would call your authentication service's logout method here.
    // For example: firebase.auth().signOut(); or send a request to your backend logout endpoint.
    console.log("Abmeldevorgang eingeleitet (Platzhalter)...");
    // Redirect to login page or home page after a short delay
    // const timer = setTimeout(() => {
    //   window.location.href = '/login'; // Or your login page
    // }, 3000);
    // return () => clearTimeout(timer);
  }, []);

  return (
    <PageLayout
      title="Abmelden"
      description="Sie werden von der DIE LINKE Suite abgemeldet."
    >
      <Card>
        <CardHeader>
          <CardTitle>Abmeldung erfolgreich (Platzhalter)</CardTitle>
          <CardDescription>Sie wurden erfolgreich abgemeldet. Dies ist eine Platzhalterseite.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>In einer echten Anwendung würde diese Seite den tatsächlichen Abmeldevorgang durchführen und Sie dann weiterleiten.</p>
          <p>Sie werden in Kürze weitergeleitet, oder Sie können auf die Schaltfläche unten klicken.</p>
          <Link href="/" passHref>
            <Button>Zurück zum Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </PageLayout>
  );
}

    