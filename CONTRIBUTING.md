# Contributing to S33D

Welcome, co-creator 🌱

S33D is a living system. Contributions should feel like tending a garden — small, careful, and intentional.

## Before you start

1. **Read the relevant Skill** — browse `public/skills/SKILL.md` for an overview, then the sub-skill for your area
2. **Run the app locally** — `npm install && npm run dev`
3. **Understand the area** — check the route, components, and hooks involved

## Contribution principles

- **Small changes** — one concern per PR
- **Preserve behaviour** — don't break existing flows
- **Respect the tone** — S33D has a ceremonial, nature-inspired language; keep it
- **Test what matters** — add regression tests for critical paths
- **Run the gate** — `npm run release-check` must pass before merging

## Where to start

| Interest | Start here |
|----------|-----------|
| Map bugs | `src/components/LeafletFallbackMap.tsx`, `src/components/Map.tsx` |
| Tree data | `src/hooks/use-tree-map-data.ts`, `src/utils/externalTreeSources.ts` |
| UI / pages | `src/pages/`, `src/components/` |
| Hearts / rewards | `src/lib/heartService.ts`, `src/utils/issueRewards.ts` |
| Backend | `supabase/functions/`, `supabase/migrations/` |
| Agent tasks | `src/components/agent-garden/` |
| Bug reports | `src/pages/BugGardenPage.tsx` |

## Route registry

All routes are defined in `src/lib/routes.ts`. Use `ROUTES.MAP` instead of `"/map"` in new code.

## Code style

- TypeScript strict mode
- Tailwind semantic tokens (not raw colors)
- Small, focused components
- Hooks for shared logic
- `src/integrations/supabase/types.ts` and `client.ts` are auto-generated — never edit

## Release safety

The `release-check` script runs: typecheck → lint → security → duplicate check → test → build.

Every PR should pass this locally before requesting review.

## Hearts & recognition

Approved contributions earn S33D Hearts — the platform's stewardship currency. Your work is recorded and visible on your Wanderer profile.
