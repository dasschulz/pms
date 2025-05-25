import { PageLayout } from "@/components/page-layout";
import { PressReleaseForm } from "@/components/pressemitteilung/press-release-form";

export default function PressReleasePage() {
  return (
    <PageLayout
      title="Pressemitteilungsgenerator KI"
      description="Erstelle überzeugende Pressemitteilungen mit KI-Unterstützung. Definiere Parameter wie Ton, Stil und politischen Fokus, um maßgeschneiderte Inhalte zu generieren."
    >
      <PressReleaseForm />
    </PageLayout>
  );
}

    