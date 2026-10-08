import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names, resolving conflicts (e.g. `p-2` vs `p-4`)
 * the way `tailwind-merge` expects. Use this instead of template
 * literals whenever a component accepts a `className` prop.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an Azerbaijani phone number (e.g. "+994501234567" or
 * "994501234567") into a human-readable grouped form:
 * "+994 50 123 45 67". Falls back to the raw input if it doesn't match
 * the expected length so we never throw on unexpected backend data.
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const normalized = digits.startsWith("994")
    ? digits
    : digits.startsWith("0")
      ? `994${digits.slice(1)}`
      : `994${digits}`;

  if (normalized.length !== 12) {
    return raw;
  }

  const country = normalized.slice(0, 3);
  const area = normalized.slice(3, 5);
  const part1 = normalized.slice(5, 8);
  const part2 = normalized.slice(8, 10);
  const part3 = normalized.slice(10, 12);

  return `+${country} ${area} ${part1} ${part2} ${part3}`;
}

/**
 * Build a `https://wa.me/<number>?text=<encoded>` URL from a phone
 * number and default message, both sourced from the public settings
 * API. Centralized here so every section of the site that needs a
 * WhatsApp link builds it identically.
 */
export function buildWhatsAppUrl(number: string, text?: string): string {
  const digits = number.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
