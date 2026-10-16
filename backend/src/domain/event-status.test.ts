import { describe, expect, it } from "vitest";
import { canTransitionEventStatus } from "./event-status.js";

describe("canTransitionEventStatus", () => {
  it("allows draft publishing, unpublishing and cancellation", () => {
    expect(canTransitionEventStatus("draft", "published")).toBe(true);
    expect(canTransitionEventStatus("published", "draft")).toBe(true);
    expect(canTransitionEventStatus("published", "cancelled")).toBe(true);
  });

  it("keeps cancelled and archived events from being republished", () => {
    expect(canTransitionEventStatus("cancelled", "published")).toBe(false);
    expect(canTransitionEventStatus("archived", "published")).toBe(false);
    expect(canTransitionEventStatus("draft", "archived")).toBe(false);
  });
});
