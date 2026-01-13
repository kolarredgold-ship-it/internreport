-- Fix 1: Create atomic claim_generation_slot function to prevent race condition
CREATE OR REPLACE FUNCTION public.claim_generation_slot(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count INTEGER;
  v_new_count INTEGER;
BEGIN
  -- Lock the row to prevent concurrent access
  SELECT generations_used INTO v_current_count
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Handle case where profile doesn't exist
  IF v_current_count IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User profile not found',
      'generations_used', 0
    );
  END IF;
  
  -- Check if limit reached
  IF v_current_count >= 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Generation limit reached. Please top up.',
      'generations_used', v_current_count
    );
  END IF;
  
  -- Atomically increment counter
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.claim_generation_slot(UUID) TO authenticated;

-- Fix 2: Update has_role function to restrict access (only check own role or if admin)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() = _user_id THEN
      -- User can check their own role
      EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
      )
    WHEN EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    ) THEN
      -- Admins can check any role
      EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
      )
    ELSE
      -- Non-admins cannot check other users' roles
      FALSE
  END;
$$;