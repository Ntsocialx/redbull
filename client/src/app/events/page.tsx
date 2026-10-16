import Link from "next/link";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { getCampuses, getEvents } from "@/lib/api";
import type { EventRecord } from "@/types";

export const instant = false;

const categories = ["Gaming", "Academic", "Social", "Sports", "Workshops", "Orientation", "Career", "Student Life"];
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ["search", "campus", "category", "from", "to", "period", "page"]) {
    const value = params[key];
    if (typeof value === "string" && value) query.set(key, value);
  }
  if (!query.has("limit")) query.set("limit", "12");
  const [result, campuses] = await Promise.all([
    getEvents(query.toString()).catch(() => ({ data: [] as EventRecord[], pagination: undefined })),
    getCampuses().catch(() => []),
  ]);
  const hasFilters = ["search", "campus", "category", "from", "to"].some((key) => typeof params[key] === "string" && params[key]) || params.period === "past";
  return (
    <main className="page-main section-wrap">
      <div className="page-intro"><span className="eyebrow">THE EVENT BOARD</span><h1>Find your <em>next thing.</em></h1><p>Search the published calendar across TUT campuses.</p></div>
      <form className="filter-panel" action="/events" method="get">
        <label className="search-field"><Search size={18} /><span className="sr-only">Search events</span><input name="search" type="search" placeholder="Search events, topics, places…" defaultValue={typeof params.search === "string" ? params.search : ""} /></label>
        <label><span className="filter-label">CAMPUS</span><select name="campus" defaultValue={typeof params.campus === "string" ? params.campus : ""}><option value="">All campuses</option>{campuses.map((campus) => <option key={campus.id} value={campus.slug}>{campus.name}</option>)}</select></label>
        <label><span className="filter-label">CATEGORY</span><select name="category" defaultValue={typeof params.category === "string" ? params.category : ""}><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label><span className="filter-label">FROM</span><input type="date" name="from" defaultValue={typeof params.from === "string" ? params.from.slice(0, 10) : ""} /></label>
        <label><span className="filter-label">TO</span><input type="date" name="to" defaultValue={typeof params.to === "string" ? params.to.slice(0, 10) : ""} /></label>
        <label><span className="filter-label">WHEN</span><select name="period" defaultValue={typeof params.period === "string" ? params.period : "upcoming"}><option value="upcoming">Upcoming</option><option value="past">Past</option></select></label>
        <button className="button button-red filter-submit" type="submit"><SlidersHorizontal size={16} />Apply filters</button>
        {hasFilters && <Link className="clear-filter" href="/events">Clear filters</Link>}
      </form>
      <div className="results-heading"><span>{result.pagination?.totalItems ?? result.data.length} published events</span>{typeof params.search === "string" && params.search && <span className="active-filter">Search: {params.search}</span>}</div>
      {result.data.length ? <div className="event-grid">{result.data.map((event) => <EventCard key={event.id} event={event} />)}</div> : <div className="empty-state"><span className="empty-icon"><Search size={22} /></span><h2>{hasFilters ? "No events match these filters." : "No events published yet."}</h2><p>{hasFilters ? "Try a different campus, category, or date range." : "Published events will appear here when they’re ready."}</p>{hasFilters && <Link href="/events" className="button button-outline">Clear filters</Link>}</div>}
      {result.pagination && result.pagination.totalPages > 1 && <nav className="pagination" aria-label="Event pages">{Number(params.page ?? 1) > 1 && <Link href={`/events?${new URLSearchParams({ ...Object.fromEntries(query), page: String(Number(params.page ?? 1) - 1) })}`}>Previous</Link>}<span>Page {result.pagination.page} of {result.pagination.totalPages}</span>{result.pagination.page < result.pagination.totalPages && <Link href={`/events?${new URLSearchParams({ ...Object.fromEntries(query), page: String(result.pagination.page + 1) })}`}>Next <ArrowUpRight size={14} /></Link>}</nav>}
    </main>
  );
}
