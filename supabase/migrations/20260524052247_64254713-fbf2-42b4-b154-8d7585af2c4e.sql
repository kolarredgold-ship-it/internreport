-- 1. Stop broadcasting wallet row changes to all subscribers
ALTER PUBLICATION supabase_realtime DROP TABLE public.wallets;

-- 2. Force withdrawals to go through request_withdrawal() SECURITY DEFINER function
DROP POLICY IF EXISTS "Users can insert their own withdrawals" ON public.withdrawals;