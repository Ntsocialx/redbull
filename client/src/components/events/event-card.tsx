import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { EventRecord } from "@/types";
import { formatEventDate, formatEventTime } from "@/lib/api";
import { ShareEvent } from "@/components/shared/share-event";

export function EventCard({ event }: { event: EventRecord }) {
  return (
    <article className="event-card">
      <Link href={`/events/${event.slug}`} className="poster-frame" aria-label={`View ${event.title}`}>
        {event.posterUrl ? (
          // The image URL is supplied by the trusted server-side record after upload verification.
          <Image src={event.posterUrl} alt={`Poster for ${event.title}`} fill sizes="(max-width: 720px) 100vw, (max-width: 1000px) 50vw, 33vw" />
        ) : (
          <span className="poster-empty"><span>POSTER</span><small>Not provided</small></span>
        )}
        {event.isFeatured && <span className="featured-label">Featured</span>}
        <span className="poster-arrow" aria-hidden="true"><ArrowUpRight size={18} /></span>
      </Link>
      <div className="event-card-content">
        <div className="event-meta-line"><span className="category-label">{event.category}</span><span>{formatEventDate(event.startAt)}</span></div>
        <h3><Link href={`/events/${event.slug}`}>{event.title}</Link></h3>
        <p className="event-summary">{event.summary}</p>
        <div className="event-location"><MapPin size={15} aria-hidden="true" /><span>{event.campus} <span className="meta-dot">/</span> {event.venue}</span></div>
        <div className="event-card-bottom"><span>{formatEventTime(event.startAt, event.endAt)}</span><ShareEvent title={event.title} slug={event.slug} compact /></div>
      </div>
    </article>
  );
}
