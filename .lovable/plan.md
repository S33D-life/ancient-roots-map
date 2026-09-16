# Small usability and reliability pass

## Shortlist

| Opportunity | User experience | Journey | Benefit | Effort / risk |
|---|---|---|---|---|
| Distinguish tree fetch failure from missing tree | A temporary network failure currently looks like a permanently missing Ancient Friend | Opening a tree | Clear retry instead of a misleading dead end | Small / low |
| Recover Shared Encounters | A transient query failure silently removes the entire section | Tree → Encounters | Users can understand and retry the failure | Small / low |
| Preserve selected tree section in the URL | Switching Overview, Encounters, or Memory is not reflected in the link | Tree exploration and sharing | Back/forward, refresh, and copied links retain context | Small / low |
| Standardise curator review Back | A directly opened review page can exit the app or go nowhere | Curator location review | Reliable fallback to the curator queue | Small / low |
| Improve Shared Encounters disclosure semantics | Expand/collapse control lacks explicit expanded/target state | Tree → Encounters | Better screen-reader clarity | Tiny / low |
| Eligibility lookup recovery | A failed permission lookup can make editing disappear | Tree → Encounters → edit | Avoid a silent missing action | Medium / medium; defer unless naturally covered |
| Mobile bottom spacing audit | Some pages may sit close to fixed navigation | General mobile use | Prevent obscured final actions | Broad verification surface; defer |
| Species Hearts background check-in mismatch | Background canopy check-ins omit Species Hearts while manual reward paths include them | Presence rewards | Consistent earning | Reward/backend behavior; separate follow-up |

## Selected implementation

1. Add explicit tree-load error state and retry while retaining the true not-found state.
2. Add recoverable Shared Encounters failure UI and accessible expand/collapse state.
3. Synchronise the selected tree section with the existing `tab` URL parameter without adding history noise.
4. Replace the curator review page's bare history navigation with the shared Back control and a safe curator-queue fallback.

## Verification

- Phone-sized browser checks for tree fetch/retry presentation, Encounters expansion, URL tab persistence, and direct-link Back fallback.
- Focused source checks for unchanged editing permissions and TreeChangeFlow reuse.
- Run the existing test suite and TypeScript check once after the final batch.

## Deferred

Species Hearts remains a separate reward-path issue: the background canopy-checkin path omits fractal rewards. Fixing it requires server-side reward source-of-truth decisions and is outside this low-risk batch.
