# ExpirySignal (EXP-01)

Self-hosted temporal validity emitter.

ExpirySignal stores expiry facts and emits read-time JSON signals. It does **not** enforce access, run background jobs, or renew anything automatically.

## Non-goals

- Enforcement / gating / authorization decisions
- Identity resolution
- Background jobs / cron / callbacks / webhooks
- Auto-renewal or automated side effects

## API

Base URL: `http://localhost:4004`

### Write (operator-owned)

`POST /api/expiry`

Stores or updates an expiry record for a subject (optionally within a scope).

Request body:

```json
{
  "subject": "user_123",
  "scope": "global",
  "expiresAt": "2026-01-01T00:00:00Z",
  "cause_code": "trial_ended",
  "renewable": true,
  "note": "optional operator note"
}
```

Notes:

- `cause_code` is optional **cause attribution** (informational only).
- `renewable` is an optional **renewal hint** (informational only).
- ExpirySignal does not schedule renewals or run jobs.

### Read (read-time)

`GET /api/expiry?subject=user_123&scope=global`

Optional deterministic evaluation override:

`GET /api/expiry?subject=user_123&scope=global&now=2025-12-31T00:00:00Z`

Notes:

- This service is time-dependent: output can change as `now` changes.
- If you need deterministic replay, pass a `now` value explicitly.

## Running locally

1) Copy env file:

```bash
cp .env.example .env
```

(On Windows cmd: `copy .env.example .env`)

2) Install + run:

```bash
npm install
npm run dev
```

3) Create DB schema (Prisma):

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

(Use your own DATABASE_URL.)

## Warnings

- **Not expired is not authorization.** Treat this signal as evidence only.
- **Absence of record is not permission.** Default to fail-closed unless you explicitly choose otherwise.
