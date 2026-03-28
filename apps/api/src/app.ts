import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { askRouter } from "./routes/ask.js";
import { profileRouter } from "./routes/profile.js";

export function createApp(): express.Express {
  const app = express();
  const allowedOrigins = env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const isAllowedOrigin = (origin?: string): boolean => {
    if (!origin) {
      return true;
    }
    return allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin === "*") {
        return true;
      }
      if (allowedOrigin.endsWith("*")) {
        const prefix = allowedOrigin.slice(0, -1);
        return origin.startsWith(prefix);
      }
      return origin === allowedOrigin;
    });
  };

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS origin is not allowed: ${origin ?? "unknown"}`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  const compressionMiddleware = compression({
    filter: (req, res) => {
      if (req.path === "/ask") {
        return false;
      }
      return compression.filter(req, res);
    },
  }) as unknown as express.RequestHandler;
  app.use(compressionMiddleware);

  const rateLimitMiddleware = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }) as unknown as express.RequestHandler;
  app.use(rateLimitMiddleware);
  app.use((req, _res, next) => {
    logger.info({ method: req.method, path: req.path }, "Incoming request");
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use(askRouter);
  app.use(profileRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error(err, "Unhandled server error");
    res.status(500).json({
      error: "Internal Server Error",
    });
  });

  return app;
}
