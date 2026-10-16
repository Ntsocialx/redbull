import { Router } from "express";
import { z } from "zod";
import { pool } from "../config/database.js";
import { authenticate } from "../middleware/authenticate.js";
import { campusSlugs, eventInputSchema, eventPatchSchema, eventCategories } from "../schemas/events.js";
import { verifyPosterUpload } from "../services/cloudinary.js";
import { isValidEventWindow } from "../domain/events.js";
import { canTransitionEventStatus, type EventStatus } from "../domain/event-status.js";

export const adminEventsRouter = Router();
adminEventsRouter.use(authenticate);
const eventSelect = `SELECT e.id, e.title, e.slug, e.summary, e.description, e.poster_url AS "posterUrl",
  e.cloudinary_public_id AS "cloudinaryPublicId", c.name AS campus, c.slug AS "campusSlug", e.venue,
  e.category, e.start_at AS "startAt", e.end_at AS "endAt", e.timezone, e.organizer_name AS "organizerName",
  e.organizer_contact AS "organizerContact", e.registration_url AS "registrationUrl", e.external_url AS "externalUrl",
  e.is_featured AS "isFeatured", e.status, e.published_at AS "publishedAt", e.updated_at AS "updatedAt"
  FROM events e JOIN campuses c ON c.id = e.campus_id`;
const idSchema = z.uuid();
const listSchema = z.object({
  search: z.string().trim().max(120).optional(),
  campus: z.enum(campusSlugs).optional(),
  category: z.enum(eventCategories).optional(),
  status: z.enum(["draft", "published", "cancelled", "archived"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

adminEventsRouter.get("/", async (request, response) => {
  const parsed = listSchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Event filters are invalid." } });
    return;
  }
  const { search, campus, category, status, page, limit } = parsed.data;
  const clauses = ["e.deleted_at IS NULL"];
  const values: string[] = [];
  const add = (clause: string, value: string) => {
    values.push(value);
    clauses.push(clause.replace("?", `$${values.length}`));
  };
  if (search) {
    values.push(`%${search}%`);
    clauses.push(`(e.title ILIKE $${values.length} OR e.summary ILIKE $${values.length})`);
  }
  if (campus) add("c.slug = ?", campus);
  if (category) add("e.category = ?", category);
  if (status) add("e.status = ?", status);
  const where = clauses.join(" AND ");
  const count = await pool.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM events e JOIN campuses c ON c.id = e.campus_id WHERE ${where}`,
    values,
  );
  const offset = (page - 1) * limit;
  const result = await pool.query(
    `${eventSelect} WHERE ${where} ORDER BY e.updated_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );
  const totalItems = Number(count.rows[0]?.total ?? 0);
  response.json({ data: result.rows, pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) } });
});

adminEventsRouter.post("/", async (request, response) => {
  const parsed = eventInputSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Event details are invalid.", details: parsed.error.flatten() } });
    return;
  }
  const event = parsed.data;
  let poster: { publicId: string; url: string } | null = null;
  if (event.posterUrl && event.cloudinaryPublicId) {
    poster = await verifyPosterUpload(response.locals.adminId, response.locals.sessionId, event.cloudinaryPublicId, event.posterUrl);
    if (!poster) {
      response.status(422).json({ error: { code: "INVALID_POSTER", message: "Upload a valid poster using the admin upload flow." } });
      return;
    }
  }
  const campus = await pool.query<{ id: string }>("SELECT id FROM campuses WHERE slug = $1 AND is_active = TRUE", [event.campusSlug]);
  if (!campus.rows[0]) {
    response.status(422).json({ error: { code: "INVALID_CAMPUS", message: "Select an active campus." } });
    return;
  }
  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO events (title, slug, summary, description, campus_id, venue, category, start_at, end_at, timezone,
      organizer_name, organizer_contact, registration_url, external_url, is_featured, poster_url, cloudinary_public_id,
      created_by, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $18)
     RETURNING id`,
    [event.title, event.slug, event.summary, event.description, campus.rows[0].id, event.venue, event.category,
      event.startAt, event.endAt, event.timezone, event.organizerName ?? null, event.organizerContact ?? null,
      event.registrationUrl ?? null, event.externalUrl ?? null, event.isFeatured, poster?.url ?? null,
      poster?.publicId ?? null, response.locals.adminId],
  );
  const created = await pool.query(`${eventSelect} WHERE e.id = $1`, [inserted.rows[0]?.id]);
  response.status(201).json({ data: created.rows[0] });
});

adminEventsRouter.get("/:id", async (request, response) => {
  const id = idSchema.safeParse(request.params.id);
  if (!id.success) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Event not found." } });
    return;
  }
  const result = await pool.query(`${eventSelect} WHERE e.id = $1 AND e.deleted_at IS NULL`, [id.data]);
  if (!result.rows[0]) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Event not found." } });
    return;
  }
  response.json({ data: result.rows[0] });
});

adminEventsRouter.patch("/:id", async (request, response) => {
  const id = idSchema.safeParse(request.params.id);
  const parsed = eventPatchSchema.safeParse(request.body);
  if (!id.success) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Event not found." } });
    return;
  }
  if (!parsed.success) {
    response.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Event details are invalid.", details: parsed.error.flatten() } });
    return;
  }
  const input = parsed.data;
  const current = await pool.query<{ startAt: Date; endAt: Date }>(
    "SELECT start_at AS \"startAt\", end_at AS \"endAt\" FROM events WHERE id = $1 AND deleted_at IS NULL",
    [id.data],
  );
  const storedEvent = current.rows[0];
  if (!storedEvent) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Event not found." } });
    return;
  }
  if (!isValidEventWindow(input.startAt ?? storedEvent.startAt, input.endAt ?? storedEvent.endAt)) {
    response.status(422).json({ error: { code: "INVALID_EVENT_WINDOW", message: "End time must be after start time." } });
    return;
  }
  if (input.campusSlug !== undefined) {
    const campus = await pool.query("SELECT 1 FROM campuses WHERE slug = $1 AND is_active = TRUE", [input.campusSlug]);
    if (!campus.rowCount) {
      response.status(422).json({ error: { code: "INVALID_CAMPUS", message: "Select an active campus." } });
      return;
    }
  }
  let poster: { publicId: string; url: string } | null | undefined;
  if (input.posterUrl !== undefined || input.cloudinaryPublicId !== undefined) {
    if (input.posterUrl && input.cloudinaryPublicId) {
      poster = await verifyPosterUpload(response.locals.adminId, response.locals.sessionId, input.cloudinaryPublicId, input.posterUrl);
      if (!poster) {
        response.status(422).json({ error: { code: "INVALID_POSTER", message: "Upload a valid poster using the admin upload flow." } });
        return;
      }
    } else if (input.posterUrl === null && input.cloudinaryPublicId === null) {
      poster = null;
    }
  }
  const columns: Record<string, string> = {
    title: "title", slug: "slug", summary: "summary", description: "description", venue: "venue", category: "category",
    startAt: "start_at", endAt: "end_at", timezone: "timezone", organizerName: "organizer_name",
    organizerContact: "organizer_contact", registrationUrl: "registration_url", externalUrl: "external_url",
    isFeatured: "is_featured",
  };
  const values: unknown[] = [];
  const updates: string[] = [];
  for (const [field, column] of Object.entries(columns)) {
    const value = (input as Record<string, unknown>)[field];
    if (value !== undefined) {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    }
  }
  if (poster !== undefined) {
    values.push(poster?.url ?? null);
    updates.push(`poster_url = $${values.length}`);
    values.push(poster?.publicId ?? null);
    updates.push(`cloudinary_public_id = $${values.length}`);
  }
  if (input.campusSlug !== undefined) {
    values.push(input.campusSlug);
    updates.push(`campus_id = (SELECT id FROM campuses WHERE slug = $${values.length} AND is_active = TRUE)`);
  }
  if (updates.length === 0) {
    response.status(422).json({ error: { code: "EMPTY_UPDATE", message: "Provide at least one event field to update." } });
    return;
  }
  values.push(response.locals.adminId, id.data);
  const result = await pool.query(
    `UPDATE events SET ${updates.join(", ")}, updated_by = $${values.length - 1}, updated_at = NOW()
     WHERE id = $${values.length} AND deleted_at IS NULL RETURNING id`,
    values,
  );
  if (!result.rows[0]) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Event not found." } });
    return;
  }
  const updated = await pool.query(`${eventSelect} WHERE e.id = $1`, [id.data]);
  response.json({ data: updated.rows[0] });
});

adminEventsRouter.post("/:id/publish", async (request, response) => transition(request.params.id, "published", response));
adminEventsRouter.post("/:id/unpublish", async (request, response) => transition(request.params.id, "draft", response));
adminEventsRouter.post("/:id/cancel", async (request, response) => transition(request.params.id, "cancelled", response));

async function transition(rawId: string, status: "published" | "draft" | "cancelled", response: import("express").Response): Promise<void> {
  const id = idSchema.safeParse(rawId);
  if (!id.success) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Event not found." } });
    return;
  }
  const current = await pool.query<{ status: EventStatus }>(
    "SELECT status FROM events WHERE id = $1 AND deleted_at IS NULL",
    [id.data],
  );
  const currentStatus = current.rows[0]?.status;
  if (!currentStatus) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Event not found." } });
    return;
  }
  if (!canTransitionEventStatus(currentStatus, status)) {
    response.status(409).json({ error: { code: "INVALID_TRANSITION", message: "This event status cannot be changed that way." } });
    return;
  }
  const result = await pool.query(
    `UPDATE events SET status = $1,
       published_at = CASE WHEN $1 = 'published' THEN COALESCE(published_at, NOW()) ELSE published_at END,
       updated_by = $2, updated_at = NOW()
     WHERE id = $3 AND deleted_at IS NULL AND status = $4 RETURNING id`,
    [status, response.locals.adminId, id.data, currentStatus],
  );
  if (!result.rows[0]) {
    response.status(409).json({ error: { code: "CONCURRENT_UPDATE", message: "The event changed while this action was processing. Refresh and retry." } });
    return;
  }
  const updated = await pool.query(`${eventSelect} WHERE e.id = $1`, [id.data]);
  response.json({ data: updated.rows[0] });
}

adminEventsRouter.delete("/:id", async (request, response) => {
  const id = idSchema.safeParse(request.params.id);
  if (!id.success) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Event not found." } });
    return;
  }
  const result = await pool.query(
    `UPDATE events SET deleted_at = NOW(), status = 'archived', updated_by = $1, updated_at = NOW()
     WHERE id = $2 AND deleted_at IS NULL RETURNING id`,
    [response.locals.adminId, id.data],
  );
  if (!result.rows[0]) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Event not found." } });
    return;
  }
  response.status(204).end();
});
