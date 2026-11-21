# Agent keys and voting — independent review lane

Confirmed in baseline: caller-owned key INSERT accepts arbitrary scopes; token
UPDATE permits scope changes; gateway trusts stored scopes and agent ID;
agent ownership verification accepts either matching ID or admin:*; cast/retract
SECURITY DEFINER functions trust p_user_id instead of auth.uid().

This draft constrains self-issued keys to read:public, allows owners only to revoke
keys, rechecks ownership and scopes for every existing/new key in the gateway,
and requires actual ownership for agent mutations. Migration revokes unsafe old
keys without deleting evidence. No privileged-key issuance mechanism is added.

Maintainer production procedure (NOT executed): inventory counts/IDs/owners/scopes
only, never token hashes or raw keys in logs. Identify integrations using privileged
keys; arrange replacement via a separately reviewed trusted issuance route. Deploy
gateway fail-closed first, then approved migration; exercise owned public key and
rejected old key with synthetic identities. Expect privileged-key consumers to stop
until explicitly reviewed. Never restore arbitrary self-issued admin:* as rollback.

Voting uses session identity for cast and retract, revokes direct client table
mutations, serializes daily budget creation/spend, locks retractions, and refunds
the original day once. Existing RPC parameter names remain compatible, but spoofed
IDs are rejected. No votes/balances touched outside isolated fictional tests.

Local PostgreSQL tests: scripts/audit-tests/agent-votes.mjs (PGlite 0.3.14; same
S33D_PGLITE environment as Grove harness). True concurrent sessions and actual
Supabase JWT/Edge deployment still require staging verification before production.
Migration and gateway deployment need separate owner approvals. No dependency on
Grove SQL; both depend only on reproducible lock PR #149 for reliable CI.

Executed local validation: 12 PostgreSQL authorization/vote assertions PASS; full
release-check PASS (88 test files / 671 tests, typecheck/lint/security/guards/build).
The former source-only test expecting admin:* bypass was replaced with the new
ownership invariant, alongside executable positive/negative authority unit tests.
