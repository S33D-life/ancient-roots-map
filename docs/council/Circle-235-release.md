# Circle 235 · open-Circle release

Prepared 7 October 2026. No complete Notion record, Weekly Harvest, Crown, companion identity, database, Offering persistence, private media, or invitation/auth code is changed.

## Sources

- Circle 235: https://app.notion.com/p/3ef15b58480d81ec84dce0c460107aa1
- Current Priorities: https://app.notion.com/p/35215b58480d813fa968d84ccb13a791
- Canopy: https://app.notion.com/p/35215b58480d81b59779f5002c5a85d7
- Crown: https://app.notion.com/p/35215b58480d8168b02fcde7c01a6177
- PLANeTarry: https://app.notion.com/p/3e915b58480d81d69191cb11a561be2c
- Weekly Harvest: https://app.notion.com/p/3f215b58480d81259cdaf76b6811a38c

Latest Current Priorities and the explicit user brief govern public scheduling. Old dated sections of Circle 235 remain historical evidence. The six-companion local candidate remains separately preserved in output/circle-235-six-companions; this release reuses those existing doorways.

## Public changes

Council card becomes Current Circle / Open Circle, with the approved question, six companions chosen by Leo, People/open seventh seat, Fly Agaric safety and hosted 3D entrance. Reflection agrees with the Circle question. No scheduled Fire is advertised or inferred to have occurred. Telegram copy is alongside this file; no Telegram message has been sent or edited.

The static URL remains /tetol/circle-235/pre-fire/tetol.html for compatibility. The embedded current-Circle projection removes the dated Fire and displays “The Circle is open now. Times will be shared in the group as each fire is lit.” Frozen source manifests and earlier Circles remain preserved. Six-companion learning and Fly Agaric/Birch paths remain available. SAVE remains disabled.

## CSP-safe package and measured asset budget

The built preview originally blocked the executable inline loader at tetol.html line 22. Its response has `script-src 'self'`; neither outer HTML nor the decoded template contains a CSP meta policy. The packed template also contained inline classic scripts, an inline module, an import map, an inline branding handler and executable blob URLs. Extracting the outer loader alone would therefore be insufficient.

The loader is now ./loader.js. Existing classic application scripts are externalized in original order into three bounded runtime files; the module is runtime/entry.js. The packed manifest now holds only non-JavaScript media. Resources are assigned on window by the external loader instead of injecting an inline script. The branding dismiss handler is registered by that loader. Relative imports in the 3D adapter and the three local add-ons replace the inline import map. The two Three.js build files remain byte-identical; each add-on changes only its import path. Global CSP, server configuration, auth and Supabase code are unchanged. No unsafe-inline, nonce, hash or blob script permission is introduced.

All paths below are relative to public/tetol/circle-235/pre-fire/.

| Asset | Production bytes | Candidate bytes | Delta bytes | Delta % |
|---|---:|---:|---:|---:|
| `tetol.html` | 1,119,371 | 667,811 | -451,560 | -40.3405% |
| `loader.js` | 0 | 16,269 | +16,269 | new file |
| `runtime/classic-1.js` | 0 | 365,989 | +365,989 | new file |
| `runtime/classic-2.js` | 0 | 296,062 | +296,062 | new file |
| `runtime/classic-3.js` | 0 | 15,444 | +15,444 | new file |
| `runtime/entry.js` | 0 | 142,379 | +142,379 | new file |
| `vendor/three/build/three.core.js` | 1,427,497 | 1,427,497 | +0 | +0.0000% |
| `vendor/three/build/three.module.js` | 648,961 | 648,961 | +0 | +0.0000% |
| `vendor/three/examples/jsm/controls/OrbitControls.js` | 40,504 | 40,529 | +25 | +0.0617% |
| `vendor/three/examples/jsm/exporters/GLTFExporter.js` | 89,670 | 89,695 | +25 | +0.0279% |
| `vendor/three/examples/jsm/exporters/OBJExporter.js` | 6,070 | 6,095 | +25 | +0.4119% |

Total uncompressed standalone package: production 3,332,073 bytes; candidate 3,716,731 bytes; delta +384,658 bytes (+11.5441%). Externalizing previously gzip-packed JavaScript increases raw package size; actual host transfer compression is not asserted. This increase was flagged before committing. HTML shrinks 481,230 bytes from the preceding candidate (1,149,041 bytes). All new files, including the 16,269-byte loader, fit the ordinary 512,000-byte limit. Only the original three exact-path exceptions remain: tetol.html, three.core.js and three.module.js. No new exception is added. TETOL remains excluded from service-worker precaching/navigation handling.

## Fresh acceptance · 7 October 2026

Fresh release-check passed after this code change: typecheck; lint (0 errors, existing warnings); security; duplicate artifact check; asset-budget check; 358 unit tests across 48 files (including Circle 235 doorway and the new external-script CSP packaging regression); production build. Generated unrelated Supabase MCP drift was restored to production bytes after the build and is excluded from the release. No schema, database, auth or Supabase delta exists.

Built preview (not development mode): desktop 1280×900 and phone viewport 390×844 both passed Council landing → hosted Circle 235 entrance → six companion doorways → Fly Agaric → eleven remembered moments → Silver Birch → reciprocal return → Circle. Fifty non-Fly companion stages and fourteen Fly stages were exercised with no horizontal overflow and SAVE disabled. Current Circle question, open-Circle line, People/open seventh seat and Fly Agaric safety agree with the approved wording. Old May gathering is historical; no active Tuesday 6 October schedule is advertised. Full Circle history and Weekly Harvest were not edited.

Browser console: no script CSP violations, runtime errors or missing module/assets on the required journey. Existing Three.js shadow-map deprecation warning only. No clickable localhost/private/internal destinations appeared in the tested journey; workspace provenance remains text rather than a required doorway. The local test origin is not an authored link. Inactive experimental relay/export/other-page flows were not newly enabled or certified. Phone evidence is Chromium viewport acceptance, not physical Safari/Android certification.

Local evidence outside this Git repository: ../../playwright/c235-companion-final.log, c235-fly-final.log, c235-seats-final.log, c235-preview-headers.txt, c235-asset-sizes.json and desktop/mobile PNGs. Fresh complete gate log: ../loader-release-check.log. Browser evidence, private source snapshots and caches are excluded from the commit. Telegram remains PREPARED / NOT SENT. Lovable private project source synchronization remains unverified behind sign-in. Stop at the deployment gate.

## Production and rollback

Read-only live version: 28ce5a2, generated 2026-10-06T05:01:44.249Z. Exact source baseline: 28ce5a248db730ee7251b6bcd3f4d7b2072f23b1 on codex/atlas-on-auth-release. Main differs; do not merge main or unrelated candidates into this release. Live Council still advertised May. Existing static TETOL response was preserved before edits.

Outside-repo rollback copies: ../rollback/production-version.json, ../rollback/production-tetol-response.html and ../rollback/source-tetol.html. The live response may contain host injection; source bytes are independently preserved. Revert only this isolated release commit on the selected release branch and republish through the same workflow. If a merge commit is used, revert it with git revert -m 1. Do not reset unrelated work.

Before publication verify the hosting project's synchronized source is exactly the reviewed release SHA, with no unrelated unpublished changes. Confirm version, Council landing, static HTML, normal app/map/auth and service-worker behavior after publication or rollback. Physical Safari/Android acceptance remains distinct from local browser checks.
