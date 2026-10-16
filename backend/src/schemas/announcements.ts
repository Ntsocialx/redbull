import { z } from "zod";
import { campusSlugs } from "./events.js";

const safeUrl = z.url().refine((value) => ["https:", "http:"].includes(new URL(value).protocol), "URL must use HTTP or HTTPS");

export const announcementInputSchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().trim().min(1).max(280),
  body: z.string().trim().min(1).max(10_000),
  campusSlug: z.enum(campusSlugs).nullable().optional(),
  priority: z.enum(["normal", "important", "urgent"]).default("normal"),
  externalUrl: safeUrl.nullable().optional(),
  startsAt: z.iso.datetime({ offset: true }).nullable().optional(),
  expiresAt: z.iso.datetime({ offset: true }).nullable().optional(),
}).superRefine((announcement, context) => {
  if (announcement.startsAt && announcement.expiresAt && new Date(announcement.expiresAt) <= new Date(announcement.startsAt)) {
    context.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiration must be after publication time." });
  }
});

export const announcementPatchSchema = announcementInputSchema.partial();
