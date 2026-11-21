# Published Circle sync

Baseline already contains the 21 November connector fix (3eefabe):
get_current_circle fetches the public Time Tree and matching catalogue instead of
trusting the stale bundled 235 projection. No duplicate connector is introduced.

Remaining confirmed mismatch: the default original TETOL entry (no circle query)
chooses 235, while the Council page hardcodes 241. This draft adds one validated
published-selector module, uses it in the current Council card and connector, and
makes the original entry resolve the published selector before loading an edition.
Explicit historical queries remain explicit. Missing/contradictory selection
fails closed rather than showing an old edition as current. Historical content,
images, transcripts, Fire records, and the renderer are untouched.

Source schedule: Circle 241 is 16–22 November 2026; ten companions; Fire null.
Tests use a fictional 242 selector/catalogue to demonstrate all three selectors
follow the same change. This is not a new real edition or artwork activation;
a future spatial edition still requires its own approved adapter/assets.

Deployment gates: frontend publish for page/default TETOL changes; separate MCP
function redeploy for generated connector bundle. Neither was performed. A source
merge alone does not prove the deployed MCP or web site is current. Verify both
published time-tree/catalogue and get_current_circle after separately approved
releases. Keep explicit 234–241 history URLs, original Tree and Staff Room checks.

Executed: full release-check PASS (88 files / 667 tests). Chromium and WebKit
against the local production build PASS: Council 241; default original TETOL 241;
explicit original TETOL 240/239/235 and Time Tree remain available. Historical 235
Canopy links are explicitly pinned before changing the no-query default.

Live read-only recheck: main remains 3f342de; public version remains a8cc42b;
public Time Tree selects 241 and live catalogue has ten companions and Fire null;
S33D MCP get_current_circle still returns 235. Thus local PASS, deployment PENDING.
No public, backend or historical record changes executed.

Additional final acceptance: Chromium and WebKit both PASS the historical Circle
237 Canopy-to-spatial study and all ten simulated-touch frame encounters (2 tests,
13.8s). The only old browser assertion changed pins the explicit historical 235
link now that an omitted edition means published current. Both engines also PASS
the default 242 synthetic-adapter fixture. No physical iPhone/VoiceOver pass is
claimed. All actual 234–241 catalogue/image/transcript bytes remain unchanged.
