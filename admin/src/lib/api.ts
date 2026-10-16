const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
  if (!response.ok) throw new Error(body?.error?.message ?? "The service is temporarily unavailable.");
  return body as T;
}

export interface AdminEvent {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  posterUrl: string | null;
  campus: string;
  campusSlug: string;
  venue: string;
  category: string;
  startAt: string;
  endAt: string;
  timezone: string;
  organizerName: string | null;
  organizerContact: string | null;
  registrationUrl: string | null;
  externalUrl: string | null;
  isFeatured: boolean;
  status: "draft" | "published" | "cancelled" | "archived";
  updatedAt?: string;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  campus: string | null;
  campusSlug: string | null;
  startsAt: string | null;
  priority: "normal" | "important" | "urgent";
  status: "draft" | "published";
  expiresAt: string | null;
  externalUrl: string | null;
}

export interface AdminUser { id: string; name: string; email: string }
export interface PageResult<T> { data: T[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } }

export function dateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-ZA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}
