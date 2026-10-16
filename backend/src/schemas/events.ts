import { z } from "zod";
import { isValidEventWindow } from "../domain/events.js";

export const campusSlugs = ["soshanguve-south", "soshanguve-north", "ga-rankuwa", "pretoria-main", "arcadia"] as const;
export const eventCategories = ["Gaming", "Academic", "Social", "Sports", "Workshops", "Orientation", "Career", "Student Life"] as const;
const safeUrl = z.url().refine((value) => ["https:", "http:"].includes(new URL(value).protocol), "URL must use HTTP or HTTPS");

const eventFieldsSchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().trim().min(1).max(280),
  description: z.string().trim().min(1).max(10_000),
  campusSlug: z.enum(campusSlugs),
  venue: z.string().trim().min(1).max(180),
  category: z.enum(eventCategories),
  startAt: z.iso.datetime({ offset: true }),
  endAt: z.iso.datetime({ offset: true }),
  timezone: z.string().trim().min(1).max(80).default("Africa/Johannesburg"),
  organizerName: z.string().trim().max(160).nullable().optional(),
  organizerContact: z.string().trim().max(254).nullable().optional(),
  registrationUrl: safeUrl.nullable().optional(),
  externalUrl: safeUrl.nullable().optional(),
  posterUrl: safeUrl.nullable().optional(),
  cloudinaryPublicId: z.string().max(255).nullable().optional(),
  isFeatured: z.boolean().default(false),
});

export const eventInputSchema = eventFieldsSchema.superRefine((event, context) => {
  if (!isValidEventWindow(event.startAt, event.endAt)) {
    context.addIssue({ code: "custom", path: ["endAt"], message: "End time must be after start time." });
  }
  if (Boolean(event.posterUrl) !== Boolean(event.cloudinaryPublicId)) {
    context.addIssue({ code: "custom", path: ["posterUrl"], message: "Poster URL and asset ID must be provided together." });
  }
});

export const eventPatchSchema = eventFieldsSchema.partial().superRefine((event, context) => {
  if (event.startAt !== undefined && event.endAt !== undefined && !isValidEventWindow(event.startAt, event.endAt)) {
    context.addIssue({ code: "custom", path: ["endAt"], message: "End time must be after start time." });
  }
  if (event.posterUrl !== undefined && event.cloudinaryPublicId !== undefined
    && Boolean(event.posterUrl) !== Boolean(event.cloudinaryPublicId)) {
    context.addIssue({ code: "custom", path: ["posterUrl"], message: "Poster URL and asset ID must be provided together." });
  }
  if ((event.posterUrl === null) !== (event.cloudinaryPublicId === null)
    && (event.posterUrl === null || event.cloudinaryPublicId === null)) {
    context.addIssue({ code: "custom", path: ["posterUrl"], message: "Remove both poster fields together." });
  }
});
export const listEventSchema = z.object({
  search: z.string().trim().max(120).optional(),
  campus: z.enum(campusSlugs).optional(),
  category: z.enum(eventCategories).optional(),
  from: z.union([z.iso.date(), z.iso.datetime({ offset: true })]).optional(),
  to: z.union([z.iso.date(), z.iso.datetime({ offset: true })]).optional(),
  period: z.enum(["upcoming", "past"]).default("upcoming"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(["startAt", "title"]).default("startAt"),
  direction: z.enum(["asc", "desc"]).default("asc"),
});
