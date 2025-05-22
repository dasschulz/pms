import { PageLayout } from "@/components/page-layout";
import { SpeechWriterForm } from "@/components/redenschreiber/speech-writer-form";

export default function SpeechWriterPage() {
  return (
    <PageLayout
      title="Redenschreiber"
      description="Generieren Sie Redeentwürfe durch Definition von Parametern wie Thema, Ton, Stil, politischer Fokus, Zielgruppe und Kernbotschaft."
    >
      <SpeechWriterForm />
    </PageLayout>
  );
}

    