# Roots — one outward journey proof

Review branch: `codex/roots-outward-journey`, based on accepted exterior continuity `727861888b652e271b7379d0e066fe66242cb550`. Local production-build preview: http://127.0.0.1:8096/tree/6fcf7b17-d5de-4455-a324-832f5451466a . No remote deployment, push or merge.

## A–B. Specimen and identity

Holm Oak, existing tree ID **6fcf7b17-d5de-4455-a324-832f5451466a**, stored coordinates **51.46970363, -0.21225726**, stored species **Holm Oak**. The public record has an existing photo Offering, “Holm and Holy”, dated 17 February 2026. It is shown in this proof as a **mapped tree**; recognised witnessed Ancient Friend status is **unconfirmed**. No new species binding or record was created.

Fortingall was not chosen: two public IDs describe the Fortingall churchyard Yew, about 173m apart, with different age estimates and different attached material. They were neither merged nor rewritten. Ankerwycke also has two similarly named records, so it was not substituted automatically. Several Holm Oaks appear in the same area; a common species/name is not a duplicate predicate. The chosen UUID is carried precisely, with its own location and attached photo. A field reconciliation of neighbouring records remains outside this proof; none is claimed to be a canonical witnessed identity.

## C. Journey

**Discover:** existing Map marker/popup → existing tree route. **Intend:** “Visit this tree” opens an inline field invitation and remembers intention on this device under the existing tree ID. **Go out:** recorded coordinates and an external OpenStreetMap location, plus the existing S33D focused Map route. The field invitation says notice, listen, spend time, and bring back what actually happened. **Return:** “Returning from a visit?” exposes existing recording and Offering actions without asserting a visit or submitting anything. **Memory:** existing Hall link with tree route in return state; clear disclosure that this does not create a Heartwood record.

These are optional depths, not a wizard. Atlas, species, Hives, Staff and Quest routes remain accessible. The new component consumes loaded tree data and uses existing callbacks; it contains no specimen registry or duplicate identity. The same lightweight invitation is reusable on existing individual-tree pages, not a specimen-specific landing page.

## D. Exact application changes

- `src/components/tree-sections/OutwardJourney.tsx`: inline visit/return invitation; tree-keyed local intention; coordinate validation; external field-map link; existing Map/encounter/Offering callbacks; Hall handoff; collapse focus/scroll restoration; encounter dismissal focus restoration.
- `src/pages/TreeDetailPage.tsx`: connects the loaded tree and existing gates to that component; neutralises fallback/error/encounter/Offering sentences that assumed Ancient Friend status; corrects the closing Hall sentence so browsing is not called a completed encounter.
- `src/pages/MapPage.tsx`: replaces the blanket “meet an Ancient Friend / claim a new encounter” arrival invitation with “Find a tree to visit” and mapped-record language.
- `src/components/MapOnboardingRitual.tsx`: removes the claim that every marker is an Ancient Friend; distinguishes browsing, seeking and recorded encounter; removes the automatic reward claim from this introductory sequence.
- `src/components/library/QuestCaveRoom.tsx`: existing add-tree milestone becomes “Map your first tree”; ten-tree and thousand-tree copy now describes mapped trees. Quest mechanics/rewards untouched.
- `src/components/CanopyCheckinModal.tsx`: existing individual-tree check-in sheet uses a bounded 90dvh height and one full snap point. Fixes an observed 320px Cancel footer outside the viewport; no check-in gate or server change. This is the tree-canopy form, not the parked Council/Canopy realm.
- `src/tests/outwardJourney.test.tsx`: four focused truth-boundary tests.
- This review document.

No Staff files were touched; no founding-144 total/cap copy was introduced. Existing Staff copy remains a held issue.

## E. Visual evidence

Evidence files are outside the Git checkout in the project output folder. Before means the unchanged `72786188` local tree page; after means this proof. Arrival, field and gate are separate states.

### 1440 before / after

![Before 1440](/Users/ed/.codex/.chatgpt-projects/g-p-683c5647f32881918e942590972e90ee/output/roots-landscape-20261010/before-tree-1440.png)
![After 1440](/Users/ed/.codex/.chatgpt-projects/g-p-683c5647f32881918e942590972e90ee/output/roots-landscape-20261010/after-tree-1440.png)

### 390 before / after

![Before 390](/Users/ed/.codex/.chatgpt-projects/g-p-683c5647f32881918e942590972e90ee/output/roots-landscape-20261010/before-tree-390.png)
![After 390](/Users/ed/.codex/.chatgpt-projects/g-p-683c5647f32881918e942590972e90ee/output/roots-landscape-20261010/after-tree-390.png)
![Field 390](/Users/ed/.codex/.chatgpt-projects/g-p-683c5647f32881918e942590972e90ee/output/roots-landscape-20261010/light-field-390.png)

### 320 critical gate and Night Grove

![320 field](/Users/ed/.codex/.chatgpt-projects/g-p-683c5647f32881918e942590972e90ee/output/roots-landscape-20261010/light-field-320.png)
![320 gate](/Users/ed/.codex/.chatgpt-projects/g-p-683c5647f32881918e942590972e90ee/output/roots-landscape-20261010/encounter-gate-320.png)
![Night Grove 390](/Users/ed/.codex/.chatgpt-projects/g-p-683c5647f32881918e942590972e90ee/output/roots-landscape-20261010/dark-field-390.png)

## F–G. Identity carry and gates

Browser Map popup link → `/tree/6fcf7b17-d5de-4455-a324-832f5451466a`; component `data-tree-id` matches. Focused Map URL carries both existing `tree` and compatibility `treeId`, the stored coordinates, and existing arrival/journey query state. Refresh restores only local intention for that ID. A different ID does not inherit it. Existing `AddOfferingDialog` still receives the selected route ID and active meeting ID where available.

The opened encounter path is `CanopyCheckinModal`: anonymous submission disabled; location-denied message displayed; underlying code requires GPS under canopy and invokes the existing server check-in function. It is not the older optional-GPS manual `TreeCheckinButton` flow. No new recognition or promotion occurs. The Offering gateway opens with the selected tree's name; final submission retains existing authentication. Its proximity hook allows `no_location` as unlocked, so an Offering is not proof of physical presence. That policy was NOT changed.

## H. Heartwood handoff

The live link opens the general `/library` Hall with `state.from` set to this tree route. Browser Back returns to the same tree and its remembered intention. No automatic durable Heartwood projection, duplicate Library item or completed-memory claim. Durable record projection remains Living Record Spine work.

## I. Remaining language / identity issues

Untouched exterior `roots-presence` selection still labels all selected photographed tree records as Friends; research-promotion terminology remains in its concurrent lane. NearbyTreesExplorer uses “Nearby Ancient Friends” without this proof establishing witness status. Some Map popup labels/age classifications, species surfaces and Staff founding-total language require separate truth reconciliation. Those are not silently certified by this prototype. Existing personal relationship heuristics may count Offerings as having “met”; not rewritten here. No repository-wide audit or authority change.

## J. Verification

Focused tests: 8 passed (4 new outward truth tests + 4 existing Map navigation tests). Full suite: 82 files / 610 tests passed. Typecheck, lint (0 errors, 181 existing warnings), build and release-check passed. Security, config-churn, duplicate and asset guards included. No new assets. Existing large-chunk/build warnings remain.

Browser: 1440×900, 390×900, 320×900; normal, Night Grove, reduced motion; no horizontal overflow in new arrival/field states. Direct URL, refresh, keyboard opening, collapse focus/scroll (0 → 0 with focus restored), Map handoff, actual Map-popup tree link, browser Back, existing anonymous/location-denied check-in gate, Cancel and focus return, Offering chooser and Hall handoff tested. Cancel at 320 is now reachable (44px target, y≈842 in a 900px viewport); submission remains disabled without sign-in/location. Smaller-height physical iPhone/keyboard testing remains a human/device check.

All external non-GET/HEAD/OPTIONS requests were blocked. No authenticated submission, external write, physical visit or server-recognition success claimed. Blocked read RPCs generate console errors; they are test restrictions, not evidence of empty data. Development-only service-worker MIME warning occurred; production-build journeys used port 8096. Browser console showed no new application exception attributable to this component. Existing drawer accessibility warning remains in the reused sheet.

## K–L. Next improvements and human gate

1. **P0 before authoritative recognition:** resolve witnessed-relationship predicate and research-conversion meaning in the existing authority lane.
2. **P1:** judge whether the field invitation is quiet/short enough and whether its placement helps departure rather than adding another information layer.
3. **P1:** field-check the selected coordinates/access and neighbouring records before recommending a real visit. Recorded location is not verified permission or navigation safety.
4. **P2:** durable carried intention and encounter→Heartwood projection; offline companionship becomes valuable after opening the field location and before writing an encounter. No offline system built.

Ed/TEOTAG should judge: Is the next useful action clear? Does the invitation know when to get out of the way? Does returning preserve the tree? Is the difference between a mapped record and lived relationship clear without a lecture? Does this get us closer to life?

Protected Crown, Canopy, Heartwood candidate, exterior reference, Roots proof, Circle 236, PLANeTary and frozen release candidate were not changed. Held Crown-anchor return and ~1.5MB plate optimisation remain held. Stop for human review; no merge or publication.
