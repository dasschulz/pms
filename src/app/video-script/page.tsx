import { PageLayout } from "@/components/page-layout";
import { VideoScriptForm } from "@/components/video-script/video-script-form";

export default function VideoScriptPage() {
  return (
    <PageLayout
      title="Kurz-Videoskript-Generator"
      description="Erstellen Sie ansprechende Kurz-Videoskripte. Definieren Sie Sprecherattribute, Populismusniveau und Schlüsselthemen, um maßgeschneiderte Inhalte zu generieren."
    >
      <VideoScriptForm />
    </PageLayout>
  );
}

    