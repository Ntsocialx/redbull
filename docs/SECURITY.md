# Security

## Authentication and authorization

- Administrators are created only with the bootstrap script; there is no public signup.
- Passwords use bcrypt cost 12. Login has a generic response and a 10-attempt/15-minute in-memory rate limit.
- API issues a short-lived HS256 JWT with configured issuer/audience and session ID. Cookie is HttpOnly, path `/`, Secure in production, configurable SameSite.
- Every protected request validates JWT and checks an active, non-revoked, non-expired session joined to an active admin in PostgreSQL.
- Logout revokes the current session and clears the cookie.
- Frontend auth state is not stored in localStorage.

## HTTP and input controls

- Helmet security headers, exact-origin CORS allowlist, JSON size limit, parameterized SQL, Zod boundary validation and safe error responses.
- State-changing browser requests reject a supplied Origin outside the two configured frontend origins. Cookies should use Lax for same-site local development and `SameSite=None; Secure` only when production domains require cross-site cookies.
- Request logs redact authorization and cookie headers and do not log bodies.
- In-memory login throttling is suitable only for one API process. Use a shared limiter store before horizontally scaling.

## Poster upload

- Only authenticated administrators can request a signature.
- Signature is constrained to an 8 MB image upload, configured asset folder, generated public ID and 15-minute intent bound to current admin/session.
- Event persistence asks Cloudinary's server API to verify the image type, format, bytes, URL and public ID; intent is consumed once.
- Cloudinary API secret stays in backend environment. Replacing/deleting assets is not automated because safe reference cleanup requires a further lifecycle workflow.

## Secrets and deployment

Use `.env.example` placeholders, keep real `.env` files ignored, and configure secrets in the hosting provider. Rotate any secret that reaches version control. JWT secrets must be 32+ characters and private. The example deployment uses a host-only API cookie; test the real browser topology and HTTPS before launch.

## Known hardening gates

- Login rate limiting is in-memory; configure shared storage for multiple instances.
- CSRF defense currently combines SameSite cookie policy with exact Origin checks. Add a synchronizer/double-submit token if the deployment topology or browser behavior makes cross-site cookies necessary beyond the documented setting.
- Backend dependency audit currently reports zero findings after upgrading Vitest. Client/admin still report high-severity findings in the development-only Next ESLint tree (`fast-glob` → `micromatch` → `braces`). Registry metadata reports no patched `braces` release and npm's suggested fix downgrades `eslint-config-next` to 14.2.35; this incompatible major downgrade was not applied. Recheck before release.
- Security and Cloudinary integration have not been penetration-tested or live-verified.
