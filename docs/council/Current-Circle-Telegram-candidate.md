# Current Circle → Telegram bounded candidate

Inspection date: 7 October 2026. Nothing sent, pushed, merged, published or deployed.

## Verified starting truth

Production `https://www.s33d.life/version.json` reports `ce9bab5`, generated 2026-10-07T09:38:31.828Z. Remote `codex/circle-235-open-journey` resolves to **ce9bab52935cbce2174bfa15454e6d907d7e8668**. Candidate starts exactly there, on `codex/current-circle-telegram`, in an independent clone (old release clone has a missing temporary Git alternates path).

`main` is **85c064114f2c7593f5e7d14eea8e7bcb01273056**. It diverges: main has 23 unique commits, production 11; common ancestor **4f394742c4689bc1cdb9c8ac36eeceee1618531d**. Do not merge main for this lane.

| Branch/reference | Head | Relation / decision |
|---|---|---|
| codex/circle-235-open-journey | ce9bab52935cbce2174bfa15454e6d907d7e8668 | Current production / accepted Circle |
| codex/atlas-on-auth-release | 28ce5a248db730ee7251b6bcd3f4d7b2072f23b1 | Production parent; older |
| Atlas accepted clue | 606bd4d33cd01a8eb4cc0a7b038e6bd013cd0146 | Ancestor of current production |
| codex/circle-235-static-hosting | f1db32bf846fc3c404acf0628a859e0b0a494d85 | Already ancestral |
| codex/circle-235-public-doorway | 5903fe8b7674de7cfedad570c80dea633bdfa5cc | Historical divergent branch, 11 production-only / 24 branch-only commits; not current |
| telegram-handoff-alignment | e8a0f3fa08a2d2b710418c4d8e55b51b6e7e8161 | Historical ancestor; do not revive |
| telegram-handoff-alignment-clean | e1a0fe11992ae91996fc828330e5cd1c493c80d4 | Historical ancestor; 3041 production-only / zero branch-only |
| release/auth-feac462d | feac462de9ab8b3c8103799064f7f25ee4e74372 | Ancestor, nine production commits ahead |
| release/diagnostic-42de468d | 42de468d7cc54b4ac5d8af724c74b7b9687c68b2 | Ancestor, eight production commits ahead |
| codex/auth-callback-consumption | 71a07e1d00883f148db05f385faedbfc2068246c | Divergent: four production-only / three branch-only; separate lane |
| claude/r1-unified-invite-consumption | bb7e0eaf20fcabb6ccd2f29bb31f67994d6efc41 | Divergent: four production-only / two branch-only; separate lane |

Remote branch inventory found no later production/release head than accepted Circle. Branch dates/names are not acceptance evidence. Current live version is authoritative for this candidate; no hosting configuration was changed.

## Source truth and data shape

Notion remains human editorial source. This candidate moves the already approved production Circle fields into `supabase/functions/_shared/currentCircle.ts`; app imports the same pure module. No browser or bot reads working Notion. No second Council table/bot, no automatic editorial ingestion.

`CurrentCircle`: number, title, weekState, openLine, question, companions, peopleSeat, safety, approval (`approved` / `draft`), revision, links (`url`, `approved`) for Council, TETOL, group, optional Fire, Guide, Images, Living Record. Approval describes public content, **not authorization to send**.

Only the already accepted Council, TETOL and group links are populated. Fire is not inferred from the group URL. Other buttons are omitted until TEOTAG approves exact public destinations. Current Circle dates remain open; no invented schedule or lunar fallback.

## Files and reuse points

- New shared Current Circle projection and pure publishing module under `supabase/functions/_shared/`.
- `src/data/council/circle235Doorway.ts`: compatibility adapter, same relative TETOL destination.
- `src/components/council/NextCouncilCard.tsx`: shared week state, Circle number, People line.
- `supabase/functions/telegram-notify/index.ts`: existing internal-only authorization, settings, connector and outbound log reused; `council_invite` no longer accepts caller-provided public copy.
- `supabase/functions/telegram-poll/index.ts`: `/council` uses the canonical HTML and inline keyboard directly, without account linking, seasonal enrichment or old lunar fallback. `/plant` retains prior behavior.
- `supabase/functions/telegram-handoff/index.ts`: existing Council response exposes Current Circle and canonical public URL; login/account flows unchanged.
- `src/tests/currentCirclePublishing.test.ts`: mocked private publishing plus real handler authorization/preview/rotation boundary tests.
- This documentation.

Inspected but intentionally unchanged: CouncilOfLifePage (already consumes doorway adapter), councilCycles, getLatestCouncilInvitation, telegram-auth, client notify service, TelegramSettings, migrations/settings/log policies. The old invitation resolver feeds the explicitly historical archive and is not a current publication source.

## Preview → explicit private test Publish

Trusted server operator invokes existing `telegram-notify` with `event_type: council_invite`, `action: preview`. Preview returns canonical HTML and approved buttons. Without server `TELEGRAM_COUNCIL_TEST_CHAT_ID` set to an explicitly approved positive private-user chat ID, preview is read-only and publishing unavailable. It never falls back to the production settings chat.

With that private test destination configured, preview writes a pending row in **existing** `telegram_outbound_log`. Publish requires `action: publish`, `confirm: true`, returned `preview_id`, internal authorization, and server attestation `TELEGRAM_EXPOSED_CREDENTIALS_ROTATED=true`. Do not set that attestation without actual revocation/rotation evidence. No secrets belong in Circle state or frontend.

Publish validates preview age (10 minutes), exact revision, content, keyboard and destination; atomically claims the pending row before gateway call. Existing settings must be enabled and Council notifications allowed. It records `sent`/`failed` and Telegram message_id. Failed or uncertain attempts cannot reuse the preview. A process crash/log failure leaves a claimed row requiring operator reconciliation; creating another preview without reconciliation may still duplicate a message. There is no automatic retry.

**This candidate cannot publish to production groups/channels.** Production enablement and a browser keeper publishing surface need a subsequent explicitly approved bounded change. Existing browser service/settings calls lack internal authority; this seam does not give the browser server credentials or introduce privilege infrastructure.

## Commit plan / acceptance

1. Shared public shape and app adapter (no public wording changes).
2. Telegram renderer and internal-only preview/private publishing seam.
3. Regression/security-boundary tests and handoff evidence.

Gate: typecheck, lint, security, duplicate guard, asset budget, full unit suite and production build. Fresh built desktop/phone checks verify exact accepted question/open line/safety, six companions, People seventh, historical distinction and TETOL entrance. Static 3D package must have zero diff from ce9bab5, including SAVE-off behavior. Mock tests prove no delivery from preview, unapproved/private URLs omitted, HTML escaped, no publish without confirmation, replay prevention, failed/uncertain outcome logging. Actual handler tests ensure untrusted calls denied, client copy ignored, missing rotation attestation blocks publish.

No real Telegram or live database calls are part of validation. Supabase migrations describe keeper-only settings/outbound-read policies, but actual deployed policy state and connector configuration have not been audited in this task. Deno/deployed integration is not proven by browser unit/build checks; real edge handler is exercised with isolated doubles.

## TEOTAG gates / remaining decisions

Before any real private test: attest exposed Telegram **and OpenAI** credentials revoked/rotated, verify replacement secrets in trusted server/connector environment, approve exact private destination, approve specific preview and send. No real send is authorized in this task.

Before production reliance: verify deployed settings/RLS/internal authorization and logging behavior in an approved sandbox; reconcile uncertain sends; decide current-circle editorial approval/revision ownership, approve optional public destinations, and authorize a production-capable publishing surface. Approval of the current Circle's content is not approval of any broadcast.

Before merge/deploy: review exact candidate commits and ancestry, choose release branch while preserving production's accepted Atlas/auth/Circle work, approve merge and deployment explicitly. Production rollback remains **ce9bab52935cbce2174bfa15454e6d907d7e8668**, remote `codex/circle-235-open-journey`; no rollback action required because production is untouched.

## Deliberate exclusions

No 3D/TETOL runtime changes, Offering SAVE/persistence, Circle history or Weekly Harvest edits, Notion mutations, Crown, PLANeTarry expansion, Heartwood, Cycle Trunk, visual asset workflow, memory loop, Staff/Curator dashboards or Staff role infrastructure. No invitation/login/profile authority changes, migrations, generated Supabase types, lockfile/dependency upgrades, new routes, broad CSP changes or unrelated branch integration. Build-generated MCP version drift must be restored before commits.

## Final local evidence

- Fresh full `release-check`: **378 tests / 49 files**, including existing Circle doorway regression and 20 new publishing/actual-handler tests; typecheck, lint, security, duplicate guard, asset budget and production build passed. Logs are kept outside the repository in `output/council-telegram-release-check-final.log` and `output/council-telegram-focused.log`.
- Built browser at desktop 1280×900 and phone 390×844: accepted Council wording, six companions, People seventh seat, safety and historical archive distinction present; TETOL doorway loads beyond Unpacking; console zero errors/CSP violations, one existing Three.js shadow warning. Phone Council document width equals viewport width (390 px), no horizontal overflow.
- Desktop accessible List exposes all six companions plus People. Fly Agaric route loads its model. Full pointer-driven Fly → memories → Birch → return acceptance **not completed**: the unchanged immersive canvas intercepts clicks on the companion card. Recorded screenshot/evidence outside repo; do not claim complete journey pass or fix the 3D package in this Telegram lane. Preserved package has zero diff from production.
- No migration, database, auth or TETOL static asset delta. The deliberately bounded edge-function publishing changes are the only server delta. Build-generated unrelated MCP drift restored exactly to ce9bab5.
- Rechecked production and remote heads after validation: production still `ce9bab5`; main and accepted Circle branch unchanged.
- Credential rotation remains **unverified**; no exposed credentials retrieved, copied, moved or tested. Server-only credential lookup is verified in code; actual environment/revocation status is not proven. Notion access discovery required for searching the old bot page is not exposed by this connection, so no secret-bearing search was attempted.
- **GO for local code review; NO-GO for production publishing/deployment.** No real private delivery, live Supabase audit, Deno deployment validation or production Telegram delivery performed. Dependency installation reports 58 existing audit findings (1 low, 18 moderate, 36 high, 3 critical); lockfile unchanged, dependency remediation belongs in a separate lane.
