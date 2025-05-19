import { PageLayout } from "@/components/page-layout";
import { AnalyzeMinorInquiryForm } from "@/components/minor-inquiry/analyze-minor-inquiry-form";

export default function AnalyzeMinorInquiryPage() {
  return (
    <PageLayout
      title="Antwort auf Kleine Anfrage analysieren"
      description="Geben Sie den Text einer Kleinen Anfrage und die dazugehörige Antwort ein, um Schlüsseldaten zu extrahieren, potenzielle Probleme zu identifizieren und Zusammenfassungen zu generieren."
    >
      <AnalyzeMinorInquiryForm />
    </PageLayout>
  );
}

    