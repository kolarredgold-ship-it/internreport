
-- Drop the permissive INSERT policy on referrals
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;

-- Referrals are only inserted via the process_referral function (SECURITY DEFINER)
-- No direct user access needed for inserts
