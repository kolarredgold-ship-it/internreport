
-- 1. Wallets: remove direct user UPDATE policy (mutations only via SECURITY DEFINER functions)
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.wallets;

-- 2. request_withdrawal: enforce caller can only withdraw from their own wallet
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_user_id uuid, p_amount integer, p_upi_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_can_withdraw JSONB;
  v_current_balance INTEGER;
BEGIN
  -- Authorization: caller must be the owner
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  v_can_withdraw := can_withdraw(p_user_id);
  IF NOT (v_can_withdraw->>'can_withdraw')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', 'Need at least 2 referrals to withdraw');
  END IF;

  SELECT withdrawable_balance INTO v_current_balance FROM wallets WHERE user_id = p_user_id;

  IF v_current_balance < 499 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Minimum wallet balance of ₹499 required for withdrawal.');
  END IF;
  IF p_amount < 499 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Minimum withdrawal amount is ₹499');
  END IF;
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  UPDATE wallets
  SET withdrawable_balance = withdrawable_balance - p_amount,
      total_balance = total_balance - p_amount
  WHERE user_id = p_user_id;

  INSERT INTO withdrawals (user_id, amount, upi_id)
  VALUES (p_user_id, p_amount, p_upi_id);

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- 3. credit_referral_earnings: require admin role
CREATE OR REPLACE FUNCTION public.credit_referral_earnings(p_referred_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referral RECORD;
  v_referrer_of_referrer_mobile TEXT;
  v_referrer_of_referrer_user_id UUID;
BEGIN
  -- Admin only
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  SELECT * INTO v_referral FROM referrals
  WHERE referred_user_id = p_referred_user_id AND status = 'pending'
  LIMIT 1;

  IF v_referral IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending referral found');
  END IF;

  UPDATE wallets
  SET referral_earnings = referral_earnings + 150,
      total_balance = total_balance + 150,
      withdrawable_balance = withdrawable_balance + 150,
      pending_earnings = pending_earnings - 150
  WHERE user_id = v_referral.referrer_user_id;

  SELECT referred_by INTO v_referrer_of_referrer_mobile FROM profiles WHERE user_id = v_referral.referrer_user_id;

  IF v_referrer_of_referrer_mobile IS NOT NULL THEN
    SELECT user_id INTO v_referrer_of_referrer_user_id FROM profiles WHERE mobile_number = v_referrer_of_referrer_mobile;
    IF v_referrer_of_referrer_user_id IS NOT NULL THEN
      UPDATE wallets
      SET referral_earnings = referral_earnings + 50,
          total_balance = total_balance + 50,
          withdrawable_balance = withdrawable_balance + 50,
          pending_earnings = pending_earnings - 50
      WHERE user_id = v_referrer_of_referrer_user_id;
    END IF;
  END IF;

  UPDATE referrals SET status = 'completed' WHERE id = v_referral.id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- 4. digital_products: stop exposing download_url to public listings
DROP POLICY IF EXISTS "Anyone can view active products" ON public.digital_products;

-- New restrictive table policy: only admins or users who purchased the product
CREATE POLICY "Admins or purchasers can view product"
ON public.digital_products FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.product_id = digital_products.id
      AND p.user_id = auth.uid()
      AND p.status = 'approved'
  )
);

-- Public-facing view that excludes the sensitive download_url column
CREATE OR REPLACE VIEW public.digital_products_public
WITH (security_invoker = true)
AS
SELECT id, title, slug, description, price, offer_price, actual_price,
       image_url, is_active, category, download_count, created_at, updated_at
FROM public.digital_products
WHERE is_active = true;

GRANT SELECT ON public.digital_products_public TO anon, authenticated;
