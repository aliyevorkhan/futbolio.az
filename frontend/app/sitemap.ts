import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://futbolio.az";

const ROUTES = ["/", "/qeydiyyat", "/mexfilik", "/haqqimizda"];

function localizedPath(route: string, locale: string): string {
  if (locale === routing.defaultLocale) return route;
  return route === "/" ? `/${locale}` : `/${locale}${route}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.flatMap((route) =>
    routing.locales.map((locale) => ({
      url: `${SITE_URL}${localizedPath(route, locale)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "/" ? 1 : 0.6,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((altLocale) => [
            altLocale,
            `${SITE_URL}${localizedPath(route, altLocale)}`,
          ]),
        ),
      },
    })),
  );
}
