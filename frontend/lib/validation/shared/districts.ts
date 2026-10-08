/**
 * The 12 Baku districts the backend accepts, in the exact code form the
 * API expects. Azerbaijani labels live only in `messages/az.json` under
 * `wizard.districts.<code>` — never hardcode a label here.
 */
export const DISTRICT_CODES = [
  "binegedi",
  "xetai",
  "xezer",
  "qaradag",
  "nerimanov",
  "nesimi",
  "nizami",
  "pirallahi",
  "sabuncu",
  "sebail",
  "suraxani",
  "yasamal",
] as const;

export type DistrictCode = (typeof DISTRICT_CODES)[number];
