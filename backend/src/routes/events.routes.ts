import { Router } from "express";
import { pool } from "../config/database.js";
import { listEventSchema } from "../schemas/events.js";

export const eventsRouter = Router();
const eventSelect = `SELECT e.id, e.title, e.slug, e.summary, e.description, e.poster_url AS "posterUrl",
  e.campus_id AS "campusId", c.name AS campus, c.slug AS "campusSlug", e.venue, e.category,
  e.start_at AS "startAt", e.end_at AS "endAt", e.timezone, e.organizer_name AS "organizerName",
  e.organizer_contact AS "organizerContact", e.registration_url AS "registrationUrl", e.external_url AS "externalUrl",
  e.is_featured AS "isFeatured", e.status, e.published_at AS "publishedAt"
  FROM events e JOIN campuses c ON c.id = e.campus_id`;

async function listPublicEvents(query: unknown, upcomingOnly = false) {
  const parsed = listEventSchema.safeParse(query);
  if (!parsed.success) return { error: true as const };

  const { search, campus, category, from, to, period, page, limit, sort, direction } = parsed.data;
  const selectedPeriod = upcomingOnly ? "upcoming" : period;
  const clauses = ["e.status = 'published'", "e.deleted_at IS NULL", selectedPeriod === "past" ? "e.start_at < NOW()" : "e.start_at >= NOW()"];
  const values: string[] = [];
  const add = (clause: string, value: string) => {
    values.push(value);
    clauses.push(clause.replace("?", `$${values.length}`));
  };
  if (from) {
    if (from.length === 10) {
      values.push(from);
      clauses.push(`(e.start_at AT TIME ZONE 'Africa/Johannesburg')::date >= $${values.length}::date`);
    } else add("e.start_at >= ?", from);
  }
  if (to) {
    if (to.length === 10) {
      values.push(to);
      clauses.push(`(e.start_at AT TIME ZONE 'Africa/Johannesburg')::date <= $${values.length}::date`);
    } else add("e.start_at <= ?", to);
  }
  if (campus) add("c.slug = ?", campus);
  if (category) add("e.category = ?", category);
  if (search) {
    values.push(`%${search.replace(/[\\%_]/g, "\\$&")}%`);
    const parameter = `$${values.length}`;
    clauses.push(`(e.title ILIKE ${parameter} ESCAPE '\\' OR e.summary ILIKE ${parameter} ESCAPE '\\' OR e.description ILIKE ${parameter} ESCAPE '\\')`);
  }
  const where = clauses.join(" AND ");
  const count = await pool.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM events e JOIN campuses c ON c.id = e.campus_id WHERE ${where}`,
    values,
  );
  const sortColumn = sort === "title" ? "e.title" : "e.start_at";
  const offset = (page - 1) * limit;
  const rows = await pool.query(
    `${eventSelect} WHERE ${where} ORDER BY ${sortColumn} ${direction.toUpperCase()} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );
  const totalItems = Number(count.rows[0]?.total ?? 0);
  return {
    data: rows.rows,
    pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
  };
}

eventsRouter.get("/featured", async (_request, response) => {
  const result = await pool.query(
    `${eventSelect} WHERE e.status = 'published' AND e.deleted_at IS NULL AND e.start_at >= NOW()
     ORDER BY e.is_featured DESC, e.start_at ASC LIMIT 3`,
  );
  response.json({ data: result.rows });
});

eventsRouter.get("/upcoming", async (request, response) => {
  const result = await listPublicEvents(request.query, true);
  if ("error" in result) {
    response.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Event filters are invalid." } });
    return;
  }
  response.json(result);
});

eventsRouter.get("/", async (request, response) => {
  const result = await listPublicEvents(request.query);
  if ("error" in result) {
    response.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Event filters are invalid." } });
    return;
  }
  response.json(result);
});

eventsRouter.get("/:slug", async (request, response) => {
  const result = await pool.query(
    `${eventSelect} WHERE e.slug = $1 AND e.status IN ('published', 'cancelled') AND e.deleted_at IS NULL LIMIT 1`,
    [request.params.slug],
  );
  const event = result.rows[0];
  if (!event) {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "Event not found." } });
    return;
  }
  response.json({ data: event });
});
