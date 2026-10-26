import cors from "cors";
import express, { Router } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { corsOrigins } from "./config.js";
import { pool } from "./db/pool.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/routes.js";
import { dashboardRouter } from "./modules/dashboard/routes.js";
import { ordersRouter } from "./modules/orders/routes.js";
import { salespersonsRouter } from "./modules/salespersons/routes.js";
import { shopsRouter } from "./modules/shops/routes.js";
import { villagesRouter } from "./modules/villages/routes.js";
import { visitsRouter } from "./modules/visits/routes.js";
import { createVoiceRouter } from "./modules/voice/routes.js";
import type { SpeechProvider } from "./modules/voice/providers.js";

export interface AppOptions {
  speechProvider?: SpeechProvider;
}

export function createApp(options: AppOptions = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins.includes("*") ? true : corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url?.startsWith("/health") ?? false },
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: Math.round(process.uptime()) });
  });
  app.get("/health/ready", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ready", database: "up" });
    } catch {
      res.status(503).json({ status: "unavailable", database: "down" });
    }
  });

  const api = Router();
  api.use("/auth", authRouter);
  api.use("/salespersons", salespersonsRouter);
  api.use("/villages", villagesRouter);
  api.use("/shops", shopsRouter);
  api.use("/orders", ordersRouter);
  api.use("/visits", visitsRouter);
  api.use("/dashboard", dashboardRouter);
  api.use("/voice", createVoiceRouter(options.speechProvider));
  app.use("/api/v1", api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
