import { Montserrat } from "next/font/google";

// Self-hosted at build time via next/font/google (zero runtime request to
// Google's CDN). One single family for both body and headings across every
// locale — `latin-ext` covers Azerbaijani-specific letters (ə, ğ, ı, ö, ü,
// ş, ç) and `cyrillic` covers Russian, so no glyph ever falls back to a
// different font when the locale switches.
export const montserrat = Montserrat({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});
