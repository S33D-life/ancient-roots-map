# Root Types V2

## Goal
Make `family`, `birth`, `union`, and `community` fully usable relationship types in the existing Grove ↔ Ancient Friend Root journey. Preserve the source of truth: **A Root is the relationship. An Inscription is the mark it leaves.**

## Build
- Add a clear relationship-type choice to the existing Root creation/suggestion dialog, with restrained, context-sensitive language for each type.
- Carry the chosen type through the existing trusted creation function; validate the supported public types server-side rather than relying on the browser.
- Return `root_type` from the safe Grove and Ancient Friend listing functions so every approved Root keeps its meaning wherever it appears.
- Show a quiet type label on Grove Root cards, Ancient Friend bark marks, approval rows, and the Root portal without changing disclosure or entry permissions.
- Keep one live Root relationship per Grove–Ancient Friend pair; the selected type characterises that relationship rather than creating duplicate parallel Roots.
- Keep contributor proposals, steward acceptance, Ancient Friend approval, removal history, handwritten inscriptions, privacy, merge folding, and no-reward behavior unchanged.

## Technical details
- Add a focused additive migration replacing the relevant function return signatures to include `root_type`, with existing grants preserved.
- Add a shared typed Root-type vocabulary in the repository layer and use it in both Root surfaces.
- Update focused tests for type labels and request payloads, then run typecheck, the complete unit suite, and phone-sized browser checks of creation and Ancient Friend display where available.

## Deliberately excluded
- The reserved `other` type remains unavailable in the UI because it needs its own naming/content decision.
- No notifications, new rewards, new authority roles, signature changes, or broader Life Grove redesign.
