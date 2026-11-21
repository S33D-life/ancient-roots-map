# £33 first-wave fulfilment — draft, no real invitations

Approved offer: one year of S33D access including a private Life Grove and Founding
Grove recognition. An account is required; invitations planned from 21 December
2026. Activation starts the year. The map remains free. No checkout/Hearts added.

This draft reuses AuthPage, existing account invitation codes, Grove creation,
private composer, membership controls and offering-media. A service-role-only
manual issuance RPC records a backer reference, invited email, hashed random token,
opening date and expiry. It sends nothing. Activation requires a confirmed matching
account, locks the invitation, and creates one entitlement/Grove atomically. Repeat
activation returns the same ID and dates, including after the invitation expires.
Existing free Groves and contents are not changed or gated.

NEW ACCOUNT DEPENDENCY: S33D currently requires a general account invitation.
For the first wave, a maintainer must create one through the existing invitation
flow, then send ONE manually composed link:
`/founding-grove/activate/<private-token>?invite=<existing-account-invite-code>`.
The page forwards that account code and an internal returnTo through existing Auth.
Existing accounts can omit the account code. Do not send either secret into logs,
GitHub, analytics, or campaign copy. Test the real email-confirmation return path
on an isolated Supabase project before inviting families; mocks are not that proof.
No parallel signup system or bypass of account invitation policy is introduced.

Export: owner-authorised RPC returns only memories the owner can actually read;
another author's Only me text/photo stays excluded. The browser fetches each photo
through the exact-memory signer and makes a portable tar containing memories.json
and original photo bytes. It removes remote media references. If any photo fails,
no partial download is offered. A 100 MiB browser-memory limit fails explicitly;
larger exports need a reviewed steward-assisted path, not silent omissions.

Executed fictional walkthrough: invitation issued; account confirmed; early/wrong
account activation denied; test opening date advanced in the isolated fixture;
activation succeeds; repeat activation preserves entitlement/end date; first
private photo memory created; owner export permitted, foreign owner denied.
Actual sample tar inspected with Python tarfile: memories.json plus one 68-byte
PNG; PNG SHA-256 4c5d573cfb85b8ab0a5659062b830a058d1a449e51a6d79c13b483a77ea7ed28.
Only fictional content was downloaded. No real family media accessed.

Open owner decisions: renewal price; post-expiry access; duration of Founding status
after year one. This draft records recognition and the paid-year dates but performs
NO expiry-triggered deletion, membership revocation, renewal, or perpetual-status
promise. Ratify these terms before a fulfilment launch; this implementation does
not choose them. Website copy is a source proposal, not a campaign edit/publication.

Order: lock #149 -> Grove boundary #150 -> reviewed founding migration -> deployed
media function and isolated end-to-end acceptance -> frontend release -> explicit
first-wave invitation GO. Backend/permissions/deployment remain separate approvals.
Rollback: preserve issued entitlements and dates; disable issuance/activation if
needed, retain authenticated read/export, and forward-fix. Never delete existing
free Groves or reset activated years. No migration/deployment executed live.

Local release-check passed: 90 files / 677 unit tests before the final Grove cache
patch was inherited. Final integrated results are recorded below after revalidation.
PGlite is a single PostgreSQL engine: repeat claims are tested, true independent
connection races and actual Storage/Auth HTTP still require isolated staging.

Email-confirmation continuity: the existing AuthPage now keeps a strictly validated
Founding activation return path and the paired account invitation in confirmation
and resend destinations. Ordinary signup still uses /welcome. No alternate Auth
backend or client-side identity authority is added. Both new/existing account
routing and denied acknowledgements have mocked regression tests; real email
confirmation, recovery and cross-device login remain isolated-staging acceptance.
