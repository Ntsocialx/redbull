import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { pool } from "./config/database.js";
import { authRouter } from "./routes/auth.routes.js";
import { eventsRouter } from "./routes/events.routes.js";
import { adminEventsRouter } from "./routes/admin.events.routes.js";
import { campusesRouter } from "./routes/campuses.routes.js";
import { announcementsRouter } from "./routes/announcements.routes.js";
import { adminAnnouncementsRouter } from "./routes/admin.announcements.routes.js";
import { dashboardRouter } from "./routes/admin.dashboard.routes.js";
import { uploadsRouter } from "./routes/uploads.routes.js";

const app = express();
const allowedOrigins = new Set([env.CLIENT_ORIGIN, env.ADMIN_ORIGIN]);

app.disable("x-powered-by");
app.use(helmet());
app.use(pinoHttp({ redact: ["req.headers.authorization", "req.headers.cookie"] }));
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    callback(null, origin === undefined || allowedOrigins.has(origin));
  },
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use((request, response, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const origin = request.get("origin");
    if (origin && !allowedOrigins.has(origin)) {
      response.status(403).json({ error: { code: "ORIGIN_NOT_ALLOWED", message: "Request origin is not allowed." } });
      return;
    }
  }
  next();
});

app.get("/health", (_request, response) => response.json({ data: { status: "ok" } }));
app.get("/health/ready", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    response.json({ data: { status: "ready" } });
  } catch {
    response.status(503).json({ error: { code: "NOT_READY", message: "Service is not ready." } });
  }
});
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/events", eventsRouter);
app.use("/api/v1/admin/events", adminEventsRouter);
app.use("/api/v1/campuses", campusesRouter);
app.use("/api/v1/announcements", announcementsRouter);
app.use("/api/v1/admin/announcements", adminAnnouncementsRouter);
app.use("/api/v1/admin/dashboard", dashboardRouter);
app.use("/api/v1/admin/uploads", uploadsRouter);

app.use((_request, response) => {
  response.status(404).json({ error: { code: "NOT_FOUND", message: "The requested resource was not found." } });
});

app.use((error: unknown, request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const databaseCode = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  request.log?.error({ errorType: error instanceof Error ? error.name : "UnknownError", databaseCode }, "Request failed");
  if (databaseCode === "23505") {
    response.status(409).json({ error: { code: "CONFLICT", message: "A record with that slug or value already exists." } });
    return;
  }
  if (["23503", "23514", "22P02"].includes(databaseCode)) {
    response.status(422).json({ error: { code: "INVALID_DATA", message: "The submitted data is not valid." } });
    return;
  }
  response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
});

export { app };
