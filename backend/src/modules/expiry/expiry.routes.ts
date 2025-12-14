import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const expiryRouter = Router();

const UpsertExpirySchema = z.object({
  subject: z.string().min(1),
  scope: z.string().min(1).optional(),
  expiresAt: z.string().datetime(), // ISO string
  note: z.string().max(500).optional()
});

const ReadExpiryQuerySchema = z.object({
  subject: z.string().min(1),
  scope: z.string().min(1).optional(),
  now: z.string().datetime().optional() // optional deterministic override
});

// Write: upsert expiry state (operator-owned write)
expiryRouter.post("/expiry", async (req, res) => {
  const parsed = UpsertExpirySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_INPUT", details: parsed.error.flatten() });
  }

  const { subject, scope, expiresAt, note } = parsed.data;

  const record = await prisma.expiryRecord.upsert({
    where: { subject_scope: { subject, scope: scope ?? null } },
    create: { subject, scope: scope ?? null, expiresAt: new Date(expiresAt), note },
    update: { expiresAt: new Date(expiresAt), note }
  });

  return res.json({
    subject: record.subject,
    scope: record.scope,
    expiresAt: record.expiresAt.toISOString(),
    signal: "stored"
  });
});

// Read: return expiry signal (read-time only)
expiryRouter.get("/expiry", async (req, res) => {
  const parsed = ReadExpiryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_QUERY", details: parsed.error.flatten() });
  }

  const { subject, scope, now } = parsed.data;
  const nowDate = now ? new Date(now) : new Date();

  const record = await prisma.expiryRecord.findUnique({
    where: { subject_scope: { subject, scope: scope ?? null } }
  });

  // Absence is not permission. It only means "no record is present".
  if (!record) {
    return res.json({
      subject,
      scope: scope ?? null,
      now: nowDate.toISOString(),
      signal: "no_record",
      expired: null
    });
  }

  const expired = nowDate.getTime() >= record.expiresAt.getTime();

  return res.json({
    subject: record.subject,
    scope: record.scope,
    now: nowDate.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
    signal: expired ? "expired" : "not_expired"
  });
});
