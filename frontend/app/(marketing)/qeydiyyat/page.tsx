import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { RegistrationWizard } from "@/components/wizard/RegistrationWizard";

export async function generateMetadata() {
  const t = await getTranslations("wizard.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

/**
 * `RegistrationWizard` reads `useSearchParams()` (for `?rol=`/UTM params)
 * so it must sit inside a Suspense boundary per Next's app-router rules.
 */
export default function QeydiyyatPage() {
  return (
    <Container className="py-10 sm:py-16">
      <Suspense fallback={null}>
        <RegistrationWizard />
      </Suspense>
    </Container>
  );
}
