"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { adminRequest, type AdminAnnouncement } from "@/lib/api";

export default function AnnouncementsPage() {
  const [items, setItems] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await adminRequest<{ data: AdminAnnouncement[] }>("/admin/announcements");
      setError("");
      setItems(result.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Announcements could not be loaded.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { startTransition(() => { void load(); }); }, [load]);

  async function action(item: AdminAnnouncement, kind: "publish" | "unpublish" | "delete") {
    if (kind === "delete" && !window.confirm(`Delete “${item.title}”?`)) return;
    try {
      await adminRequest(`/admin/announcements/${item.id}${kind === "delete" ? "" : `/${kind}`}`, { method: kind === "delete" ? "DELETE" : "POST" });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Action failed."); }
  }

  return <div className="admin-page"><div className="admin-page-heading"><div><span className="admin-eyebrow">CONTENT MANAGEMENT</span><h1>Announcements</h1><p>Manage active notices, priority and expiration.</p></div><Link href="/announcements/new" className="admin-button admin-button-red"><Plus size={16} />Create announcement</Link></div>{error && <div className="admin-alert" role="alert">{error}</div>}<div className="admin-table-meta"><span>{items.length} records</span>{loading && <span>Updating…</span>}</div><section className="admin-section announcement-admin-list" aria-busy={loading}>{items.map((item) => <article className="admin-announcement-row" key={item.id}><div className="admin-announcement-priority"><span className={`priority-dot ${item.priority}`} /><span className={`status-pill ${item.priority}`}>{item.priority}</span></div><div className="admin-announcement-title"><strong>{item.title}</strong><small>{item.campus ?? "All campuses"} · /{item.slug}</small><p>{item.summary}</p></div><span className={`status-pill ${item.status}`}>{item.status}</span><div className="row-actions"><Link className="icon-button" href={`/announcements/${item.id}/edit`} aria-label={`Edit ${item.title}`}><Pencil size={15} /></Link>{item.status === "published" ? <button className="admin-button admin-button-outline" type="button" onClick={() => action(item, "unpublish")}>Unpublish</button> : <button className="admin-button admin-button-red" type="button" onClick={() => action(item, "publish")}>Publish</button>}<button className="icon-button destructive-icon" type="button" aria-label={`Delete ${item.title}`} onClick={() => action(item, "delete")}><Trash2 size={15} /></button></div></article>)}{!loading && !items.length && <div className="admin-empty"><Megaphone size={20} /><strong>No announcements yet</strong><span>Create a draft, preview it, then publish when ready.</span><Link href="/announcements/new" className="admin-inline-link">Create announcement <ArrowUpRight size={14} /></Link></div>}</section></div>;
}
