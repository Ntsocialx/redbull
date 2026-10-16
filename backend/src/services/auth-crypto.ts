import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";

export interface AccessTokenInput {
  adminId: string;
  sessionId: string;
  secret: string;
  issuer: string;
  audience: string;
  expiresIn: SignOptions["expiresIn"];
}

export function createAccessToken(input: AccessTokenInput): string {
  return jwt.sign({ role: "admin" }, input.secret, {
    algorithm: "HS256",
    subject: input.adminId,
    jwtid: input.sessionId,
    issuer: input.issuer,
    audience: input.audience,
    expiresIn: input.expiresIn,
  });
}

export function verifyAccessToken(token: string, secret: string, issuer: string, audience: string) {
  try {
    const claims = jwt.verify(token, secret, { algorithms: ["HS256"], issuer, audience });
    if (typeof claims === "string" || claims.role !== "admin" || !claims.sub || !claims.jti) return null;
    return claims;
  } catch {
    return null;
  }
}

export async function hashAdminPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyAdminPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
