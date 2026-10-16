import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../src/config/database.js";
import { z } from "zod";

const email = z.email().safeParse(process.env.INITIAL_ADMIN_EMAIL);
const name = z.string().trim().min(2).max(120).safeParse(process.env.INITIAL_ADMIN_NAME);
const password = process.env.INITIAL_ADMIN_PASSWORD;

if (!email.success || !name.success || !password || password.length < 16 || password.length > 200) {
  console.error("Set INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_NAME, and a 16-200 character INITIAL_ADMIN_PASSWORD in the local environment.");
  process.exitCode = 1;
} else {
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query(
      `INSERT INTO admins (email, name, password_hash) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [email.data.toLowerCase(), name.data, passwordHash],
    );
    console.info("Administrator bootstrap completed. No credentials were printed.");
  } finally {
    await pool.end();
  }
}
