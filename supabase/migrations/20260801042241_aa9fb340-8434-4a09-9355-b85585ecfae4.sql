-- 1. Remove the user-controlled INSERT policy (allowed arbitrary balance values)
DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.wallets;

-- 2. Secure wallet provisioning with hard-coded defaults
CREATE OR REPLACE FUNCTION public.ensure_wallet()
RETURNS TABLE (total_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.wallets (user_id)
  VALUES (v_user)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN QUERY
  SELECT w.total_balance FROM public.wallets w WHERE w.user_id = v_user;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_wallet() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_wallet() TO authenticated;

-- 3. Provision wallets automatically for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
