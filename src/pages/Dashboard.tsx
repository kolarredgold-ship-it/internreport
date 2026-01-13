import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  LogOut, 
  Plus, 
  History, 
  User,
  Zap,
  AlertCircle,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  generations_used: number;
  full_name: string | null;
  email: string | null;
}

interface AccountStatus {
  isActive: boolean;
  label: string;
}

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>({ isActive: false, label: 'Inactive - Payment Pending' });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      checkAdminStatus();
      checkAccountStatus();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('generations_used, full_name, email')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user?.id, _role: 'admin' });

      if (error) throw error;
      setIsAdmin(data || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const checkAccountStatus = async () => {
    try {
      // Check if user has any verified payment (admin sets status to 'verified')
      const { data, error } = await supabase
        .from('payments')
        .select('id, status')
        .eq('user_id', user?.id)
        .eq('status', 'verified')
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setAccountStatus({ isActive: true, label: 'Active' });
      } else {
        // Check if there's a pending payment
        const { data: pendingData } = await supabase
          .from('payments')
          .select('id, status')
          .eq('user_id', user?.id)
          .eq('status', 'pending')
          .limit(1);

        if (pendingData && pendingData.length > 0) {
          setAccountStatus({ isActive: false, label: 'Payment Under Review' });
        } else {
          setAccountStatus({ isActive: false, label: 'Inactive - Payment Pending' });
        }
      }
    } catch (error) {
      console.error('Error checking account status:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const remainingGenerations = 3 - (profile?.generations_used || 0);
  const needsTopUp = remainingGenerations <= 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">IPRG</span>
          </Link>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
            )}
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Create and manage your internship reports</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{remainingGenerations}</p>
                  <p className="text-sm text-muted-foreground">Generations Left</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{profile?.generations_used || 0}</p>
                  <p className="text-sm text-muted-foreground">Reports Generated</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accountStatus.isActive ? 'bg-success/10' : 'bg-warning/10'}`}>
                  <User className={`w-6 h-6 ${accountStatus.isActive ? 'text-success' : 'text-warning'}`} />
                </div>
                <div>
                  <p className={`text-lg font-display font-bold ${accountStatus.isActive ? 'text-success' : 'text-warning'}`}>
                    {accountStatus.label}
                  </p>
                  <p className="text-sm text-muted-foreground">Account Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Up Alert */}
        {needsTopUp && (
          <Card className="border-warning/50 bg-warning/5 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display font-semibold mb-1">Generation Limit Reached</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    You've used all 3 free generations. Top up to continue creating reports.
                  </p>
                  <Button variant="gradient">
                    Top Up ₹499 for 5 Reports
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-soft hover:shadow-lg transition-shadow cursor-pointer group">
            <Link to="/create-report">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-glow">
                  <Plus className="w-7 h-7 text-primary-foreground" />
                </div>
                <CardTitle className="font-display">Create New Report</CardTitle>
                <CardDescription>
                  Generate a new internship project report using AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="gradient" className="w-full" disabled={needsTopUp}>
                  {needsTopUp ? 'Top Up Required' : 'Start Creating'}
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="border-0 shadow-soft hover:shadow-lg transition-shadow cursor-pointer group">
            <Link to="/my-reports">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <History className="w-7 h-7 text-accent" />
                </div>
                <CardTitle className="font-display">My Reports</CardTitle>
                <CardDescription>
                  View and download your previously generated reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  View Reports
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
