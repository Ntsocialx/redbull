"use client";

import { useEffect, useState } from "react";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { adminRequest, type AdminAnnouncement } from "@/lib/api";

export function EditAnnouncementClient({ id }: { id: string }) {
  const [announcement, setAnnouncement] = useState<AdminAnnouncement | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminRequest<{ data: AdminAnnouncement }>(`/admin/announcements/${encodeURIComponent(id)}`).then((result) => {
      if (active) setAnnouncement(result.data);
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : "Announcement could not be loaded.");
    });
    return () => { active = false; };
  }, [id]);

  if (error) return <div className="admin-page"><div className="admin-alert" role="alert">{error}</div></div>;
  if (!announcement) return <div className="admin-page"><div className="admin-empty" aria-busy="true">Loading announcement…</div></div>;
  return <AnnouncementForm key={announcement.id} announcement={announcement} />;
}
