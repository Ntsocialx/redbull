"use client";

import Link from "next/link";
import Image from "next/image";
import { startTransition, useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pencil, Plus, Search, Trash2, XCircle } from "lucide-react";
import { adminRequest, dateLabel, type AdminEvent, type PageResult } from "@/lib/api";

const campuses = [
  ["soshanguve-south", "TUT Soshanguve South"], ["soshanguve-north", "TUT Soshanguve North"],
  ["ga-rankuwa", "Ga-Rankuwa Campus"], ["pretoria-main", "Pretoria Main Campus"], ["arcadia", "Arcadia Campus"],
];
const categories = ["Gaming", "Academic", "Social", "Sports", "Workshops", "Orientation", "Career", "Student Life"];

export default function EventsPage() {
  const [result, setResult] = useState<PageResult<AdminEvent> | null>(null);
  const [search, setSearch] = useState("");
  const [campus, setCampus] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) query.set("search", search);
    if (campus) query.set("campus", campus);
    if (category) query.set("category", category);
    if (status) query.set("status", status);
    try {
      const nextResult = await adminRequest<PageResult<AdminEvent>>(`/admin/events?${query}`);
      setError("");
      setResult(nextResult);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Events could not be loaded."); }
    finally { setLoading(false); }
  }, [page, search, campus, category, status]);

  useEffect(() => { startTransition(() => { void load(); }); }, [load]);

  async function action(event: AdminEvent, actionName: "publish" | "unpublish" | "cancel" | "delete") {
    const confirmation = actionName === "delete" ? `Permanently archive “${event.title}”?` : actionName === "cancel" ? `Cancel “${event.title}”?` : "";
    if (confirmation && !window.confirm(confirmation)) return;
    try {
      await adminRequest(`/admin/events/${event.id}${actionName === "delete" ? "" : `/${actionName}`}`, { method: actionName === "delete" ? "DELETE" : "POST" });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Action failed."); }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">CONTENT MANAGEMENT</span><h1>Events</h1><p>Search, review and publish campus events.</p></div><Link className="admin-button admin-button-red" href="/events/new"><Plus size={16} />Create event</Link></div>
      <form className="admin-filter-bar" onSubmit={(event) => { event.preventDefault(); setPage(1); void load(); }}><label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => { setLoading(true); setSearch(event.target.value); setPage(1); }} placeholder="Search event title…" aria-label="Search events" /></label><label><span className="sr-only">Campus</span><select value={campus} onChange={(event) => { setLoading(true); setCampus(event.target.value); setPage(1); }}><option value="">All campuses</option>{campuses.map(([slug, name]) => <option value={slug} key={slug}>{name}</option>)}</select></label><label><span className="sr-only">Category</span><select value={category} onChange={(event) => { setLoading(true); setCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="sr-only">Status</span><select value={status} onChange={(event) => { setLoading(true); setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{["draft", "published", "cancelled", "archived"].map((item) => <option key={item}>{item}</option>)}</select></label><button type="button" className="admin-clear" onClick={() => { setLoading(true); setSearch(""); setCampus(""); setCategory(""); setStatus(""); setPage(1); }}>Clear</button></form>
      {error && <div className="admin-alert" role="alert">{error}<button type="button" onClick={load}>Retry</button></div>}
      <div className="admin-table-meta"><span>{result?.pagination.totalItems ?? 0} records</span>{loading && <span>Updating…</span>}</div>
      <section className="admin-data-table" aria-busy={loading}>
        <div className="admin-table-head"><span>Event</span><span>Campus</span><span>Event date</span><span>Category</span><span>Status</span><span>Actions</span></div>
        {result?.data.map((event) => <article className="admin-event-row" key={event.id}><div className="admin-event-cell"><span className="admin-poster-thumb">{event.posterUrl ? <Image src={event.posterUrl} alt="" width={38} height={43} /> : <CalendarDaysIcon />}</span><span><Link href={`/events/${event.id}/edit`} className="admin-event-title">{event.title}</Link><small>Updated {event.updatedAt ? dateLabel(event.updatedAt) : "—"}</small></span></div><span className="admin-campus-cell">{event.campus}</span><span>{dateLabel(event.startAt)}</span><span>{event.category}</span><span className={`status-pill ${event.status}`}>{event.status}</span><div className="row-actions"><Link className="icon-button" href={`/events/${event.id}/edit`} aria-label={`Edit ${event.title}`}><Pencil size={15} /></Link>{event.status === "published" ? <button className="icon-button" type="button" aria-label={`Unpublish ${event.title}`} onClick={() => action(event, "unpublish")}><XCircle size={15} /></button> : <button className="icon-button" type="button" aria-label={`Publish ${event.title}`} onClick={() => action(event, "publish")}><ArrowUpRight size={15} /></button>}{event.status !== "cancelled" && event.status !== "archived" && <button className="icon-button" type="button" aria-label={`Cancel ${event.title}`} onClick={() => action(event, "cancel")}><XCircle size={15} /></button>}<button className="icon-button destructive-icon" type="button" aria-label={`Delete ${event.title}`} onClick={() => action(event, "delete")}><Trash2 size={15} /></button></div></article>)}
        {!loading && !result?.data.length && <div className="admin-empty"><CalendarDaysIcon /><strong>No matching events</strong><span>Create an event or adjust the filters.</span><Link href="/events/new" className="admin-inline-link">Create event <ArrowUpRight size={14} /></Link></div>}
      </section>
      {result && result.pagination.totalPages > 1 && <nav className="admin-pagination" aria-label="Event pages"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}><ArrowLeft size={15} />Previous</button><span>Page {page} of {result.pagination.totalPages}</span><button type="button" disabled={page >= result.pagination.totalPages} onClick={() => setPage(page + 1)}>Next<ArrowRight size={15} /></button></nav>}
    </div>
  );
}

function CalendarDaysIcon() { return <span className="calendar-placeholder" aria-hidden="true">EVENT</span>; }
