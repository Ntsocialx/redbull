import { pool } from "../src/config/database.js";

const campuses = [
  ["TUT Soshanguve South", "soshanguve-south"],
  ["TUT Soshanguve North", "soshanguve-north"],
  ["Ga-Rankuwa Campus", "ga-rankuwa"],
  ["Pretoria Main Campus", "pretoria-main"],
  ["Arcadia Campus", "arcadia"],
] as const;

try {
  for (const [name, slug] of campuses) {
    await pool.query(
      "INSERT INTO campuses (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name",
      [name, slug],
    );
  }
  console.info("Canonical campus records are ready.");
} finally {
  await pool.end();
}
