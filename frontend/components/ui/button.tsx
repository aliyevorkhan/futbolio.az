import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * shadcn-style button primitive. `default`/`outline`/`ghost`/`dark-solid`
 * — the shared primitive for every CTA across the site, following the
 * same `cva` pattern.
 *
 * IMPORTANT: the `default` variant uses `bg-brand-green` and MUST keep
 * `text-brand-dark` (never `text-white`) per the project's contrast
 * requirement — see tailwind.config.ts design tokens.
 */
const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand-green text-brand-dark hover:bg-brand-green/90",
        "dark-solid":
          "bg-brand-dark text-white hover:bg-brand-dark/90 active:bg-brand-dark/80",
        outline:
          "border border-brand-dark/20 bg-transparent text-foreground hover:bg-brand-dark/5",
        ghost: "bg-transparent text-foreground hover:bg-brand-dark/5",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
