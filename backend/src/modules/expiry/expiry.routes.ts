import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const expiryRouter = Router();

// Backwards-compatible aliases (older docs/clients):
//   POST /api/expiry/write  (often uses snake_case fields)
//   GET  /api/expiry/signal
// Canonical v1 routes remain:
//   POST /api/expiry
//   GET  /api/expiry

function normalizeUpsertBody(raw: any) {
  return {
    subject: raw?.subject,
    scope: raw?.scope,
    expiresAt: raw?.expiresAt ?? raw?.expires_at,
    cause_code: raw?.cause_code ?? raw?.causeCode,
    renewable: raw?.renewable,
    note: raw?.note,
  };
}

const UpsertExpirySchema = z.object({
  subject: z.string().min(1),
  scope: z.string().min(1).optional(),

  // ISO datetime string written by the operator's system.
  expiresAt: z.string().datetime(),

  // Optional expiry cause attribution (informational only).
  cause_code: z.string().min(1).max(120).optional(),

  // Optional renewal hint (informational only). No background jobs.
  renewable: z.boolean().optional(),

  // Optional operator-defined metadata (non-authoritative).
  note: z.string().max(500).optional()
});

const ReadExpiryQuerySchema = z.object({
  subject: z.string().min(1),
  scope: z.string().min(1).optional(),
  now: z.string().datetime().optional() // optional deterministic override
});

async function handleExpiryWrite(req: any, res: any) {
  const normalized = normalizeUpsertBody(req.body);
  const parsed = UpsertExpirySchema.safeParse(normalized);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_INPUT", details: parsed.error.flatten() });
  }

  const { subject, scope, expiresAt, cause_code, renewable, note } = parsed.data;

  const record = await prisma.expiryRecord.upsert({
    where: { subject_scope: { subject, scope: scope ?? null } },
    create: {
      subject,
      scope: scope ?? null,
      expiresAt: new Date(expiresAt),
      causeCode: cause_code ?? null,
      renewable: renewable ?? null,
      note,
    },
    update: {
      expiresAt: new Date(expiresAt),
      causeCode: cause_code ?? null,
      renewable: renewable ?? null,
      note,
    },
  });

  return res.json({
    status: "applied",
    signal: {
      component: "ExpirySignal",
      component_id: "EXP-01",
      version: "1.0.0",
      subject: record.subject,
      scope: record.scope,
      now: new Date().toISOString(),
      expiresAt: record.expiresAt.toISOString(),
      cause_code: record.causeCode ?? null,
      renewable: record.renewable ?? null,
      signal: "stored",
      warnings: [
        "Signal-only: ExpirySignal emits temporal validity. Your application interprets the signal and enforces outcomes.",
        "Not expired is not authorization. Treat this signal as evidence only."
      ]
    }
  });
}

// Write: upsert expiry state (operator-owned write)
expiryRouter.post("/expiry", handleExpiryWrite);
// Backwards-compatible alias
expiryRouter.post("/expiry/write", handleExpiryWrite);

async function handleExpiryRead(req: any, res: any) {
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
      component: "ExpirySignal",
      component_id: "EXP-01",
      version: "1.0.0",
      subject,
      scope: scope ?? null,
      now: nowDate.toISOString(),
      expiresAt: null,
      cause_code: null,
      renewable: null,
      signal: "no_record",
      expired: null,
      warnings: [
        "Signal-only: ExpirySignal emits temporal validity. Your application interprets the signal and enforces outcomes.",
        "Absence of record is not permission. Default to fail-closed unless you explicitly choose otherwise."
      ]
    });
  }

  const expired = nowDate.getTime() >= record.expiresAt.getTime();

  return res.json({
    component: "ExpirySignal",
    component_id: "EXP-01",
    version: "1.0.0",
    subject: record.subject,
    scope: record.scope,
    now: nowDate.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
    cause_code: record.causeCode ?? null,
    renewable: record.renewable ?? null,
    signal: expired ? "expired" : "not_expired",
    expired,
    warnings: [
      "Signal-only: ExpirySignal emits temporal validity. Your application interprets the signal and enforces outcomes.",
      "Not expired is not authorization. Treat this signal as evidence only."
    ]
  });
}

// Read: return expiry signal (read-time only)
expiryRouter.get("/expiry", handleExpiryRead);
// Backwards-compatible alias
expiryRouter.get("/expiry/signal", handleExpiryRead);
