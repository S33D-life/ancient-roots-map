
-- Trigger: when staffs.owner_user_id is set (claim event), issue starting hearts + influence + species hearts
CREATE OR REPLACE FUNCTION public.on_staff_claimed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_starting_hearts INTEGER := 3333;
  v_influence_bonus INTEGER := 33;
  v_species_hearts_bonus INTEGER := 33;
BEGIN
  -- Only fire when owner_user_id is newly assigned
  IF OLD.owner_user_id IS NOT NULL OR NEW.owner_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1. Issue starting S33D Hearts
  INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
  VALUES (NEW.owner_user_id, NULL, 'patron_claim', v_starting_hearts);

  -- 2. Issue Influence bonus
  INSERT INTO influence_transactions (user_id, action_type, amount, reason, scope)
  VALUES (NEW.owner_user_id, 'patron_claim', v_influence_bonus, 'Founding patron staff claim: ' || NEW.id, 'global');

  -- 3. Issue Species Hearts bonus
  INSERT INTO species_heart_transactions (user_id, species_family, amount, reason, tree_id)
  VALUES (NEW.owner_user_id, NEW.species, v_species_hearts_bonus, 'Founding patron species bonus', NULL);

  -- 4. Log ceremony
  INSERT INTO ceremony_logs (user_id, staff_code, staff_name, staff_species, ceremony_type)
  VALUES (NEW.owner_user_id, NEW.id, NEW.species || ' Staff', NEW.species, 'claim');

  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_staff_claimed ON public.staffs;
CREATE TRIGGER trg_staff_claimed
  AFTER UPDATE OF owner_user_id ON public.staffs
  FOR EACH ROW
  EXECUTE FUNCTION public.on_staff_claimed();
