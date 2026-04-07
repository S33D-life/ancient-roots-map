CREATE OR REPLACE FUNCTION public.validate_heart_ledger_entry()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.transaction_type NOT IN (
    'earn_tree_mapping', 'earn_checkin', 'earn_offering', 'earn_curation',
    'earn_council', 'earn_contribution', 'earn_referral', 'earn_bug_report',
    'earn_streak_bonus', 'earn_windfall', 'earn_patron_grant',
    'earn_root_growth', 'earn_support_gratitude',
    'purchase_bundle', 'purchase_single',
    'spend_nftree_generation', 'spend_room_customisation', 'spend_skin_unlock',
    'spend_gift', 'spend_market_stake', 'spend_plant_hearts',
    'refund', 'admin_grant', 'admin_debit',
    'claim_reward', 'claim_founder',
    'lock_stake', 'unlock_stake',
    'mint_prepare', 'mint_confirmed',
    'bridge_to_chain', 'bridge_from_chain'
  ) THEN
    RAISE EXCEPTION 'Invalid transaction_type: %', NEW.transaction_type;
  END IF;
  IF NEW.currency_type NOT IN ('S33D', 'SPECIES', 'INFLUENCE') THEN
    RAISE EXCEPTION 'Invalid currency_type: %', NEW.currency_type;
  END IF;
  IF NEW.status NOT IN ('pending', 'confirmed', 'failed', 'reversed', 'locked') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.chain_state NOT IN ('offchain', 'claimable', 'claiming', 'onchain', 'bridging') THEN
    RAISE EXCEPTION 'Invalid chain_state: %', NEW.chain_state;
  END IF;
  RETURN NEW;
END;
$function$;