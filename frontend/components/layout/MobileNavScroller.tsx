"use client";

/**
 * Mobile nav is an explicit spec requirement: a horizontally-scrollable
 * row of pill buttons, NOT a hamburger/dropdown menu. This component is
 * just the scroll container; `Header.tsx` supplies the pill links as
 * children so copy stays out of this file.
 */
export function MobileNavScroller({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}
