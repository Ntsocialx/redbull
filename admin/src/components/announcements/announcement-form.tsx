"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminRequest, type AdminAnnouncement } from "@/lib/api";

const campuses = [
  ["soshanguve-south", "TUT Soshanguve South"], ["soshanguve-north", "TUT Soshanguve North"],
  ["ga-rankuwa", "Ga-Rankuwa Campus"], ["pretoria-main", "Pretoria Main Campus"], ["arcadia", "Arcadia Campus"],
] as const;
const schema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().trim().min(1).max(280),
  body: z.string().trim().min(1).max(10000),
  campusSlug: z.string(),
  priority: z.enum(["normal", "important", "urgent"]),
  startsAt: z.string(),
  expiresAt: z.string(),
  externalUrl: z.union([z.literal(""), z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol))]),
});
type Fields = z.infer<typeof schema>;
const defaults: Fields = { title: "", slug: "", summary: "", body: "", campusSlug: "", priority: "normal", startsAt: "", expiresAt: "", externalUrl: "" };

function slugify(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function toIso(value: string) { return value ? new Date(value).toISOString() : null; }
function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function AnnouncementForm({ announcement }: { announcement?: AdminAnnouncement }) {
  const router = useRouter();
  const initialValues: Fields = announcement ? {
    title: announcement.title, slug: announcement.slug, summary: announcement.summary, body: announcement.body,
    campusSlug: announcement.campusSlug ?? "", priority: announcement.priority,
    startsAt: localDateTime(announcement.startsAt), expiresAt: localDateTime(announcement.expiresAt),
    externalUrl: announcement.externalUrl ?? "",
  } : defaults;
  const form = useForm<Fields>({ resolver: zodResolver(schema), defaultValues: initialValues });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const values = useWatch({ control: form.control });

  async function submit(fields: Fields, publish: boolean) {
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const endpoint = announcement ? `/admin/announcements/${announcement.id}` : "/admin/announcements";
      const result = await adminRequest<{ data: { id: string } }>(endpoint, {
        method: announcement ? "PATCH" : "POST",
        body: JSON.stringify({
          title: fields.title, slug: fields.slug, summary: fields.summary, body: fields.body,
          campusSlug: fields.campusSlug || null, priority: fields.priority,
          startsAt: toIso(fields.startsAt), expiresAt: toIso(fields.expiresAt), externalUrl: fields.externalUrl || null,
        }),
      });
      if (publish) await adminRequest(`/admin/announcements/${result.data.id}/publish`, { method: "POST" });
      setMessage(publish ? "Announcement published." : "Announcement saved as a draft.");
      if (announcement) router.push("/announcements");
      else form.reset(defaults);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Announcement could not be saved.");
    } finally { setSaving(false); }
  }

  return (
    <div className="admin-page">
      <Link href="/announcements" className="admin-back-link"><ArrowLeft size={15} />Announcements</Link>
      <div className="admin-page-heading"><div><span className="admin-eyebrow">{announcement ? "EDIT CONTENT" : "NEW CONTENT"}</span><h1>{announcement ? "Edit announcement" : "Create announcement"}</h1><p>Prepare a campus update for the student noticeboard.</p></div></div>
      {error && <div className="admin-alert" role="alert">{error}</div>}{message && <div className="admin-success" role="status">{message}</div>}
      <form className="event-form" onSubmit={form.handleSubmit((fields) => submit(fields, false))} noValidate>
        <section className="form-section"><div className="form-section-title"><span>01</span><div><h2>Announcement details</h2><p>Keep important information easy to scan.</p></div></div><div className="form-fields">
          <label className="field full"><span>Title <b>*</b></span><input {...form.register("title", { onBlur: (event) => { if (!form.getValues("slug")) form.setValue("slug", slugify(event.target.value), { shouldDirty: true }); } })} /></label>
          <label className="field full"><span>Slug <b>*</b></span><input {...form.register("slug")} placeholder="campus-update" /></label>
          <label className="field full"><span>Summary <b>*</b></span><input {...form.register("summary")} maxLength={280} /></label>
          <label className="field full"><span>Announcement body <b>*</b></span><textarea rows={7} {...form.register("body")} /></label>
          <label className="field"><span>Campus</span><select {...form.register("campusSlug")}><option value="">All campuses</option>{campuses.map(([slug, name]) => <option value={slug} key={slug}>{name}</option>)}</select></label>
          <label className="field"><span>Priority</span><select {...form.register("priority")}><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select></label>
          <label className="field"><span>Publish from</span><input type="datetime-local" {...form.register("startsAt")} /></label>
          <label className="field"><span>Expires at</span><input type="datetime-local" {...form.register("expiresAt")} /></label>
          <label className="field full"><span>External information URL</span><input type="url" placeholder="https://" {...form.register("externalUrl")} /></label>
        </div></section>
        <section className="form-section announcement-preview-section"><div className="form-section-title"><span>02</span><div><h2>Student preview</h2><p>Preview updates as you write.</p></div></div><article className={`announcement-preview priority-${values.priority}`}><span className={`status-pill ${values.priority}`}>{values.priority}</span><small>{campuses.find(([slug]) => slug === values.campusSlug)?.[1] ?? "All campuses"}</small><h3>{values.title || "Announcement title"}</h3><p>{values.summary || "Your summary appears here."}</p><div>{values.body || "Your announcement details appear here."}</div>{values.externalUrl && <span className="admin-inline-link">More information <ArrowUpRight size={14} /></span>}</article></section>
        <div className="form-actions"><Link href="/announcements" className="admin-button admin-button-outline" onClick={(click) => { if (form.formState.isDirty && !window.confirm("Discard unsaved announcement changes?")) click.preventDefault(); }}>Cancel</Link><div><button className="admin-button admin-button-outline" type="submit" disabled={saving}>{saving ? "Saving…" : "Save draft"}</button><button className="admin-button admin-button-red" type="button" disabled={saving} onClick={form.handleSubmit((fields) => submit(fields, true))}>{saving ? "Publishing…" : "Publish announcement"}</button></div></div>
      </form>
    </div>
  );
}
