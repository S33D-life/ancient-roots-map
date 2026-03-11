
-- Update streak tier thresholds from 1/3/7/30 to 3/7/21/90
CREATE OR REPLACE FUNCTION public.update_mapping_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_streak INTEGER;
  v_longest INTEGER;
  v_last_date DATE;
  v_today DATE := CURRENT_DATE;
  v_old_tier TEXT;
  v_new_tier TEXT := 'none';
  v_hearts_bonus INTEGER := 0;
BEGIN
  v_user_id := NEW.created_by;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  SELECT current_streak, longest_streak, last_mapped_date, streak_tier
    INTO v_streak, v_longest, v_last_date, v_old_tier
    FROM wanderer_streaks WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    v_streak := 1;
    v_longest := 1;
    v_last_date := v_today;
    INSERT INTO wanderer_streaks (user_id, current_streak, longest_streak, last_mapped_date, streak_tier)
    VALUES (v_user_id, 1, 1, v_today, 'none');
  ELSE
    IF v_last_date = v_today THEN
      RETURN NEW;
    ELSIF v_last_date = v_today - 1 THEN
      v_streak := v_streak + 1;
    ELSE
      v_streak := 1;
    END IF;

    IF v_streak > v_longest THEN v_longest := v_streak; END IF;

    -- Updated tier thresholds: 3/7/21/90
    IF v_streak >= 90 THEN v_new_tier := 'guardian';
    ELSIF v_streak >= 21 THEN v_new_tier := 'young_tree';
    ELSIF v_streak >= 7 THEN v_new_tier := 'sapling';
    ELSIF v_streak >= 3 THEN v_new_tier := 'seedling';
    ELSE v_new_tier := 'none';
    END IF;

    -- Award hearts on tier upgrade
    IF v_new_tier != COALESCE(v_old_tier, 'none') AND v_new_tier != 'none' THEN
      CASE v_new_tier
        WHEN 'seedling' THEN v_hearts_bonus := 5;
        WHEN 'sapling' THEN v_hearts_bonus := 15;
        WHEN 'young_tree' THEN v_hearts_bonus := 33;
        WHEN 'guardian' THEN v_hearts_bonus := 90;
        ELSE v_hearts_bonus := 0;
      END CASE;

      IF v_hearts_bonus > 0 THEN
        INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
        VALUES (v_user_id, NEW.id, 'streak_bonus', v_hearts_bonus);
      END IF;
    END IF;

    UPDATE wanderer_streaks
    SET current_streak = v_streak,
        longest_streak = v_longest,
        last_mapped_date = v_today,
        streak_tier = v_new_tier,
        updated_at = now()
    WHERE user_id = v_user_id;
  END IF;

  RETURN NEW;
END;
$$;
