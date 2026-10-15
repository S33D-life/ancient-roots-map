# TETOL Staff Room · restoration (15 Oct 2026)

**Branch:** `claude/tetol-staffroom-restore`, from main `df9041d8`. Local only: not pushed, not merged, not published.
**Principle:** preserve first, weave second, improve third.

## What broke

The doorway "Step inside the Staff Room" showed on the Tree but did nothing. The console read `[interior] not available: staffroom`.

1. **The address stopped being swapped.** In the original single-file bundle (TETOL 0.9.11 → 0.9.14-dev, and the first hosted copy, `f1db32bf`, 6 Oct), `window.STAFFROOM_URL="5eaf7c1e-…"` sat inside the bundle's inline template. The loader replaced every asset id in that template with a `blob:` URL, so the line became a playable address.
2. **Release `ce9bab52` (7 Oct, "open Circle 235 through Council and TETOL")** moved the inline scripts into `runtime/*.js` so they would run under the site's `script-src 'self'`. That was correct for the Tree, but the loader's swap only touches the template. `STAFFROOM_URL` stayed a bare id, and `open()` accepts only `blob:` addresses, so it refused every time.
3. **Simply re-minting a `blob:` URL would not fix it.** Two experiments showed this:
   - Under the production CSP (`public/_headers`: `default-src 'self'`), the browser refuses to frame a `blob:` page.
   - Without the CSP, the room loads but three.js fails. Its import map pins integrity hashes for the original unpkg files, and the vendored copies have rewritten import paths, so the hashes no longer match.

The room itself was never lost. Asset `5eaf7c1e-…` is still in the hosted bundle, byte-identical to TETOL 0.9.14-dev (sha256 `05fea9eb…77c1ab`).

## How it was recovered

**`scripts/tetol-staffroom.mjs`** (`npm run tetol:staffroom`, with `--check`) builds the room as an ordinary same-origin page:
- It reads the preserved interior from the bundle and refuses to run if the bytes are not the original.
- It writes `staffroom.html` plus `runtime/staffroom/1–5-*.js`. Each script is moved out unchanged, with only the mechanical changes the CSP requires:
  - the import-map injector is removed;
  - bare `three` specifiers point at the vendored copy already beside TETOL;
  - one inline `onerror` becomes `data-ph-fallback`.

**`runtime/staffroom/weave.js`** is small, hand-written and separate from the preserved room. It only adds:
- a link from each staff panel to its canonical record, `/staff/<code>`;
- the 2D Staff Room in place of the Library Index's dead link to an earlier design file;
- the photograph fallback;
- arrival at one staff from `#record=<code>`.

**`runtime/classic-1.js`** (the interior bridge):
- `STAFFROOM_URL="./staffroom.html"`.
- `open()` also accepts a same-origin page in the TETOL folder.
- Deep links `#route=/staff/<code>` open the room at that staff, including through the door-crossing animation (it now passes the staff along).
- While the room is open, the address follows the selected staff, so the browser's Back from a 2D record returns to the same staff. Leaving restores the Tree's address.
- The floating "Return to Council of Life" and design badge are hidden while inside; the room's own ← returns to the Tree.

**The 2D app** (two links, one helper `src/lib/tetolStaffRoom.ts`):
- `/library/staff-room` gets "Step inside the 3D Staff Room".
- `/staff/:code` gets "Meet this staff in the 3D Staff Room".

## What is preserved, and what is not invented

- The roundhouse, Spiral, the 36 framed NFT portraits on the wall, the hearth, lighting, arrival, the Library view, the Founding 144 lens, the Library Index, and the root passage to Heartwood are all unchanged.
- Staff identities come only from the room's sourced collection. The tests prove that its 144 founding records are exactly the 2D app's 144 codes.
- Oak and Yew Circle 4 are Notion records with unresolved lineage. They get an honest note and no record link.
- **NFT portraits.** The room loads them from IPFS (CID `bafybeifhx…be6hq`, token 1–36 in contract order). Until an image arrives, the room shows its own plate: token number, species code, "ANCIENT FRIENDS". No replacement artwork has been made.

## Tests

- **`src/tests/tetolStaffRoom.test.ts`:**
  - the generated files are up to date;
  - no inline script, handler or import map remains;
  - no bare `three` specifier remains;
  - the bridge points at the page;
  - all 144 codes round-trip between the 2D app and the room, through both mappings;
  - unresolved staffs get no record;
  - the 2D doorway links are correct.
- **Playwright** (local harness, Chromium with software WebGL, production CSP):
  - before and after at the doorway;
  - full journey on desktop 1440 × 900 and iPhone 13 emulation;
  - real pointer and touch activation from the Tree's List view and the mobile sheet.

## Known limits

- **Not measured on real hardware.** The sandbox renders WebGL in software, at a few frames per second, so performance and Safari behaviour need Ed's iPhone. Screenshot runs use reduced motion and settle CSS transitions instantly. The deep-link test also passed once with full motion.
- **Portraits could not be loaded here.** IPFS, Drive and Notion are blocked in the sandbox. Whether pinata serves the 36 portraits, and serves them with CORS, must be checked on a device.
- **Token numbering mismatch (pre-existing, needs a decision).** The 2D Staff Room numbers tokens in spiral order (YEW = Token #001). The contract metadata order in `SPECIES_CODES`, which the room also uses, starts GOA = 1. One of them shows the wrong NFT. This branch changes neither.
- **Hard to find on mobile.** At the whole-Tree view the Staff Room has no visible label. A visitor reaches it through TETOL → List → a Staff place → expand the sheet. On the Tree, the floating "Return to Council of Life" overlaps sheet text (pre-existing).
- **Circle 235 wording.** The Tree's welcome card still says Circle 235 is open now (the known Circle 236 P0, Codex's).
