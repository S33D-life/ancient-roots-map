# Roots #101 — current-main reconciliation and permission audit

Source of truth read first: Notion Current Priorities (15 Oct live parallel checkpoint, edited19:38UTC), Life Groves; PR101 latest19:37UTC handoff. Main verified/fetched e2164fba3cbed90d8de586125b0196f431a80bd3. Current priorities explicitly defer Support outreach and blind deployment; old receipts do not override that.

## Isolated source
Original PR101 head9fcf4ec2d3148823914941c0a0a4162a8cada965 and checkpoint70322bf3 unchanged. New local codex/ancestral-roots-main-reconcile-20261015 starts currentmain; replays70322bf3 and9fcf4ec2 as919eeb37 and4eeb57dc without conflicts. Preserves merged Staff/Circle/Ely code. No push/merge/publication authorised or performed. No supabase, backend, auth configuration, storage, family data, Ely ID or invitation writes.

## Narrow new frontend correction
AncestralInscriptions and use-tree-inscriptions now recheck marks/Grove on mount and suppress cached marks/content during refresh or after errors. Missing Grove rows show unavailable, not endless Opening. Do not fetch offerings until the refreshed Grove row is permitted. Hide stale offering results during refresh/error. Pending-tree review cache includes viewer identity; authority refresh/error does not leave old review controls visible.

Regression: seeded a previously cached private Grove, then denied its next read. Before repair the test failed: old content could remain open. After repair both rejected and null responses remain unavailable without offering queries. Successful fresh Grove read still opens; public denied mark/forged ID/legacy/context tests retained. No claim that this closes every auth/media lifecycle issue.

## Live read-only evidence (no family rows)
Retrieved pg_get_functiondef for list_tree_inscriptions, can_view_life_grove, contributor/steward helpers, can_view_life_grove_offering, legacy invite lookup and join. Retrieved relevant pg_policies and offerings-private public=false. These are actual live definitions/config, not deployed Edge source or end-to-end role acceptance. Receipts preserved privately outside source. No invocation of join/invite/approval/media signing, no real record/media read.

| Viewer/path | Current live definition | Remaining gate |
|---|---|---|
| Anonymous | active public marks; names/title/dedication only named disclosure; members_only entry denied | consented anonymous/direct-media runtime test |
| Unrelated signed-in | no contributor-based private entry | real two-account isolation and logout/cache test |
| Owner / active steward | contributor helper grants Grove rights | demonstrate intended offering-level visibility |
| Active invited member | contributor helper grants all Grove offering rows, regardless individual visibility | private-vs-family semantics must be approved or repaired separately |
| Revoked member | revoked_at excludes ordinary membership | valid shared invite token can rejoin and clear revoked_at; do not treat membership revocation alone as durable |
| Revoked author | SELECT/media helper still allows author's own offerings | confirm withdrawal semantics; not an accidental new Roots permission |
| Tree keeper | Root authority is distinct from Grove contributor | verify keeper cannot view private family media |
| Legacy invite holder | lookup returns Grove title/name/story_intro by token, no expiry check in that function | consented preview disclosure and expiry/rotation requirements |

## Specific HOLD findings
1. join_life_grove_with_token authenticates but ON CONFLICT clears revoked_at; existing InvitePage auto-invokes on signed-in navigation. Do not visit real invite URLs during read-only testing. Need separately approved invite/revocation design and non-sensitive fixtures; no backend patch included.
2. Existing SELECT and can_view_life_grove_offering grant members all Grove offerings; visibility=private is not author-only under those branches. Decide intended personal-vs-shared semantics before real pilot.
3. useCurrentUser caches viewer up to10minutes without an auth-event subscription in that hook. Account-scoped Roots keys alone do not independently prove immediate sign-out/account-change clearance. Global auth hook was deliberately not changed in this bounded patch; requires explicit scoped follow-up and lifecycle tests.
4. Repo offering-media authenticates, checks offering authorization and issues a10minute signed URL. Actual deployed bytes, borrowed/signed URL expiry/revocation and historical public-media exposure are unverified. No legacy-media migration performed.
5. Backup/export+restore and real iPhone acceptance remain unverified. Fictional preview is not family acceptance.

## Next safe stages
- Independently review this local reconciliation + cache patch; approve a review-branch push separately if desired. PR101 remote remains unchanged, so its existing green CI is historical evidence only for9fcf4ec2.
- Physical iPhone fictional member/outsider journey, then separately authorise consented non-sensitive account/assets test fixtures (anonymous/outsider/invited/steward/keeper/revoked). No grandmother material or cousin invites.
- Resolve invitation renewal, individual-private visibility, auth cache and signed-media/recovery gates before any real family pilot. Production schema/function changes require their own reviewed approval.
- No automatic Ely Root. No notifications, spatial Life Groves or second storage model. Issue103 remains separate and no Support contact is requested.

Decision: prepared for independent local review / fictional testing; NO-GO for real family sharing or production release.
