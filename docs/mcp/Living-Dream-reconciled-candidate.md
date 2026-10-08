# Living Dream read-layer reconciliation · 7 October 2026

Canonical base: `da5209feae985426c86bcad9d27cd2a1c02ae815`.
Candidate A: `039c90955c8be6d4010e282267f10e68208685a2`, `codex/evening-living-dream-reads-20261007`.
Candidate B: `09a46faa6fd896f294c9c57a2fb7d58bc64995cd`, `codex/living-dream-read-layer`.
Reconciled branch: `codex/living-dream-read-layer-reconciled`, created directly from the canonical base. Neither independent candidate was merged into it. Their source commits remain preserved in their original local checkouts. This report supersedes both candidate handoffs for this read layer.

## A · Exact file-by-file and semantic comparison

The union contains nine paths. Eight differ between A and B; the tool implementation is byte-identical. Neither modifies dependencies, Supabase configuration, schema, the four existing tool sources, or their user-scoped Supabase helper.

| Path | A against base | B against base | A versus B / choice |
| --- | --- | --- | --- |
| `src/lib/mcp/tools/living-dream.ts` | New, 100 lines | Same new 100 lines | **Identical**. SHA-256 `a2fb67bea628d18e123f7c15c0063fadc0703d3886bb82d217f3e5c5ee21a032`. Keep without rewriting. |
| `src/lib/mcp/index.ts` | Registers same three tools; explicit snapshot, maturity, relationship and authority limits | Same registration/auth; shorter instructions, explicit priorities HOLD; extra blank line | No execution difference. Keep A's distinctions and B's priorities HOLD in one instruction string. |
| `src/data/crown/growths.ts` | 22 additions / 3 removals: corrected PR #88/#89/publication/main lineage, historical production marker, two merged seams, revised live-check decision | Unchanged; stale earlier-production claim persists | A is factually safer. Same canonical Folio collection, no second Growth state. |
| `src/tests/crownGrowthRecord.test.ts` | 14 additions / 1 removal: new release-line regression and pre-#88 build expectations | Unchanged | Keep A: covers the Growth correction and no maturity/live-verification promotion. |
| `src/tests/livingDreamMcp.test.ts` | New 207-line suite | New 188-line suite | A adds 19 lines within the same 25 cases: authenticated discovery, signed wrong-audience/wrong-issuer/expired JWT rejection. Otherwise identical. Keep A; add schema snapshot equality and actual runtime regeneration regression. |
| `supabase/functions/mcp/index.ts` | Generated: 430 additions / 2 removals | Generated: 403 additions / 2 removals | Both use SDK **0.26.3**, retain the original-tool prefix and issuer/audience. Differences are bundled Growth facts and instructions; not alternate server logic. Regenerate from reconciled sources. |
| `docs/releases/Evening-Living-Dream-read-candidate.md` | New, 78 lines | Absent | A carries the six-commit audit, Telegram boundary inspection and release correction. Preserve relevant findings below, rather than retain a competing final handoff. |
| `docs/mcp/Living-Dream-read-layer-candidate.md` | Absent | New, 75 lines | B has clearer tool contracts and priorities categories, plus SDK mismatch disclosure. Incorporate and correct its generation analysis below. |
| `docs/mcp/living-dream-tool-schemas.json` | Absent | New, 67 lines | Keep B's exact discovery snapshot; final tests compare it to real discovery so it cannot silently drift. This is contract documentation, not priorities or Growth state. |

Behaviour comparison by concern:

- **Registration/auth:** identical seven-tool ordering and unchanged OAuth issuer / `authenticated` audience. All new handlers check verified auth before loading a source. Neither adds Staff/Curator role coupling or elevated DB access.
- **Schemas:** identical raw-Zod conventions. Empty inputs for Circle/list; required `growth_id`, trimmed and bounded to 1–128 characters. Same actual MCP discovery metadata and read-only annotations. No output-schema convention is added.
- **Privacy/Circle:** identical explicit public field selection, approved-only state, approval/revision, and existing `approvedCircleUrl` validator. Draft/missing Circle fails closed; unknown top-level private fields are omitted. Companions remain appearance labels, not asserted individual-tree bindings.
- **Growth/list/detail:** identical pure read of `CROWN_GROWTHS`, the collection used by the Folio. List is a compact map; detail includes source refs, release evidence, memory refs and decisions without opening evidence bodies or reading Notion drafts. Repeated summary fields in detail are derived presentation, not competing stored facts. Existing nested references are from the public-safe Folio model; extending that model with private fields is outside this contract.
- **Errors:** identical `isError: true` / no structured payload for unknown id, missing/draft Circle; generic public failure for source exceptions. Empty Growth list succeeds.
- **Coupling:** both intentionally import existing canonical modules; neither creates storage, live Notion access, task routing or authority. Test injection is a seam for testing, not an alternate runtime store.

## B · Chosen implementation

Keep the shared implementation verbatim. Use A's proven Growth correction/auth tests, B's discovery schema snapshot and priorities categories, and a single reconciled report. Add only the evidence checks needed to compare real schemas and generated code. No UI, persistence or dependency upgrade is included.

## C · Generated runtime / SDK discrepancy

The deployment artifact is `supabase/functions/mcp/index.ts`. Base main, A and B all import **0.26.3**. The original-tool prefix is byte-identical across all three. A's claim of byte identity applies to that prefix, **not the whole extended artifact**. B's documented mismatch is real: `package.json` allows `^0.26.1`, while `package-lock.json` installs **0.26.1**. Both previous full checks used an installed **0.26.3**. No manifest or lockfile was aligned by either candidate.

The Vite generator imports its own installed SDK version when emitting `npm:` imports. The final artifact retains the existing checked-in 0.26.3 convention, generated rather than manually version-rewritten. Repeating generation with identical reconciled sources, alias configuration and SDK 0.26.3 produces byte-identical output. A regression generates twice into an ignored `.vite/` directory and compares against the committed runtime; it does not repair that file while asserting success.

Independent generation with locally extracted published SDK packages also established:

- **0.26.1:** repeat generation is deterministic, but emits `import { ROUTES } from "npm:@/lib/routes"`. It does not apply Vite aliases when bundling the Growth model. This is an unresolved app alias, not a deployable npm dependency. Source unit tests passing under 0.26.1 do not prove this artifact boots in Deno.
- **0.26.3:** handles Vite aliases and bundles `src/lib/routes.ts`; no unresolved alias. Existing original-tool runtime imports remain 0.26.3.
- The difference is therefore **not only version spelling**: seven SDK imports change, plus routes are bundled versus left external. This was understated in the previous handoffs.
- The SDKs also differ in actual HTTP behaviour: 0.26.3 authorizes non-OPTIONS requests before rejecting unsupported methods, while 0.26.1 returns MCP 405 before authentication for non-POST methods. 0.26.3 adds `Cache-Control: no-store` to those 405 responses. The relevant POST auth/tool tests pass under both versions; this does not make the versions behaviourally identical.

This candidate contains no accidental SDK downgrade or alias drift, and its retained generation is reproducible with SDK 0.26.3. **A clean locked `npm ci` is not sufficient to reproduce it.** Dependency/tooling alignment is a separate explicit HOLD; package manifests, lockfile and Vite configuration remain untouched. Do not silently restore or publish an artifact emitted under 0.26.1. The new generated-runtime test deliberately catches that mismatch. An isolated 0.26.1 generation comparison was made without modifying the final runtime.

## D · Final files

Eight paths: `src/data/crown/growths.ts`, `src/lib/mcp/index.ts`, `src/lib/mcp/tools/living-dream.ts`, `src/tests/crownGrowthRecord.test.ts`, `src/tests/livingDreamMcp.test.ts`, `supabase/functions/mcp/index.ts`, `docs/mcp/living-dream-tool-schemas.json`, and this report.

## E · Final contracts / authority and privacy audit

| Tool | Input | Result and source |
| --- | --- | --- |
| `get_current_circle` | `{}` | `{ circle, provenance }`; existing approved `CURRENT_CIRCLE`, filtered public links, approval/revision retained |
| `list_growth_items` | `{}` | `{ growths, provenance }`; compact id/title/subtitle/maturity/touched-realms/engineering-summary/decision-needed map over existing collection |
| `get_growth_item` | `{ growth_id: string }` | `{ growth, provenance }`; same Folio model, origin/source refs, maturity attribution, touched realms, engineering/release evidence, Heartwood refs, handoffs, open items, decisions; unknown id fails cleanly |

All require existing verified authentication; read-only/idempotent hints and bounded public errors are preserved. Snapshot provenance names the module and states freshness honestly: checked-in data in the serving MCP build, not a live Notion read. No retrieval time is substituted for semantic freshness.

Explicit audit: **no write path, canonical mutation, Staff authority, Curator authority, Telegram send, Hearts/reward authority or publishing authority is introduced**. No DB/network dependency in the new handlers; no live evidence-body read. Staff expresses lineage/role; the server grants authority. MCP access does not imply TEOTAG approval. Species ≠ individual tree ≠ encounter ≠ reviewed Ancient Friend ≠ Council appearance. Relationship truth is not inferred from maturity; no automatic canonical promotion.

## F · Growth truth retained

PR #88 corrected Folio merge: `db3dfa7a51fb24412cd4e6bfa8630cf9908fef87` (corrected PR head recorded by the existing review: `7bfd5b57c3c20538ef9d6bbbc179cd744ff86874`). PR #89 reconciliation into main: `4e3281de8854cef05c21ce115898ec002190fc83`. Published source: `84716ebd7984cf4657b8d2ea8da9423f35f6c672`. The record includes these and the canonical main guide merge; historical production-source evidence is labelled historical. Stale “production still serves an earlier build” wording is removed. New seams remain merged with recorded repository checks and an unresolved successful live-route check.

Growth remains **Growing**, with no new TEOTAG maturity decision. Preserve both vocabularies: Ember → Thread → Seed → Growing → Ripening → Fruit; research → proposed → branch → testing → blocked → merged → deployed → verified. Fruit ≠ deployed. Merged ≠ verified live. Published ≠ independently verified route behaviour.

## G · Independent live Folio check

**VERIFIED 404**, 2026-10-07 22:47:52 UTC. Read-only public GET of `https://www.s33d.life/version.json` returned HTTP 200 and `build: "84716eb"`, generated `2026-10-07T20:21:28.523Z`. The Folio URL returned HTTP 200 SPA shell; independent browser rendering at `https://www.s33d.life/golden-dream/growth/one-circle-many-surfaces` showed title **Page Not Found · S33D**, heading **404**, and “The route /golden-dream/growth/one-circle-many-surfaces doesn't exist.” This is a rendered route failure, not HTTP transport 404. It contradicts any inference that published repository ancestry proves route success. No cause is invented and no route fix or maturity change was made.

## H · Validation evidence

- Focused four-suite run: **71 passed** (MCP 26, Growth record 16, Folio 9, Circle publishing 20).
- Normal `release-check`, using installed SDK **0.26.3**: **passed**; all **478 tests / 61 suites**, static/share freshness, typecheck, lint (zero errors; 178 inherited warnings), security, duplicate/asset checks and production/PWA build. Build warnings remain; no UI change was made.
- Isolated SDK **0.26.1** contract/auth comparison: **25 passed, 1 intentionally excluded** (the generation regression, since that installed generator does not match the retained artifact). It proves POST contract compatibility, not deployability or clean-install reproducibility. Neither original checkout's installed dependencies was changed.
- Direct SDK protocol probes: unauthenticated GET returned **405 / no cache-control** under 0.26.1 and **401 / no-store** under 0.26.3, confirming the inspected HTTP behaviour difference without external calls.
- Repeated generation with each extracted SDK is individually deterministic; 0.26.1 reproduces the unresolved alias, 0.26.3 does not. Final retained artifact SHA-256: `a6dd02322e8ce77bbbeec4e978997b61381086942dd31b384d2eaade10eeb172`.
- Real MCP discovery equals the checked-in JSON schema snapshot. Signed JWT success, anonymous/invalid/expired/wrong-issuer/wrong-audience rejection, approved Circle fidelity/filtering, compact list/detail fidelity, unknown id, maturity separation, unchanged-source/no-network/new-no-write contracts remain green.
- Original four source tools and user-scoped helper match base byte-for-byte. Generated runtime's entire original-tool prefix matches base byte-for-byte; auth issuer/audience and all existing SDK imports are unchanged.
- `crown:growth:check`, `guard:config-churn`, and `git diff --check` passed. No live authenticated MCP, Telegram call, production DB or browser write was used. The only live-site check was public read-only Folio/release inspection.

## I · Remaining holds / future priorities seam

`get_current_priorities` remains absent. Neither candidate supplies an approved structured Notion-fed projection, and reconciliation creates none. No hard-coded priorities, priorities database, JSON shadow state or repo-owned semantic substitute.

Minimum future approved projection: **now, next, held, historical**, plus **provenance, approval/revision, freshness**. A separately approved export/validation process would supply only the public edition of current Notion meaning; a tiny shared read adapter could consume it beside the existing shared projections. Stable references and approved links must remain references, drafts withheld, freshness explicit. No such export or adapter is implemented here. Notion remains semantic authority.

Other holds: dependency/generator alignment; successful live Folio behaviour; Fulham Holm Oak binding; Staff/Curator authority; Offering persistence; Telegram rotation/publishing; canonical write-back and Hearts/reward decisions. Nothing was pushed, merged, deployed, published, sent, or written to Notion/production Supabase.

## Preserved earlier inspection evidence

The six Lovable commits are five implementation commits and one merge, all judged safe to retain by A. `5431c561089c6ec71b2695d19a5220ddeb42c75c`: URL helper/routes/roadmap. `2334e20a3de92a8991f670504bcce645c3c4dac0`: connection page/helper tests. `2afc409895ec463306b515ae82eada6f2efc851a`: route registration/footer. `cc0737c4f57f385afc2fe5ef2eb23cbdee902dc6`: guide instruction banner. `31d6ec1c1989da2843be9de7e1004eae56e5c43a`: roadmap completion. `da5209feae985426c86bcad9d27cd2a1c02ae815`: bot merge, parents published `84716ebd…` and `31d6ec1c…`. Main landing bypassed documented reviewed-PR discipline; A's GitHub association query found no PR for the merge. Public guide/endpoint metadata only; no backend authority change. Provider guidance can age and live client connection was not established by helper tests.

Telegram findings from A remain inspection evidence, not a new production check: `/council` uses the approved shared invitation/filter; `/continue` selects linked-user offering → claimed handoff → dashboard; `/radio` reads recent user/forest song offerings. Rotation confirmation gates Council publication specifically, not all commands. Preview/publish has private destination, stored revision/payload, ten-minute freshness and atomic claim; preview can write a log, so neither action was invoked. Rotation, settings and production deployment remain unverified. Telegram is arrival/doorway, not canonical archive. These systems are unchanged here.

## J / K · Candidate and recommendation

The exact local candidate SHA accompanies this report in the final handoff. One commit directly above canonical main, clean tracked working tree, no push.

**HOLD push + PR for now:** the semantic/read-layer reconciliation is ready for review, but canonical clean-install generation is inconsistent and the live Folio is independently 404. First approve a bounded dependency/generator alignment task preserving existing runtime authority; then rerun clean-install checks and decide push/draft PR separately. A live-route failure does not automatically block isolated read-layer code, but must remain an explicit separate operational hold. No new work is silently included to resolve either hold.
