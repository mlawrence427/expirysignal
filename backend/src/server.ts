import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { expiryRouter } from "./modules/expiry/expiry.routes";

const app = express();

app.use(express.json());

if (env.CORS_ORIGIN) {
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
} else {
  app.use(cors());
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "expirysignal" });
});

// Signal-only API
app.use("/api", expiryRouter);

app.use((req, res) => {
  res.status(404).json({ error: "NOT_FOUND", path: req.path });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[expirysignal] unhandled_error", err);
  res.status(500).json({ error: "INTERNAL_ERROR" });
});

const port = env.PORT ?? 4000;
app.listen(port, () => {
  console.log(`[expirysignal] backend listening at http://localhost:${port}`);
});
