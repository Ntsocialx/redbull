import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { getCampuses, getEvents } from "@/lib/api";
import type { EventRecord } from "@/types";

export const instant = false;

export default async function CampusEventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campuses = await getCampuses().catch(() => []);
  const campus = campuses.find((item) => item.slug === slug);
  if (campuses.length && !campus) notFound();
  const events = await getEvents(new URLSearchParams({ campus: slug, limit: "50" }).toString()).catch(() => ({ data: [] as EventRecord[] }));
  return (
    <main className="section-wrap page-main">
      <Link href="/campuses" className="back-link"><ArrowLeft size={16} />All campuses</Link>
      <div className="page-intro"><span className="eyebrow">CAMPUS EVENTS</span><h1>{campus?.name ?? "Campus"} <em>what’s on.</em></h1><p>Published events at this campus.</p></div>
      {events.data.length ? <div className="event-grid">{events.data.map((event) => <EventCard key={event.id} event={event} />)}</div> : <div className="empty-state"><h2>No upcoming events here.</h2><p>New published events will appear when available.</p><Link href="/events" className="button button-outline">View all events <ArrowUpRight size={16} /></Link></div>}
    </main>
  );
}
