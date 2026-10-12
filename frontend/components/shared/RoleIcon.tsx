export type RoleKey = "futbolcu" | "qapici" | "hakim" | "hekim" | "reqib";

interface RoleIconProps {
  role: RoleKey;
  className?: string;
}

/**
 * The 5 "who do you need" icons, shared between the hero role menu and
 * the Xidmətlər cards so the same glyph always means the same role
 * everywhere on the site. Exact paths ported from the design prototype
 * (not swapped for the closest lucide-react equivalent) so the icons
 * match the approved screenshots pixel-for-pixel.
 */
export function RoleIcon({ role, className }: RoleIconProps) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
  };

  switch (role) {
    case "futbolcu":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <polygon points="12,8 15.5,10.5 14.2,14.5 9.8,14.5 8.5,10.5" />
        </svg>
      );
    case "qapici":
      return (
        <svg {...common}>
          <path d="M7 21v-8l-2-3 1-2 3 3V5a1.5 1.5 0 0 1 3 0v5V4a1.5 1.5 0 0 1 3 0v6V6a1.5 1.5 0 0 1 3 0v9a6 6 0 0 1-6 6z" />
        </svg>
      );
    case "hakim":
      return (
        <svg {...common}>
          <path d="M5 21V4h11l-2 4 2 4H5" />
        </svg>
      );
    case "hekim":
      return (
        <svg {...common}>
          <path d="M6 3v6a4 4 0 0 0 8 0V3" />
          <path d="M10 13v2a5 5 0 0 0 10 0v-2" />
          <circle cx="20" cy="11" r="2" />
        </svg>
      );
    case "reqib":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M16 14a5 5 0 0 1 6 5" />
        </svg>
      );
  }
}
