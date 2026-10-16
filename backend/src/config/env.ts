import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().url(),
  JWT_AUDIENCE: z.string().min(1),
  JWT_ACCESS_TTL: z.string().regex(/^\d+[smhd]$/).default("15m"),
  CLIENT_ORIGIN: z.string().url(),
  ADMIN_ORIGIN: z.string().url(),
  COOKIE_SECURE: z.string().default("false").transform((value) => value === "true"),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("lax"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default("red-bull-tut/events"),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
  console.error(`Invalid backend configuration. Check: ${missing}`);
  process.exit(1);
}

export const env = result.data;
