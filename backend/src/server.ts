import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./config/database.js";

const server = app.listen(env.PORT, () => {
  console.info(`Red Bull TUT API listening on port ${env.PORT}`);
});

function shutdown(): void {
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
