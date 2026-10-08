import { Inter, Manrope } from "next/font/google";

// Self-hosted at build time via next/font/google (zero runtime request to
// Google's CDN — same pragmatic stand-in this project used for Montserrat
// before; swap to next/font/local with real .woff2 files once the design
// team supplies them). Inter (body) + Manrope (headings) replace
// Montserrat per the fix-round design-system update — both carry
// `cyrillic` subsets, needed now that Russian is a supported locale.
export const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const manrope = Manrope({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["700", "800"],
  variable: "--font-manrope",
  display: "swap",
});
