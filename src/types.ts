// ── Response models ───────────────────────────────────────────────────────────

export interface Holiday {
  name: string;
  date: string;
  type: string;
  country: string;
  region?: string;
  religion?: string;
  language?: string;
}

export interface Subdivision {
  code: string;
  name: string;
}

export interface Country {
  name: string;
  alpha2: string;
  subdivisions?: Subdivision[];
}

export interface Language {
  code: string;
  name: string;
}

// ── Request params ────────────────────────────────────────────────────────────

export interface HolidaysParams {
  /** ISO 3166 alpha-2 country code, e.g. `"US"`. Required. */
  country: string;
  /** Four-digit year, e.g. `2024`. Required. */
  year: number | string;
  /** Month filter (1–12). Optional. */
  month?: number | string;
  /** Day filter (1–31). Optional. */
  day?: number | string;
  /** Holiday type(s): `"religious"` | `"national"` | `"local"`. Optional. */
  type?: string | string[];
  /** Religion code(s) 1–11. Optional. */
  religion?: number | number[];
  /** Region/subdivision code(s) — from `getCountry()`. Optional. */
  region?: string | string[];
  /** Language code(s) — from `getLanguages()`. Optional. */
  lang?: string | string[];
  /** Response format: `"json"` (default) | `"xml"` | `"yaml"` | `"csv"`. Optional. */
  response?: "json" | "xml" | "yaml" | "csv";
}

// ── Client options ────────────────────────────────────────────────────────────

export interface ClientOptions {
  /** Bearer token from https://www.holidays.rest/dashboard. Required. */
  apiKey: string;
  /** Override base URL. Useful for testing. */
  baseUrl?: string;
}
