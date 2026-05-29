# TETOL Light/Dark Colour & Typography Audit

> Audit of the felt experience — colour, contrast, text hierarchy, atmosphere —
> across light/dark modes. **Audit-first. No redesign, no new visual language.**
> Preserve the S33D soul; only propose changes that make the tree feel *calmer,
> clearer, more alive*.

Reviewed against `main` @ `c4de3dc0`. Method: token-level audit of `src/index.css`
+ `tailwind.config.ts` + component usage (not a per-pixel live capture of each route —
findings are grounded in the design tokens and how components consume them).

---

## 1. Current colour system map

**Fonts** (`tailwind.config.ts`): `serif: Cinzel` (display) · `sans: Inter` (body).
`h1–h6` are forced to **Cinzel + `color: hsl(var(--primary))`** (every heading is the
primary hue). `body` is Inter.

**Dark (`:root` = `.dark`) — "Ancient forest mystical"** (HSL):
| token | value | reads as |
|---|---|---|
| background | `80 15% 10%` | near-black olive |
| foreground | `45 100% 85%` | **bright gold** (all body text) |
| card / card-fg | `75 20% 12%` / `45 95% 80%` | dark olive / gold |
| primary | `42 95% 55%` | golden amber |
| accent | `45 100% 60%` | bright gold |
| secondary | `78 18% 18%` | deep forest |
| muted-foreground | `45 40% 60%` | dim gold (secondary text) |
| border | `42 60% 35%` | gold-bronze |

**Light (`.light`) — "Botanical Parchment"**:
| token | value | reads as |
|---|---|---|
| background | `38 35% 95%` | warm parchment |
| foreground | `30 18% 18%` | dark brown ink |
| primary | `35 65% 35%` | botanical ink |
| accent | `45 55% 42%` | moss-gold |
| secondary | `90 14% 90%` | soft sage |
| muted-foreground | `30 14% 42%` | warm grey-brown |
| + `--elevation-low/mid/high`, `--surface-glow`, `--atmosphere-bg` | (light only) | depth + luminous bg |

**Per-realm `--level-accent`** (the realm identity system):
| realm | dark | light |
|---|---|---|
| s33d | `42 95% 55%` gold | (—) |
| roots | `120 45% 45%` green | `120 35% 32%` green |
| heartwood | `28 70% 50%` amber | `30 50% 38%` amber |
| canopy | `195 60% 50%` **sky-blue** | `150 35% 35%` **green** ⚠ |
| crown | `45 100% 60%` gold | `42 65% 42%` gold |
| hearth | `15 80% 55%` orange | `18 55% 42%` orange |

---

## 2. Light mode issues

- 🟢 **It feels intentional, not accidental** — a dedicated parchment palette + elevation
  tokens + `--atmosphere-bg` + per-realm light overrides. This is a strength to protect.
- 🟡 **Primary `35 65% 35%` is quite dark** — strong as ink, but as a *button* fill with
  `--primary-foreground 38 40% 97%` it's high-contrast/heavy; large gold buttons can feel
  weightier than the calm parchment around them.
- 🟡 **Gold accents lose their glow** — `--glow-sacred`/`--glow-subtle` are near-invisible in
  light (by design), so "sacred" moments that rely on glow in dark fall flat in light with
  nothing replacing them.
- 🟢 **Contrast is healthy** — brown ink on parchment is comfortable, warm, legible.

## 3. Dark mode issues

- 🟡 **Gold-dominant to the point of flattening** — foreground, all headings, primary, accent,
  and card-foreground are all the same 42–45 gold family. "Magical," but long passages of
  fully-saturated gold body text (`45 100% 85%`) read as slightly *muddy*/glowy rather than
  crisp, and they drown realm distinction.
- 🔴 **Dark loses the elevation system** — `--elevation-*` / `--surface-glow` are defined
  **only** in `.light`, but `src/components/ui/button.tsx` consumes them. In dark those vars
  are undefined → buttons (and anything using them) render **flat / shadowless**. Dark feels
  less dimensional than light, the opposite of intended.
- 🟡 **Secondary text borderline** — `muted-foreground 45 40% 60%` on card `75 20% 12%` is a
  dim desaturated gold; fine for large text, tight for 10–11px microcopy (of which there is a lot).
- 🟢 **The atmosphere is genuinely magical** — the deep olive + amber world is the soul;
  the fix is clarity *within* it, not replacing it.

## 4. Typography hierarchy issues

- 🟡 **Cinzel is everywhere** — `font-serif` appears **~5,725×** across components/pages,
  including tiny utility text (`text-[10px] font-serif`, uppercase + wide tracking). Cinzel is
  a *display* serif; at ≤12px with letter-spacing it is the single biggest **mobile legibility**
  drag. Ceremony is right for titles; microcopy wants Inter.
- 🟡 **Every heading is gold** — `h1–h6 { color: hsl(var(--primary)) }` means headings never
  carry realm identity and add to gold-dominance in dark.
- 🟡 **Weak mid-hierarchy** — with Cinzel for both titles and labels and gold for both
  headings and body, the size/colour gap between "title / section label / body / microcopy"
  is compressed; scanning relies on size alone.
- 🟢 **Two-font system is sound** — Cinzel + Inter is a good pairing; the issue is *where* each
  is applied, not the choice.

## 5. Top 10 tiny visual wins (token/class-level, soul-preserving)

1. 🔴 **Define `--elevation-*`, `--surface-glow` in dark too** (in `:root`/`.dark`, tuned for
   dark) so `button.tsx` regains depth in dark. Highest-leverage, fixes a real gap.
2. 🟡 **Unify the canopy hue across modes** — pick one identity (recommend sky-blue both, or
   green both); today canopy is blue in dark, green in light. One/two token edits.
3. 🟡 **Nudge dark `muted-foreground` `45 40% 60%` → ~`45 35% 66%`** for AA-comfortable microcopy
   without losing the gold cast.
4. 🟡 **Allow headings to inherit `--level-accent`** where a realm is active (opt-in class),
   instead of always `--primary` — gives Roots/Canopy/Crown felt identity.
5. 🟡 **Soften dark body foreground for dense text** — introduce a `--foreground-soft`
   (e.g. `45 60% 88%`, less saturated) for long paragraphs; keep gold for headings/accents.
6. 🟡 **Demote Cinzel below ~12px** — a `.text-microcopy` utility (Inter, normal tracking) for
   the smallest labels; apply incrementally, highest-traffic screens first.
7. 🟢 **Light-mode "sacred" substitute** — a subtle warm ring/underline token to replace the
   invisible glow so ceremonial moments still register in light.
8. 🟡 **Primary-button weight in light** — slightly lift `--primary` lightness for fills (or use
   a dedicated `--primary-soft`) so big buttons sit calmer on parchment.
9. 🟢 **Tighten heading letter-spacing on mobile** — `0.05em` Cinzel caps at small sizes hurts
   legibility; reduce tracking under `sm`.
10. 🟢 **Document the realm accent contract** — a short note so new components reach for
    `--level-accent` instead of hardcoding gold (prevents future drift).

## 6. Top 5 deeper theme-token recommendations

1. **A complete dark elevation/atmosphere layer** mirroring light's (`--elevation-*`,
   `--surface-glow`, `--atmosphere-bg` for dark) so both modes share one depth language.
2. **A foreground scale, not a single gold** — `--foreground` (headings/emphasis, gold) +
   `--foreground-soft` (body) + `--foreground-muted` (microcopy), tuned per mode. Resolves the
   "magical vs muddy" tension by reserving full gold for emphasis.
3. **Make `--level-accent` load-bearing** — adopt it in headers, section rules, active-nav,
   and realm landings so Roots/Trunk/Canopy/Crown are *felt* in colour, not just motion.
   (Pairs directly with the TETOL UX coherence audit.)
4. **A typography scale contract** — Cinzel for display (`≥` section titles), Inter for body +
   microcopy; encode as `.font-display` / default sans, retire blanket `font-serif` on utility text.
5. **Per-mode glow/atmosphere parity** — a shared `--accent-halo` that renders as glow in dark
   and as a soft warm tint/underline in light, so "sacred" reads in both.

## 7. What NOT to change

- ❌ The deep-olive + amber **dark soul** — keep the mystical world; refine clarity within it.
- ❌ The **botanical parchment** light palette — it's intentional and working.
- ❌ The **Cinzel + Inter** pairing — keep both; only re-scope *where* each applies.
- ❌ Don't flip to a generic high-contrast/neutral "modern app" theme.
- ❌ Don't desaturate the gold into beige, or recolour realms into a generic palette.
- ❌ No mass `font-serif → sans` find/replace (5,725 sites) — incremental, per-surface only.

## 8. Suggested smallest first PR

**Define the elevation/surface tokens in dark mode** (win #1): add `--elevation-low/mid/high`,
`--surface-glow` (and optionally a dark `--atmosphere-bg`) to `:root`/`.dark` in `src/index.css`,
tuned for a dark surface. This is the smallest change with the clearest payoff: `button.tsx`
already references these, so dark buttons/cards immediately regain the depth light already has —
no component edits, no new visual language, fully reversible, soul intact.

Optional pairing in the same tiny PR (or the next): unify the **canopy hue** across modes (win #2)
— a one-line token alignment.

> Verification when implemented: `typecheck / lint / test / build / e2e -- smoke`, plus a manual
> light/dark pass on `/`, `/map`, `/library`, `/library/arborium`, `/council`, `/golden-dream`,
> `/tree/:id`. Audit only for now.
