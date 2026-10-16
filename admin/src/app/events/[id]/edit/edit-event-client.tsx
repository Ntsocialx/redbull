"use client";

import { useEffect, useState } from "react";
import { EventForm } from "@/components/events/event-form";
import { adminRequest, type AdminEvent } from "@/lib/api";

export function EditEventClient({ id }: { id: string }) {
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminRequest<{ data: AdminEvent }>(`/admin/events/${encodeURIComponent(id)}`).then((result) => {
      if (active) setEvent(result.data);
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : "Event could not be loaded.");
    });
    return () => { active = false; };
  }, [id]);

  if (error) return <div className="admin-page"><div className="admin-alert" role="alert">{error}</div></div>;
  if (!event) return <div className="admin-page"><div className="admin-empty" aria-busy="true">Loading event record…</div></div>;
  return <EventForm event={event} />;
}
