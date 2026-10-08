"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DAY_VALUES, HOUR_SLOT_VALUES, type DayValue, type HourSlotValue } from "@/lib/validation/wizard/step3.schema";

interface AvailabilityGridProps {
  label?: string;
  /** `"day:slot"` composite strings, e.g. `"monday:09_12"` — the exact `time_slots` wire shape. */
  values: string[];
  onChange: (values: string[]) => void;
  dayLabels: Record<DayValue, string>;
  slotLabels: Record<HourSlotValue, string>;
  error?: string;
  registerRef?: (el: HTMLElement | null) => void;
}

/**
 * 7-day x 5-slot tappable availability grid, shared by all 3 roles.
 * Backed by a `Set<"day:slot">` for O(1) toggle lookups — the array
 * form of that set IS the `time_slots` payload shape, no translation
 * layer needed between this component's state and the API request.
 *
 * Mobile: a horizontal-scroll table contained to the grid itself (the
 * simplest option, consistent with this codebase's other mobile
 * patterns) rather than a day-accordion — the page itself never gains
 * horizontal scroll, only this one container does.
 */
export function AvailabilityGrid({
  label,
  values,
  onChange,
  dayLabels,
  slotLabels,
  error,
  registerRef,
}: AvailabilityGridProps) {
  const selected = React.useMemo(() => new Set(values), [values]);

  const toggle = (day: DayValue, slot: HourSlotValue) => {
    const key = `${day}:${slot}`;
    const next = new Set(selected);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(Array.from(next));
  };

  return (
    <div>
      {label ? <p className="mb-2 text-sm font-medium text-foreground">{label}</p> : null}
      <div
        role="group"
        aria-label={label}
        ref={registerRef as React.Ref<HTMLDivElement>}
        tabIndex={-1}
        className={cn(
          "overflow-x-auto rounded-lg border border-brand-dark/10",
          error && "border-red-500",
        )}
      >
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white p-2 text-left text-xs font-medium text-muted" scope="col" />
              {HOUR_SLOT_VALUES.map((slot) => (
                <th
                  key={slot}
                  scope="col"
                  className="whitespace-nowrap p-2 text-center text-xs font-medium text-muted"
                >
                  {slotLabels[slot]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAY_VALUES.map((day) => (
              <tr key={day}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 whitespace-nowrap bg-white p-2 text-left text-xs font-medium text-foreground"
                >
                  {dayLabels[day]}
                </th>
                {HOUR_SLOT_VALUES.map((slot) => {
                  const key = `${day}:${slot}`;
                  const checked = selected.has(key);
                  return (
                    <td key={slot} className="p-1 text-center">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        aria-label={`${dayLabels[day]}, ${slotLabels[slot]}`}
                        onClick={() => toggle(day, slot)}
                        className={cn(
                          "mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-brand-dark/15 bg-white transition-colors hover:bg-brand-dark/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2",
                          checked && "border-brand-green bg-brand-green text-brand-dark",
                        )}
                      >
                        {checked ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : null}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
