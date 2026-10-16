import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, CalendarDays, MapPin, Megaphone } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { CanFeatureImage } from "@/components/events/can-feature-image";
import { getCampuses, getFeaturedEvents, getUrgentAnnouncements } from "@/lib/api";

export const instant = false;

export default async function Home() {
  const [events, notices, campuses] = await Promise.all([
    getFeaturedEvents().catch(() => []),
    getUrgentAnnouncements().catch(() => []),
    getCampuses().catch(() => []),
  ]);
  return (
    <main>
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-mark" /> CAMPUS NOTICEBOARD</span>
          <h1>Your campus.<br />Your events.<br /><em>Your vibe.</em></h1>
          <p>Stay in the loop with events, campus activities, workshops, gaming sessions and student announcements across TUT.</p>
          <div className="hero-actions"><Link className="button button-red" href="/events">Explore events <ArrowUpRight size={17} /></Link><Link className="button button-text" href="/calendar">View calendar <CalendarDays size={17} /></Link></div>
          <div className="hero-footnote"><span>PUBLIC CAMPUS BOARD</span><span>EVENTS · PEOPLE · PLACES</span></div>
        </div>
        <div className="hero-art" aria-label="Campus events visual">
          <div className="hero-art-top"><span>01 / DISCOVER</span><span>PRETORIA · SOUTH AFRICA</span></div>
          <div className="hero-shape"><CanFeatureImage /><span className="shape-caption">CAMPUS<br />IN MOTION</span></div>
          <div className="hero-art-bottom"><span>MADE FOR THE<br />MOMENTS BETWEEN</span><ArrowDownRight size={26} /></div>
        </div>
      </section>

      {notices.length > 0 && <section className="urgent-ribbon" aria-label="Urgent announcements"><Megaphone size={18} /><strong>URGENT</strong><span>{notices[0]?.title}</span><Link href="/announcements">Read notice <ArrowUpRight size={15} /></Link></section>}

      <section className="featured-band"><div className="section-wrap featured-section">
        <div className="section-heading"><div><span className="eyebrow">WHAT’S ON</span><h2>Make room for<br /><em>something good.</em></h2></div><Link className="button button-outline" href="/events">All events <ArrowUpRight size={16} /></Link></div>
        {events.length ? <div className="event-grid">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <div className="empty-band"><span className="empty-number">01</span><div><h3>Nothing published just yet.</h3><p>New events will show here when a platform administrator publishes them.</p></div><Link href="/events">Browse events <ArrowUpRight size={16} /></Link></div>}
      </div></section>

      <section className="campus-band">
        <div className="section-wrap campus-band-inner"><div><span className="eyebrow">FIVE CAMPUSES, ONE PLACE</span><h2>Find your<br /><em>corner of TUT.</em></h2><p>Explore published events by campus, and find what’s happening close to you.</p><Link className="button button-light" href="/campuses">Explore campuses <ArrowUpRight size={16} /></Link></div>
          <div className="campus-list">{campuses.length ? campuses.map((campus, index) => <Link key={campus.id} href={`/campuses/${campus.slug}`}><span>0{index + 1}</span><strong>{campus.name}</strong><ArrowUpRight size={16} /></Link>) : <div className="campus-empty"><MapPin size={18} /><span>Campus directory is unavailable. Check back soon.</span></div>}</div>
        </div>
      </section>

      <section className="section-wrap category-section"><div className="section-heading"><div><span className="eyebrow">FOLLOW YOUR INTEREST</span><h2>Pick a <em>lane.</em></h2></div></div><div className="category-links">{["Gaming", "Academic", "Social", "Sports", "Workshops", "Career", "Student Life"].map((category, index) => <Link key={category} href={`/events?category=${encodeURIComponent(category)}`}><span>0{index + 1}</span>{category}<ArrowUpRight size={16} /></Link>)}</div></section>
    </main>
  );
}
