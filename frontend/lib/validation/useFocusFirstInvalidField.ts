"use client";

import { useCallback, useEffect, useRef } from "react";

export type SimpleFieldErrors = Record<string, { message?: unknown } | undefined>;

/**
 * Shared across every wizard step (and Step 4's manual file-slot
 * validation, which isn't RHF-registered): on validation failure, move
 * focus to the first invalid field in `fieldOrder` and announce its
 * message via an `aria-live="assertive"` region. Register each field's
 * focusable element with `registerField(name)` as its `ref`.
 */
export function useFocusFirstInvalidField(
  errors: SimpleFieldErrors,
  fieldOrder: string[],
) {
  const fieldRefs = useRef<Partial<Record<string, HTMLElement | null>>>({});
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const lastAnnouncedRef = useRef<string | null>(null);

  const registerField = useCallback(
    (name: string) => (el: HTMLElement | null) => {
      fieldRefs.current[name] = el;
    },
    [],
  );

  useEffect(() => {
    const firstInvalidName = fieldOrder.find((name) => errors[name]?.message);
    if (!firstInvalidName) {
      lastAnnouncedRef.current = null;
      return;
    }
    const message = String(errors[firstInvalidName]?.message ?? "");
    fieldRefs.current[firstInvalidName]?.focus();
    if (liveRegionRef.current && lastAnnouncedRef.current !== message) {
      liveRegionRef.current.textContent = message;
      lastAnnouncedRef.current = message;
    }
  }, [errors, fieldOrder]);

  return { registerField, liveRegionRef };
}
