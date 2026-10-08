import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { inter, manrope } from "@/lib/fonts";
import { Providers } from "@/components/providers/Providers";
import { cn } from "@/lib/utils";
import "@/app/globals.css";

/**
 * `/admin` is its own independent root layout (Next's "multiple root
 * layouts via route groups" pattern) — it is NOT nested under
 * `app/[locale]`, since the admin panel stays Azerbaijani-only and
 * un-prefixed (`/admin/...`, never `/ru/admin/...`). It therefore
 * supplies its own `<html>`/`<body>` and font variables independently of
 * the marketing locale tree.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolves to the Azerbaijani messages — see i18n/request.ts's
  // locale-less fallback, since /admin is outside the [locale] segment.
  const messages = await getMessages();

  return (
    <html lang="az" className={cn(inter.variable, manrope.variable)}>
      <body>
        <NextIntlClientProvider locale="az" messages={messages}>
          <Providers>
            <div className="min-h-screen bg-surface">{children}</div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
