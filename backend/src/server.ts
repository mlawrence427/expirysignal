// backend/src/server.ts
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { expiryRouter } from "./modules/expiry/expiry.routes";

const app = express();

// JSON only. No cookies required.
app.use(express.json());

// CORS: optional allowlist. Default permissive for local dev.
if (env.CORS_ORIGIN) {
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
} else {
  app.use(cors());
}

// Health
app.get("/health", (_req, res) => {
  return res.json({
    ok: true,
    service: "expirysignal",
    time_source: env.TIME_SOURCE ?? "system",
  });
});

// API
app.use("/api", expiryRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "NOT_FOUND", path: req.path });
});

// Error handler
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[expirysignal] unhandled_error", err);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
);

const port = env.PORT ?? 4004;
app.listen(port, () => {
  console.log(`[expirysignal] backend listening at http://localhost:${port}`);
});
