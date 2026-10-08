/**
 * JSON-LD builders for structured data. Rendered via
 * `components/shared/JsonLdScript.tsx`. Keep these pure functions (no
 * fetching/side effects) so callers build them from data they already
 * have in hand — in particular, FAQ JSON-LD must be built from the
 * exact same array the visible accordion renders, never a separate
 * hardcoded copy.
 */

export interface FaqItem {
  id: string | number;
  question: string;
  answer: string;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://futbolio.az";

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Futbolio",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo.svg`,
    description:
      "Bakıda həvəskar futbol komandaları üçün oyunçu, qapıçı, hakim və həkim tapan xidmət.",
    areaServed: {
      "@type": "City",
      name: "Baku",
    },
  };
}

export function buildFaqPageJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
