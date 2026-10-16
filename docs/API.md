# API

Base path: `/api/v1`. JSON responses use `{ "data": ... }`; errors use `{ "error": { "code", "message", "details?" } }`. List endpoints return `data` and, where implemented, `pagination: { page, limit, totalItems, totalPages }`. Public routes never return drafts.

## Health

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| GET | `/health` | No | Liveness only |
| GET | `/health/ready` | No | Checks PostgreSQL and returns 503 when unavailable |

## Auth

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| POST | `/auth/login` | No | `{ email, password }`; sets HttpOnly session cookie |
| POST | `/auth/logout` | Session | Revokes current session and clears cookie |
| GET | `/auth/me` | Session | Returns safe administrator identity |

Login failures are generic and rate limited. There is no registration endpoint.

## Public

| Method | Path | Query / response |
| --- | --- | --- |
| GET | `/events` | `search`, `campus`, `category`, `from`, `to`, `period=upcoming|past`, `page`, `limit`, `sort`, `direction`; published results |
| GET | `/events/featured` | Up to three upcoming published events, featured first |
| GET | `/events/upcoming` | Upcoming published results with pagination |
| GET | `/events/:slug` | Published event or cancelled event detail; never draft/archived |
| GET | `/campuses` | Active canonical campuses |
| GET | `/announcements` | Optional `search`, `campus`; active published notices |
| GET | `/announcements/urgent` | Active urgent notices |
| GET | `/announcements/:slug` | One active published notice |

`from`/`to` accept ISO timestamps or `YYYY-MM-DD`; date-only values are compared in `Africa/Johannesburg`.

## Protected admin

All `/admin/*` routes require the session cookie.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/admin/dashboard/stats` | Six database-derived counts |
| GET | `/admin/events` | Filtered/paginated records; accepts `search`, `campus`, `category`, `status`, `page`, `limit` |
| POST | `/admin/events` | Create draft from validated event payload |
| GET | `/admin/events/:id` | Read a non-deleted event |
| PATCH | `/admin/events/:id` | Partial update; server validates merged date range and active campus |
| POST | `/admin/events/:id/publish` | Publish transition |
| POST | `/admin/events/:id/unpublish` | Return to draft |
| POST | `/admin/events/:id/cancel` | Cancel event |
| DELETE | `/admin/events/:id` | Soft delete/archive |
| GET | `/admin/announcements` | List non-deleted records |
| POST | `/admin/announcements` | Create draft announcement |
| GET | `/admin/announcements/:id` | Read a record |
| PATCH | `/admin/announcements/:id` | Partial update |
| POST | `/admin/announcements/:id/publish` | Publish announcement |
| POST | `/admin/announcements/:id/unpublish` | Return to draft |
| DELETE | `/admin/announcements/:id` | Soft delete |
| POST | `/admin/uploads/signature` | Issue short-lived scoped Cloudinary signature |

Unique database conflicts return 409; invalid input and constraint failures return safe 422 responses. Unknown server errors return a generic 500 message. Stack traces and credentials are not returned.

## Upload request shape

`POST /admin/uploads/signature` takes no body and returns a constrained upload URL, API key, timestamp, signature, `assetFolder`, and generated `publicId`. Client sends the file to Cloudinary, then the event payload includes `posterUrl` and `cloudinaryPublicId` together. The backend verifies the asset against Cloudinary before persistence.

## Validation and current limits

Zod validates event and announcement bodies at API boundaries. Slugs are unique in PostgreSQL. The implemented public events filters cover campus, category, search, date, and pagination; past-event browsing and an API-backed past filter are not implemented yet. No live integration tests were run without a configured database and Cloudinary account.
