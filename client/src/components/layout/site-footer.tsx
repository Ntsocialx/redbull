import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div><Link href="/" className="brand-lockup"><span className="brand-name">RED BULL <span>TUT</span></span></Link><p>A central place to find campus events and announcements.</p></div>
        <nav aria-label="Footer navigation"><Link href="/events">Events</Link><Link href="/announcements">Announcements</Link><Link href="/calendar">Calendar</Link><Link href="/campuses">Campuses</Link><Link href="/about">About</Link></nav>
      </div>
      <div className="footer-bottom"><span>© Red Bull TUT</span><span>Independent campus noticeboard. No official endorsement is implied.</span></div>
    </footer>
  );
}
