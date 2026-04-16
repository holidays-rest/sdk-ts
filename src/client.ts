import { HolidaysApiError } from "./errors.js";
import type {
  ClientOptions,
  Country,
  Holiday,
  HolidaysParams,
  Language,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.holidays.rest/v1";

function toCommaSeparated(value: string | string[] | number | number[]): string {
  return Array.isArray(value) ? value.join(",") : String(value);
}

function buildQuery(params: Record<string, string | number | string[] | number[] | undefined>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    query.set(key, toCommaSeparated(value as string | string[] | number | number[]));
  }

  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export class HolidaysClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL }: ClientOptions) {
    if (!apiKey) throw new Error("HolidaysClient: apiKey is required");
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  // ── internal ──────────────────────────────────────────────────────────────

  private async request<T>(path: string, query = ""): Promise<T> {
    const url = `${this.baseUrl}${path}${query}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    let body: unknown;
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    if (!response.ok) {
      const message =
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof (body as Record<string, unknown>).message === "string"
          ? (body as { message: string }).message
          : response.statusText;

      throw new HolidaysApiError(message, response.status, body);
    }

    return body as T;
  }

  // ── public API ────────────────────────────────────────────────────────────

  /**
   * Fetches public holidays matching the given parameters.
   *
   * @example
   * await client.getHolidays({ country: "US", year: 2024 });
   * await client.getHolidays({ country: "TR", year: 2024, type: ["national", "religious"] });
   */
  async getHolidays(params: HolidaysParams): Promise<Holiday[]> {
    if (!params.country) throw new Error("getHolidays: country is required");
    if (!params.year) throw new Error("getHolidays: year is required");

    const query = buildQuery({
      country:  params.country,
      year:     params.year,
      month:    params.month,
      day:      params.day,
      type:     params.type,
      religion: params.religion,
      region:   params.region,
      lang:     params.lang,
      response: params.response,
    });

    return this.request<Holiday[]>("/holidays", query);
  }

  /** Returns all supported countries. */
  async getCountries(): Promise<Country[]> {
    return this.request<Country[]>("/countries");
  }

  /**
   * Returns details for one country, including subdivision codes
   * usable as `region` filters in {@link getHolidays}.
   *
   * @param countryCode ISO 3166 alpha-2 code, e.g. `"US"`.
   */
  async getCountry(countryCode: string): Promise<Country> {
    if (!countryCode) throw new Error("getCountry: countryCode is required");
    return this.request<Country>(`/country/${encodeURIComponent(countryCode)}`);
  }

  /** Returns all supported language codes. */
  async getLanguages(): Promise<Language[]> {
    return this.request<Language[]>("/languages");
  }
}
