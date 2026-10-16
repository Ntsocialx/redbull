import Link from "next/link";
import { ArrowUpRight, Megaphone, Search } from "lucide-react";
import { getAnnouncements, getCampuses } from "@/lib/api";

export const instant = false;

export default async function AnnouncementsPage({ searchParams }: { searchParams: Promise<{ search?: string; campus?: string; priority?: string }> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.campus) query.set("campus", params.campus);
  if (params.priority) query.set("priority", params.priority);
  const [announcements, campuses] = await Promise.all([
    getAnnouncements(query.toString()).catch(() => []),
    getCampuses().catch(() => []),
  ]);
  return (
    <main className="section-wrap page-main">
      <div className="page-intro"><span className="eyebrow">STAY IN THE KNOW</span><h1>Campus <em>announcements.</em></h1><p>Timely updates published by authorized platform administrators.</p></div>
      <form className="announcement-search" action="/announcements" method="get"><Search size={18} /><label className="sr-only" htmlFor="announcement-search">Search announcements</label><input id="announcement-search" type="search" name="search" placeholder="Search announcements…" defaultValue={params.search} /><label className="sr-only" htmlFor="announcement-campus">Campus</label><select id="announcement-campus" name="campus" defaultValue={params.campus ?? ""}><option value="">All campuses</option>{campuses.map((campus) => <option value={campus.slug} key={campus.id}>{campus.name}</option>)}</select><label className="sr-only" htmlFor="announcement-priority">Priority</label><select id="announcement-priority" name="priority" defaultValue={params.priority ?? ""}><option value="">All priorities</option><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select><button className="button button-red" type="submit">Search</button></form>
      {announcements.length ? <div className="announcement-list">{announcements.map((notice) => <article className={`announcement-row priority-${notice.priority}`} key={notice.id}><span className="notice-icon"><Megaphone size={18} /></span><div><div className="notice-meta"><span className={`priority-label ${notice.priority}`}>{notice.priority}</span><span>{notice.campus ?? "All campuses"}</span></div><h2>{notice.title}</h2><p>{notice.summary}</p>{notice.expiresAt && <small>Expires {new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(new Date(notice.expiresAt))}</small>}</div>{notice.externalUrl ? <a className="icon-button" href={notice.externalUrl} target="_blank" rel="noreferrer" aria-label={`Open details for ${notice.title}`}><ArrowUpRight size={18} /></a> : <Link className="icon-button" href={`/announcements/${notice.slug}`} aria-label={`Read ${notice.title}`}><ArrowUpRight size={18} /></Link>}</article>)}</div> : <div className="empty-state"><span className="empty-icon"><Megaphone size={22} /></span><h2>No active announcements.</h2><p>When administrators publish a notice, it will appear here until it expires.</p></div>}
      <p className="notice-disclaimer">Event details may change. Contact the event organizer for event-specific information.</p>
    </main>
  );
}
