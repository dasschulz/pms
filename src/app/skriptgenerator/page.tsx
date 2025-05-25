"use client"; // Needs to be a client component for useState

import { useState } from "react"; // Import useState
import { PageLayout } from "@/components/page-layout";
import { VideoScriptForm } from "@/components/skriptgenerator/video-script-form";
import { Button } from "@/components/ui/button"; // Import Button
import { Settings as SettingsIcon } from "lucide-react"; // Import SettingsIcon

export default function VideoScriptPage() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const settingsButton = (
    <Button 
      variant="default" // Keep default for basic button structure, override colors
      className="bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent"
      onClick={() => setIsSettingsModalOpen(true)}
    >
      <SettingsIcon className="mr-2 h-4 w-4" />
      Meine Einstellungen
    </Button>
  );

  return (
    <PageLayout
      title="Skriptgenerator KI"
      description="Erstelle ansprechende Kurz-Videoskripte. Definiere Sprecherattribute, Populismusniveau und Schlüsselthemen, um maßgeschneiderte Inhalte zu generieren."
      headerActions={settingsButton} // Pass the button here
    >
      <VideoScriptForm 
        isSettingsModalOpen={isSettingsModalOpen} 
        onSettingsModalOpenChange={setIsSettingsModalOpen} 
      />
    </PageLayout>
  );
}

    