# Field species discoverability — Stage 1

26 November 2026. Independent frontend draft from main `d2a08bb4f679a8fef5292f6fb8b47b3bf053dfea`.

## Scope and preservation

Add Tree's actual name-entry surface is `encounter/SpeciesIdentifier.tsx`. It now uses the existing `useSpeciesSearch` / `search_species_multilingual` read path, with immediate local suggestions. The unused static-search declarations in AddTreeDialog are removed. No new species database, migration, enrichment function, automatic taxon creation, existing-tree update or change to encounters/offerings is introduced.

A deliberate catalogue selection carries the existing species key and scientific name into the **new** tree insert and the existing signed-out pending-tree handoff. Typing, blur, a broad common name, photo suggestion, or a family/genus identification never fabricates a key. Editing a chosen name clears its prior selection. Catalogue and alias hits are deduplicated by existing species ID; scientific authorship does not create another local suggestion. Existing records with distinct IDs are not merged based on similar names.

The existing `trees.metadata.identification` JSON records the entered name, certainty, rank and source. Family/genus-only entry uses an explicitly unconfirmed label, no species key, and no scientific species assertion. Family/genus names are entered by the user, not validated by this frontend. The legacy RPC omits rank; unambiguous single-word genera are treated conservatively and other unrecognised scientific forms remain unresolved. No new certainty claim is made for those rows.

## Field performance and accessibility

- Immediate bounded local suggestions while typing; 250 ms debounce before remote search.
- Existing RPC only; at most three parallel queries per pause (literal name, punctuation-folded variant if needed, and exact documented local scientific-name hints).
- Never expand ambiguous bare `Oak` to the first local species.
- Abort superseded queries and stop remote waiting after 3.5 seconds in this field-only path; no automatic retries or window-focus requests.
- Query-session caching; no new persistent history, external per-keystroke taxonomy calls, analytics or catalogue import.
- Late results cannot replace the user's text or auto-select a row. Keyboard selection resets when results change.
- Labelled combobox, scientific/family descriptions, keyboard arrows/Enter/Escape, touch targets, in-flow scrollable choices, status text and 16 px input to avoid iPhone input zoom.
- Manual and unknown entry remain possible during failure. This does **not** introduce an offline save guarantee: the existing tree-save/authentication flow still needs its normal connectivity.

## Cambridge examples and honest catalogue limits

Read-only GET against the source-configured public species endpoint on 26 November (not independently established as the currently served app's backend):

| Field label | Scientific name | Catalogue observation |
|---|---|---|
| Common Walnut | Juglans regia | Three pre-existing records (`walnut`, `gbif-3054368`, `juglans-regia`); preserve IDs, no silent deduplication or preferred-identity invention |
| Chestnut-leaved Oak | Quercus castaneifolia | Existing `gbif-7930013`, common label `Oak`; scientific hint reaches it |
| European Hop-Hornbeam | Ostrya carpinifolia | Existing `ostrya-carpinifolia` |
| Wollemi Pine | Wollemia nobilis | Not found; explicit local/manual suggestion only, no invented catalogue key |
| Cork Oak | Quercus suber | Existing `quercus-suber` |
| Argan | Argania spinosa | Existing `argania-spinosa` |
| Sausage Tree | Kigelia africana | Not found; explicit local/manual suggestion only, no invented catalogue key |

The three added entries extend the **existing** small fallback (not a competing catalogue). European Hop-Hornbeam is an alias on the existing Ostrya entry. Only factual names/families are included; no source prose, imagery or restricted language names are copied.

Sources checked:
- Kew POWO, Quercus castaneifolia: https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:295924-1
- EUFORGEN, European hop-hornbeam: https://www.euforgen.org/species/ostrya-carpinifolia/
- Kew, Wollemi pine: https://www.kew.org/plants/wollemi-pine
- SANBI, Kigelia africana: https://pza.sanbi.org/kigelia-africana

Global coverage, scientific synonym completeness, reconciling existing duplicate Walnut records, richer multilingual indexing and provider licensing remain the separately requested Global Tree Species Catalogue workstream. The legacy prefix RPC is not transformed into a worldwide fuzzy search by this PR.

## Automated review

`npm run test -- src/tests/fieldSpeciesSearch.test.ts src/tests/FieldSpeciesSearch.test.tsx`

Exercises all seven common/scientific names, Unicode punctuation/accents/partial local search, bounded query hints, ambiguous Oak, repeated canonical/alias hits, manual and family/genus payloads, clearing old keys, explicit keyboard selection, connection failure/deadline and stale responses.

`npx playwright test e2e/field-species-search.spec.ts --project=chromium`

Runs the real `/add-tree` journey at 390 px and desktop width using **fictional** RPC results. All non-local requests are intercepted, and no real tree/media writes are performed. Seven mapped mocked identities are not evidence that all seven exist in production; the live-read table above records the actual limitation. The same test can be run with a local WebKit project override; no workflow changes are required.

## Native iPhone acceptance — pending, no network exposure authorised

1. On an approved private preview, open `/add-tree`, choose “I know the species”. Search each of the seven field names and its scientific counterpart. Check the list can scroll above the keyboard and the scientific description remains readable.
2. Search `Oak`. Confirm multiple choices, no automatic selection; select deliberately, then edit the name and verify that the previous species association is not retained.
3. Toggle connectivity while typing. Local hints and manual text remain usable; catalogue unavailability is stated. Reconnect before using the normal save journey. Do not create real acceptance trees without a separately approved data test.
4. Choose “I know only the family or genus”. Try `Quercus` and `Fagaceae`; confirm the reflection summary says species unconfirmed. Also continue without a species.
5. With VoiceOver, check input name, expanded state, options and scientific names, status feedback, explicit selection, and focus return. Test touch scrolling, landscape, and large text.
6. No real existing Ancient Friend should change; existing encounters and offerings remain attached to their existing tree IDs.

## Release and rollback

Draft source review only. Merge and frontend publication require separate approval. No SQL, backend deployment, licence-gated imports or data repair is required for this frontend. Roll back by restoring the prior frontend source/build; any **new** tree explicitly mapped by a user retains its existing valid catalogue key. There is no bulk relinking to undo.
