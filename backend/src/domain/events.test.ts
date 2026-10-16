import { describe, expect, it } from "vitest";
import { isValidEventWindow } from "./events.js";

describe("isValidEventWindow", () => {
  it("accepts an end time after the start time", () => {
    expect(isValidEventWindow("2026-10-20T09:00:00Z", "2026-10-20T10:00:00Z")).toBe(true);
  });

  it("rejects equal, reversed, or invalid timestamps", () => {
    expect(isValidEventWindow("2026-10-20T09:00:00Z", "2026-10-20T09:00:00Z")).toBe(false);
    expect(isValidEventWindow("2026-10-20T10:00:00Z", "2026-10-20T09:00:00Z")).toBe(false);
    expect(isValidEventWindow("not-a-date", "2026-10-20T10:00:00Z")).toBe(false);
  });
});
