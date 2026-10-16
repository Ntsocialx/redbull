import type { Announcement, ApiList, Campus, EventRecord } from "@/types";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
  if (!response.ok) throw new Error(body?.error?.message ?? "The service is temporarily unavailable.");
  return body as T;
}

export async function getEvents(query = ""): Promise<ApiList<EventRecord>> {
  return apiRequest<ApiList<EventRecord>>(`/events${query ? `?${query}` : ""}`);
}

export async function getFeaturedEvents(): Promise<EventRecord[]> {
  const result = await apiRequest<{ data: EventRecord[] }>("/events/featured");
  return result.data;
}

export async function getEvent(slug: string): Promise<EventRecord | null> {
  try {
    const result = await apiRequest<{ data: EventRecord }>(`/events/${encodeURIComponent(slug)}`);
    return result.data;
  } catch {
    return null;
  }
}

export async function getCampuses(): Promise<Campus[]> {
  const result = await apiRequest<{ data: Campus[] }>("/campuses");
  return result.data;
}

export async function getAnnouncements(query = ""): Promise<Announcement[]> {
  const result = await apiRequest<{ data: Announcement[] }>(`/announcements${query ? `?${query}` : ""}`);
  return result.data;
}

export async function getUrgentAnnouncements(): Promise<Announcement[]> {
  const result = await apiRequest<{ data: Announcement[] }>("/announcements/urgent");
  return result.data;
}

export function formatEventDate(date: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric", ...options }).format(new Date(date));
}

export function formatEventTime(startAt: string, endAt: string) {
  const time = new Intl.DateTimeFormat("en-ZA", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Johannesburg" });
  return `${time.format(new Date(startAt))} - ${time.format(new Date(endAt))}`;
}
