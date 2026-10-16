import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { ShareEvent } from "@/components/shared/share-event";
import { formatEventDate, formatEventTime, getEvent } from "@/lib/api";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event not found | Red Bull TUT" };
  return {
    title: `${event.title} | Red Bull TUT`,
    description: event.summary,
    openGraph: { title: event.title, description: event.summary, images: event.posterUrl ? [event.posterUrl] : [] },
  };
}

export default async function EventDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();
  return (
    <main className="section-wrap detail-main">
      <Link href="/events" className="back-link"><ArrowLeft size={16} />All events</Link>
      <div className="detail-grid">
        <div className="detail-poster">{event.posterUrl ? <Image src={event.posterUrl} alt={`Poster for ${event.title}`} fill sizes="(max-width: 720px) 100vw, 40vw" /> : <div className="poster-empty large"><span>POSTER</span><small>Not provided</small></div>}</div>
        <article className="detail-copy">
          <div className="detail-labels"><span className="category-label">{event.category}</span><span className="campus-tag">{event.campus}</span></div>
          <h1>{event.title}</h1>
          {event.status === "cancelled" && <div className="cancel-notice" role="alert"><strong>Event cancelled</strong><span>This event has been cancelled. Please contact the organizer for further information.</span></div>}
          <p className="detail-summary">{event.summary}</p>
          <div className="detail-facts"><div><CalendarDays size={19} /><span><strong>{formatEventDate(event.startAt, { weekday: "long" })}</strong><small>{formatEventDate(event.startAt)} · {formatEventTime(event.startAt, event.endAt)}</small></span></div><div><MapPin size={19} /><span><strong>{event.venue}</strong><small>{event.campus}</small></span></div></div>
          <div className="detail-description"><h2>About this event</h2><p>{event.description}</p></div>
          {event.organizerName && <p className="organizer-line">Organized by <strong>{event.organizerName}</strong>{event.organizerContact && <> · <a href={`mailto:${event.organizerContact}`}>{event.organizerContact}</a></>}</p>}
          <div className="detail-actions">{event.registrationUrl && event.status !== "cancelled" && <a className="button button-red" href={event.registrationUrl} target="_blank" rel="noreferrer">Registration details <ArrowUpRight size={16} /></a>}<ShareEvent title={event.title} slug={event.slug} /></div>
        </article>
      </div>
    </main>
  );
}
