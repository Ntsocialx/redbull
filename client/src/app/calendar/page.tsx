import { CalendarExplorer } from "@/components/calendar/calendar-explorer";
import { getCampuses } from "@/lib/api";

export const instant = false;

export default async function CalendarPage() {
  const campuses = await getCampuses().catch(() => []);
  return <main className="section-wrap page-main"><div className="page-intro"><span className="eyebrow">PLAN YOUR MONTH</span><h1>Campus <em>calendar.</em></h1><p>Browse upcoming published events by date.</p></div><CalendarExplorer campuses={campuses} /></main>;
}
