import { Router } from "express";
import { pool } from "../config/database.js";

export const campusesRouter = Router();

campusesRouter.get("/", async (_request, response) => {
  const result = await pool.query<{ id: string; name: string; slug: string }>(
    "SELECT id, name, slug FROM campuses WHERE is_active = TRUE ORDER BY name",
  );
  response.json({ data: result.rows });
});
