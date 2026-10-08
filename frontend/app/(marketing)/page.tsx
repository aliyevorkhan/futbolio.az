import { getTranslations } from "next-intl/server";
import { buildOrganizationJsonLd } from "@/lib/jsonld";
import { JsonLdScript } from "@/components/shared/JsonLdScript";
import { HeroSection } from "@/components/home/HeroSection";
import { BizKimikSection } from "@/components/home/BizKimikSection";
import { XidmetlerSection } from "@/components/home/XidmetlerSection";
import { NeceIsleyirSection } from "@/components/home/NeceIsleyirSection";
import { SeviyyelerSection } from "@/components/home/SeviyyelerSection";
import { VideolarSection } from "@/components/home/VideolarSection";
import { ZemanetSection } from "@/components/home/ZemanetSection";
import { QosulCtaSection } from "@/components/home/QosulCtaSection";
import { SuallarSection } from "@/components/home/SuallarSection";
import { ElaqeFooterSection } from "@/components/home/ElaqeFooterSection";

export async function generateMetadata() {
  const t = await getTranslations("meta.home");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function HomePage() {
  return (
    <>
      <JsonLdScript data={buildOrganizationJsonLd()} />
      <HeroSection />
      <BizKimikSection />
      <XidmetlerSection />
      <NeceIsleyirSection />
      <SeviyyelerSection />
      <VideolarSection />
      <ZemanetSection />
      <QosulCtaSection />
      <SuallarSection />
      <ElaqeFooterSection />
    </>
  );
}
