CREATE OR REPLACE FUNCTION public.claim_generation_slot(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_current_count INTEGER;
  v_new_count INTEGER;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = 'admin'
  ) INTO v_is_admin;

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
  
  -- Admins bypass the generation limit
  IF NOT v_is_admin AND v_current_count >= 1 THEN
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