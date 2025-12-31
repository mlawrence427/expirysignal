// backend/src/config/env.ts
import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

// Load .env from repo root (not /backend)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),

  PORT: z.coerce.number().int().positive().optional(),

  CORS_ORIGIN: z.string().optional(),

  TIME_SOURCE: z.enum(["system"]).optional(),
});

export const env = EnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  TIME_SOURCE: process.env.TIME_SOURCE,
});

