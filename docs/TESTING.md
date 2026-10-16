# Testing

## Local checks

```powershell
npm run test:backend
npm run build:backend
npm run build:client
npm run build:admin
```

The backend Vitest suite currently has 13 tests covering password hashing/verification, JWT issuer/audience/signature/expiry checks, event status transitions, date-window validation, announcement active-window behavior, event request schema validation, poster URL/ID pairing and date-only filter parsing.

## Service-backed checks still required

With an isolated non-production Neon database and test admin, add/run API integration tests for login/failed login, unauthorized mutations, event/announcement CRUD and status transitions, public privacy filters, campus/search/pagination, and rate-limit behavior. With a Cloudinary test account, verify signature restrictions, invalid asset rejection, ownership/expiry and poster persistence.

Run browser tests at 390×844 and desktop 1440×1000 for mobile navigation, event filters/details/share, calendar navigation, admin login/session/logout, draft privacy, publication visibility, poster errors, forms, empty and network states. Use a non-production test database only.

The workspace has not configured Neon, Cloudinary, Playwright or an axe browser runner, so these integration/accessibility/E2E checks are not claimed as passed.
