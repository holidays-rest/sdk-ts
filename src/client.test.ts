import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HolidaysApiError } from "./errors.js";
import { HolidaysClient } from "./client.js";
import type { Country, Holiday, Language } from "./types.js";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const NATIONAL_HOLIDAY: Holiday = {
  country_code: "DE",
  country_name: "Germany",
  date: "2026-01-01",
  name: { en: "New Year's Day" },
  isNational: true,
  isReligious: false,
  isLocal: false,
  isEstimate: false,
  day: { actual: "Thursday", observed: "Thursday" },
  religion: "",
  regions: [],
};

const LOCAL_HOLIDAY: Holiday = {
  country_code: "DE",
  country_name: "Germany",
  date: "2026-01-06",
  name: { en: "Epiphany" },
  isNational: false,
  isReligious: true,
  isLocal: true,
  isEstimate: false,
  day: { actual: "Tuesday", observed: "Tuesday" },
  religion: "Christianity",
  regions: ["BW", "BY", "ST"],
};

const COUNTRY_DE: Country = {
  name: "Germany",
  alpha2: "DE",
  subdivisions: [
    { code: "BW", name: "Baden-Württemberg" },
    { code: "BY", name: "Bavaria" },
  ],
};

const LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "de", name: "German" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockFetch(status: number, body: unknown, contentType = "application/json") {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: {
      get: (header: string) =>
        header.toLowerCase() === "content-type" ? `${contentType}; charset=utf-8` : null,
    },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  } as unknown as Response;

  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
}

function capturedUrl() {
  const fetchMock = vi.mocked(fetch);
  const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
  return url;
}

function capturedHeaders() {
  const fetchMock = vi.mocked(fetch);
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return init.headers as Record<string, string>;
}

// ── Constructor ───────────────────────────────────────────────────────────────

describe("HolidaysClient constructor", () => {
  it("throws when apiKey is empty string", () => {
    expect(() => new HolidaysClient({ apiKey: "" })).toThrow("apiKey is required");
  });

  it("constructs with valid apiKey", () => {
    expect(() => new HolidaysClient({ apiKey: "key" })).not.toThrow();
  });

  it("strips trailing slash from baseUrl", () => {
    mockFetch(200, []);
    const client = new HolidaysClient({
      apiKey: "key",
      baseUrl: "https://example.com/v1/",
    });
    return client.getHolidays({ country: "US", year: 2024 }).then(() => {
      expect(capturedUrl()).toMatch(/^https:\/\/example\.com\/v1\//);
      expect(capturedUrl()).not.toMatch(/v1\/\//);
    });
  });
});

// ── getHolidays ───────────────────────────────────────────────────────────────

describe("getHolidays", () => {
  let client: HolidaysClient;

  beforeEach(() => {
    client = new HolidaysClient({ apiKey: "test-key", baseUrl: "https://api.test" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws when country is missing", async () => {
    await expect(
      // @ts-expect-error intentional — testing runtime guard
      client.getHolidays({ year: 2024 }),
    ).rejects.toThrow("country is required");
  });

  it("throws when year is missing", async () => {
    await expect(
      // @ts-expect-error intentional — testing runtime guard
      client.getHolidays({ country: "DE" }),
    ).rejects.toThrow("year is required");
  });

  it("calls /holidays with required query params", async () => {
    mockFetch(200, [NATIONAL_HOLIDAY]);
    await client.getHolidays({ country: "DE", year: 2026 });

    const url = new URL(capturedUrl());
    expect(url.pathname).toBe("/holidays");
    expect(url.searchParams.get("country")).toBe("DE");
    expect(url.searchParams.get("year")).toBe("2026");
  });

  it("includes optional scalar params in query string", async () => {
    mockFetch(200, [NATIONAL_HOLIDAY]);
    await client.getHolidays({ country: "DE", year: 2026, month: 1, day: 1 });

    const url = new URL(capturedUrl());
    expect(url.searchParams.get("month")).toBe("1");
    expect(url.searchParams.get("day")).toBe("1");
  });

  it("omits undefined optional params", async () => {
    mockFetch(200, [NATIONAL_HOLIDAY]);
    await client.getHolidays({ country: "DE", year: 2026 });

    const url = new URL(capturedUrl());
    expect(url.searchParams.has("month")).toBe(false);
    expect(url.searchParams.has("day")).toBe(false);
    expect(url.searchParams.has("type")).toBe(false);
    expect(url.searchParams.has("religion")).toBe(false);
    expect(url.searchParams.has("region")).toBe(false);
    expect(url.searchParams.has("lang")).toBe(false);
  });

  it("joins array params with comma", async () => {
    mockFetch(200, [LOCAL_HOLIDAY]);
    await client.getHolidays({
      country: "DE",
      year: 2026,
      type: ["national", "religious"],
      region: ["BW", "BY"],
      religion: [1, 2],
    });

    const url = new URL(capturedUrl());
    expect(url.searchParams.get("type")).toBe("national,religious");
    expect(url.searchParams.get("region")).toBe("BW,BY");
    expect(url.searchParams.get("religion")).toBe("1,2");
  });

  it("handles string (non-array) type param", async () => {
    mockFetch(200, [NATIONAL_HOLIDAY]);
    await client.getHolidays({ country: "DE", year: 2026, type: "national" });

    expect(new URL(capturedUrl()).searchParams.get("type")).toBe("national");
  });

  it("passes lang param", async () => {
    mockFetch(200, [NATIONAL_HOLIDAY]);
    await client.getHolidays({ country: "DE", year: 2026, lang: ["en", "de"] });

    expect(new URL(capturedUrl()).searchParams.get("lang")).toBe("en,de");
  });

  it("passes response format param", async () => {
    mockFetch(200, [NATIONAL_HOLIDAY]);
    await client.getHolidays({ country: "DE", year: 2026, response: "json" });

    expect(new URL(capturedUrl()).searchParams.get("response")).toBe("json");
  });

  it("returns Holiday[] on 200", async () => {
    mockFetch(200, [NATIONAL_HOLIDAY, LOCAL_HOLIDAY]);
    const result = await client.getHolidays({ country: "DE", year: 2026 });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(NATIONAL_HOLIDAY);
    expect(result[1]).toEqual(LOCAL_HOLIDAY);
  });

  it("sends Authorization Bearer header", async () => {
    mockFetch(200, []);
    await client.getHolidays({ country: "DE", year: 2026 });

    expect(capturedHeaders()["Authorization"]).toBe("Bearer test-key");
  });

  it("sends Accept: application/json header", async () => {
    mockFetch(200, []);
    await client.getHolidays({ country: "DE", year: 2026 });

    expect(capturedHeaders()["Accept"]).toBe("application/json");
  });

  it("throws HolidaysApiError on 401 with JSON message", async () => {
    mockFetch(401, { message: "invalid api key" });

    await expect(client.getHolidays({ country: "DE", year: 2026 })).rejects.toMatchObject({
      name: "HolidaysApiError",
      status: 401,
      message: "invalid api key",
    });
  });

  it("throws HolidaysApiError on 401 with no message field", async () => {
    mockFetch(401, { error: "unauthorized" });

    await expect(client.getHolidays({ country: "DE", year: 2026 })).rejects.toMatchObject({
      name: "HolidaysApiError",
      status: 401,
    });
  });

  it("throws HolidaysApiError on 404", async () => {
    mockFetch(404, { message: "not found" });

    await expect(client.getHolidays({ country: "XX", year: 2026 })).rejects.toBeInstanceOf(
      HolidaysApiError,
    );
  });

  it("throws HolidaysApiError on 500", async () => {
    mockFetch(500, { message: "server error" });

    await expect(client.getHolidays({ country: "DE", year: 2026 })).rejects.toMatchObject({
      name: "HolidaysApiError",
      status: 500,
    });
  });

  it("throws HolidaysApiError for non-JSON error response", async () => {
    mockFetch(503, "Service Unavailable", "text/plain");

    await expect(client.getHolidays({ country: "DE", year: 2026 })).rejects.toMatchObject({
      name: "HolidaysApiError",
      status: 503,
    });
  });
});

// ── getCountries ──────────────────────────────────────────────────────────────

describe("getCountries", () => {
  let client: HolidaysClient;

  beforeEach(() => {
    client = new HolidaysClient({ apiKey: "test-key", baseUrl: "https://api.test" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls GET /countries", async () => {
    mockFetch(200, [COUNTRY_DE]);
    await client.getCountries();

    expect(new URL(capturedUrl()).pathname).toBe("/countries");
  });

  it("returns Country[]", async () => {
    mockFetch(200, [COUNTRY_DE]);
    const result = await client.getCountries();

    expect(result).toEqual([COUNTRY_DE]);
  });
});

// ── getCountry ────────────────────────────────────────────────────────────────

describe("getCountry", () => {
  let client: HolidaysClient;

  beforeEach(() => {
    client = new HolidaysClient({ apiKey: "test-key", baseUrl: "https://api.test" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws when countryCode is empty string", async () => {
    await expect(client.getCountry("")).rejects.toThrow("countryCode is required");
  });

  it("calls GET /country/:code", async () => {
    mockFetch(200, COUNTRY_DE);
    await client.getCountry("DE");

    expect(new URL(capturedUrl()).pathname).toBe("/country/DE");
  });

  it("URL-encodes the country code", async () => {
    mockFetch(200, COUNTRY_DE);
    await client.getCountry("DE/extra");

    expect(new URL(capturedUrl()).pathname).toBe("/country/DE%2Fextra");
  });

  it("returns Country", async () => {
    mockFetch(200, COUNTRY_DE);
    const result = await client.getCountry("DE");

    expect(result).toEqual(COUNTRY_DE);
  });
});

// ── getLanguages ──────────────────────────────────────────────────────────────

describe("getLanguages", () => {
  let client: HolidaysClient;

  beforeEach(() => {
    client = new HolidaysClient({ apiKey: "test-key", baseUrl: "https://api.test" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls GET /languages", async () => {
    mockFetch(200, LANGUAGES);
    await client.getLanguages();

    expect(new URL(capturedUrl()).pathname).toBe("/languages");
  });

  it("returns Language[]", async () => {
    mockFetch(200, LANGUAGES);
    const result = await client.getLanguages();

    expect(result).toEqual(LANGUAGES);
  });
});
