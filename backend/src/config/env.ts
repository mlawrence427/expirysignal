import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().optional(),
  CORS_ORIGIN: z.string().optional(),
  TIME_SOURCE: z.enum(["system"]).optional()
});

export const env = EnvSchema.parse(process.env);
