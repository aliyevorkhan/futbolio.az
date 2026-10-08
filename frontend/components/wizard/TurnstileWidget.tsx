"use client";

import { useEffect, useRef } from "react";

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void },
      ) => string;
    };
  }
}

/**
 * Renders nothing (and the wizard just submits `turnstile_token: ""`)
 * when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset — the local-dev and
 * current-production default, since the backend's `TURNSTILE_BYPASS`
 * accepts an empty token. Once a site key is configured, lazily loads
 * Cloudflare's script and renders the real widget.
 */
export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (!siteKey || renderedRef.current) return;

    const renderWidget = () => {
      if (renderedRef.current || !containerRef.current || !window.turnstile) return;
      window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onToken,
      });
      renderedRef.current = true;
    };

    if (window.turnstile) {
      renderWidget();
      return;
    }

    let script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", renderWidget);
    return () => script?.removeEventListener("load", renderWidget);
  }, [siteKey, onToken]);

  if (!siteKey) return null;

  return <div ref={containerRef} />;
}

/**
 * Honeypot field: a real, rendered `<input>` kept off-screen (not
 * `display:none`/`type="hidden"`, which simple bots skip but a
 * visually-hidden-yet-rendered field still catches) that must stay
 * empty. Spread the returned props onto an `<input>`.
 */
export function honeypotFieldProps() {
  return {
    name: "website",
    autoComplete: "off",
    tabIndex: -1,
    "aria-hidden": true,
    className: "absolute -left-[9999px] h-px w-px overflow-hidden",
  } as const;
}
