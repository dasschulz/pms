import { PageLayout } from "@/components/page-layout";
import { GenerateMinorInquiryForm } from "@/components/kleine-anfragen/generate-minor-inquiry-form";

export default function GenerateMinorInquiryPage() {
  return (
    <PageLayout
      title="Kleine Anfragen Generator"
      description="Nutze KI, um Entwürfe für Kleine Anfragen basierend auf deinem Thema, Kontext und gewünschten Ergebnissen zu erstellen."
    >
      <GenerateMinorInquiryForm />
    </PageLayout>
  );
}

    