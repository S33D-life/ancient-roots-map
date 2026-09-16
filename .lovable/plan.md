# Ancestral Root handwritten inscriptions V2

## Goal
Let a Grove contributor or steward draw a quiet handwritten mark when creating an Ancestral Root, and let Grove stewards add or replace the mark later — including MAITHE’s existing inscription.

The governing sentence remains: **A Root is the relationship. An Inscription is the mark it leaves.**

## Experience
- Add a touch- and pointer-friendly signature canvas beside the existing short inscription field.
- Keep typed inscription text as the accessible name and fallback; the handwritten mark is optional.
- Provide clear, undo-last-stroke, and redraw controls with comfortable mobile targets.
- Preview the handwritten mark within the Grove’s Root card and on the Ancient Friend’s digital bark.
- Show the handwritten mark in the Ancestral Root portal, with the typed inscription available to assistive technology.
- Add a restrained steward-only “Tend inscription” action so an existing Root such as MAITHE can receive or replace its mark.
- Respect reduced motion and avoid decorative animation on the handwriting itself.

## Authority, privacy, and history
- Store normalized stroke coordinates as bounded JSON data, not as a public image URL. This avoids exposing private marks through public storage links and keeps rendering crisp at different sizes.
- Validate stroke count, point count, coordinate range, and payload size in trusted database functions.
- Root creation remains contributor/steward controlled exactly as today; proposal and Ancient Friend approval states remain unchanged.
- Only Grove stewards may alter an existing inscription or handwritten mark.
- Public Ancient Friend listing returns the mark only for active Roots whose inscription is public; Grove access rules remain authoritative and unchanged.
- Every create/tend action records whether a handwritten mark was supplied or changed in append-only Root history, without copying the private stroke data into history.
- No rewards, balances, offering behavior, or merge authority changes.

## Technical details
- Add a nullable `signature_strokes` JSON column to `grove_roots` with an outer payload constraint.
- Replace the Root creation and tending functions to accept and validate the optional stroke payload while retaining their existing signatures through default parameters.
- Extend safe Root-listing functions to return strokes only under their existing visibility/authority rules.
- Extend repository types and requests.
- Add a focused reusable signature-pad component using pointer events and an SVG renderer; no dependency added.
- Wire creation, steward tending, Grove cards, Ancient Friend bark marks, and the portal.
- Keep merge folding unchanged because the signature remains attached to the preserved Root row; folded inscriptions already remain in history detail.

## Verification
- Database checks: contributor can include a bounded mark; invalid/oversized payload rejected; non-steward cannot tend; steward can add/replace/clear; private mark not returned publicly; inactive mark not shown.
- UI checks on phone and desktop: draw, undo, clear, submit, render in Grove card, bark, and portal; keyboard-accessible controls and typed fallback.
- Run focused tests, then the complete test suite and TypeScript check once.

## Deliberately deferred
Photographic signature uploads, pressure-sensitive brush styling, multi-colour ink, notifications, rewards, and broad inscription archives.
