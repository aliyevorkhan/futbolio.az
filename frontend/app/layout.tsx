import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { montserrat } from "@/lib/fonts";
import { Providers } from "@/components/providers/Providers";
import "@/app/globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://futbolio.az";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Futbolio",
    template: "%s",
  },
  openGraph: {
    siteName: "Futbolio",
    locale: "az_AZ",
    type: "website",
    images: [{ url: "/brand/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="az" className={montserrat.variable}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
