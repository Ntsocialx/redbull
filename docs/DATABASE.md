# Database

PostgreSQL is accessed with `pg` and one bounded pool. `DATABASE_URL` should be a Neon pooled connection URL with TLS.

## Tables

- `admins`: unique email, bcrypt hash, active flag and login timestamps. Role is currently constrained to `admin`.
- `admin_sessions`: server-side session IDs, admin reference, expiry and revocation timestamp. Raw JWTs are not stored.
- `campuses`: canonical names/slugs, active flag. Seeded values: `TUT Soshanguve South` (`soshanguve-south`), `TUT Soshanguve North` (`soshanguve-north`), `Ga-Rankuwa Campus` (`ga-rankuwa`), `Pretoria Main Campus` (`pretoria-main`), `Arcadia Campus` (`arcadia`).
- `events`: details, campus FK, UTC timestamps, status, publication timestamps, Cloudinary reference and soft-delete timestamp. Check constraint requires `end_at > start_at`.
- `announcements`: body, optional campus FK, priority, status, activation/expiry window and soft-delete timestamp.
- `upload_intents`: generated Cloudinary public ID, admin/session ownership, expiry and one-use consumption marker.
- `schema_migrations`: migration filenames and applied timestamps.

Indexes cover public event dates, campus/date filters, categories, admin status/updated ordering, announcement visibility and upload-intent expiry. Cloudinary public IDs are unique when set.

## Migration and seed commands

From `backend/` (with `.env` configured):

```powershell
npm run migrate
npm run seed
```

`migrate.ts` applies sorted `.sql` files once inside transactions and never drops tables. Migration `001_initial.sql` creates tables and inserts campuses idempotently. `002_upload_intents.sql` adds upload ownership and poster uniqueness. `seed.ts` only inserts/updates the five campuses.

To reset a development database, create a new Neon branch/database and apply migrations again. There is no destructive reset command. Never reset a production database as a test procedure.
