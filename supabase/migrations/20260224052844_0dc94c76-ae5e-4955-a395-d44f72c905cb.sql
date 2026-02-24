CREATE OR REPLACE FUNCTION public.claim_generation_slot(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count INTEGER;
  v_new_count INTEGER;
BEGIN
  SELECT generations_used INTO v_current_count
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_current_count IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User profile not found',
      'generations_used', 0
    );
  END IF;
  
  IF v_current_count >= 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Generation limit reached. Please top up.',
      'generations_used', v_current_count
    );
  END IF;
  
  v_new_count := v_current_count + 1;
  UPDATE profiles
  SET generations_used = v_new_count
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'generations_used', v_new_count
  );
END;
$$;