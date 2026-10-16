import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { pool } from "../config/database.js";

export const sessionCookie = "rbt_session";

export async function authenticate(_request: Request, response: Response, next: NextFunction): Promise<void> {
  const token = response.req.cookies?.[sessionCookie] as string | undefined;

  if (!token) {
    response.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } });
    return;
  }

  try {
    const claims = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    if (typeof claims === "string" || !claims.sub || !claims.jti) throw new Error("Invalid session claims");
    const session = await pool.query(
      `SELECT s.id FROM admin_sessions s
       JOIN admins a ON a.id = s.admin_id
       WHERE s.id = $1 AND s.admin_id = $2 AND s.revoked_at IS NULL
         AND s.expires_at > NOW() AND a.is_active = TRUE`,
      [claims.jti, claims.sub],
    );
    if (session.rowCount !== 1) throw new Error("Session is no longer active");
    response.locals.adminId = claims.sub;
    response.locals.sessionId = claims.jti;
    next();
  } catch {
    response.status(401).json({ error: { code: "SESSION_EXPIRED", message: "Your session has expired. Sign in again." } });
  }
}
