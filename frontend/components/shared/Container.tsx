import { cn } from "@/lib/utils";

/**
 * Max-width content wrapper used by every section so page padding stays
 * consistent. Pass `as` to render a semantic element other than `div`.
 */
export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <Tag className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </Tag>
  );
}
