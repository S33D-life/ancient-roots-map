# Council Offerings V1 — isolated interaction fixture

Review-only, based on main e2f2830f0af383f14d7f0165cd3eb9be4ec9d057. Not a persistent offering system, release approval, Ledger record or deployed feature.

## Design provenance

The requested Claude offering interaction artifact was not located in connected Drive/Notion searches. Council PDFs and an older artwork handoff were discoverable, but do not establish the interaction design. A link or written screen/wording/privacy handoff was requested. This draft follows Ed’s explicit six-kind/private-by-default requirements and the existing architecture proposal; **visual fidelity to Claude is unverified**. No Claude media was downloaded, copied or published.

## Run locally

```sh
npm ci
npx vite build --config vite.offering-fixture.config.ts
npx vite preview --config vite.offering-fixture.config.ts
```

Computer-only entry: http://127.0.0.1:4242/review/council-offerings.html?companion=goji-seed

Original Tree entry: http://127.0.0.1:4242/review/council-offerings.html?view=deck&companion=hoopoe

Choose a companion in 2D, then Leave an offering. In the original Deck, open the existing sheet with its handle, then Leave an offering. Both invoke one composer and return to their originating companion. The iframe is the actual repository Tree, not a replacement renderer or gallery.

This independent branch deliberately does not incorporate or modify #127. Its main-baseline Deck still uses the older sheet-opening behavior. Reconcile the small optional Circle238Page props with #127 after human release decisions; do not revive main’s old headings or overwrite #127’s lore/navigation when resolving that overlap. The preview heading override affects only this harness. Without an explicit callback, production Circle238Page has no offering button, including with forged query parameters.

## Safety boundary

- In-memory state only; refresh/close discards the draft.
- Private by default; proposing Circle sharing is separate and does not automatically publish or broaden a source offering’s permissions.
- Confirmation: “Demo — not saved to Council Ledger.”
- Six primary types, future-companion suggestion and one visibly synthetic source-offering reference. No tree IDs are fabricated. Link mode carries only the source ID/context, not copied content.
- Poem input is reused directly from offering-kit. Other controls reuse existing UI primitives. Photo/voice/music are synthetic fixtures rather than unsafe invocation of existing public upload/search flows. The tone is generated locally; no microphone or camera/library prompt occurs.
- No Supabase/client import, uploads, auth calls, external search, rewards, attendance, archive, localStorage/IndexedDB submission or background sync in the fixture code.
- Separate Vite config has no app MCP/PWA/environment plugin; serves original public Tree/Council assets read-only from this checkout, with no-store and self-only network CSP. Original Tree preferences are replaced by per-document memory in this harness; original source files are unchanged. Non-GET/HEAD requests are rejected. This server is loopback-only, not a protected public hosting service.
- Its build requires the checkout for the original static assets; it is not a self-contained public upload package. No production deployment is authorized.
- Standard app build does not emit this review HTML/module. No App route is added. Real application history/auth paths are not reimplemented by this harness; use the original Tree Time Tree for spatial history. Existing production history and artwork remain untouched.

## Checks

```sh
npm run test -- src/tests/CouncilOfferingFixture.test.tsx
npm run release-check
npx playwright test --config playwright.offering-fixture.config.ts
```

The `.fixture.ts` browser spec intentionally runs only under its own configuration, not the production smoke server. The separate path-scoped Actions workflow installs Chromium/WebKit and runs the four disconnected journeys; software-renderer CI is not native iPhone proof. Tests block external requests and non-read requests. A later real persistence design needs separate Ledger identity, consent, RLS, private signing, idempotency and withdrawal approval; this draft proves none of those backend properties.

No frame geometry/camera fix is included. Frame diagnosis remains outside this branch and requires a separate GO.
