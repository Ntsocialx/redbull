"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ImagePlus, LoaderCircle, Save, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminRequest, type AdminEvent } from "@/lib/api";

const campuses = [
  ["soshanguve-south", "TUT Soshanguve South"],
  ["soshanguve-north", "TUT Soshanguve North"],
  ["ga-rankuwa", "Ga-Rankuwa Campus"],
  ["pretoria-main", "Pretoria Main Campus"],
  ["arcadia", "Arcadia Campus"],
] as const;
const categories = ["Gaming", "Academic", "Social", "Sports", "Workshops", "Orientation", "Career", "Student Life"] as const;
const schema = z.object({
  title: z.string().trim().min(3, "Enter at least 3 characters.").max(160),
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens."),
  summary: z.string().trim().min(1, "Add a short summary.").max(280),
  description: z.string().trim().min(1, "Add an event description.").max(10000),
  campusSlug: z.enum(campuses.map(([slug]) => slug) as [string, ...string[]]),
  venue: z.string().trim().min(1, "Enter a venue.").max(180),
  category: z.enum(categories),
  startAt: z.string().min(1, "Choose a start time."),
  endAt: z.string().min(1, "Choose an end time."),
  organizerName: z.string().max(160),
  organizerContact: z.string().max(254),
  registrationUrl: z.union([z.literal(""), z.url().refine((value) => ["https:", "http:"].includes(new URL(value).protocol))]),
  externalUrl: z.union([z.literal(""), z.url().refine((value) => ["https:", "http:"].includes(new URL(value).protocol))]),
  isFeatured: z.boolean(),
}).superRefine((value, context) => {
  if (value.startAt && value.endAt && new Date(value.endAt) <= new Date(value.startAt)) {
    context.addIssue({ code: "custom", path: ["endAt"], message: "End time must be after start time." });
  }
});
type EventFields = z.infer<typeof schema>;

type UploadSignature = { cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string; publicId: string; uploadUrl: string };
type CloudinaryUpload = { secure_url: string; public_id: string };

function localDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function defaults(event?: AdminEvent): EventFields {
  return {
    title: event?.title ?? "", slug: event?.slug ?? "", summary: event?.summary ?? "", description: event?.description ?? "",
    campusSlug: event?.campusSlug ?? "soshanguve-south", venue: event?.venue ?? "", category: (event?.category as EventFields["category"]) ?? "Social",
    startAt: localDateTime(event?.startAt), endAt: localDateTime(event?.endAt), organizerName: event?.organizerName ?? "",
    organizerContact: event?.organizerContact ?? "", registrationUrl: event?.registrationUrl ?? "", externalUrl: event?.externalUrl ?? "", isFeatured: event?.isFeatured ?? false,
  };
}

function slugify(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function EventForm({ event }: { event?: AdminEvent }) {
  const form = useForm<EventFields>({ resolver: zodResolver(schema), defaultValues: defaults(event) });
  const [file, setFile] = useState<File | null>(null);
  const [posterUrl, setPosterUrl] = useState(event?.posterUrl ?? "");
  const [posterId, setPosterId] = useState("");
  const [posterChanged, setPosterChanged] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => { if (event) form.reset(defaults(event)); }, [event, form]);
  useEffect(() => {
    if (!form.formState.isDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [form.formState.isDirty]);

  function selectFile(next: File | undefined) {
    setError("");
    if (!next) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type) || next.size > 8 * 1024 * 1024) {
      setError("Choose a JPG, PNG or WebP image under 8 MB.");
      return;
    }
    setFile(next);
  }

  async function uploadPoster() {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const signature = await adminRequest<{ data: UploadSignature }>("/admin/uploads/signature", { method: "POST" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signature.data.apiKey);
      formData.append("timestamp", String(signature.data.timestamp));
      formData.append("signature", signature.data.signature);
      formData.append("folder", signature.data.folder);
      formData.append("public_id", signature.data.publicId);
      formData.append("overwrite", "false");
      const response = await fetch(signature.data.uploadUrl, { method: "POST", body: formData });
      const result = await response.json() as CloudinaryUpload | { error?: { message?: string } };
      if (!response.ok || !("secure_url" in result)) throw new Error("error" in result ? result.error?.message ?? "Poster upload failed." : "Poster upload failed.");
      setPosterUrl(result.secure_url);
      setPosterId(result.public_id);
      setPosterChanged(true);
      setFile(null);
      setMessage("Poster uploaded and ready to save.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Poster upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(values: EventFields, publish: boolean) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload: Record<string, unknown> = {
        title: values.title, slug: values.slug, summary: values.summary, description: values.description,
        campusSlug: values.campusSlug, venue: values.venue, category: values.category,
        startAt: new Date(values.startAt).toISOString(), endAt: new Date(values.endAt).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Johannesburg",
        organizerName: values.organizerName || null, organizerContact: values.organizerContact || null,
        registrationUrl: values.registrationUrl || null, externalUrl: values.externalUrl || null, isFeatured: values.isFeatured,
      };
      if (posterChanged) {
        payload.posterUrl = posterUrl || null;
        payload.cloudinaryPublicId = posterId || null;
      }
      const endpoint = event ? `/admin/events/${event.id}` : "/admin/events";
      const result = await adminRequest<{ data: AdminEvent }>(endpoint, { method: event ? "PATCH" : "POST", body: JSON.stringify(payload) });
      if (publish && result.data.status !== "published") {
        await adminRequest(`/admin/events/${result.data.id}/publish`, { method: "POST" });
      }
      setMessage(publish ? "Event published." : event ? "Changes saved." : "Draft saved.");
      form.reset(values);
      setPosterChanged(false);
      if (!event) router.push("/events");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The event could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const register = form.register;
  return (
    <div className="admin-page">
      <Link href="/events" className="admin-back-link" onClick={(click) => { if (form.formState.isDirty && !window.confirm("Discard unsaved event changes?")) click.preventDefault(); }}><ArrowLeft size={15} />Events</Link>
      <div className="admin-page-heading"><div><span className="admin-eyebrow">{event ? "EDIT CONTENT" : "NEW CONTENT"}</span><h1>{event ? "Edit event" : "Create event"}</h1><p>{event ? `Current status: ${event.status}. Update details and save when ready.` : "Add event information for students across TUT."}</p></div>{event && <span className={`status-pill ${event.status}`}>{event.status}</span>}</div>
      {error && <div className="admin-alert" role="alert">{error}</div>}{message && <div className="admin-success" role="status">{message}</div>}
      <form className="event-form" onSubmit={form.handleSubmit((values) => submit(values, false))} noValidate>
        <section className="form-section"><div className="form-section-title"><span>01</span><div><h2>Event information</h2><p>Give students a clear overview.</p></div></div><div className="form-fields">
          <label className="field full"><span>Event title <b>*</b></span><input {...register("title", { onBlur: (event) => { if (!form.getValues("slug")) form.setValue("slug", slugify(event.target.value), { shouldDirty: true, shouldValidate: true }); } })} placeholder="e.g. Campus Gaming Wednesday" />{form.formState.errors.title && <small className="field-error">{form.formState.errors.title.message}</small>}</label>
          <label className="field full"><span>URL slug <b>*</b></span><input {...register("slug")} placeholder="campus-gaming-wednesday" />{form.formState.errors.slug && <small className="field-error">{form.formState.errors.slug.message}</small>}</label>
          <label className="field full"><span>Short summary <b>*</b></span><input {...register("summary")} maxLength={280} placeholder="A short description for event cards" />{form.formState.errors.summary && <small className="field-error">{form.formState.errors.summary.message}</small>}</label>
          <label className="field full"><span>Full description <b>*</b></span><textarea rows={6} {...register("description")} placeholder="Include the details students need to know." />{form.formState.errors.description && <small className="field-error">{form.formState.errors.description.message}</small>}</label>
          <label className="field"><span>Category <b>*</b></span><select {...register("category")}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        </div></section>
        <section className="form-section"><div className="form-section-title"><span>02</span><div><h2>Location</h2><p>Use the canonical campus label.</p></div></div><div className="form-fields"><label className="field"><span>Campus <b>*</b></span><select {...register("campusSlug")}>{campuses.map(([slug, name]) => <option value={slug} key={slug}>{name}</option>)}</select></label><label className="field"><span>Venue <b>*</b></span><input {...register("venue")} placeholder="Building, room or meeting point" />{form.formState.errors.venue && <small className="field-error">{form.formState.errors.venue.message}</small>}</label></div></section>
        <section className="form-section"><div className="form-section-title"><span>03</span><div><h2>Date and time</h2><p>Times are stored as UTC and shown in the selected local timezone.</p></div></div><div className="form-fields"><label className="field"><span>Starts <b>*</b></span><input type="datetime-local" {...register("startAt")} />{form.formState.errors.startAt && <small className="field-error">{form.formState.errors.startAt.message}</small>}</label><label className="field"><span>Ends <b>*</b></span><input type="datetime-local" {...register("endAt")} />{form.formState.errors.endAt && <small className="field-error">{form.formState.errors.endAt.message}</small>}</label></div></section>
        <section className="form-section"><div className="form-section-title"><span>04</span><div><h2>Poster</h2><p>JPG, PNG or WebP · up to 8 MB.</p></div></div><div className="poster-upload-box">{posterUrl ? <div className="poster-upload-preview"><Image src={posterUrl} alt="Current event poster" fill sizes="150px" /><button type="button" className="icon-button" aria-label="Remove poster" onClick={() => { setPosterUrl(""); setPosterId(""); setPosterChanged(true); setFile(null); }}><X size={16} /></button></div> : <div className="poster-dropzone"><ImagePlus size={22} /><strong>{file?.name ?? "Choose a poster image"}</strong><span>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "Upload directly to the authorized media account."}</span><label className="admin-button admin-button-outline"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectFile(event.target.files?.[0])} />Select image</label></div>}{file && <button type="button" className="admin-button admin-button-red" onClick={uploadPoster} disabled={uploading}>{uploading ? <LoaderCircle className="spin" size={15} /> : <Upload size={15} />}{uploading ? "Uploading…" : "Upload poster"}</button>}</div></section>
        <section className="form-section"><div className="form-section-title"><span>05</span><div><h2>Additional details</h2><p>Optional organizer and registration information.</p></div></div><div className="form-fields"><label className="field"><span>Organizer name</span><input {...register("organizerName")} /></label><label className="field"><span>Organizer contact</span><input {...register("organizerContact")} /></label><label className="field"><span>Registration URL</span><input type="url" {...register("registrationUrl")} placeholder="https://" />{form.formState.errors.registrationUrl && <small className="field-error">Use an HTTP or HTTPS URL.</small>}</label><label className="field"><span>External event URL</span><input type="url" {...register("externalUrl")} placeholder="https://" />{form.formState.errors.externalUrl && <small className="field-error">Use an HTTP or HTTPS URL.</small>}</label><label className="featured-toggle"><input type="checkbox" {...register("isFeatured")} /><span>Feature this event on the student homepage</span></label></div></section>
        <div className="form-actions"><Link href="/events" className="admin-button admin-button-outline" onClick={(click) => { if (form.formState.isDirty && !window.confirm("Discard unsaved event changes?")) click.preventDefault(); }}>Cancel</Link><div><button className="admin-button admin-button-outline" type="submit" disabled={saving || uploading}><Save size={15} />{saving ? "Saving…" : event ? "Save changes" : "Save draft"}</button><button className="admin-button admin-button-red" type="button" disabled={saving || uploading} onClick={form.handleSubmit((values) => submit(values, true))}>{saving ? "Publishing…" : "Publish event"}</button></div></div>
      </form>
    </div>
  );
}
