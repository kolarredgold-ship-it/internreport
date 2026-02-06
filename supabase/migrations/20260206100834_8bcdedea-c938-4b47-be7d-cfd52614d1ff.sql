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
  -- Check if can withdraw (needs 2+ referrals)
  v_can_withdraw := can_withdraw(p_user_id);
  
  IF NOT (v_can_withdraw->>'can_withdraw')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', 'Need at least 2 referrals to withdraw');
  END IF;

  -- Get current withdrawable balance
  SELECT withdrawable_balance INTO v_current_balance FROM wallets WHERE user_id = p_user_id;
  
  -- Check if wallet balance is less than ₹101 (lock withdrawals)
  IF v_current_balance < 101 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Withdrawals locked. Minimum wallet balance of ₹101 required.');
  END IF;

  -- Check minimum withdrawal amount of ₹499
  IF p_amount < 499 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Minimum withdrawal amount is ₹499');
  END IF;

  -- Check if sufficient balance for requested amount
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
$function$;