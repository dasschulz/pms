import { PageLayout } from "@/components/page-layout";
import { GenerateMinorInquiryForm } from "@/components/minor-inquiry/generate-minor-inquiry-form";

export default function GenerateMinorInquiryPage() {
  return (
    <PageLayout
      title="Kleine Anfrage erstellen"
      description="Nutzen Sie KI, um Entwürfe für Kleine Anfragen basierend auf Ihrem Thema, Kontext und gewünschten Ergebnissen zu erstellen."
    >
      <GenerateMinorInquiryForm />
    </PageLayout>
  );
}

    