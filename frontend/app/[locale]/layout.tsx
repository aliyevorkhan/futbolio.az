import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { inter, manrope } from "@/lib/fonts";
import { Providers } from "@/components/providers/Providers";
import { cn } from "@/lib/utils";
import "@/app/globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://futbolio.az";

const OG_LOCALE: Record<AppLocale, string> = {
  az: "az_AZ",
  ru: "ru_RU",
  en: "en_US",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: "Futbolio",
      template: "%s",
    },
    openGraph: {
      siteName: "Futbolio",
      locale: OG_LOCALE[locale as AppLocale] ?? "az_AZ",
      type: "website",
      images: [{ url: "/brand/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/brand/og-image.png"],
    },
  };
}

export default async function LocaleRootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as AppLocale)) {
    notFound();
  }

  // Enables static rendering for every locale (next-intl requirement when
  // using the [locale] segment pattern with generateStaticParams).
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={cn(inter.variable, manrope.variable)}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
