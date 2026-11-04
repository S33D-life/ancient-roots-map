# Circle239 living frames — private review candidate, not release-cleared

**Latest:** [corrected typeset candidates and review](TYPESET-CANDIDATES.md), pinned by candidate-receipt.json. The original intake, dimensions, OCR limitations and risk table below are historical evidence for the FIRST pack, not the current candidate set. All ten current candidates are 3:2; the originals below remain unchanged.

Base: d054f087fecb384e2d539930b4f37068059e62ce (#140, already live). New isolated feature; no changes to #140, historical manifests/art, camera, backend, permissions or DNS. One optional adapter hook in original entry.js; no new renderer. The current 390px camera-edge clipping is preserved/documented, not fixed by this feature.

## Asset intake and publication gate

Ten raw PNGs were fetched from the owner-supplied restricted [ZIP](https://drive.google.com/file/d/1km_aG2n250GQyHnoOi9_JLHckHiCWxqO/view), [manifest](https://drive.google.com/file/d/1j0f7a2eDncyrzubZkeeQcpN6zpNZZmlB/view) and [contact sheet](https://drive.google.com/file/d/1wPUc_x-ZyQeEHNmTquS8jeZgcaYGE-2f/view). Drive metadata exposes owner/writer user permissions only; no sharing changed. ZIP integrity, ten SHA256 values, order, roles and PNG dimensions verified. Original bytes were not edited. ZIP SHA256: `6d1008c8fa8dd31b17e42c1134af8fd499fddf4d82736db979059c31e573c160`.

**The supplied source manifest says PRIVATE_ARTWORK_REVIEW_TEXT_FACTCHECK_REQUIRED and publicationApproved:false. All original reverse images remain private, OUTSIDE git/public/dist.** The checked-in catalogue has no artwork URLs or raw transcript. Production fails closed, retaining fronts and a truthful unavailable reverse control even with query flags. A loopback-only GET server can overlay original private images for local review. It labels them LOCAL_PRIVATE_REVIEW, never APPROVED. This is a reviewed implementation mechanism, not an art/content release approval.

Nine images are1536×1024 (3:2). Nutcracker is1448×1086 (4:3). Preserve that original image; contain it within the existing3:2 spatial artwork envelope with wider side borders. Never crop/stretch it to manufacture3:2. Complete2D image scales to its actual ratio. The existing wooden backing/cord/camera geometry is unchanged. The frame control offers a separate full-image link for text zoom.

## Initial visual/text risk audit — ALL PUBLICATION HOLD

This is a source-linked risk review, not a claim of exhaustive scientific/legal clearance. AI-generated diagrams are not specimen identification or documentary evidence. Symbolic language belongs to editorial reflection, not scientific claims. No source artwork has been silently corrected.

| # / role | Required reviewed revision or evidence |
|---|---|
|1 Defynnog Yew / Ancient Friend|Individual identity/order matches. Diagram labels aril non-toxic and seed toxic; explain toxic tissues without implying safe foraging. Exact estimated age/ancient sacred history needs source/uncertainty attribution; generated church/tree image is not a documented view. [MedlinePlus toxicity](https://medlineplus.gov/ency/article/002877.htm); [Ancient Yew Group individual record](https://www.ancient-yew.org/yew_trees/defynnog-405/).|
|2 European Beech / Tree|Identity/order match. Generic species lifespan must not read as an individual measured age; qualify historical mast-food mention and avoid food-preparation inference. Woodland/lore assertions require supporting editorial sources.|
|3 Ginger / Plant|Number correct, but reverse essence differs from approved front “Hidden fire.” Blanket immunity, circulation, inflammation and travel-sickness claims require revision; distinguish historical tradition from proven treatment and product-specific evidence. Rhizome is a stem; label/depiction of showy flowers requires botanical review. [NCCIH](https://www.nccih.nih.gov/health/ginger) reports mixed evidence and most motion-sickness studies not helpful.|
|4 Sycamore helicopter / Seed|Role/order match. Review exact species/winged-seed/leaf illustration correspondence and lifespan/food/ecology claims; do not create an exact taxon binding from generated art.|
|5 Ginkgo / Leaf|**Revise “edible when prepared.”** Seed toxicity is not eliminated by a generic cooked/prepared claim. Review gymnosperm seed coating versus botanical fruit labels, wildlife-food claims and species-vs-individual age. [NCCIH](https://www.nccih.nih.gov/health/ginkgo) notes toxicity and serious effects after roasted seeds; [Hong Kong Centre for Food Safety](https://www.cfs.gov.hk/english/multimedia/multimedia_pub/multimedia_pub_fsf_204_02.html) states cooking does not eliminate all toxins.|
|6 Dahlia / Flower|Role/order match. Edible-tuber/medicine/recipe references need species-specific sourcing or removal; generated domestic varieties are not food-identification evidence. Double-flower pollinator claims need qualification.|
|7 Rosehip / Fruit|Role/order match. Blanket immunity/anti-inflammatory/restorative claims need revision/qualification; wild-rose taxa and preparations cannot be treated interchangeably. Food imagery is not harvesting guidance; review irritant seed hairs. [Cambridge Botanic Garden](https://www.botanic.cam.ac.uk/the-garden/plant-list/rosa-canina/) confirms traditional syrup and irritant hairs, not therapeutic promises.|
|8 Fly Agaric / Fungus|**Remove recipe/use invitation; make toxicity explicit in the revised artwork.** No dosage/preparation instructions. Qualify broad shamanic/winter-tradition claims with actual sources rather than an invented common history. Root partnership diagram must not imply safe human consumption. [FDA](https://www.fda.gov/food/post-market-determinations-use-substance-not-gras/letter-industry-use-amanita-muscaria-or-its-constituents-food) findsA.muscaria/constituents not generally recognised as safe for food.|
|9 Nutcracker / Bird|Identity/order visually match but1448×1086 is4:3. Subspecies/common-name/taxonomy and range need source verification; no actual sighting inferred. Preserve broad existing Council identity until reviewed; no new canonical bird record.|
|10 The Secret Garden / Book|Work-oriented role/order match. Verify quoted-looking tagline or identify it as editorial prose, not a sourced quotation; verify generated imitation-cover provenance/rights separately. Literary healing is a theme, not a medical claim. No excerpt/edition licence inferred.|

All ten: provenance is owner-supplied AI-generated draft per source manifest. Rights beyond that statement are not independently cleared. Curator must supply reviewed asset revisions + exact hashes + verified readable text + rights approval. OCR was generated locally for private inspection only, marked unreviewed, and is never committed as authoritative text. Raw intake remains private so a public draft PR cannot expose unsafe/unapproved artwork.

## Interaction and data boundaries

- Shared custom element on239 encounter page and existing original239 TETOL sheet; unchanged gallery fronts and companion identities. Clear Reveal reverse / Return to front button, aria-pressed, retained focus,44px controls, polite state/error text. Keyboard/touch/mouse use the same button. Small rotation hint is disabled by prefers-reduced-motion.
- Reverse image and accessible readable text are a single reviewed unit; production admission requires factReviewed, rightsApproved, statusAPPROVED and collection publicationApproved. Generic query flags cannot approve an asset. A missing image leaves the current side unchanged.
- 2D URL records companion/side, preserving refresh/Back; original3D query records frame/side alongside existing circle/hash. Full-image containment, untouched UV repeat/offset and original front bytes. No camera algorithm change. New239 scene hook swaps only the selected artwork texture and contained plane size.
- Explore deeper is absent for all current entries: source search found species-catalogue names but no verified subject-specific Living Library page. A catalogue name is not a verified chapter. No fabricated IDs, generic Library link presented as a record, or new species database.
- No offering/write/upload/attendance/reward/Fire scheduling. fire:null and quiet hearth unchanged.

## Local review (Mac only)

```
npm ci
npm run build
# Raw private intake must contain MANIFEST.json, ten original PNGs and locally reviewed .txt transcripts.
node scripts/review-circle239-living-frames.mjs /private/tmp/s33d-239-reverses-intake/unpacked 4270
```

Open `http://127.0.0.1:4270/council/239?review239=1` or originalTree `/tetol/circle-235/pre-fire/tetol.html?circle=239&review239=1#croom`. Server binds127.0.0.1 only, GET/HEAD only, rejects path traversal, pins the exact intake receipt, never writes to public/, never approves content. Its local-only CSP blocks external API connections, forms and service-worker registration. Local test browser intercepts all external/non-GET traffic. No LAN/Tailscale/tunnel activation authorised here. Ctrl-C stops only this review server; verify no4270 listener. Ordinary built preview remains held/front-only.

Tests use synthetic edge-marked images in CI. `CIRCLE239_PRIVATE_INTAKE=/absolute/intake/unpacked npx playwright test --config playwright.living-frames.config.ts` locally tests actual bytes in all ten pairs without putting them in git/dist. A new additive, path-scoped browser workflow tests this feature only; existing main/Council workflows, assertions, budgets and #133 remain unchanged.

## Native acceptance still required

iPhoneSafari + VoiceOver: ten2D/3D pairs; name/number/role; front default; toggle announced with state, focus retained, transcript correct and manually verified; no duplicate hidden-image announcement; pinch full-image readability; no text/edge crop. Portrait/landscape, toolbars, safe areas, keyboard focus and320/390px, reduced motion, #grab scroll/touch/camera gestures without accidental turns. Refresh/Back/Forward must preserve selected companion and side. Return to gathering/current/history238–234/StaffRoom; no write controls or scheduledFire. Simulated WebKit/touch is not native proof. Known390px spatial camera clipping remains unresolved; full-image link and sheet reading do not prove unobscured in-world framing.

## Source merge / publication / recovery — separate GOs

Source review only. Recommend HOLD on merge-for-release/publication until revised content/rights/readable-text approval and native acceptance (or explicit acceptance of limitations). Current public bundle contains no reverse art and cannot enable it. Never merge other security/navigation/camera drafts incidentally.

After asset revision/review: narrowly add approved assets+hashes+transcripts in this feature branch or separately approved follow-up, rerun exact-head checks, receive source mergeGO. After merge, green post-mergeCI and exact Lovable sync, request separate frontendPublishGO. Verify actual version/tenpairs/UVs/historicalroutes and no-write behaviour after publication. Source recovery target for this feature is front-only`d054f087fecb384e2d539930b4f37068059e62ce`: separately approved release-only Git revert, frontend rebuild/tests/republish. Lovable cannot redeploy pinned frontend artifacts; bytes/build metadata may differ. Never HistoryRevert, backend rollback or database mutation.

Local validation: full release-check passed83 unit files/646 tests, lint/type/build and public-byte scan890 files. All12 private-artwork Chromium/WebKit cases passed; synthetic CI cases are recorded separately at the exact PR head. Actual transcripts remain unreviewed OCR and native iPhone/VoiceOver remains unverified.

Browser harness note: software-GPU CI bounds continuous whole-Tree drawing while retaining the original renderer and explicitly drawing every reverse texture once. This separates sheet/texture/navigation assertions from native animation/performance proof; no per-test/global budget or behavioural assertion is removed. One initial hosted120s Chromium sheet-tap timeout is retained in the review history, not labelled a clean first run.

Existing front-only239 browser regressions:11/12 passed on the first local run; one Chromium return-to239 startup label missed the existing5s assertion budget. Its unchanged focused rerun passed. No old test assertion or budget was altered. Keep this timing limitation distinct from a proven production defect.
