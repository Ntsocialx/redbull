export interface AnnouncementWindow {
  status: string;
  deletedAt: Date | string | null;
  startsAt: Date | string | null;
  expiresAt: Date | string | null;
}

export function isAnnouncementActive(announcement: AnnouncementWindow, now = new Date()): boolean {
  if (announcement.status !== "published" || announcement.deletedAt !== null) return false;
  const current = now.getTime();
  const startsAt = announcement.startsAt === null ? Number.NEGATIVE_INFINITY : new Date(announcement.startsAt).getTime();
  const expiresAt = announcement.expiresAt === null ? Number.POSITIVE_INFINITY : new Date(announcement.expiresAt).getTime();
  return Number.isFinite(current) && startsAt <= current && expiresAt > current;
}
