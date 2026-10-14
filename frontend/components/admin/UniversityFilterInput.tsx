"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { listUniversities } from "@/lib/api/admin/applications";

/**
 * Searchable university filter — no fixed universities table exists in
 * this codebase (university_name is free text), so this is a plain
 * text input with a client-side-filtered suggestion list sourced from
 * GET /api/admin/applications/universities/, not a full combobox
 * library (none is installed).
 */
export function UniversityFilterInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: universities } = useQuery({
    queryKey: ["admin-universities"],
    queryFn: listUniversities,
    staleTime: 5 * 60 * 1000,
  });

  const suggestions = (universities ?? []).filter((name) =>
    name.toLowerCase().includes(draft.toLowerCase()),
  );

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5 text-sm font-medium text-foreground">
      {label}
      <Input
        value={draft}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setDraft(e.target.value);
          setOpen(true);
        }}
        onBlur={() => onChange(draft)}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-brand-dark/15 bg-white py-1 shadow-lg">
          {suggestions.map((name) => (
            <li key={name}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-brand-dark/5"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setDraft(name);
                  onChange(name);
                  setOpen(false);
                }}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
