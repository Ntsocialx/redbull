import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return <main className="section-wrap page-main about-page"><div className="page-intro"><span className="eyebrow">ABOUT THE PLATFORM</span><h1>One place for<br /><em>what’s happening.</em></h1><p>Red Bull TUT is a centralized campus events and announcements platform for students at Tshwane University of Technology.</p></div><div className="about-detail"><ShieldCheck size={24} /><div><h2>Clear information, responsibly published.</h2><p>Event information is published by authorized platform administrators. Details can change, so consult the event organizer for event-specific information.</p><p>Red Bull TUT is an independent platform identity. No official partnership or endorsement by TUT or Red Bull is implied.</p></div></div><Link className="button button-red" href="/events">Explore published events <ArrowUpRight size={16} /></Link></main>;
}
