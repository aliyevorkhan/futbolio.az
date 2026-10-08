import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipToContent } from "@/components/layout/SkipToContent";

/**
 * Shared chrome for every public marketing route (home, /qeydiyyat,
 * /mexfilik): skip link, sticky header, page content, site footer.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SkipToContent />
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
