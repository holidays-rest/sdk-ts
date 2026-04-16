import { describe, expect, it } from "vitest";
import { HolidaysApiError } from "./errors.js";

describe("HolidaysApiError", () => {
  it("is an instance of Error", () => {
    const err = new HolidaysApiError("bad request", 400, null);
    expect(err).toBeInstanceOf(Error);
  });

  it("has name HolidaysApiError", () => {
    const err = new HolidaysApiError("bad request", 400, null);
    expect(err.name).toBe("HolidaysApiError");
  });

  it("stores message", () => {
    const err = new HolidaysApiError("invalid api key", 401, null);
    expect(err.message).toBe("invalid api key");
  });

  it("stores status", () => {
    const err = new HolidaysApiError("not found", 404, null);
    expect(err.status).toBe(404);
  });

  it("stores body", () => {
    const body = { message: "not found", code: "NOT_FOUND" };
    const err = new HolidaysApiError("not found", 404, body);
    expect(err.body).toBe(body);
  });

  it("stores null body", () => {
    const err = new HolidaysApiError("server error", 500, null);
    expect(err.body).toBeNull();
  });
});
