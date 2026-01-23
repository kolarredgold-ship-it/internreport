
-- Add mobile_number to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mobile_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Create wallet table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  welcome_bonus INTEGER NOT NULL DEFAULT 100,
  referral_earnings INTEGER NOT NULL DEFAULT 0,
  total_balance INTEGER NOT NULL DEFAULT 100,
  withdrawable_balance INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_mobile TEXT NOT NULL,
  referred_mobile TEXT NOT NULL,
  referred_user_id UUID NOT NULL,
  referrer_user_id UUID,
  earning_amount INTEGER NOT NULL DEFAULT 150,
  bonus_amount INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_mobile)
);

-- Create withdrawals table
CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  upi_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Wallet policies
CREATE POLICY "Users can view their own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wallet" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all wallets" ON public.wallets FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Referrals policies
CREATE POLICY "Users can view referrals they made" ON public.referrals FOR SELECT USING (referrer_user_id = auth.uid());
CREATE POLICY "Admins can view all referrals" ON public.referrals FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert referrals" ON public.referrals FOR INSERT WITH CHECK (true);

-- Withdrawals policies
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all withdrawals" ON public.withdrawals FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for wallet updated_at
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for withdrawals updated_at
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON public.withdrawals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to process referral and credit earnings
CREATE OR REPLACE FUNCTION public.process_referral(
  p_referred_user_id UUID,
  p_referred_mobile TEXT,
  p_referrer_mobile TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Credit ₹150 to referrer
  UPDATE wallets 
  SET referral_earnings = referral_earnings + 150,
      total_balance = total_balance + 150,
      withdrawable_balance = withdrawable_balance + 150
  WHERE user_id = v_referrer_user_id;

  -- Find if referrer was also referred by someone
  SELECT referred_by INTO v_referrer_of_referrer_mobile FROM profiles WHERE user_id = v_referrer_user_id;
  
  IF v_referrer_of_referrer_mobile IS NOT NULL THEN
    SELECT user_id INTO v_referrer_of_referrer_user_id FROM profiles WHERE mobile_number = v_referrer_of_referrer_mobile;
    
    IF v_referrer_of_referrer_user_id IS NOT NULL THEN
      -- Credit ₹50 to the person who referred the referrer
      UPDATE wallets 
      SET referral_earnings = referral_earnings + 50,
          total_balance = total_balance + 50,
          withdrawable_balance = withdrawable_balance + 50
      WHERE user_id = v_referrer_of_referrer_user_id;
    END IF;
  END IF;

  -- Record the referral
  INSERT INTO referrals (referrer_mobile, referred_mobile, referred_user_id, referrer_user_id, earning_amount, bonus_amount)
  VALUES (p_referrer_mobile, p_referred_mobile, p_referred_user_id, v_referrer_user_id, 150, 
          CASE WHEN v_referrer_of_referrer_user_id IS NOT NULL THEN 50 ELSE 0 END);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to check if user can withdraw
CREATE OR REPLACE FUNCTION public.can_withdraw(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral_count INTEGER;
  v_mobile TEXT;
BEGIN
  SELECT mobile_number INTO v_mobile FROM profiles WHERE user_id = p_user_id;
  
  SELECT COUNT(*) INTO v_referral_count FROM referrals WHERE referrer_mobile = v_mobile;
  
  IF v_referral_count >= 2 THEN
    RETURN jsonb_build_object('can_withdraw', true, 'referral_count', v_referral_count);
  ELSE
    RETURN jsonb_build_object('can_withdraw', false, 'referral_count', v_referral_count, 'required', 2);
  END IF;
END;
$$;

-- Function to process withdrawal request
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_user_id UUID,
  p_amount INTEGER,
  p_upi_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_can_withdraw JSONB;
  v_current_balance INTEGER;
BEGIN
  -- Check if can withdraw
  v_can_withdraw := can_withdraw(p_user_id);
  
  IF NOT (v_can_withdraw->>'can_withdraw')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', 'Need at least 2 referrals to withdraw');
  END IF;

  -- Check balance
  SELECT withdrawable_balance INTO v_current_balance FROM wallets WHERE user_id = p_user_id;
  
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Deduct from wallet
  UPDATE wallets 
  SET withdrawable_balance = withdrawable_balance - p_amount,
      total_balance = total_balance - p_amount
  WHERE user_id = p_user_id;

  -- Create withdrawal request
  INSERT INTO withdrawals (user_id, amount, upi_id)
  VALUES (p_user_id, p_amount, p_upi_id);

  RETURN jsonb_build_object('success', true);
END;
$$;
