# R1 acceptance cohort: invitation lineage across auth paths

**When:** only after R1 has been reviewed, deployed as an exact approved SHA, and the R0 baseline has been taken.

**Who:**
- **Inviter:** Ed.
- **Invitees:** three people Ed has chosen, who have agreed to take part. Their names and emails are kept out of the repository, PRs and logs.

## Preparation (Ed)

1. Take the **R0 baseline** (`R0_baseline_counts.sql`) and keep the result row.
2. Note Ed's allowance as shown in the Hearth (`/referrals`: "N of 144 remaining").
3. From the Hearth (`/dashboard` → "Invite someone into the grove" → `/referrals`), create **one link per invitee**.
   - `/referrals` shows only the newest open link, so create the next link only once the previous invitee has accepted, or send each link as soon as it is made.
   - Each link is `/auth?invite=<code>` and becomes used on its first acceptance.

## Paths

| Invitee | Auth path | Device | What R1 changed for this path |
|---|---|---|---|
| A | Google | iPhone Safari | Returns to `/auth/callback` (#74 guard). The invitation is now recorded app-wide after the callback, not only if `/auth` is mounted. |
| B | email + password, then the confirmation link opened from the mail app | any | The confirmation lands on `/welcome`, now guarded like #74, so the fragment survives. The invitation is recorded app-wide, wherever the session appears. |
| C | magic link | desktop or phone | Also lands on `/welcome`. Same as B. |

Each invitee opens their link and goes through the sign-up or sign-in view with the invitation shown.

- **B (email + password):** creates the account there with the invitation code filled in.
- **A (Google) and C (magic link):** use those buttons on the same screen.

**Keep to one browser.** Open the confirmation or magic-link email on the **same device and browser** where the invitation link was opened. The pending invitation lives in that browser until the person is signed in.

**If it was opened elsewhere:** the invitee opens the original invitation link again while signed in, within the first week. The invitation is then recorded; it is still unused, because it was never consumed.

## Pass criteria (every one, for every invitee)

1. **One durable Wanderer.** Exactly one account exists for the invitee.
2. **Recorded exactly once.** The invitee appears once in Ed's `/referrals` list, and the invitee's `/referrals` shows "sparked by Ed".
3. **Allowance falls exactly once.** Ed's "N of 144 remaining" is exactly one lower per accepted invitee (three lower after all three), and never lower.
4. **Lineage visible from both sides.**
   - The invitee's Hearth shows Ed as the one who invited them, with Staff lineage from Ed's Staff.
   - Ed's side lists the invitee.
   - (The Vault lineage tree is repaired in R2; until then use `/referrals` on both sides.)
5. **Return login works.** The invitee signs out and signs back in with the same method, and lands in the same Wanderer.
6. **Another method creates no second Wanderer.** The invitee signs in with a second method, for example email + password after Google (same verified email), or Google after email + password. They land in the **same** Wanderer, and no new entry appears in Ed's list.
7. **No stray toast or error.** At most one "Your invitation has taken root" message, and no "could not be recorded" message.

After all three, the admin re-runs R0. Expected differences:

- `referrals_total` +3;
- `profiles_with_inviter` +3;
- `links_used` +3;
- `mirror_disagrees_with_referral` and `mirror_without_referral` **unchanged**.

## If a criterion fails

Stop. Record which criterion failed, the invitee label (A/B/C), the device and the time. **Do not** retry with a new account, and do not edit profiles or referrals by hand. The Hearth-side evidence and the R0 counts are enough to diagnose it.

## Known limits (not tested by this cohort)

- **Only the invitation doorway counts.** Only `/auth?invite=` links from the Hearth, or a code entered on the sign-up form, are recorded as invitations. Tree shares, whisper shares and Telegram codes are not (see `R2_share_vs_invitation.md`), so send the cohort Hearth links, not tree shares.

- **Telegram arrivals** are the Telegram lane (NEXT).
- **The installed iOS app:** email links open in Safari. The installed app then needs one ordinary sign-in, and the invitation is recorded on whichever side the session first appears.
- **The Vault lineage tree** is repaired in R2.
