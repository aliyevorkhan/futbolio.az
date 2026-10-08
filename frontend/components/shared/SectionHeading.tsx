import { cn } from "@/lib/utils";

/**
 * Standard section title + optional supporting text, used at the top
 * of every home-page section. Keep copy out of this component — pass
 * translated strings in from the caller.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = "left",
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "mb-2 text-sm font-semibold uppercase tracking-wide text-brand-green",
            eyebrowClassName,
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className={cn("mt-3 text-base leading-[1.5] text-muted", descriptionClassName)}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
