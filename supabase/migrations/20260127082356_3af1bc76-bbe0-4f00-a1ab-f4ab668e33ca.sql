-- Add pending earnings columns to wallets table
ALTER TABLE public.wallets 
ADD COLUMN pending_earnings integer NOT NULL DEFAULT 0;

-- Update process_referral function to mark earnings as pending instead of immediately crediting
CREATE OR REPLACE FUNCTION public.process_referral(p_referred_user_id uuid, p_referred_mobile text, p_referrer_mobile text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_user_id UUID;
  v_referrer_of_referrer_mobile TEXT;
  v_referrer_of_referrer_user_id UUID;
BEGIN
  -- Check for self-referral
  IF p_referred_mobile = p_referrer_mobile THEN
    RETURN jsonb_build_object('success', false, 'error', 'Self-referral not allowed');
  END IF;

  -- Check if already referred
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_mobile = p_referred_mobile) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already referred');
  END IF;

  -- Find referrer user
  SELECT user_id INTO v_referrer_user_id FROM profiles WHERE mobile_number = p_referrer_mobile;
  
  IF v_referrer_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referrer not found');
  END IF;

  -- Add ₹150 to pending earnings (not credited yet - pending payment)
  UPDATE wallets 
  SET pending_earnings = pending_earnings + 150
  WHERE user_id = v_referrer_user_id;

  -- Find if referrer was also referred by someone
  SELECT referred_by INTO v_referrer_of_referrer_mobile FROM profiles WHERE user_id = v_referrer_user_id;
  
  IF v_referrer_of_referrer_mobile IS NOT NULL THEN
    SELECT user_id INTO v_referrer_of_referrer_user_id FROM profiles WHERE mobile_number = v_referrer_of_referrer_mobile;
    
    IF v_referrer_of_referrer_user_id IS NOT NULL THEN
      -- Add ₹50 to pending earnings for secondary referrer
      UPDATE wallets 
      SET pending_earnings = pending_earnings + 50
      WHERE user_id = v_referrer_of_referrer_user_id;
    END IF;
  END IF;

  -- Record the referral with pending status
  INSERT INTO referrals (referrer_mobile, referred_mobile, referred_user_id, referrer_user_id, earning_amount, bonus_amount, status)
  VALUES (p_referrer_mobile, p_referred_mobile, p_referred_user_id, v_referrer_user_id, 150, 
          CASE WHEN v_referrer_of_referrer_user_id IS NOT NULL THEN 50 ELSE 0 END, 'pending');

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- Create function to credit referral earnings when payment is approved
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
  -- Find the pending referral for this user
  SELECT * INTO v_referral FROM referrals 
  WHERE referred_user_id = p_referred_user_id AND status = 'pending'
  LIMIT 1;
  
  IF v_referral IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending referral found');
  END IF;

  -- Credit ₹150 to referrer's wallet (move from pending to actual balance)
  UPDATE wallets 
  SET referral_earnings = referral_earnings + 150,
      total_balance = total_balance + 150,
      withdrawable_balance = withdrawable_balance + 150,
      pending_earnings = pending_earnings - 150
  WHERE user_id = v_referral.referrer_user_id;

  -- Check for secondary referral (referrer's referrer)
  SELECT referred_by INTO v_referrer_of_referrer_mobile FROM profiles WHERE user_id = v_referral.referrer_user_id;
  
  IF v_referrer_of_referrer_mobile IS NOT NULL THEN
    SELECT user_id INTO v_referrer_of_referrer_user_id FROM profiles WHERE mobile_number = v_referrer_of_referrer_mobile;
    
    IF v_referrer_of_referrer_user_id IS NOT NULL THEN
      -- Credit ₹50 to secondary referrer
      UPDATE wallets 
      SET referral_earnings = referral_earnings + 50,
          total_balance = total_balance + 50,
          withdrawable_balance = withdrawable_balance + 50,
          pending_earnings = pending_earnings - 50
      WHERE user_id = v_referrer_of_referrer_user_id;
    END IF;
  END IF;

  -- Update referral status to completed
  UPDATE referrals SET status = 'completed' WHERE id = v_referral.id;

  RETURN jsonb_build_object('success', true);
END;
$function$;