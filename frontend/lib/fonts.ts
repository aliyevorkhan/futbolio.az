import { Montserrat } from "next/font/google";

// NOTE — documented deviation from spec: the brand spec calls for
// Montserrat self-hosted via static .woff2 files, but no real font
// binary is available/fetchable in this build environment. We use
// `next/font/google` as a pragmatic stand-in: it downloads and
// self-hosts the font at BUILD time, so there is zero runtime request
// to Google's CDN at request time (same performance/privacy property
// the spec is after), it just isn't a literal static file the design
// team controls yet. Swap this for real self-hosted `.woff2` files via
// `next/font/local` once the design team provides them — the exported
// `montserrat.variable` class name should stay the same so no other
// file needs to change.
export const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});
