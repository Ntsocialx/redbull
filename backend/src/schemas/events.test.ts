import { describe, expect, it } from "vitest";
import { eventInputSchema, listEventSchema } from "./events.js";

const validEvent = {
  title: "Campus Gaming Wednesday",
  slug: "campus-gaming-wednesday",
  summary: "A sample summary for an event.",
  description: "A longer sample description.",
  campusSlug: "soshanguve-south",
  venue: "Student centre",
  category: "Gaming",
  startAt: "2026-11-10T10:00:00+02:00",
  endAt: "2026-11-10T12:00:00+02:00",
};

describe("eventInputSchema", () => {
  it("accepts valid event fields", () => {
    expect(eventInputSchema.safeParse(validEvent).success).toBe(true);
  });

  it("rejects reversed time windows and unsupported campus labels", () => {
    expect(eventInputSchema.safeParse({ ...validEvent, endAt: "2026-11-10T09:00:00+02:00" }).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...validEvent, campusSlug: "unknown-campus" }).success).toBe(false);
  });

  it("requires a poster URL and Cloudinary asset ID as a pair", () => {
    expect(eventInputSchema.safeParse({ ...validEvent, posterUrl: "https://res.cloudinary.com/example/image/upload/poster.jpg" }).success).toBe(false);
  });
});

describe("listEventSchema", () => {
  it("accepts date-only filters from native date controls", () => {
    expect(listEventSchema.safeParse({ from: "2026-11-10", to: "2026-11-12" }).success).toBe(true);
  });
});
