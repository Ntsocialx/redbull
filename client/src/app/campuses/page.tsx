import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { getCampuses } from "@/lib/api";

export const instant = false;

export default async function CampusesPage() {
  const campuses = await getCampuses().catch(() => []);
  return (
    <main className="section-wrap page-main">
      <div className="page-intro"><span className="eyebrow">FIND YOUR PLACE</span><h1>Across <em>campus.</em></h1><p>Choose a campus to browse its published events.</p></div>
      {campuses.length ? <div className="campus-cards">{campuses.map((campus, index) => <Link className="campus-card" href={`/campuses/${campus.slug}`} key={campus.id}><span className="campus-card-index">0{index + 1} / TUT CAMPUS</span><MapPin size={22} /><h2>{campus.name}</h2><span className="campus-card-action">Explore events <ArrowUpRight size={17} /></span></Link>)}</div> : <div className="empty-state"><span className="empty-icon"><MapPin size={22} /></span><h2>Campus directory unavailable.</h2><p>Campus records will appear when the platform API is connected.</p></div>}
    </main>
  );
}
