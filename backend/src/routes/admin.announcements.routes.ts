import { Router } from "express";
import { z } from "zod";
import { pool } from "../config/database.js";
import { authenticate } from "../middleware/authenticate.js";
import { announcementInputSchema, announcementPatchSchema } from "../schemas/announcements.js";
import { campusSlugs } from "../schemas/events.js";

export const adminAnnouncementsRouter = Router();
adminAnnouncementsRouter.use(authenticate);
const idSchema = z.uuid();
const select = `SELECT a.id, a.title, a.slug, a.summary, a.body, a.priority, a.status,
  a.starts_at AS "startsAt", a.expires_at AS "expiresAt", a.external_url AS "externalUrl",
  c.name AS campus, c.slug AS "campusSlug", a.published_at AS "publishedAt", a.updated_at AS "updatedAt"
  FROM announcements a LEFT JOIN campuses c ON c.id = a.campus_id`;

adminAnnouncementsRouter.get("/", async (_request, response) => {
  const result = await pool.query(`${select} WHERE a.deleted_at IS NULL ORDER BY a.updated_at DESC`);
  response.json({ data: result.rows });
});

adminAnnouncementsRouter.post("/", async (request, response) => {
  const parsed = announcementInputSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Announcement details are invalid.", details: parsed.error.flatten() } });
    return;
  }
  const input = parsed.data;
  const campus = input.campusSlug
    ? await pool.query<{ id: string }>("SELECT id FROM campuses WHERE slug = $1 AND is_active = TRUE", [input.campusSlug])
    : null;
  if (campus && !campus.rows[0]) {
    response.status(422).json({ error: { code: "INVALID_CAMPUS", message: "Select an active campus." } });
    return;
  }
  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO announcements (title, slug, summary, body, campus_id, priority, external_url, starts_at, expires_at, created_by, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10) RETURNING id`,
    [input.title, input.slug, input.summary, input.body, campus?.rows[0]?.id ?? null, input.priority,
      input.externalUrl ?? null, input.startsAt ?? null, input.expiresAt ?? null, response.locals.adminId],
  );
  const created = await pool.query(`${select} WHERE a.id = $1`, [inserted.rows[0]?.id]);
  response.status(201).json({ data: created.rows[0] });
});

adminAnnouncementsRouter.get("/:id", async (request, response) => {
  const id = idSchema.safeParse(request.params.id);
  if (!id.success) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Announcement not found." } });
    return;
  }
  const result = await pool.query(`${select} WHERE a.id = $1 AND a.deleted_at IS NULL`, [id.data]);
  if (!result.rows[0]) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Announcement not found." } });
    return;
  }
  response.json({ data: result.rows[0] });
});

adminAnnouncementsRouter.patch("/:id", async (request, response) => {
  const id = idSchema.safeParse(request.params.id);
  const parsed = announcementPatchSchema.safeParse(request.body);
  if (!id.success) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Announcement not found." } });
    return;
  }
  if (!parsed.success) {
    response.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Announcement details are invalid.", details: parsed.error.flatten() } });
    return;
  }
  const input = parsed.data;
  const columns: Record<string, string> = {
    title: "title", slug: "slug", summary: "summary", body: "body", priority: "priority",
    externalUrl: "external_url", startsAt: "starts_at", expiresAt: "expires_at",
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
  if (input.campusSlug !== undefined) {
    if (input.campusSlug === null) {
      updates.push("campus_id = NULL");
    } else if ((campusSlugs as readonly string[]).includes(input.campusSlug)) {
      values.push(input.campusSlug);
      updates.push(`campus_id = (SELECT id FROM campuses WHERE slug = $${values.length} AND is_active = TRUE)`);
    }
  }
  if (updates.length === 0) {
    response.status(422).json({ error: { code: "EMPTY_UPDATE", message: "Provide at least one announcement field to update." } });
    return;
  }
  values.push(response.locals.adminId, id.data);
  const updated = await pool.query(
    `UPDATE announcements SET ${updates.join(", ")}, updated_by = $${values.length - 1}, updated_at = NOW()
     WHERE id = $${values.length} AND deleted_at IS NULL RETURNING id`, values,
  );
  if (!updated.rows[0]) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Announcement not found." } });
    return;
  }
  const result = await pool.query(`${select} WHERE a.id = $1`, [id.data]);
  response.json({ data: result.rows[0] });
});

adminAnnouncementsRouter.post("/:id/publish", async (request, response) => changeStatus(request.params.id, "published", response));
adminAnnouncementsRouter.post("/:id/unpublish", async (request, response) => changeStatus(request.params.id, "draft", response));

async function changeStatus(rawId: string, status: "published" | "draft", response: import("express").Response): Promise<void> {
  const id = idSchema.safeParse(rawId);
  if (!id.success) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Announcement not found." } });
    return;
  }
  const changed = await pool.query(
    `UPDATE announcements SET status = $1,
       published_at = CASE WHEN $1 = 'published' THEN COALESCE(published_at, NOW()) ELSE published_at END,
       updated_by = $2, updated_at = NOW()
     WHERE id = $3 AND deleted_at IS NULL RETURNING id`,
    [status, response.locals.adminId, id.data],
  );
  if (!changed.rows[0]) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Announcement not found." } });
    return;
  }
  const result = await pool.query(`${select} WHERE a.id = $1`, [id.data]);
  response.json({ data: result.rows[0] });
}

adminAnnouncementsRouter.delete("/:id", async (request, response) => {
  const id = idSchema.safeParse(request.params.id);
  if (!id.success) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Announcement not found." } });
    return;
  }
  const result = await pool.query(
    "UPDATE announcements SET deleted_at = NOW(), updated_by = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING id",
    [response.locals.adminId, id.data],
  );
  if (!result.rows[0]) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Announcement not found." } });
    return;
  }
  response.status(204).end();
});
