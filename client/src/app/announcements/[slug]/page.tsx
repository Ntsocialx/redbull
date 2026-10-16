import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, Megaphone } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { Announcement } from "@/types";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const result = await apiRequest<{ data: Announcement }>(`/announcements/${encodeURIComponent(slug)}`);
    return { title: `${result.data.title} | Red Bull TUT`, description: result.data.summary };
  } catch {
    return { title: "Announcement not found | Red Bull TUT" };
  }
}

export default async function AnnouncementDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let notice: Announcement | null = null;
  try {
    const result = await apiRequest<{ data: Announcement }>(`/announcements/${encodeURIComponent(slug)}`);
    notice = result.data;
  } catch {
    notFound();
  }
  if (!notice) notFound();
  return <main className="section-wrap page-main announcement-detail"><Link href="/announcements" className="back-link"><ArrowLeft size={16} />All announcements</Link><article className={`announcement-feature priority-${notice.priority}`}><div className="notice-meta"><span className={`priority-label ${notice.priority}`}>{notice.priority}</span><span>{notice.campus ?? "All campuses"}</span></div><Megaphone size={25} /><h1>{notice.title}</h1><p className="detail-summary">{notice.summary}</p><div className="announcement-body">{notice.body}</div>{notice.externalUrl && <a className="button button-red" href={notice.externalUrl} target="_blank" rel="noreferrer">More information <ArrowUpRight size={16} /></a>}</article></main>;
}
