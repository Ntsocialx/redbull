"use client";

import { startTransition, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { apiRequest, formatEventDate, formatEventTime } from "@/lib/api";
import type { ApiList, Campus, EventRecord } from "@/types";

const categories = ["Gaming", "Academic", "Social", "Sports", "Workshops", "Orientation", "Career", "Student Life"];
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarExplorer({ campuses }: { campuses: Campus[] }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selected, setSelected] = useState<EventRecord | null>(null);
  const [campus, setCampus] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  useEffect(() => {
    let current = true;
    const from = new Date(year, monthIndex, 1).toISOString();
    const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);
    const to = monthEnd.toISOString();
    const query = new URLSearchParams({ from, to, limit: "50", period: monthEnd < new Date() ? "past" : "upcoming" });
    if (campus) query.set("campus", campus);
    if (category) query.set("category", category);
    startTransition(async () => {
      try {
        const result = await apiRequest<ApiList<EventRecord>>(`/events?${query}`);
        if (current) setEvents(result.data);
      } catch {
        if (current) setEvents([]);
      } finally {
        if (current) setLoading(false);
      }
    });
    return () => { current = false; };
  }, [year, monthIndex, campus, category]);

  const firstOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstOffset + dayCount) / 7) * 7 }, (_, index) => {
    const day = index - firstOffset + 1;
    return day > 0 && day <= dayCount ? day : null;
  });
  const eventsOn = (day: number) => events.filter((event) => {
    const date = new Date(event.startAt);
    return date.getFullYear() === year && date.getMonth() === monthIndex && date.getDate() === day;
  });

  return (
    <div className="calendar-explorer">
      <div className="calendar-toolbar">
        <div className="month-controls"><button className="icon-button" type="button" aria-label="Previous month" onClick={() => { setLoading(true); setMonth(new Date(year, monthIndex - 1, 1)); }}><ArrowLeft size={17} /></button><h2>{new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric" }).format(month)}</h2><button className="icon-button" type="button" aria-label="Next month" onClick={() => { setLoading(true); setMonth(new Date(year, monthIndex + 1, 1)); }}><ArrowRight size={17} /></button><button className="today-button" type="button" onClick={() => { setLoading(true); setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); setSelected(null); }}>Today</button></div>
        <div className="calendar-filters"><label><span className="sr-only">Filter by campus</span><select value={campus} onChange={(event) => { setLoading(true); setCampus(event.target.value); }}><option value="">All campuses</option>{campuses.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label><label><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => { setLoading(true); setCategory(event.target.value); }}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div>
      </div>
      <div className="calendar-body">
        <div className="calendar-grid" aria-label="Month calendar">
          {weekdays.map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
          {cells.map((day, index) => <div className={`calendar-cell ${day === null ? "outside-month" : ""}`} key={`${day ?? "blank"}-${index}`}>
            {day !== null && <><span className={`calendar-day-number ${new Date().getFullYear() === year && new Date().getMonth() === monthIndex && new Date().getDate() === day ? "is-today" : ""}`}>{day}</span>{eventsOn(day).map((event) => <button className={`calendar-event category-${event.category.toLowerCase().replaceAll(" ", "-")}`} key={event.id} type="button" onClick={() => setSelected(event)} aria-label={`${event.title}, ${formatEventTime(event.startAt, event.endAt)}`}><span aria-hidden="true" />{event.title}</button>)}</>}
          </div>)}
        </div>
        <aside className="calendar-agenda" aria-live="polite">
          <div className="agenda-heading"><span className="eyebrow">{selected ? "SELECTED EVENT" : "MONTH AGENDA"}</span><CalendarDays size={18} /></div>
          {loading ? <p className="agenda-empty">Loading events…</p> : selected ? <div className="agenda-event"><span className="category-label">{selected.category}</span><h3>{selected.title}</h3><p>{formatEventDate(selected.startAt, { weekday: "long" })}<br />{formatEventTime(selected.startAt, selected.endAt)}</p><p><MapPin size={14} />{selected.campus} · {selected.venue}</p><a href={`/events/${selected.slug}`}>Event details <ArrowRight size={14} /></a></div> : events.length ? events.slice(0, 6).map((event) => <button className="agenda-row" key={event.id} type="button" onClick={() => setSelected(event)}><span>{formatEventDate(event.startAt, { day: "numeric", month: "short" })}</span><strong>{event.title}</strong><small>{event.campus}</small></button>) : <p className="agenda-empty">No published events in this month.</p>}
        </aside>
      </div>
    </div>
  );
}
