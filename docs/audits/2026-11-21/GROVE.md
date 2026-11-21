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
