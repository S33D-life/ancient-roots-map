# Ancient Friends — Deep Ecology & Species Experience Audit

> Long-form synthesis, not an implementation plan. The question underneath every
> section: *"What would make S33D feel like a living ecological intelligence rather
> than a tree app?"*
>
> Companions: `SPECIES_LIBRARY_ARCHITECTURE.md`, `SPECIES_LIBRARY` PRs (#49/#50),
> `ENCOUNTER_ARCHITECTURE_AUDIT.md`, `TETOL_UX_COHERENCE_AUDIT.md`,
> `TETOL_THEME_AUDIT.md`. Reviewed against `main` @ `38cf5782`.

Guiding values held throughout: **wonder, calm, exploration, ecological truthfulness,
softness, mythic atmosphere, field-guide usefulness.** Avoided: encyclopedia-feel,
fantasy overkill, gamified clutter, fake precision, parallel data lanes.

---

## 0. What already exists (so we build on the trunk, not beside it)

A surprising amount of the "living system" is already scaffolded:
- **Exact trunk:** `species_index` + `speciesResolver.ts` (3-tier, GBIF on-ramp).
- **Concept bridge:** `speciesConcepts.ts` + `speciesConceptResolver.ts` (pure, never
  fabricates a key; `concept_exact` ≠ taxonomic exact).
- **Name + lore layers:** `tree_species_names`, `tree_species_lore` — *but siloed to Treeasurus*.
- **Arborium ID:** `idBranches.ts` — a deterministic leaf/bark/bud clue-tree → starter-species slugs.
- **Encounter:** four `tree_checkins` write paths (now converging via `buildCheckinPayload`),
  Skystamp, reflection, location refinement, co-witness sessions.
- **Species loops that already exist (important):** Quest Cave `livingPaths` counts *distinct
  species met* ("Three species met… Twelve Canopies… Twenty-five remembered by name") with
  `speciesMatchers`; `TreeRadio` already takes a `speciesFilter`.
- **Imagery model:** PR #50 types (`speciesMedia.ts`) — keyed to species_key/concept_id/raw label.

So the work is **convergence + deepening of loops that already half-exist**, not invention.

---

## 1. Deep species / encounter audit — the experience arc

The stranger's journey, mapped to what's there today:

| Step | Today | Felt quality |
|------|-------|--------------|
| Encounter a tree | check-in (Quick/ceremonial), map marker | ✅ real, slightly utilitarian |
| Doesn't know species | can type freeform / "unknown" | 🟡 allowed but unguided |
| Begins identification | Arborium ID clue-tree (separate from the tree) | 🔴 **disconnected** from the actual encounter |
| Learns clues | Arborium leaf/bark/bud branches | ✅ calm, but not tied to *this* tree |
| Understands confidence | resolver has exact/fuzzy/unresolved; UI rarely shows it | 🔴 confidence is computed but **invisible** |
| Ecological context | `tree_species_lore` exists | 🔴 only on Treeasurus, not at the encounter |
| Mythology / culture | lore `category` supports it | 🟡 present but not surfaced in the moment |
| Contributes memory/photos | reflection, offerings, encounter photos | ✅ strong |
| Revisits later | check-in status light, presence | ✅ exists |
| Learns seasonality | `season_stage` captured per check-in; blooming clock | 🟡 captured, not *taught* back to the user |
| Joins a species pathway | Quest Cave species-count seals | 🟡 counts species but isn't a *named* pathway per species |

**Shallow today:** identification is a *separate room* (Arborium) from the *encounter* (map/
tree page); confidence is modelled but not shown; lore lives only on Treeasurus.
**Magical already:** the check-in moment (Skystamp, reflection, "the tree was felt"), the
blooming clock, the species-count seals.
**Fragmented:** the same species concept is reached three different ways (Arborium slug,
resolver key, raw label) and they don't visibly connect.
**The missing loop:** *encounter → identify-this-tree → learn → remember on the tree's own
record → revisit and see it deepen.* Today identification doesn't flow back into the encounter.

---

## 2. Tree encounter depth

- **After check-in emotionally:** a warm confirmation + optional reflection + (sometimes) a
  refinement nudge. Good, but **species-blind** — an oak and a yew check-in feel identical.
- **Does species deepen the encounter?** Barely. Species is a label on the card, not a
  felt presence.
- **Distinct across species?** No — same copy, same atmosphere.
- **Opportunities (explore, don't over-build):**
  - Species could lend **one line of ecological poetry** at check-in ("You rest beneath a
    yew — a tree that has likely outlived a dozen human lifetimes."). Sourced from
    `tree_species_lore` (a single short `category: "presence"` entry). High wonder, low cost.
  - Species → **soundscape**: `TreeRadio` already has `speciesFilter`; a species could bias
    ambient sound (birds that favour oaks, wind in pines). Reuse, don't invent.
  - Species → **offerings**: gentle, optional — a yew might invite "a moment of stillness,"
    an apple "a thank-you for fruit." Copy-level, not mechanics.
  - Species → **quests/seasonality**: already counting species; could surface "you've now met
    3 of the 5 native oaks" as a soft pathway prompt.
  - **Caution:** do NOT make species change rules/rewards — keep it atmospheric. Species
    influencing *Hearts* or unlock-gating would tip into gamified clutter.

---

## 3. Arborium evolution audit

Current: calm beginner ID + learning, deterministic clue-tree, starter species ↔ concepts.

**Strength to protect:** it is *calm and exploratory*, not a dashboard. Keep it that way.

**Highest-leverage evolution — connect Arborium to the encounter:**
- "**I found this tree — help me narrow it down**" should be launchable *from a tree page /
  map marker*, pre-seeded with what's known (region, season, any photo), and write its result
  back as a *refinement proposal* (not a silent overwrite). This closes the missing loop in §1.
- Clue comparison (bark/leaf/seed side-by-side) is a natural fit once `speciesMedia` (PR #50)
  has leaf/bark/seed roles — Arborium becomes a **visual** field guide without a rewrite.
- Beginner → intermediate → advanced: layer *depth*, not difficulty — same calm surface, more
  clues revealed as the user goes deeper. Avoid "levels/XP."
- Habitat / mycorrhizal / relationships: **concept-layer learning groups** ("water-loving
  trees", "sacred grove trees") are the right home — these are learning concepts, not taxonomy.

**Keep out:** textbook density, quiz-gamification, dashboard panels. Arborium is a *grove to
wander*, not a course to complete.

---

## 4. Treeasurus evolution audit

- **Too hidden?** Yes — it's the canonical knowledge but only reachable via search/links;
  names + lore tables are read *only* by `use-treeasurus`. It should be the destination every
  species chip, card, and Arborium card *flows toward*.
- **Canonical?** Yes structurally (species_index + names + lore). Emotionally **under-alive** —
  it reads as a record, not a shrine.
- **"Living species shrine" direction (right, if restrained):** a species page = hero image +
  one breath of presence (poetry) + the field-guide clues (leaf/bark/seed) + ecology + lore/
  myth + *who has met this species in S33D* (encounter echoes) + seasonality. The **encounter
  echoes** are what make it *living* — the page grows as people meet the species.
- **Science / lore / myth balance:** keep them **layered and labelled**, never blended into
  one ambiguous voice. Science (GBIF-backed, exact), ecology (habitat/relationships), lore/myth
  (cultural, clearly marked as story). `tree_species_lore.category` already supports this split.
- **Exact vs concept on the page:** exact species pages carry science + precise clues; concept
  pages ("oak") carry the *family feeling* + "which oak might this be?" → links to exact species.

---

## 5. Species Concept Layer review

The concept layer is the system's quiet genius — it lets S33D be *truthful about uncertainty*.

| Concept | Stay a concept? | Why |
|---|---|---|
| oak, willow, pine | **always concept** (genus) unless exact species known | "oak" is dozens of species; collapsing to one is a lie |
| water-loving trees | **always concept** (habitat learning group) | ecological grouping, not taxonomy |
| ancient elders | **always concept** (mythic/learning) | a relationship to age/awe, never a species |
| medicinal trees, sacred grove trees | **always concept** (cultural learning) | cultural lenses, cross-cutting taxonomy |
| English Yew (Taxus baccata) | exact species (has a key) | genuinely one species |

**Risks:** the danger is *fuzzy → fake-exact drift* (a "willow" check-in silently becoming
*Salix alba*). The resolver already guards this (`concept_exact` ≠ exact). The UX must mirror
it: a concept must **look** broad.

**Visual distinction (concept vs exact) — a core recommendation:**
- Exact species: scientific name shown, a precise hero photo, a "verified species" cue.
- Concept: a *softer, plural* treatment — "Oak — a family of trees", a silhouette or collage
  rather than one definitive photo, a "narrow it down →" affordance. Concepts should feel
  like **a doorway**, exact species like **a portrait**.

---

## 6. Species imagery & visual language (philosophy)

Beyond PR #50's metadata — *how species should feel*.

**Identification vs emotion — two image jobs:**
- **Field-guide clarity:** leaf, bark, seed/fruit, silhouette — flat, well-lit, comparable.
  These *identify*. (PR #50 `kind`s cover them.)
- **Presence/hero:** one atmospheric image that carries the species' *character*. This *connects*.

**Visual identity sketches (ecological poetry + field-guide clarity, not fantasy):**
- **Oak** — shelter, community, broad canopy: wide, grounded, dappled light, room beneath.
- **Yew** — threshold, eternity: deep shadow with a single shaft of light; age in the bark.
- **Birch** — pioneer, brightness, beginnings: white bark, high airy light, edge-of-clearing.
- **Pine** — endurance, scent, vertical calm: tall verticals, resin warmth, mountain air.
- **Willow** — water, yielding, grief/comfort: movement, reflection, low over water.

**Hierarchy:** hero (1, presence) → silhouette (recognisable shape) → leaf/bark/seed (ID) →
seasonal set (time) → habitat (place). **Clutter risk:** more than ~5 images per species on one
screen becomes a gallery, not a guide. Show *one hero + the relevant clue*; tuck the rest.

**Seasonality as atmosphere:** the `season_stage` already captured at check-in could pick the
*seasonal* hero (bare/bud/leaf/blossom/fruit) — the same tree page feels different in November
vs May. High wonder, reuses existing data.

---

## 7. TETOL realm relationships

- **Roots / Ancient Friends** is the species realm's home (encounter, map, add-tree).
- **Could realm atmosphere shift by dominant species?** Speculative but evocative: a grove of
  yews could lend the Roots realm a deeper, older accent; a birch stand a brighter one. **Risk:**
  this fights the realm-identity work (Roots = green) and could get noisy. *Recommendation:*
  keep realm identity fixed; let **groves** (not realms) carry species atmosphere.
- **Groves as ecologically distinct places** is the high-leverage idea: a grove's dominant
  species/hive could tint *the grove view* (not the whole realm), giving real "this place feels
  like a pine wood" without breaking navigation. `groveDetection.ts` already has species-aware logic.
- **Species as navigational memory:** "the oak path you walked" — encounters could leave a faint
  species-tinted trail on the map (memory-trail layer exists). Calm, optional.

---

## 8. Map & search experience

- **Confidence legibility (the biggest gap):** the resolver knows exact/fuzzy/unresolved, but
  markers, chips, and the tree card rarely show it. A beginner can't tell a *verified Quercus
  robur* from a *guessed "oak"*. **Tiny, high-leverage:** a quiet confidence cue (a dot, a word)
  on the species chip — "Oak · broad" vs "Pedunculate Oak · verified".
- **Exact vs broad clarity:** same fix — concepts look plural, exact looks precise (see §5).
- **Raw unresolved labels:** handle *gracefully and honestly* — show the raw label as-is with a
  gentle "help identify →", never auto-promote it. (`speciesMedia` raw-label tier supports this.)
- **Encouragement to refine:** the refinement trail + proposal flow exist; the *invitation* is
  weak. A soft "this tree's species is still a guess — refine it?" on under-confident cards.
- **Exploratory search/browse:** searching "oak" should return the concept + member species +
  hives + nearby oaks to *visit* — search as a doorway into the living map, not a list.

---

## 9. Data Commons & research trees

- **Fuzzy imported data:** preserve the source label; resolve *toward* a key only when GBIF
  confidence is defensible (the `gbif-enrich` flow already scores this). Never hard-assert.
- **Unresolved labels:** display the raw label + "imported, unverified" — honest provenance.
- **Low confidence:** show it as *low confidence*, not as fact; route to community refinement.
- **Three truths, kept distinct:** *scientific* (GBIF/exact), *ecological* (habitat/relationships,
  often concept-level), *mythic/cultural* (lore, labelled as story). The UI must never let myth
  read as science or vice-versa — same discipline as §4.

---

## 10. Future systems (speculative — NOT to build now)

Ranked by realism × leverage, honestly:

| Idea | Verdict |
|---|---|
| Species pathways (named journeys: "meet the five native oaks") | 🟢 realistic, high leverage — builds on existing species-count seals |
| Species journals (your encounters per species) | 🟢 realistic — assembles existing check-in data |
| Seasonal hero imagery | 🟢 realistic — reuses `season_stage` + `speciesMedia` |
| Encounter echoes on Treeasurus pages | 🟢 high leverage — makes pages *living* |
| Pollinator / mycorrhizal webs | 🟡 beautiful but data-hungry; concept-level only, slow |
| Grove ecological tinting | 🟡 medium — scope to grove view, not realms |
| Species soundscapes | 🟡 reuse `TreeRadio speciesFilter`; keep subtle |
| Species rarity | 🟠 dangerous — invites collection/gamification; only as *ecological awareness*, never scarcity-points |
| Species-based Hearts / species-gated rewards | 🔴 do not — tips into gamified clutter, distorts the economy |
| Realm atmosphere drift by species | 🔴 fights realm identity + navigation clarity |
| Full "grove intelligence" / ecological guild simulation | 🔴 overbuild; a simulation, not a field guide |

---

## 11. Beginner → expert ecological learning pathway

A *depth gradient*, never difficulty levels or XP:
1. **Notice** — "this is a broad-leaved tree" (concept, no pressure).
2. **Narrow** — Arborium clue-tree from the encounter (leaf/bark) → a likely concept.
3. **Name** — resolve to exact species when clues + photo support it (refinement proposal).
4. **Know** — Treeasurus: ecology, relationships, lore.
5. **Tend** — seasonality, revisits, contributing photos/lore back.
6. **Guide** — help others identify; steward a species pathway.
The same calm surface throughout; depth is *revealed*, not *unlocked*.

---

## 12. Recommendations (tiered)

**Tiny safe PRs (token/read-only, high wonder-per-line):**
1. **Show species confidence** on the tree card / species chip (exact vs broad vs unresolved) — the resolver already computes it.
2. **One line of species presence** at check-in / on the tree card, from `tree_species_lore` (read-only).
3. **Concept vs exact visual cue** (a small "broad" / "verified" tag) — honesty made visible.
4. **Surface `tree_species_lore` beyond Treeasurus** (a read service the tree card + Arborium can call).
5. **Gentle "still a guess — refine?" invitation** on low-confidence species.

**Medium leverage (read-mostly, staged, tested):**
6. Arborium "**identify this tree**" launched from an encounter, writing a refinement *proposal*.
7. Treeasurus **encounter echoes** + hero/clue imagery via `speciesMedia` fallback.
8. **Seasonal hero** selection from `season_stage`.
9. Named **species pathways** built on the existing species-count seals.
10. Search → **concept + members + nearby-to-visit** doorway.

**Dangerous complexity (resist):**
- Species rarity-as-points, species-gated Hearts, realm drift by species, mycorrhizal
  simulation, "grove intelligence" engines, any species mechanic that changes rewards/rules.

---

## 13. Highest-leverage next architectural move

**Make the encounter and the species library one loop.**

Today identification (Arborium), the encounter (map/check-in), the knowledge (Treeasurus), and
the trust trail (refinement) are four separate places. The single move that turns "tree app"
into "living ecological intelligence" is a thin **Species Experience read-service** that, given
a tree (or a raw label), assembles: resolver identity + confidence + concept + names + lore +
imagery (PR #50) + "who has met this species" — and that every surface (tree card, Arborium,
search, Treeasurus, Data Commons) reads from. It writes nothing, invents nothing, and lets
identification *flow back into the encounter* via the existing refinement trail.

That read-service (a few PRs: confidence display → lore-at-encounter → encounter→Arborium→refine
loop) is where wonder and coherence compound. Everything else is decoration on top of it.

> The library grows through encounters; the encounter deepens through the library. Close that
> loop softly, and S33D stops being a tree app and starts being a forest that remembers.
