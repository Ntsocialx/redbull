import { randomUUID } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { authenticate, sessionCookie } from "../middleware/authenticate.js";
import { createAccessToken, verifyAdminPassword } from "../services/auth-crypto.js";

export const authRouter = Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const loginSchema = z.object({
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200),
});
const dummyHash = bcrypt.hashSync(randomUUID(), 12);
const ttlUnits: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
const ttlUnit = ttlUnits[env.JWT_ACCESS_TTL.slice(-1)];
if (ttlUnit === undefined) throw new Error("Invalid JWT_ACCESS_TTL unit");
const ttlMs = Number(env.JWT_ACCESS_TTL.slice(0, -1)) * ttlUnit;
const cookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE || env.NODE_ENV === "production",
  sameSite: env.COOKIE_SAME_SITE,
  path: "/",
  maxAge: ttlMs,
} as const;

authRouter.post("/login", loginLimit, async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Enter a valid email and password." } });
    return;
  }

  const result = await pool.query<{
    id: string;
    email: string;
    name: string;
    password_hash: string;
    is_active: boolean;
  }>("SELECT id, email, name, password_hash, is_active FROM admins WHERE email = $1", [parsed.data.email]);
  const admin = result.rows[0];
  const passwordMatches = await verifyAdminPassword(parsed.data.password, admin?.password_hash ?? dummyHash);

  if (!admin || !admin.is_active || !passwordMatches) {
    response.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." } });
    return;
  }

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + ttlMs);
  await pool.query("INSERT INTO admin_sessions (id, admin_id, expires_at) VALUES ($1, $2, $3)", [
    sessionId,
    admin.id,
    expiresAt,
  ]);
  await pool.query("UPDATE admins SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [admin.id]);

  const token = createAccessToken({
    adminId: admin.id,
    sessionId,
    secret: env.JWT_ACCESS_SECRET,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: env.JWT_ACCESS_TTL as `${number}${"s" | "m" | "h" | "d"}`,
  });
  response.cookie(sessionCookie, token, cookieOptions);
  response.json({ data: { admin: { id: admin.id, email: admin.email, name: admin.name } } });
});

authRouter.get("/me", authenticate, async (_request, response) => {
  const result = await pool.query<{ id: string; email: string; name: string }>(
    "SELECT id, email, name FROM admins WHERE id = $1 AND is_active = TRUE",
    [response.locals.adminId],
  );
  const admin = result.rows[0];
  if (!admin) {
    response.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } });
    return;
  }
  response.json({ data: { admin } });
});

authRouter.post("/logout", async (request, response) => {
  const token = request.cookies?.[sessionCookie] as string | undefined;
  if (token) {
    try {
      const claims = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        algorithms: ["HS256"],
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
        ignoreExpiration: true,
      });
      if (typeof claims !== "string" && claims.sub && claims.jti) {
        await pool.query(
          "UPDATE admin_sessions SET revoked_at = NOW() WHERE id = $1 AND admin_id = $2 AND revoked_at IS NULL",
          [claims.jti, claims.sub],
        );
      }
    } catch {
      // Clear invalid or expired browser cookies even when there is no session left to revoke.
    }
  }
  response.clearCookie(sessionCookie, { httpOnly: true, secure: cookieOptions.secure, sameSite: cookieOptions.sameSite, path: "/" });
  response.json({ data: { loggedOut: true } });
});
