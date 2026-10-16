export type EventStatus = "draft" | "published" | "cancelled" | "archived";

export function canTransitionEventStatus(current: EventStatus, target: EventStatus): boolean {
  if (current === "archived" || current === "cancelled") return current === target;
  if (target === "archived") return false;
  return true;
}
