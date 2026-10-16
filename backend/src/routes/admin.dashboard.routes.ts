import { Router } from "express";
import { pool } from "../config/database.js";
import { authenticate } from "../middleware/authenticate.js";

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get("/stats", async (_request, response) => {
  const result = await pool.query<{
    totalEvents: string;
    publishedEvents: string;
    draftEvents: string;
    upcomingEvents: string;
    cancelledEvents: string;
    activeAnnouncements: string;
  }>(`SELECT
      (SELECT COUNT(*) FROM events WHERE deleted_at IS NULL) AS "totalEvents",
      (SELECT COUNT(*) FROM events WHERE status = 'published' AND deleted_at IS NULL) AS "publishedEvents",
      (SELECT COUNT(*) FROM events WHERE status = 'draft' AND deleted_at IS NULL) AS "draftEvents",
      (SELECT COUNT(*) FROM events WHERE status = 'published' AND start_at >= NOW() AND deleted_at IS NULL) AS "upcomingEvents",
      (SELECT COUNT(*) FROM events WHERE status = 'cancelled' AND deleted_at IS NULL) AS "cancelledEvents",
      (SELECT COUNT(*) FROM announcements WHERE status = 'published' AND deleted_at IS NULL
        AND (starts_at IS NULL OR starts_at <= NOW()) AND (expires_at IS NULL OR expires_at > NOW())) AS "activeAnnouncements"`);
  const stats = result.rows[0];
  response.json({ data: Object.fromEntries(Object.entries(stats ?? {}).map(([key, value]) => [key, Number(value)])) });
});
