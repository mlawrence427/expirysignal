# ExpirySignal

Self-hosted expiration signal emitter.

- Emits `expired` / `not_expired` at read time.
- Does NOT run background jobs.
- Does NOT invalidate tokens or revoke sessions.
- Does NOT enforce behavior.
- Absence of a record is not permission.

Self-hosted. Signal-only. Deterministic given stored state and a time source.
