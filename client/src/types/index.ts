export interface Campus {
  id: string;
  name: string;
  slug: string;
}

export interface EventRecord {
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
  status: string;
}

export interface Announcement {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body?: string;
  priority: "normal" | "important" | "urgent";
  campus: string | null;
  campusSlug: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  externalUrl: string | null;
}

export interface ApiList<T> {
  data: T[];
  pagination?: { page: number; limit: number; totalItems: number; totalPages: number };
}
