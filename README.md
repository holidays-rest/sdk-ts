# holidays.rest TypeScript SDK

Official TypeScript SDK for the [holidays.rest](https://holidays.rest) API.

## Requirements

- Node.js ≥ 18 (uses native `fetch`)
- TypeScript 5+ (for consumers using TypeScript)
- Zero runtime dependencies

## Installation

```bash
npm install holidays.rest
```

## Quick Start

```ts
import { HolidaysClient } from "holidays.rest";

const client = new HolidaysClient({ apiKey: "YOUR_API_KEY" });

const holidays = await client.getHolidays({ country: "US", year: 2024 });
holidays.forEach((h) => console.log(`${h.date} — ${h.name}`));
```

Get an API key at [holidays.rest/dashboard](https://www.holidays.rest/dashboard).

---

## API

### `new HolidaysClient(options)`

```ts
interface ClientOptions {
  apiKey:   string;   // required — Bearer token from dashboard
  baseUrl?: string;   // optional — override for testing
}
```

---

### `getHolidays(params)` → `Promise<Holiday[]>`

```ts
interface HolidaysParams {
  country:   string;                          // required — ISO 3166 alpha-2 (e.g. "US")
  year:      number | string;                 // required — e.g. 2024

  month?:    number | string;                 // optional — 1–12
  day?:      number | string;                 // optional — 1–31
  type?:     string | string[];               // "religious" | "national" | "local"
  religion?: number | number[];               // religion codes 1–11
  region?:   string | string[];               // subdivision codes from getCountry()
  lang?:     string | string[];               // language codes from getLanguages()
  response?: "json" | "xml" | "yaml" | "csv"; // default: "json"
}
```

```ts
// All US holidays in 2024
await client.getHolidays({ country: "US", year: 2024 });

// National holidays only
await client.getHolidays({ country: "DE", year: 2024, type: "national" });

// Multiple types
await client.getHolidays({ country: "TR", year: 2024, type: ["national", "religious"] });

// Filter by month and day
await client.getHolidays({ country: "GB", year: 2024, month: 12, day: 25 });

// Specific region
await client.getHolidays({ country: "US", year: 2024, region: "US-CA" });

// Multiple regions
await client.getHolidays({ country: "US", year: 2024, region: ["US-CA", "US-NY"] });
```

---

### `getCountries()` → `Promise<Country[]>`

```ts
const countries = await client.getCountries();
countries.forEach((c) => console.log(`${c.alpha2} — ${c.name}`));
```

---

### `getCountry(countryCode)` → `Promise<Country>`

Returns country details including subdivision codes usable as `region` filters.

```ts
const us = await client.getCountry("US");
us.subdivisions?.forEach((s) => console.log(`${s.code} — ${s.name}`));
```

---

### `getLanguages()` → `Promise<Language[]>`

```ts
const languages = await client.getLanguages();
```

---

## Types

All request and response types are exported:

```ts
import type {
  Holiday,
  Country,
  Subdivision,
  Language,
  HolidaysParams,
  ClientOptions,
} from "holidays.rest";
```

```ts
interface Holiday {
  name: string; date: string; type: string; country: string;
  region?: string; religion?: string; language?: string;
}

interface Country {
  name: string; alpha2: string; subdivisions?: Subdivision[];
}

interface Subdivision { code: string; name: string; }
interface Language    { code: string; name: string; }
```

---

## Error Handling

Non-2xx responses throw `HolidaysApiError`:

```ts
import { HolidaysClient, HolidaysApiError } from "holidays.rest";

try {
  await client.getHolidays({ country: "US", year: 2024 });
} catch (err) {
  if (err instanceof HolidaysApiError) {
    console.log(err.status);   // HTTP status code (number)
    console.log(err.message);  // Error message (string)
    console.log(err.body);     // Raw response body (unknown)
  }
}
```

| Status | Meaning             |
|--------|---------------------|
| 400    | Bad request         |
| 401    | Invalid API key     |
| 404    | Not found           |
| 500    | Server error        |
| 503    | Service unavailable |

---

## Building

```bash
npm run build       # outputs ESM + CJS + .d.ts to dist/
npm run typecheck   # type-check without emitting
```

The build outputs:

| File               | Format | Used by                     |
|--------------------|--------|-----------------------------|
| `dist/index.js`    | ESM    | `import` / bundlers         |
| `dist/index.cjs`   | CJS    | `require()` / older tooling |
| `dist/index.d.ts`  | Types  | TypeScript consumers        |

---

## License

MIT
