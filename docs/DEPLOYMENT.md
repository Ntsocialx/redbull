# Deployment

## Client and admin on Vercel

Create two Vercel projects with project roots `client/` and `admin/`. Each folder has its own package manifest, lockfile and `vercel.json`.

Client variables:

- `NEXT_PUBLIC_API_URL` — production API base, ending in `/api/v1`.
- `NEXT_PUBLIC_SITE_URL` — public canonical site URL.

Admin variables:

- `NEXT_PUBLIC_API_URL` — same production API base.
- `NEXT_PUBLIC_ADMIN_URL` — admin site URL.
- `NEXT_PUBLIC_SITE_URL` — public student site URL.

Do not put backend secrets in Vercel frontend variables.

## Express API on Render

`render.yaml` describes a persistent Node web service rooted at `backend/`, with `npm ci --ignore-scripts`, TypeScript build, pre-deploy migrations, `npm start`, and `/health/ready` health check. Configure all secrets in the Render dashboard. `autoDeploy` is disabled in the blueprint so release/deploy is explicit.

Required backend variables: `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_ACCESS_TTL`, `CLIENT_ORIGIN`, `ADMIN_ORIGIN`, `COOKIE_SECURE`, `COOKIE_SAME_SITE`. Cloudinary values are required to enable upload signatures and asset verification.

The administrator bootstrap variables are temporary command inputs, not runtime web-service variables.

## PostgreSQL

Provision Neon PostgreSQL with TLS and a pooled connection URL. Run `npm run migrate --prefix backend` as a release step; do not run migrations at API startup or independently in each serverless instance. Run the campus seed once if required (it is safe to repeat).

## Cookie topology

Local origins `localhost:3000`, `localhost:3001`, and `localhost:4000` are different origins but share the localhost site. In production, frontend credentialed fetches need exact API CORS allowlisting. Set `COOKIE_SECURE=true`. If admin and API are cross-site, use `COOKIE_SAME_SITE=none`; browsers require Secure cookies for this mode. Verify Set-Cookie behavior in the actual browser and deployed domains. Prefer related custom subdomains and a host-only API cookie.

## Release checklist

1. Apply migrations and verify canonical campuses.
2. Create an administrator with the bootstrap script.
3. Configure Cloudinary and test a signed upload in a non-production environment.
4. Confirm only intended frontend origins pass CORS and health/readiness behavior is safe.
5. Verify login, refresh/page reload, logout, expiry, create/publish/cancel and public visibility from a real browser.
6. Run all app builds, backend tests, npm audits and smoke tests.
7. Configure backups/restore and rotate secrets through hosting settings.

This workspace has no live service credentials, so production smoke checks remain unverified.
