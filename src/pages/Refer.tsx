import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  FileText, 
  Share2, 
  Wallet, 
  Users, 
  IndianRupee,
  Copy,
  Gift,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WalletData {
  welcome_bonus: number;
  referral_earnings: number;
  total_balance: number;
  withdrawable_balance: number;
}

interface Referral {
  id: string;
  referred_mobile: string;
  earning_amount: number;
  created_at: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  upi_id: string;
  status: string;
  transaction_id: string | null;
  created_at: string;
}

const Refer = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [mobileNumber, setMobileNumber] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  
  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        // Fetch profile for mobile number
        const { data: profile } = await supabase
          .from('profiles')
          .select('mobile_number')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.mobile_number) {
          setMobileNumber(profile.mobile_number);
        }

        // Fetch or create wallet
        let { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (walletError && walletError.code === 'PGRST116') {
          const { data: newWallet } = await supabase
            .from('wallets')
            .insert({ user_id: user.id })
            .select('*')
            .single();
          walletData = newWallet;
        }

        if (walletData) {
          setWallet(walletData);
        }

        // Check if can withdraw
        const { data: withdrawCheck } = await supabase.rpc('can_withdraw', {
          p_user_id: user.id
        });
        
        if (withdrawCheck && typeof withdrawCheck === 'object' && !Array.isArray(withdrawCheck)) {
          const checkData = withdrawCheck as { can_withdraw: boolean; referral_count: number };
          setCanWithdraw(checkData.can_withdraw);
          setReferralCount(checkData.referral_count);
        }

        // Fetch referrals
        const { data: referralsData } = await supabase
          .from('referrals')
          .select('*')
          .eq('referrer_user_id', user.id)
          .order('created_at', { ascending: false });

        if (referralsData) {
          setReferrals(referralsData);
        }

        // Fetch withdrawals
        const { data: withdrawalsData } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (withdrawalsData) {
          setWithdrawals(withdrawalsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime updates
    const walletChannel = supabase
      .channel('wallet-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setWallet(payload.new as WalletData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
    };
  }, [user]);

  const handleCopyReferralId = () => {
    if (mobileNumber) {
      navigator.clipboard.writeText(mobileNumber);
      toast({
        title: 'Copied!',
        description: 'Referral ID copied to clipboard',
      });
    }
  };

  const handleWhatsAppShare = () => {
    if (!mobileNumber) {
      toast({
        title: 'Mobile number required',
        description: 'Please add your mobile number to share referral',
        variant: 'destructive',
      });
      return;
    }

    const message = encodeURIComponent(
      `I earned ₹5,000 by referring this app 🤯\n\nYou can earn ₹150 for every friend you invite.\n\nJoin using my number as referral ID: ${mobileNumber}\n\nhttps://project-scribe-gen.lovable.app/`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleWithdraw = async () => {
    if (!wallet || !user) return;
    
    const amount = parseInt(withdrawAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    if (amount > wallet.withdrawable_balance) {
      toast({
        title: 'Insufficient balance',
        description: 'You don\'t have enough balance to withdraw',
        variant: 'destructive',
      });
      return;
    }

    if (!upiId.trim()) {
      toast({
        title: 'UPI ID required',
        description: 'Please enter your UPI ID',
        variant: 'destructive',
      });
      return;
    }

    setWithdrawing(true);
    try {
      const { data, error } = await supabase.rpc('request_withdrawal', {
        p_user_id: user.id,
        p_amount: amount,
        p_upi_id: upiId.trim()
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string } | null;
      
      if (result?.success) {
        toast({
          title: 'Withdrawal requested!',
          description: 'Your withdrawal request has been submitted',
        });
        setWithdrawAmount('');
        setUpiId('');
        
        // Refresh data
        const { data: withdrawalsData } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (withdrawalsData) setWithdrawals(withdrawalsData);
      } else {
        toast({
          title: 'Withdrawal failed',
          description: result?.error || 'Something went wrong',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setWithdrawing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">InternReport.in</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Hook */}
        <Card className="mb-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">💸</div>
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
              I earned ₹5,000 this week just by referring this app!
            </h1>
            <p className="text-lg text-muted-foreground">
              Earn <span className="text-green-600 font-bold">₹150</span> for every friend you invite.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Invite friends. Earn money. Withdraw via UPI.
            </p>
          </CardContent>
        </Card>

        {/* Wallet Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Wallet className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">₹{wallet?.total_balance ?? 0}</p>
              <p className="text-xs text-muted-foreground">Wallet Balance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{referralCount}</p>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <IndianRupee className="w-6 h-6 mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-bold">₹{wallet?.referral_earnings ?? 0}</p>
              <p className="text-xs text-muted-foreground">Referral Earnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Gift className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">₹{wallet?.welcome_bonus ?? 0}</p>
              <p className="text-xs text-muted-foreground">Welcome Bonus</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral ID & Share */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Your Referral ID
            </CardTitle>
            <CardDescription>
              Share your mobile number as referral ID and earn ₹150 per signup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mobileNumber ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-secondary/50 rounded-lg px-4 py-3 font-mono text-lg">
                    {mobileNumber}
                  </div>
                  <Button variant="outline" size="icon" onClick={handleCopyReferralId}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  onClick={handleWhatsAppShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share on WhatsApp
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Add your mobile number to start referring friends
                </p>
                <Link to="/dashboard">
                  <Button variant="outline">Update Profile</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              Withdraw Earnings
            </CardTitle>
            <CardDescription>
              {canWithdraw 
                ? `Withdrawable Balance: ₹${wallet?.withdrawable_balance ?? 0}`
                : `Need ${2 - referralCount} more referrals to unlock withdrawals`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canWithdraw ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
                <p className="text-amber-600 text-sm">
                  🔒 Complete {2 - referralCount} more referral{2 - referralCount !== 1 ? 's' : ''} to unlock withdrawals
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={wallet?.withdrawable_balance ?? 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upi">UPI ID</Label>
                  <Input
                    id="upi"
                    type="text"
                    placeholder="yourname@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleWithdraw}
                  disabled={withdrawing || (wallet?.withdrawable_balance ?? 0) <= 0}
                >
                  {withdrawing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Request Withdrawal'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        {withdrawals.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Withdrawal History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div 
                    key={withdrawal.id} 
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">₹{withdrawal.amount}</p>
                      <p className="text-xs text-muted-foreground">{withdrawal.upi_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={
                          withdrawal.status === 'success' ? 'default' : 
                          withdrawal.status === 'pending' ? 'secondary' : 'destructive'
                        }
                        className={
                          withdrawal.status === 'success' ? 'bg-green-500' : ''
                        }
                      >
                        {withdrawal.status === 'success' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {withdrawal.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                        {withdrawal.status}
                      </Badge>
                      {withdrawal.transaction_id && (
                        <p className="text-xs text-muted-foreground mt-1">
                          TxnID: {withdrawal.transaction_id}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referral List */}
        {referrals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Your Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div 
                    key={referral.id} 
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {referral.referred_mobile.slice(0, 4)}****{referral.referred_mobile.slice(-2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-green-500">
                      +₹{referral.earning_amount}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Refer;
