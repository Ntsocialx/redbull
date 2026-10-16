import { Router } from "express";
import { pool } from "../config/database.js";

export const announcementsRouter = Router();
const select = `SELECT a.id, a.title, a.slug, a.summary, a.body, a.priority, a.starts_at AS "startsAt",
  a.expires_at AS "expiresAt", a.external_url AS "externalUrl", c.name AS campus, c.slug AS "campusSlug",
  a.published_at AS "publishedAt"
  FROM announcements a LEFT JOIN campuses c ON c.id = a.campus_id`;
const active = "a.status = 'published' AND a.deleted_at IS NULL AND (a.starts_at IS NULL OR a.starts_at <= NOW()) AND (a.expires_at IS NULL OR a.expires_at > NOW())";

announcementsRouter.get("/urgent", async (_request, response) => {
  const result = await pool.query(`${select} WHERE ${active} AND a.priority = 'urgent' ORDER BY a.published_at DESC LIMIT 5`);
  response.json({ data: result.rows });
});

announcementsRouter.get("/", async (request, response) => {
  const search = typeof request.query.search === "string" ? request.query.search.trim().slice(0, 120) : "";
  const campus = typeof request.query.campus === "string" ? request.query.campus.trim().slice(0, 80) : "";
  const priority = typeof request.query.priority === "string" ? request.query.priority : "";
  if (priority && !["normal", "important", "urgent"].includes(priority)) {
    response.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Announcement priority is invalid." } });
    return;
  }
  const values: string[] = [];
  let clauses = active;
  if (search) {
    values.push(`%${search}%`);
    clauses += ` AND (a.title ILIKE $${values.length} OR a.summary ILIKE $${values.length} OR a.body ILIKE $${values.length})`;
  }
  if (campus) {
    values.push(campus);
    clauses += ` AND (c.slug = $${values.length} OR a.campus_id IS NULL)`;
  }
  if (priority) {
    values.push(priority);
    clauses += ` AND a.priority = $${values.length}`;
  }
  const result = await pool.query(`${select} WHERE ${clauses} ORDER BY CASE a.priority WHEN 'urgent' THEN 0 WHEN 'important' THEN 1 ELSE 2 END, a.published_at DESC`, values);
  response.json({ data: result.rows });
});

announcementsRouter.get("/:slug", async (request, response) => {
  const result = await pool.query(`${select} WHERE ${active} AND a.slug = $1 LIMIT 1`, [request.params.slug]);
  if (!result.rows[0]) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Announcement not found." } });
    return;
  }
  response.json({ data: result.rows[0] });
});
