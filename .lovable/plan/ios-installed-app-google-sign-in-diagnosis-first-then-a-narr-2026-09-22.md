# iOS installed-app Google sign-in — diagnosis first, then a narrow handoff

## What I found in the code (before any change)

- The installed app is a real standalone web app (`display: standalone`, `start_url: /`).
- Google sign-in always uses the same call: `lovable.auth.signInWithOAuth("google", { redirect_uri: origin + path })` from the sign-in page. There is no separate path for the installed app.
- The session is stored in the browser's own local storage for the site (the preview broker resolves to plain local storage on s33d.life).
- Sign-in requests to Google are excluded from offline caching, so the service worker is not the cause.

On iPhone, the installed app and Safari keep **separate** storage for the same site. When the installed app sends the person to Google, iOS finishes that journey in Safari, so the finished sign-in is saved in Safari — not in the installed app. The installed app comes back to a still-signed-out storage. This matches the reported symptom exactly, including "reinstalling does not help".

I want to prove this on a real iPhone before changing the sign-in flow.

## Step 1 — Instrumentation (no behaviour change)

Add a hidden diagnostics panel at `/auth/diagnostics` (only shown with `?diag=1`) that records and displays, with timestamps:

- whether the page is running as the installed app or in Safari;
- a one-time random "context marker" written on first run, so each context is identifiable;
- whether a sign-in session exists right now;
- what the sign-in journey last recorded (started, returned, still pending);
- whether the installed app stayed alive while Google was open.

Then run this checklist on a physical iPhone and record results: start sign-in from the installed app, complete Google, note where it lands, check the panel in Safari and then in the installed app. This answers all six of your questions with evidence rather than assumption.

Nothing is deployed for this step without your approval; it ships in the same candidate for TEOTAG review.

## Step 2 — Smallest secure handoff (only for the installed app)

Safari and desktop keep exactly today's flow, untouched.

When, and only when, the app is running installed:

1. Before leaving, the app creates a random secret, keeps it in its own storage, and sends only its fingerprint to the server. The server records a pending handoff that expires in 5 minutes and can be used once.
2. The Google return address becomes a plain page carrying only the opaque handoff identifier — never any sign-in token.
3. That return page (in Safari) confirms the sign-in, tells the server "this handoff belongs to this person", and the server privately prepares a single-use sign-in ticket for it. The page then simply says: return to the S33D app.
4. When the installed app is reopened, it presents the original secret, the server checks the fingerprint, checks it is unexpired and unused, marks it used, and returns the one-time ticket once.
5. The installed app redeems that ticket itself, so the session is created in its own storage. Reloading the app afterwards stays signed in.

Safety properties this gives us: no tokens in the address bar; no reliance on Safari and the app sharing storage; the handoff cannot be used twice, cannot be used by anyone who does not hold the original secret, and dies after 5 minutes; a cancelled or failed sign-in simply expires and the app returns to the sign-in screen with a retry. Signing out affects only the context you sign out from.

## Technical detail

- New table `auth_pwa_handoffs`: `id`, `verifier_hash`, `created_at`, `expires_at` (5 min), `bound_user_id`, `ticket_hash`, `consumed_at`. Row Level Security on, no client access; all access via a new edge function using service credentials.
- New edge function `auth-handoff` with three actions: `create` (unauthenticated, stores hash only), `bind` (requires the Safari session's own token; stores user and a server-generated single-use sign-in ticket), `claim` (requires the raw secret; atomic single-use update returning the ticket exactly once).
- The single-use ticket is a server-generated one-time sign-in token for that same account, redeemed by the app to create its own session. Identity binding: the ticket is only ever created from the session that completed Google, and only ever released to the holder of the secret created by the initiating app.
- Frontend: `src/lib/auth/pwaHandoff.ts` (detection, secret handling, state machine), `src/pages/AuthHandoffPage.tsx` (return page + claim on resume), route constant in `src/lib/routes.ts`, a standalone-only branch in `src/pages/AuthPage.tsx`, diagnostics panel component.
- PKCE/state: the existing Google call keeps its own state/PKCE handling; the handoff identifier is carried separately as an opaque value and verified server-side.

## Regression coverage

New test file `src/tests/PwaAuthHandoff.test.ts`:

- Safari/desktop sign-in still takes the unchanged path;
- installed-app sign-in takes the handoff path;
- return lands in Safari, binds, and the app claims successfully;
- wrong secret, expired handoff and reused handoff are all refused;
- cancelled sign-in leaves the app recoverable and retryable;
- reload of the installed app after success stays signed in;
- sign-out clears only the local context.

## Out of scope

No changes to the other auth methods, no changes to the installed-app manifest, no legacy media migration, and no deployment or publish — the candidate goes to TEOTAG with commit, files, and test results.
