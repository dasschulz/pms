import { PageLayout } from "@/components/page-layout";
import { PressReleaseForm } from "@/components/pressemitteilung/press-release-form";

export default function PressReleasePage() {
  return (
    <PageLayout
      title="Pressemitteilungsgenerator"
      description="Erstellen Sie überzeugende Pressemitteilungen mit KI-Unterstützung. Definieren Sie Parameter wie Ton, Stil und politischen Fokus, um maßgeschneiderte Inhalte zu generieren."
    >
      <PressReleaseForm />
    </PageLayout>
  );
}

    