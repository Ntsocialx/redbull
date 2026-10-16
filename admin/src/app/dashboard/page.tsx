"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, Megaphone, Plus, RefreshCw } from "lucide-react";
import { adminRequest, dateLabel, type AdminAnnouncement, type AdminEvent, type PageResult } from "@/lib/api";

type Stats = { totalEvents: number; publishedEvents: number; draftEvents: number; upcomingEvents: number; cancelledEvents: number; activeAnnouncements: number };
const metrics: { key: keyof Stats; label: string }[] = [
  { key: "totalEvents", label: "Total events" }, { key: "publishedEvents", label: "Published" },
  { key: "draftEvents", label: "Drafts" }, { key: "upcomingEvents", label: "Upcoming" },
  { key: "cancelledEvents", label: "Cancelled" }, { key: "activeAnnouncements", label: "Active announcements" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [statResult, eventResult, noticeResult] = await Promise.all([
        adminRequest<{ data: Stats }>("/admin/dashboard/stats"),
        adminRequest<PageResult<AdminEvent>>("/admin/events?limit=5"),
        adminRequest<{ data: AdminAnnouncement[] }>("/admin/announcements"),
      ]);
      setError("");
      setStats(statResult.data);
      setEvents(eventResult.data);
      setAnnouncements(noticeResult.data.slice(0, 4));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Dashboard data is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { startTransition(() => { void load(); }); }, []);
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">OVERVIEW</span><h1>Dashboard</h1><p>Current content across the campus noticeboard.</p></div><Link href="/events/new" className="admin-button admin-button-red"><Plus size={16} />Create event</Link></div>
      {error && <div className="admin-alert" role="alert">{error}<button type="button" onClick={() => { setLoading(true); void load(); }}><RefreshCw size={14} />Retry</button></div>}
      <div className="metric-grid">{metrics.map((metric) => <div className="metric-item" key={metric.key}><span>{metric.label}</span><strong>{loading ? "—" : stats?.[metric.key] ?? 0}</strong><small>{loading ? "Loading records" : "Database total"}</small></div>)}</div>
      <div className="dashboard-columns"><section className="admin-section"><div className="admin-section-heading"><div><span className="admin-eyebrow">RECENTLY UPDATED</span><h2>Events</h2></div><Link href="/events">Manage events <ArrowUpRight size={14} /></Link></div>
        {loading ? <div className="admin-empty">Loading event records…</div> : events.length ? <div className="recent-table"><div className="table-head"><span>EVENT</span><span>CAMPUS</span><span>DATE</span><span>STATUS</span></div>{events.map((event) => <Link className="table-row" href={`/events/${event.id}/edit`} key={event.id}><strong>{event.title}</strong><span>{event.campus}</span><span>{dateLabel(event.startAt)}</span><span className={`status-pill ${event.status}`}>{event.status}</span></Link>)}</div> : <div className="admin-empty"><CalendarDays size={20} /><strong>No events created</strong><span>Events you create will appear here.</span><Link href="/events/new" className="admin-inline-link">Create event <ArrowUpRight size={14} /></Link></div>}
      </section>
      <section className="admin-section"><div className="admin-section-heading"><div><span className="admin-eyebrow">NOTICEBOARD</span><h2>Announcements</h2></div><Link href="/announcements">Manage <ArrowUpRight size={14} /></Link></div>
        {loading ? <div className="admin-empty">Loading announcements…</div> : announcements.length ? <div className="recent-notices">{announcements.map((item) => <article className="recent-notice" key={item.id}><span className={`priority-dot ${item.priority}`} /> <div><h3>{item.title}</h3><p>{item.campus ?? "All campuses"} · {item.priority}</p></div><span className={`status-pill ${item.status}`}>{item.status}</span></article>)}</div> : <div className="admin-empty"><Megaphone size={20} /><strong>No announcements yet</strong><span>Manage notices when an update is ready.</span><Link href="/announcements/new" className="admin-inline-link">Create announcement <ArrowUpRight size={14} /></Link></div>}
      </section></div>
      <div className="quick-actions"><Link href="/events/new"><Plus size={16} /><span><strong>Create event</strong><small>Draft or publish campus activity</small></span><ArrowUpRight size={16} /></Link><Link href="/announcements/new"><Megaphone size={16} /><span><strong>Create announcement</strong><small>Share a campus update</small></span><ArrowUpRight size={16} /></Link></div>
    </div>
  );
}
