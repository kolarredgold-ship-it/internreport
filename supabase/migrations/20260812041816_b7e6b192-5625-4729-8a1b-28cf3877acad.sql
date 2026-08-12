CREATE OR REPLACE FUNCTION public.ensure_wallet()
 RETURNS TABLE(total_balance numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  SELECT w.total_balance::numeric FROM public.wallets w WHERE w.user_id = v_user;
END;
$function$;