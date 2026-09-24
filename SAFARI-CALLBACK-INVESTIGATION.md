# Safari callback investigation — 24 September 2026

Status: diagnostic candidate only; not a proven Safari login fix. No push or deployment.

User evidence: Google sign-in succeeds on desktop; normal and Private iPhone Safari show AuthSessionMissingError. In the supplied two callback traces, credentials are detected, SDK initialization settles without an error, and session reads remain empty. No SIGNED_IN or CALLBACK_VALIDATION_REQUESTED event is recorded. The new callback code is executing; stale cache is not established as the cause.

Installed SDK source @supabase/auth-js parses fragment parameters first and query parameters second. An empty query access_token overrides a populated fragment access_token, bypasses implicit callback recognition, and returns successful initialization with no session. A regression test using the installed SDK reproduces this without network requests. This is a possible cause, NOT proof of the phone's callback shape. The prior diagnostics record key presence only and cannot distinguish empty values, incomplete credentials, or mixed query/fragment fields.

This candidate adds fixed, allowlisted event names describing pre-SDK callback shape and an explicit CALLBACK_SESSION_MISSING event. It saves no URLs, parameter values, tokens, user details, or raw errors. Existing auth exchange, storage, and redirect behavior is unchanged. Tests cover empty-query precedence, complete implicit callbacks, code-only callbacks, empty values, and diagnostic redaction.

Validation: 314 tests across 44 files; typecheck and standalone production build passed. Full release-check passed (typecheck, lint, security, duplicate and asset guards, tests, production build). Test/build configuration regenerates supabase/functions/mcp/index.ts to its locked MCP dependency version; that generated change is excluded from this candidate.

Next: approve a separate diagnostic release if phone-specific evidence is needed. A subsequent single Safari attempt can distinguish empty effective tokens, missing refresh/expiry metadata, or credentials present before SDK startup with no session afterwards. Do not assume that accepting a Google security alert establishes an application session. Do not manually accept incomplete tokens, bypass SDK validation, clear users' storage, or add a second unconditional token exchange.
