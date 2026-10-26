import { createApp } from "./app.js";
import { config } from "./config.js";
import { ensureAdmin } from "./db/bootstrap.js";
import { migrate } from "./db/migrate.js";
import { pool } from "./db/pool.js";
import { logger } from "./lib/logger.js";

async function main() {
  await migrate();
  await ensureAdmin();

  const server = createApp().listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV, stt: config.STT_PROVIDER }, "Jain Distributor API listening");
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, "Shutting down");
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.fatal({ err }, "Failed to start API");
  process.exit(1);
});
