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
  Loader2
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

interface Payment {
  id: string;
  user_id: string;
  report_id: string | null;
  amount: number;
  status: string;
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
  created_at: string;
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
  
  // User management state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

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
    } catch (error: any) {
      console.error('Fetch payments error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payments.',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (paymentId: string) => {
    setProcessing(paymentId);
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: user?.id
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: 'Payment Approved',
        description: 'The payment has been verified and activated.',
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

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    verified: payments.filter(p => p.status === 'verified').length,
    totalAmount: payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount, 0),
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

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Payment Management</h1>
          <p className="text-muted-foreground">Verify and manage user payments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
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
                  <p className="text-2xl font-bold">{stats.pending}</p>
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
                  <p className="text-2xl font-bold">{stats.verified}</p>
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
                  <p className="text-2xl font-bold">₹{stats.totalAmount}</p>
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
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                        <TableCell>{payment.payer_name || '-'}</TableCell>
                        <TableCell>{payment.payer_mobile || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.transaction_number || '-'}
                        </TableCell>
                        <TableCell className="font-semibold">₹{payment.amount}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
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
      </main>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
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
                  <img
                    src={selectedPayment.screenshot_url}
                    alt="Payment screenshot"
                    className="w-full rounded-lg border"
                  />
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
    </div>
  );
};

export default Admin;
