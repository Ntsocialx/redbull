import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: true } : undefined,
});

pool.on("error", () => {
  console.error("Unexpected error from an idle PostgreSQL client");
});
