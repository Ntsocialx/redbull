import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pool } from "../src/config/database.js";

async function migrate(): Promise<void> {
  await pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
  const directory = resolve(process.cwd(), "migrations");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();

  for (const name of files) {
    const alreadyApplied = await pool.query("SELECT 1 FROM schema_migrations WHERE name = $1", [name]);
    if (alreadyApplied.rowCount) continue;
    const sql = await readFile(resolve(directory, name), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
      await client.query("COMMIT");
      console.info(`Applied migration ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

migrate().catch((error: unknown) => {
  console.error("Database migration failed", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
}).finally(() => pool.end());
