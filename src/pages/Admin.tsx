import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye,
  RefreshCw,
  Users,
  IndianRupee,
  Key,
  Loader2,
  LayoutDashboard,
  Package
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import AdminStats from '@/components/admin/AdminStats';
import UserDetailsTable from '@/components/admin/UserDetailsTable';
import UserDetailsDialog from '@/components/admin/UserDetailsDialog';
import AdminProducts from '@/components/admin/AdminProducts';

interface Payment {
  id: string;
  user_id: string;
  report_id: string | null;
  amount: number;
  status: string;
  payment_type: string;
  transaction_number: string | null;
  payer_name: string | null;
  payer_mobile: string | null;
  payer_email: string | null;
  screenshot_url: string | null;
  created_at: string;
  verified_at: string | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  mobile_number: string | null;
  college_name: string | null;
  course: string | null;
  university: string | null;
  register_number: string | null;
  generations_used: number | null;
  referred_by: string | null;
  created_at: string;
}

interface UserWallet {
  user_id: string;
  total_balance: number;
  referral_earnings: number;
  pending_earnings: number;
  withdrawable_balance: number;
  welcome_bonus: number;
}

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  upi_id: string;
  status: string;
  transaction_id: string | null;
  created_at: string;
  processed_at: string | null;
}

interface Referral {
  id: string;
  status: string;
  earning_amount: number;
}

interface ReportCount {
  user_id: string;
  count: number;
}

interface PaymentCount {
  user_id: string;
  verified_count: number;
  total_paid: number;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [screenshotSignedUrl, setScreenshotSignedUrl] = useState<string | null>(null);
  const [loadingScreenshot, setLoadingScreenshot] = useState(false);
  
  // User management state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Withdrawal management state
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null);
  
  // Duplicate transaction tracking
  const [duplicateTransactions, setDuplicateTransactions] = useState<Map<string, number>>(new Map());

  // Additional data for comprehensive stats
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [reportCounts, setReportCounts] = useState<ReportCount[]>([]);
  const [paymentCounts, setPaymentCounts] = useState<PaymentCount[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [totalProductDownloads, setTotalProductDownloads] = useState(0);
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

  const checkAdminAccess = async () => {
    try {
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user?.id, _role: 'admin' });

      if (error) throw error;

      if (!data) {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      fetchPayments();
      fetchUsers();
      fetchWithdrawals();
      fetchWallets();
      fetchReferrals();
      fetchReports();
    } catch (error: any) {
      console.error('Admin check error:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
      
      // Find duplicate transaction numbers
      if (data) {
        const txnCounts = new Map<string, number>();
        data.forEach(payment => {
          if (payment.transaction_number) {
            const txn = payment.transaction_number.trim().toLowerCase();
            txnCounts.set(txn, (txnCounts.get(txn) || 0) + 1);
          }
        });
        // Only keep duplicates (count > 1)
        const duplicates = new Map<string, number>();
        txnCounts.forEach((count, txn) => {
          if (count > 1) duplicates.set(txn, count);
        });
        setDuplicateTransactions(duplicates);
      }
    } catch (error: any) {
      console.error('Fetch payments error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payments.',
        variant: 'destructive',
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Fetch users error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users.',
        variant: 'destructive',
      });
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error: any) {
      console.error('Fetch withdrawals error:', error);
    }
  };

  const fetchWallets = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('user_id, total_balance, referral_earnings, pending_earnings, withdrawable_balance, welcome_bonus');

      if (error) throw error;
      setWallets(data || []);
    } catch (error: any) {
      console.error('Fetch wallets error:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('id, status, earning_amount');

      if (error) throw error;
      setReferrals(data || []);
    } catch (error: any) {
      console.error('Fetch referrals error:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('user_id');

      if (error) throw error;
      
      // Count reports per user
      const counts: Record<string, number> = {};
      (data || []).forEach(report => {
        counts[report.user_id] = (counts[report.user_id] || 0) + 1;
      });
      
      const reportCountsArray = Object.entries(counts).map(([user_id, count]) => ({
        user_id,
        count,
      }));
      
      setReportCounts(reportCountsArray);
      setTotalReports(data?.length || 0);

      // Calculate payment counts per user from payments
      const paymentCountsMap: Record<string, { verified_count: number; total_paid: number }> = {};
      payments.forEach(payment => {
        if (payment.status === 'verified') {
          if (!paymentCountsMap[payment.user_id]) {
            paymentCountsMap[payment.user_id] = { verified_count: 0, total_paid: 0 };
          }
          paymentCountsMap[payment.user_id].verified_count++;
          paymentCountsMap[payment.user_id].total_paid += payment.amount;
        }
      });
      
      const paymentCountsArray = Object.entries(paymentCountsMap).map(([user_id, data]) => ({
        user_id,
        ...data,
      }));
      
      setPaymentCounts(paymentCountsArray);
    } catch (error: any) {
      console.error('Fetch reports error:', error);
    }
  };

  const handleApproveWithdrawal = async (withdrawal: Withdrawal) => {
    if (!transactionId.trim()) {
      toast({
        title: 'Transaction ID Required',
        description: 'Please enter the transaction ID after transferring the amount.',
        variant: 'destructive',
      });
      return;
    }

    setProcessingWithdrawal(withdrawal.id);
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'success', 
          transaction_id: transactionId.trim(),
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        })
        .eq('id', withdrawal.id);

      if (error) throw error;

      toast({
        title: 'Withdrawal Approved',
        description: 'The withdrawal has been marked as successful.',
      });
      setSelectedWithdrawal(null);
      setTransactionId('');
      fetchWithdrawals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingWithdrawal(null);
    }
  };

  const handleRejectWithdrawal = async (withdrawal: Withdrawal) => {
    setProcessingWithdrawal(withdrawal.id);
    try {
      // Refund the amount to user's wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('total_balance, withdrawable_balance')
        .eq('user_id', withdrawal.user_id)
        .single();

      if (walletData) {
        await supabase
          .from('wallets')
          .update({ 
            total_balance: walletData.total_balance + withdrawal.amount,
            withdrawable_balance: walletData.withdrawable_balance + withdrawal.amount
          })
          .eq('user_id', withdrawal.user_id);
      }

      const { error } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        })
        .eq('id', withdrawal.id);

      if (error) throw error;

      toast({
        title: 'Withdrawal Rejected',
        description: 'Amount has been refunded to user\'s wallet.',
      });
      setSelectedWithdrawal(null);
      fetchWithdrawals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingWithdrawal(null);
    }
  };

  const getUserInfo = (userId: string) => {
    const userProfile = users.find(u => u.user_id === userId);
    return userProfile?.email || userProfile?.mobile_number || userId.slice(0, 8);
  };

  // Extract file path from the screenshot URL
  const getFilePathFromUrl = (url: string): string | null => {
    try {
      // URL format: .../storage/v1/object/public/payment-screenshots/user-id/filename.jpg
      const match = url.match(/payment-screenshots\/(.+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  // Generate signed URL when payment is selected
  const loadScreenshotSignedUrl = async (screenshotUrl: string) => {
    setLoadingScreenshot(true);
    setScreenshotSignedUrl(null);
    
    const filePath = getFilePathFromUrl(screenshotUrl);
    if (!filePath) {
      setLoadingScreenshot(false);
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('payment-screenshots')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      setScreenshotSignedUrl(data.signedUrl);
    } catch (error: any) {
      console.error('Error generating signed URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to load screenshot.',
        variant: 'destructive',
      });
    } finally {
      setLoadingScreenshot(false);
    }
  };

  const handleSelectPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    if (payment.screenshot_url) {
      loadScreenshotSignedUrl(payment.screenshot_url);
    }
  };

  const handleClosePaymentDialog = () => {
    setSelectedPayment(null);
    setScreenshotSignedUrl(null);
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser || !newPassword) return;

    if (newPassword.length < 6) {
      toast({
        title: 'Invalid Password',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('admin-update-password', {
        body: {
          userId: selectedUser.user_id,
          newPassword: newPassword,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update password');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Password Updated',
        description: `Password for ${selectedUser.email || 'user'} has been updated.`,
      });

      setSelectedUser(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Password update error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleApprove = async (paymentId: string) => {
    setProcessing(paymentId);
    try {
      // First get the payment details to check payment type and user
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) throw new Error('Payment not found');

      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: user?.id
        })
        .eq('id', paymentId);

      if (error) throw error;

      // If this is a topup payment, add 3 more generations to the user's profile
      if (payment.payment_type === 'topup') {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('generations_used')
          .eq('user_id', payment.user_id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else {
          // Subtract 5 from generations_used (giving them 5 more generations)
          const newGenerationsUsed = Math.max(0, (profile.generations_used || 0) - 5);
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ generations_used: newGenerationsUsed })
            .eq('user_id', payment.user_id);

          if (updateError) {
            console.error('Error updating generations:', updateError);
          }
        }
      }

      // Credit referral earnings when payment is approved (₹499 payment)
      if (payment.amount === 499) {
        const { data: referralResult, error: referralError } = await supabase.rpc(
          'credit_referral_earnings',
          { p_referred_user_id: payment.user_id }
        );
        
        if (referralError) {
          console.error('Error crediting referral:', referralError);
        } else if (referralResult && typeof referralResult === 'object') {
          const result = referralResult as { success: boolean };
          if (result.success) {
            console.log('Referral earnings credited successfully');
          }
        }
      }

      toast({
        title: 'Payment Approved',
        description: payment.payment_type === 'topup' 
          ? 'Payment verified and 5 generations added to user account.' 
          : 'The payment has been verified and activated.',
      });

      fetchPayments();
      setSelectedPayment(null);
    } catch (error: any) {
      console.error('Approve error:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve payment.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    setProcessing(paymentId);
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'rejected',
          verified_at: new Date().toISOString(),
          verified_by: user?.id
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: 'Payment Rejected',
        description: 'The payment has been rejected.',
      });

      fetchPayments();
      setSelectedPayment(null);
    } catch (error: any) {
      console.error('Reject error:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject payment.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>;
    }
  };

  const paymentStats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    verified: payments.filter(p => p.status === 'verified').length,
    totalAmount: payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount, 0),
  };

  // Fetch product downloads when admin access confirmed
  useEffect(() => {
    if (isAdmin) {
      const fetchProductDownloads = async () => {
        const { data } = await supabase.from('digital_products').select('download_count');
        if (data) setTotalProductDownloads((data as any[]).reduce((sum, p) => sum + (p.download_count || 0), 0));
      };
      fetchProductDownloads();
    }
  }, [isAdmin]);

  const comprehensiveStats = {
    totalUsers: users.length,
    totalReports: totalReports,
    totalPayments: payments.length,
    pendingPayments: payments.filter(p => p.status === 'pending').length,
    verifiedPayments: payments.filter(p => p.status === 'verified').length,
    rejectedPayments: payments.filter(p => p.status === 'rejected').length,
    totalRevenue: payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount, 0),
    pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
    completedWithdrawals: withdrawals.filter(w => w.status === 'success').length,
    totalWithdrawalAmount: withdrawals.filter(w => w.status === 'success').reduce((sum, w) => sum + w.amount, 0),
    totalReferrals: referrals.length,
    pendingReferrals: referrals.filter(r => r.status === 'pending').length,
    completedReferrals: referrals.filter(r => r.status === 'completed').length,
    totalWalletBalance: wallets.reduce((sum, w) => sum + w.total_balance, 0),
    activeUsers: paymentCounts.length,
    totalProductDownloads,
  };

  // Get wallet for viewing user
  const getWalletForUser = (userId: string) => {
    return wallets.find(w => w.user_id === userId) || null;
  };

  const getPaymentTotalForUser = (userId: string) => {
    return paymentCounts.find(p => p.user_id === userId)?.total_paid || 0;
  };

  const getReportCountForUser = (userId: string) => {
    return reportCounts.find(r => r.user_id === userId)?.count || 0;
  };

  const isUserActive = (userId: string) => {
    return paymentCounts.some(p => p.user_id === userId);
  };

  const refreshAllData = () => {
    fetchPayments();
    fetchUsers();
    fetchWithdrawals();
    fetchWallets();
    fetchReferrals();
    fetchReports();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">Admin Panel</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Complete overview of all users, payments, and system stats</p>
        </div>

        {/* Comprehensive Stats */}
        <div className="mb-8">
          <AdminStats stats={comprehensiveStats} />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <IndianRupee className="w-4 h-4" />
              Payments ({paymentStats.pending} pending)
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-2">
              <IndianRupee className="w-4 h-4" />
              Withdrawals ({withdrawals.filter(w => w.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab with User Details */}
          <TabsContent value="overview" className="space-y-6">
            <UserDetailsTable
              users={users}
              wallets={wallets}
              reportCounts={reportCounts}
              paymentCounts={paymentCounts}
              onRefresh={refreshAllData}
              onEditPassword={(u) => {
                setSelectedUser(u);
                setNewPassword('');
              }}
              onViewUser={(u) => setViewingUser(u)}
            />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{paymentStats.total}</p>
                      <p className="text-xs text-muted-foreground">Total Payments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{paymentStats.pending}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{paymentStats.verified}</p>
                      <p className="text-xs text-muted-foreground">Verified</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">₹{paymentStats.totalAmount}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payments Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-display">All Payments</CardTitle>
                  <CardDescription>Review and approve pending payments</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchPayments}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Transaction #</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No payments found
                          </TableCell>
                        </TableRow>
                      ) : (
                        payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(payment.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={payment.payment_type === 'topup' ? 'secondary' : 'outline'}>
                                {payment.payment_type === 'topup' ? 'Top-up' : 'Report'}
                              </Badge>
                            </TableCell>
                            <TableCell>{payment.payer_name || '-'}</TableCell>
                            <TableCell>{payment.payer_mobile || '-'}</TableCell>
                            <TableCell className="font-mono text-sm">
                              <div className="flex items-center gap-2">
                                {payment.transaction_number || '-'}
                                {payment.transaction_number && 
                                  duplicateTransactions.has(payment.transaction_number.trim().toLowerCase()) && (
                                  <Badge variant="destructive" className="text-xs">
                                    ⚠️ Duplicate ({duplicateTransactions.get(payment.transaction_number.trim().toLowerCase())})
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">₹{payment.amount}</TableCell>
                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSelectPayment(payment)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {payment.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleApprove(payment.id)}
                                      disabled={processing === payment.id}
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleReject(payment.id)}
                                      disabled={processing === payment.id}
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* Users Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-display">All Users</CardTitle>
                  <CardDescription>Manage user accounts and reset passwords</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchUsers}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Joined</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(u.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </TableCell>
                            <TableCell>{u.email || '-'}</TableCell>
                            <TableCell>{u.full_name || '-'}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setNewPassword('');
                                }}
                              >
                                <Key className="w-4 h-4 mr-2" />
                                Edit Password
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <IndianRupee className="w-5 h-5" />
                  Withdrawal Requests
                </CardTitle>
                <CardDescription>
                  Pending: {withdrawals.filter(w => w.status === 'pending').length} | 
                  Completed: {withdrawals.filter(w => w.status === 'success').length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>UPI ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Txn ID</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No withdrawal requests
                          </TableCell>
                        </TableRow>
                      ) : (
                        withdrawals.map((w) => (
                          <TableRow key={w.id}>
                            <TableCell className="font-medium">
                              {new Date(w.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {getUserInfo(w.user_id)}
                            </TableCell>
                            <TableCell className="font-bold">₹{w.amount}</TableCell>
                            <TableCell className="font-mono text-sm">{w.upi_id}</TableCell>
                            <TableCell>
                              {w.status === 'success' ? (
                                <Badge className="bg-green-100 text-green-800">Success</Badge>
                              ) : w.status === 'rejected' ? (
                                <Badge variant="destructive">Rejected</Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {w.transaction_id || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {w.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedWithdrawal(w)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Process
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <AdminProducts />
          </TabsContent>
        </Tabs>
      </main>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={handleClosePaymentDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedPayment.payer_name || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mobile</p>
                  <p className="font-medium">{selectedPayment.payer_mobile || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedPayment.payer_email || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Transaction #</p>
                  <p className="font-medium font-mono">{selectedPayment.transaction_number || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg text-primary">₹{selectedPayment.amount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(selectedPayment.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {selectedPayment.screenshot_url && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Payment Screenshot</p>
                  {loadingScreenshot ? (
                    <div className="w-full h-48 rounded-lg border flex items-center justify-center bg-muted">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : screenshotSignedUrl ? (
                    <img
                      src={screenshotSignedUrl}
                      alt="Payment screenshot"
                      className="w-full rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-48 rounded-lg border flex items-center justify-center bg-muted">
                      <p className="text-muted-foreground text-sm">Failed to load screenshot</p>
                    </div>
                  )}
                </div>
              )}

              {selectedPayment.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1"
                    onClick={() => handleApprove(selectedPayment.id)}
                    disabled={processing === selectedPayment.id}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve Payment
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleReject(selectedPayment.id)}
                    disabled={processing === selectedPayment.id}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Key className="w-5 h-5" />
              Edit Password
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="text-sm">
                <p className="text-muted-foreground">User Email</p>
                <p className="font-medium">{selectedUser.email || 'No email'}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={updatingPassword}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1"
                  onClick={handleUpdatePassword}
                  disabled={updatingPassword || newPassword.length < 6}
                >
                  {updatingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                  disabled={updatingPassword}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdrawal Processing Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Process Withdrawal</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{getUserInfo(selectedWithdrawal.user_id)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg text-green-600">₹{selectedWithdrawal.amount}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">UPI ID</p>
                  <p className="font-mono font-medium">{selectedWithdrawal.upi_id}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="txnId">Transaction ID (after transfer)</Label>
                <Input
                  id="txnId"
                  placeholder="Enter UPI Transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApproveWithdrawal(selectedWithdrawal)}
                  disabled={processingWithdrawal === selectedWithdrawal.id}
                >
                  {processingWithdrawal === selectedWithdrawal.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleRejectWithdrawal(selectedWithdrawal)}
                  disabled={processingWithdrawal === selectedWithdrawal.id}
                >
                  {processingWithdrawal === selectedWithdrawal.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <UserDetailsDialog
        user={viewingUser}
        wallet={viewingUser ? getWalletForUser(viewingUser.user_id) : null}
        reportsCount={viewingUser ? getReportCountForUser(viewingUser.user_id) : 0}
        paymentsTotal={viewingUser ? getPaymentTotalForUser(viewingUser.user_id) : 0}
        isActive={viewingUser ? isUserActive(viewingUser.user_id) : false}
        onClose={() => setViewingUser(null)}
      />
    </div>
  );
};

export default Admin;
