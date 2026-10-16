import { describe, expect, it } from "vitest";
import { isAnnouncementActive } from "./announcements.js";

const now = new Date("2026-10-15T12:00:00Z");

describe("isAnnouncementActive", () => {
  it("includes published notices inside their time window", () => {
    expect(isAnnouncementActive({ status: "published", deletedAt: null, startsAt: null, expiresAt: "2026-10-16T12:00:00Z" }, now)).toBe(true);
  });

  it("excludes drafts, deleted, future, and expired notices", () => {
    expect(isAnnouncementActive({ status: "draft", deletedAt: null, startsAt: null, expiresAt: null }, now)).toBe(false);
    expect(isAnnouncementActive({ status: "published", deletedAt: now, startsAt: null, expiresAt: null }, now)).toBe(false);
    expect(isAnnouncementActive({ status: "published", deletedAt: null, startsAt: "2026-10-16T12:00:00Z", expiresAt: null }, now)).toBe(false);
    expect(isAnnouncementActive({ status: "published", deletedAt: null, startsAt: null, expiresAt: now }, now)).toBe(false);
  });
});
