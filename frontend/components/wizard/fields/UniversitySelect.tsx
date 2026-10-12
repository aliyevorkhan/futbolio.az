"use client";

import * as React from "react";
import { useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AZ_UNIVERSITIES } from "@/lib/data/azUniversities";

interface UniversitySelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  searchPlaceholder: string;
  otherLabel: string;
  otherInputPlaceholder: string;
  error?: boolean;
  registerRef?: (el: HTMLElement | null) => void;
}

/**
 * Searchable "pick from a known list, or type your own" combobox for the
 * player wizard's "Oxuduğun universitet" field. Built without a new
 * dependency (no cmdk/Radix Combobox in this codebase yet) — a plain
 * filtered list + a free-text fallback revealed by the "Digər" option.
 */
export function UniversitySelect({
  value,
  onChange,
  onBlur,
  placeholder,
  searchPlaceholder,
  otherLabel,
  otherInputPlaceholder,
  error,
  registerRef,
}: UniversitySelectProps) {
  const isKnownValue = value ? AZ_UNIVERSITIES.includes(value) : false;
  const [isOther, setIsOther] = useState(Boolean(value) && !isKnownValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(isKnownValue ? value ?? "" : "");
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AZ_UNIVERSITIES;
    return AZ_UNIVERSITIES.filter((name) => name.toLowerCase().includes(q));
  }, [query]);

  if (isOther) {
    return (
      <div>
        <input
          type="text"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={otherInputPlaceholder}
          aria-invalid={error}
          ref={registerRef as React.Ref<HTMLInputElement>}
          className="flex h-11 w-full rounded-lg border border-brand-dark/15 bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-muted-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2 aria-[invalid=true]:border-red-500"
        />
        <button
          type="button"
          className="mt-1.5 text-xs text-brand-green underline"
          onClick={() => {
            setIsOther(false);
            setQuery("");
            onChange("");
          }}
        >
          {placeholder}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        ref={registerRef as React.Ref<HTMLButtonElement>}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-lg border border-brand-dark/15 bg-white px-3.5 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2",
          error && "border-red-500",
          value ? "text-foreground" : "text-muted-2",
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      </button>

      {open ? (
        <div
          ref={listRef}
          onMouseDown={(event) => event.preventDefault()}
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-brand-dark/15 bg-white shadow-lg"
        >
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full border-b border-brand-dark/10 px-3.5 py-2.5 text-sm focus-visible:outline-none"
          />
          <div role="listbox" className="max-h-56 overflow-y-auto">
            {filtered.map((name) => (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={value === name}
                onClick={() => {
                  onChange(name);
                  setQuery(name);
                  setOpen(false);
                  onBlur?.();
                }}
                className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm hover:bg-brand-green/10"
              >
                <span className="truncate">{name}</span>
                {value === name ? <Check className="h-4 w-4 shrink-0 text-brand-green" aria-hidden="true" /> : null}
              </button>
            ))}
            {filtered.length === 0 ? (
              <p className="px-3.5 py-2 text-sm text-muted">{searchPlaceholder}</p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setIsOther(true);
                setOpen(false);
                onChange("");
                setQuery("");
              }}
              className="flex w-full items-center px-3.5 py-2 text-left text-sm font-medium text-brand-dark hover:bg-brand-green/10"
            >
              {otherLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
