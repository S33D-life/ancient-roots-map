# 🌳 S33D — Ancient Roots Map

A living atlas of the world's most remarkable trees, built as a participatory stewardship platform.

S33D maps **Ancient Friends** — venerable trees verified by human encounters — and weaves them into a shared economy of care powered by **Hearts**, **Staff NFTs**, and community governance.

## Key areas

| Area | Route | Purpose |
|------|-------|---------|
| **Map** | `/map` | Interactive Leaflet map with tree markers, deep-links, and species layers |
| **Atlas** | `/atlas` | Country portals, bio-regions, and pilgrimage pathways |
| **Library** | `/library` | Heartwood rooms — offerings, stories, staff room, creator's path |
| **Hearth** | `/dashboard` | Personal dashboard — legend, heart balance, streaks |
| **Vault** | `/vault` | Wallet, Staff NFTs, NFTree minting |
| **Council** | `/council-of-life` | Community governance and digital fire votes |
| **Bug Garden** | `/bug-garden` | Bug reports, improvement sparks, and feature requests |
| **Agent Garden** | `/agent-garden` | Tasks for AI agents and external co-creators |
| **Roadmap** | `/roadmap` | Living Forest Roadmap — public development timeline |

## Tech stack

- **Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Edge Functions, Storage)
- **Map:** Leaflet with MarkerCluster
- **Chain:** Base (ethers.js) — Staff NFTs, NFTree minting
- **Testing:** Vitest

## Local setup

```sh
git clone <YOUR_GIT_URL>
cd ancient-roots-map
npm install
npm run dev
```

Requires Node.js 20+.

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (generates version.json) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (run once) |
| `npm run release-check` | **Full pre-publish gate:** typecheck → lint → security → duplicates → test → build |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Quick start:**

1. Pick a task from the [Bug Garden](/bug-garden) or [Agent Garden](/agent-garden)
2. Read the relevant [Skill](/public/skills/SKILL.md) before contributing
3. Make small, focused changes
4. Run `npm run release-check` before opening a PR

## Project structure

```
src/
├── components/     # UI components (map/, tree-sections/, dashboard/, etc.)
├── config/         # App constants and contract config
├── contexts/       # React context providers
├── hooks/          # Custom hooks
├── integrations/   # Supabase client and types (auto-generated — do not edit)
├── lib/            # Shared utilities (routes, heart service, etc.)
├── pages/          # Route page components
├── styles/         # Global CSS and map styles
├── test/           # Vitest test files
└── utils/          # Pure utility functions

public/skills/      # S33D Skills knowledge base (markdown)
supabase/functions/ # Edge Functions
supabase/migrations/# Database migrations
```

## Publish

Open [Lovable](https://lovable.dev/projects/206b4e97-2343-48d0-89b8-f5647bb248f1) → Share → Publish.

Run `npm run release-check` locally first.

## Version metadata

`public/version.json` is generated during build. Verify with:

```sh
npm run build && npm run preview
curl -i http://localhost:4173/version.json
```
