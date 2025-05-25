import { PageLayout } from "@/components/page-layout";
import { SpeechWriterForm } from "@/components/redenschreiber/speech-writer-form";

const RedenschreiberPage = () => {
  return (
    <PageLayout
      title="Redenschreiber KI"
      description="Generiere Redeentwürfe durch Definition von Parametern wie Thema, Ton, Stil, politischer Fokus, Zielgruppe und Kernbotschaft."
    >
      <SpeechWriterForm />
    </PageLayout>
  );
}

export default RedenschreiberPage;

    