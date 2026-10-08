"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Gates a motion effect on two conditions: the target element is in the
 * viewport AND the user hasn't requested reduced motion (checked once on
 * mount — the global `prefers-reduced-motion` CSS override in
 * globals.css is a second, independent safety net, not duplicated here).
 * Returns a single `shouldAnimate` boolean so callers just toggle a
 * class/animation-play-state off it.
 */
export function useInViewAnimation(ref: RefObject<Element>): boolean {
  const [isInView, setIsInView] = useState(false);
  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, prefersReducedMotion]);

  return isInView && !prefersReducedMotion;
}
