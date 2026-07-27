import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const WalletHeader = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchWallet = async () => {
      try {
        const { data, error } = await supabase
          .from('wallets')
          .select('total_balance')
          .eq('user_id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Wallet doesn't exist, create one
          const { data: newWallet, error: createError } = await supabase
            .from('wallets')
            .insert({ user_id: user.id })
            .select('total_balance')
            .single();

          if (!createError && newWallet) {
            setBalance(newWallet.total_balance);
          }
        } else if (data) {
          setBalance(data.total_balance);
        }
      } catch (error) {
        console.error('Error fetching wallet:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('wallet-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && 'total_balance' in payload.new) {
            setBalance((payload.new as { total_balance: number }).total_balance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) {
    return (
      <Link
        to="/auth"
        className="flex items-center gap-1.5 shrink-0 px-2 sm:px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium whitespace-nowrap"
      >
        <Wallet className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Login to Earn</span>
        <span className="sm:hidden">Earn</span>
      </Link>
    );
  }

  return (
    <Link
      to="/refer"
      className="flex items-center gap-1.5 shrink-0 px-2 sm:px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors text-sm font-medium whitespace-nowrap"
    >
      <Wallet className="w-4 h-4" />
      <span>
        {loading ? '...' : `₹${balance ?? 0}`}
      </span>
    </Link>
  );
};

export default WalletHeader;
