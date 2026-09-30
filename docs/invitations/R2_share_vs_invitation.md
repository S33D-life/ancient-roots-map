# R2 open question: share codes and invitation codes are the same codes

**Principle:** identity ≠ invitation ≠ share.

## Where R1 stands

R1 cannot tell a deliberate invitation from share traffic **by the code**, because every surface mints and reuses the same `invite_links` rows:

| Surface | Link it produces | Row it uses |
|---|---|---|
| Hearth `/referrals` | `/auth?invite=<code>` | newest open own link, or a new one |
| Hearth Pod, "Fellow Wanderers" (`DashboardWanderers`) | `/auth?invite=<code>` | newest open own link, or a new one |
| `TreeShareCard` (tree share) | `/tree/:id?invite=<code>` | **newest open own link**, which can be a Hearth or whisper invitation |
| `SendWhisperModal` (whisper + invite toggle) | `/tree/:id?invite=<code>` | a new single-use link |
| Telegram `start=invite_<code>` | handoff page | whatever code was passed |

So R1 separates them **by doorway**, not by code:

- **Consumed:** codes that arrive through `/auth?invite=`, or that the person confirms on the sign-up form. These land under `s33d_pending_invite_code`.
- **Not consumed in R1:** tree shares, whisper shares, Telegram and bot handoffs. These land under `s33d_invite_code`.

**Behaviour change.** Before R1, `AuthPage` consumed those codes too, but only when it happened to be mounted. A share recipient who wants their lineage recorded now needs the inviter's `/auth?invite=` link, or must enter the code on the sign-up form.

## Temporary R1 guard

R1 also does not attempt consumption for accounts older than 7 days. The guard is **client-side only**; `consume_invitation` carries no account-age rule. It is a safety guard for the first cohort, not a definition of "invited". An established Wanderer may later be genuinely invited, into a relationship, a Grove, a Staff lineage or another part of the Tree.

## What R2 should settle (proposal; nothing built)

1. **Separate the kinds of link at the source.** Mark each `invite_links` row with its purpose (e.g. `kind`: `invitation` / `share` / `whisper`; nullable, existing rows untouched). Shares should stop borrowing invitation codes: `TreeShareCard` would mint or reuse only `share` rows, or carry no code at all.
2. **Decide what an existing Wanderer accepting an invitation means.** Is it the same one-inviter lineage (only if they have none), or a different relationship kind (Grove, Staff, Circle) with its own record? Then remove the 7-day guard.
3. **Decide Telegram and whisper invitations explicitly,** rather than inheriting whatever the shared code was.
4. **Repair the Vault lineage view** (`get_user_lineage`).
