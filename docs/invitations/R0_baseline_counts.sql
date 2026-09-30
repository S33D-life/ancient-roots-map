-- R0 · Invitation baseline — READ-ONLY, COUNTS ONLY (approved by TEOTAG, 30 Sep 2026)
--
-- Run by an admin in the Supabase SQL editor BEFORE the R1 migration is applied,
-- then once more after the acceptance cohort. Export the single result row and
-- keep it with the release notes. It returns numbers only: no ids, names,
-- emails or codes. The transaction is read-only and rolled back, so nothing
-- can be written even by mistake. Nothing here "fixes" a mismatch.

BEGIN;
SET TRANSACTION READ ONLY;

SELECT
  now()                                                                                  AS taken_at,
  -- links
  (SELECT count(*) FROM public.invite_links)                                             AS links_total,
  (SELECT count(*) FROM public.invite_links WHERE is_used)                               AS links_used,
  (SELECT count(*) FROM public.invite_links WHERE NOT is_used AND revoked_at IS NULL
                                              AND (expires_at IS NULL OR expires_at > now())) AS links_open,
  (SELECT count(*) FROM public.invite_links WHERE revoked_at IS NOT NULL)                 AS links_revoked,
  -- canonical relationship and its mirror
  (SELECT count(*) FROM public.referrals)                                                AS referrals_total,
  (SELECT count(*) FROM public.referrals WHERE invite_link_id IS NULL)                   AS referrals_without_link,
  (SELECT count(*) FROM public.referrals r JOIN public.gift_seeds g
     ON g.recipient_id = r.invitee_id AND g.sender_id = r.inviter_id
     WHERE r.invite_link_id IS NULL)                                                     AS referrals_from_gift_seeds,
  (SELECT count(*) FROM public.profiles WHERE invited_by_user_id IS NOT NULL)            AS profiles_with_inviter,
  (SELECT count(*) FROM public.referrals r JOIN public.profiles p ON p.id = r.invitee_id
     WHERE p.invited_by_user_id IS DISTINCT FROM r.inviter_id)                           AS mirror_disagrees_with_referral,
  (SELECT count(*) FROM public.profiles p WHERE p.invited_by_user_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.referrals r WHERE r.invitee_id = p.id))        AS mirror_without_referral,
  -- allowance (history; not changed by R1)
  (SELECT count(*) FROM public.profiles WHERE invites_remaining < 0 OR invites_remaining > 144) AS allowance_out_of_range,
  (SELECT count(*) FROM public.profiles WHERE invites_accepted <> (SELECT count(*) FROM public.referrals r WHERE r.inviter_id = profiles.id)) AS accepted_counter_differs_from_referrals,
  -- duplicate-Wanderer signals
  (SELECT count(*) FROM auth.users WHERE email LIKE '%@telegram.s33d.local')             AS telegram_placeholder_accounts,
  (SELECT count(*) FROM public.connected_accounts WHERE provider = 'telegram')           AS telegram_links;

ROLLBACK;
