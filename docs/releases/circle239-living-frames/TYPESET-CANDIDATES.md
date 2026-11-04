# Circle 239 corrected reverse folios — 4 November 2026

**Superseded asset gate:** Ed has approved the exact ten images and confirmed rights/public use. See [current release candidate](RELEASE-CANDIDATE.md) and release-receipt.json. Earlier HOLD statements below remain historical evidence. Source merge and publication still require separate explicit GO.

Candidate set `typeset-candidates-v2`; ten 1536×1024 PNGs. This supersedes the original artwork risk findings in REVIEW.md, but does not grant human approval. Original receipt.json and original supplied bytes remain intact. Final proof collection: restricted Drive folder `1jHYaXROcMFgI1Ih4iDCYEjhvjGDUe1g5`; QA file `1Nwa1qGKTpki-rpckE701xGfwKzdMnqTS`.

## Corrections and provenance

The ten new supplied proof hashes were checked against their manifest and dimensions, followed by full-size visual reading. Ginkgo is #5 and Dahlia #6; the source owner JPEG filenames are inverted, so their original filenames AND hashes remain in candidate-receipt.json. Nutcracker #9 uses the new 3:2 owner source, not the old 4:3 reverse. Illustrations are not verified specimens, individual-tree photographs or documented encounters.

Ed authorised deterministic typesetting/compositing. `scripts/prepare-circle239-folios.py` verifies the exact private proof manifest and all PNG hashes; creates new derivatives in a new directory; records Pillow/font hashes, edit rectangles, output hashes and transcript hashes; checks that pixels outside declared edits are unchanged. No supplied proof/front is overwritten, and no font binary is redistributed.

- All ten: replace REVIEW PROOF / NOT LIVE footer with illustration and source credits. Candidate status stays in metadata and local review notice.
- Ginger: replace the remaining root/health-claim banner with an explicitly editorial reflection; restore readable Plant role above Hidden fire.
- Secret Garden: explicitly label the banner EDITORIAL REFLECTION, remove quotation styling and match the body’s editorial sentence. No novel quotation or medical claim is asserted.
- Rosehip: narrow the irritation note to the supported claim without assigning a mechanism or treatment benefit.
- Nutcracker: make Bird role explicit; remove inherited stray lettering from the decorative study crop. This does not alter the approved front portrait. The study is contained without aspect distortion.

## Text / fact / rights review

Each complete card was read at full resolution, including banner, role, essence, body, safety note, reflection and footer. Matching readable transcripts are separately generated from the manually checked header transcription and exact body text. OCR is not treated as approval. A local Vision OCR attempt failed in this environment; that is neither a transcript pass nor a scientific check.

The private candidate manifest carries the exact supporting source URLs for each card, reviewed 4 November 2026. These support bounded claims, not the visual accuracy of generated illustrations:

|Card|Review result / remaining boundary|
|---|---|
|Yew|Churchyard identity retained; no exact measured age. Poisonous foliage/bark/seeds and no-foraging warning. RHS, Ancient Yew Group and MedlinePlus. Generated tree/church study is not documentary evidence.|
|Beech|Fagus sylvatica, grey bark, autumn, mast/wildlife and leaf litter. Forestry England / Woodland Trust. No individual age or human-food recommendation.|
|Ginger|Rhizome (underground stem), not root; limited preparation-specific nausea evidence, no blanket therapeutic promises. RHS / NCCIH. Flower illustration is stylised, not botanical identification.|
|Sycamore|Paired winged fruits containing seeds, dispersal. University College Cork. Council’s Seed role is preserved, without pretending samara is only a naked seed.|
|Ginkgo|Seed coat is not botanical fruit. Explicit serious toxicity even after cooking; do not eat. Kew / NCCIH / Hong Kong Centre for Food Safety. “Living fossil” is editorial shorthand for lineage, not an unchanged individual species through deep time.|
|Dahlia|Tubers, variety, open-centred vs double pollinator access. RHS. No edible-tuber or medicinal recommendation.|
|Rosehip|Post-flower hips, wildlife, variable vitamin C; irritant hairs. Cambridge University Botanic Garden / Woodland Trust. No treatment/harvest instruction.|
|Fly Agaric|Poisonous, not food/remedies; no preparation/dose. Ectomycorrhizal partnership. FDA / Manaaki Whenua. FDA is a safety source, not a UK legal classification. Broad cultural prose remains an editorial description, not a documented ceremony.|
|Nutcracker|Seed caching can contribute to new trees. Swiss Ornithological Institute. No precise subspecies, sighting, place or universal germination guarantee. Owner-selected Council identity preserved.|
|Secret Garden|Burnett’s 1911 novel and literary garden/renewal theme. Original work via Project Gutenberg. Editorial banner is NOT a quotation; no nature-cures-illness promise. US public-domain status does not clear all worldwide artwork rights.|

**Human visual/editorial/rights approval remains pending for all ten.** Owner-provided AI artwork provenance is recorded, not converted into a legal clearance assertion. No asset approval is inferred from CI. Public catalogue stays HOLD, factReviewed:false, rightsApproved:false, no image URL or transcript. No candidate PNG or raw transcript is committed or included in dist. This is the QA checklist’s explicit private-proof gate, not a new release process.

## Reproduction / private review

```
python3 scripts/prepare-circle239-folios.py /absolute/proofs /absolute/new-candidates
npm run build
node scripts/review-circle239-living-frames.mjs /absolute/new-candidates 4270
```

Requires Pillow 11.3.0 and the recorded macOS Georgia font files. Exact resulting hashes are in candidate-receipt.json. The viewer accepts only a pinned known receipt and verifies each image plus candidate transcript digest before listening. Older intake remains separately reproducible using receipt.json. Loopback only, GET/HEAD only, external connections/forms/workers blocked. No LAN/Serve/Funnel exposure.

Open `/council/239?review239=1` or `/tetol/circle-235/pre-fire/tetol.html?circle=239&review239=1#croom` on that local origin. All ten final candidates use the existing shared front/reverse control in 2D and the original 3D sheet and scene. No new renderer, camera, backing, cord or history changes.

## Approval card

Engineering and candidate-content review are reviewable; **source merge and publication remain separate human GOs**. Public release is HOLD pending final exact-artwork approval, rights attestation and native-device acceptance/explicit limitation decision. No automatic promotion of the held catalogue. Once approved, the exact PNGs and matching transcripts must be narrowly admitted to the public catalogue, checked again, and reviewed before source merge; this is not a deploy-ready asset bundle yet.

Native iPhone Safari/VoiceOver remains unverified: all ten 2D/3D front/back pairs; focus/announcements; readable text; full-image zoom; toolbar/safe-area/orientation; reduced motion; #grab and camera gestures; refresh/Back/Forward; return/current/238–234/Staff Room; fire:null and no writes. Existing 390px spatial camera side-edge clipping remains; sheet containment/full-image link do not fix it. No broad camera redesign is bundled.

Recovery remains the separately approved source-based return to front-only d054f087fecb384e2d539930b4f37068059e62ce followed by frontend rebuild/tests/republish. This is not a demonstrated pinned-artifact restore. Never History Revert or backend rollback. Stale-shell investigation remains separate in STALE-SHELL-READONLY.md.

## Local validation receipt (candidate revision)

- Full `npm run release-check`: PASS, 83 files / 647 unit tests, lint/typecheck/security/static/asset/build gates.
- Actual ten private candidate PNGs + matching transcripts: Chromium 6/6 and WebKit 6/6 PASS, including original 3D texture draws, containment/UVs, refresh/history/Staff Room and no scheduled Fire.
- First browser run: 10 passed / 2 failed because an old test asserted PRIVATE DRAFT while the new notice correctly read PRIVATE CANDIDATE. Replaced the prefix check with a stronger exact complete-transcript assertion; unchanged behavioural coverage/budgets; full rerun 12/12 passed.
- Public-byte privacy scan: PASS, 890 files; no reverse PNGs in public/dist. Original front manifest digest unchanged.
- Deterministic second rendering: all ten PNG SHA-256 values exactly match. Original proof bytes remain hash-pinned; edits outside declared masks: zero.
- Hosted CI at the resulting exact commit is reported separately; local green is not hosted or native-device acceptance.
