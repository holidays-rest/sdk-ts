// ── Response models ───────────────────────────────────────────────────────────

/**
 * Holiday name keyed by BCP 47 language code, e.g. `{ en: "New Year's Day", de: "Neujahr" }`.
 * The `en` key is always present.
 */
export interface HolidayName {
  [lang: string]: string;
}

/** Actual and observed weekday names for a holiday date. */
export interface HolidayDay {
  /** Weekday the holiday falls on, e.g. `"Thursday"`. */
  actual: string;
  /** Weekday the holiday is legally observed, e.g. `"Monday"` (for rolled-over holidays). */
  observed: string;
}

export interface Holiday {
  /** ISO 3166 alpha-2 country code, e.g. `"DE"`. */
  country_code: string;
  /** Full country name, e.g. `"Germany"`. */
  country_name: string;
  /** ISO 8601 date string, e.g. `"2026-01-01"`. */
  date: string;
  /** Holiday name in one or more languages. */
  name: HolidayName;
  /** `true` when the holiday applies nationwide. */
  isNational: boolean;
  /** `true` when the holiday has a religious origin. */
  isReligious: boolean;
  /** `true` when the holiday applies to specific regions only. */
  isLocal: boolean;
  /** `true` when the date is an estimate (e.g. lunar-calendar holidays). */
  isEstimate: boolean;
  /** Actual and observed weekday information. */
  day: HolidayDay;
  /** Religion associated with the holiday, e.g. `"Christianity"`. Empty string when not applicable. */
  religion: string;
  /** Subdivision codes where the holiday applies, e.g. `["BW", "BY"]`. Empty array for nationwide holidays. */
  regions: string[];
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
