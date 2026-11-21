# Grove privacy remediation — draft, not deployed

Confirmed: broad member SELECT ignores memory visibility; owner SELECT and the
separate media helper can disagree; join resets revoked_at; token previews expose
family details anonymously. #143 already addresses replay: this migration subsumes
that focused fix and adds a shared Grove-row lock for invite/revoke/rotate paths.
Review against #143 rather than applying both blindly.

New policy: private and unknown legacy values = active author only; family_only =
active members/stewards; public = public memory in a public Grove only. Being a
steward does not confer access to Only me. Removed authors lose private access.
Unknown legacy rows are not rewritten. They cannot be edited until an explicit
audience is chosen. Review their intended audience individually, never widen it.

Migration moves legacy capability tokens into a non-client-readable table with
immediate expiry; existing memberships survive. Stewards issue seven-day links,
revoke/rotate, or deliberately reinvite a removed person through separate RPCs.
The public retired token is not usable for redemption. New Grove creation still
works but requires a steward-generated invitation rather than an automatic token.

Photos always upload privately, even for public Grove memories. The signer checks
the session, exact memory audience, author/Grove object prefix, object ownership
and unambiguous binding. Signed URLs remain bearer capabilities for up to 60 seconds;
revocation cannot recall bytes already downloaded. The direct storage read policy
also checks the memory; unsaved photos preview from an in-memory blob.

Release order (separate approvals): deployed-schema/policy inventory and backup;
review migration and all existing storage policies; isolated Supabase integration
and true two-session revoke/redeem races; migration; offering-media redeploy;
frontend publication. Do not deploy this frontend before its RPCs. Do not roll
back to the permissive SELECT or replay path. Forward-fix while keeping data.

IMPORTANT: already-public bucket files cannot be made private by hiding a URL or
changing this signer. Inventory legacy public photos with owner approval, contain
at their current hosts, and arrange reviewed private-object migration separately.
No production records or media inspected in this work. Do not invite real families
until containment and actual deployed policy/storage integration are verified.

Tests: scripts/audit-tests/grove.mjs runs the real initial/stewardship schemas and
new migration in PGlite PostgreSQL with fictional records and session roles. It is
not proof of deployed Supabase, Storage HTTP behaviour or multi-connection locking.
The exact pinned test-engine install/command is in the script header.

Executed results: 25 PostgreSQL role/RLS/media/invitation assertions PASS; full
release-check PASS (88 files / 671 unit tests, lint/typecheck/security/build and
all repository guards). Voice remains blocked through every offered visibility;
non-voice composing remains available with an explicit private default.

Additional boundary found during implementation: the PWA's broad REST and storage
caches could retain private Grove responses across sign-out. Targeted NetworkOnly
rules and a scoped activation cleanup remove only Grove API/private-photo entries;
public trees/map caches remain. Authentication changes clear Grove React Query
caches, and detail query keys include the viewer. The old unexpired-token copying
panel is replaced by steward-issued expiring invitations. Restrictive RLS policies
also block historical permissive-policy bypass; the database fixture intentionally
adds old broad policies and still denies unauthorised text/photo reads.

Final local results: 31 PostgreSQL assertions PASS; 673 unit tests / 89 files and
full release-check PASS. Existing unknown audience values are explicitly tested
as author-only. No physical device or production integration acceptance claimed.

Final security review additionally prevents content-edit ownership transfer and
requires the primary owner for Grove visibility changes. Contributor emails are
column-restricted; author-identity/contact RPCs respect exact memory audiences.
The final database matrix includes expiry, revoked authors, old broad policies,
email denial and delegated-steward ownership/visibility escalation (39 assertions).
A separate read-only-permission CI job runs the pinned PostgreSQL fixture engine;
no hosted database credentials or changed existing workflow triggers are used.

Concurrency gap closed locally: PostgreSQL 17.12 was installed only under /tmp and
started with listen_addresses empty, a mode-0700 Unix socket, and fictional data.
Independent authenticated sessions were observed waiting on actual row locks.
Both revoke-before-redeem and redeem-before-revoke finish with the member revoked.
The new CI job uses pinned PostgreSQL 17.6 in a disposable loopback-only service
and no secrets. This does not substitute for real Supabase Storage/Auth staging.

Latest compatibility check: 675 unit tests PASS and 45 actual PostgreSQL assertions
PASS. Public catalogue songs remain references (never public-uploaded family files).
Public Grove photos also stay in private storage and are signed for anonymous
viewers only when the exact memory AND Grove are explicitly public; private and
ambiguous records still deny them. Existing synthetic contract examples now match
this rule, while actual SQL—not those examples—provides the security evidence.

Final storage rollback boundary: restrictive INSERT/UPDATE policies reject Grove
objects in the public offerings bucket even for an older frontend; otherwise a
record-insert denial would occur too late to prevent a public upload. Removed
members cannot upload or modify Grove objects. Non-Grove Ancient Friends paths
retain their existing public upload / private-owner preview behaviour. The final
matrix has 51 assertions, including these positive and negative upload cases;
independent revoke/redeem races also PASS on PostgreSQL 17.12. Edge module bundle
and the last frontend release-check pass (675 tests) are recorded locally.

Revocation hardening supersedes the earlier 60-second URL approach above: clients
cannot SELECT/sign ANY Grove object directly, including the uploader. Each new
Grove read uses offering-media to authenticate, check the exact memory and object,
and proxy no-store bytes. The frontend uses a browser-local Blob URL and revokes
it on cleanup. No newly minted remote capability can outlive membership. Existing
downloaded bytes and previously minted old URLs cannot be recalled; legacy host
containment remains a separately approved operation. Non-Grove Ancient Friends
owner reads are retained. Latest SQL matrix: 52 assertions PASS; actual revoked
member races PASS. Updated frontend release-check: 678 tests PASS. Both the Edge
service and frontend must be coordinated; old JSON-only clients fail closed during
that upgrade rather than restoring signed-URL fallback.

Final client byte-delivery regression: raster MIME is derived from byte signatures
before creating the browser-local URL (no SVG/HTML MIME is trusted). A real PNG
through the actual reader decodes in Chromium and WebKit in the isolated browser
walkthrough; native iPhone/VoiceOver remain untested. Current unit total: 679.

Final invitation UI acceptance adds four tests: no signed-out detail lookup;
family details only after successful redemption; an honest expired-link state with
Return to my Groves; and no reuse of another account's joined state. The final
frontend release-check passes 683 tests. The actual PostgreSQL matrix remains 52
assertions plus both independent-session revocation orderings. Before rollout,
review legacy public media, old signed capabilities and existing browser drafts;
new written drafts stay in memory, and no existing canonical memory is deleted.
