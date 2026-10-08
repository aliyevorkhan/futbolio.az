import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/** Final success state — no account created, nothing left to do. */
export function ThankYouScreen() {
  const t = useTranslations("wizard.thankYou");

  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/15 text-3xl">
        ✓
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
      <p className="mt-3 max-w-md text-muted">{t("description")}</p>
      <Button asChild className="mt-8">
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </div>
  );
}
