import { describe, expect, it } from "vitest";
import { createAccessToken, hashAdminPassword, verifyAccessToken, verifyAdminPassword } from "./auth-crypto.js";

const settings = { secret: "a-secure-test-secret-with-more-than-32-characters", issuer: "https://api.example.test", audience: "red-bull-tut-admin" };

describe("admin password hashing", () => {
  it("stores only a verifiable password hash", async () => {
    const password = "a-unique-admin-password-123";
    const hash = await hashAdminPassword(password);
    expect(hash).not.toBe(password);
    await expect(verifyAdminPassword(password, hash)).resolves.toBe(true);
    await expect(verifyAdminPassword("wrong-password", hash)).resolves.toBe(false);
  });
});

describe("access token verification", () => {
  it("accepts a signed token only for the configured issuer and audience", () => {
    const token = createAccessToken({ ...settings, adminId: "admin-1", sessionId: "session-1", expiresIn: "15m" });
    expect(verifyAccessToken(token, settings.secret, settings.issuer, settings.audience)).toMatchObject({ sub: "admin-1", jti: "session-1", role: "admin" });
    expect(verifyAccessToken(token, settings.secret, settings.issuer, "different-audience")).toBeNull();
  });

  it("rejects tampered and expired tokens", () => {
    const token = createAccessToken({ ...settings, adminId: "admin-1", sessionId: "session-1", expiresIn: "0s" });
    expect(verifyAccessToken(`${token.slice(0, -1)}x`, settings.secret, settings.issuer, settings.audience)).toBeNull();
    expect(verifyAccessToken(token, settings.secret, settings.issuer, settings.audience)).toBeNull();
  });
});
