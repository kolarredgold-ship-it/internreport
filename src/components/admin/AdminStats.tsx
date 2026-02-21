import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  FileText, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Wallet,
  Gift,
  TrendingUp
} from 'lucide-react';

interface StatsData {
  totalUsers: number;
  totalReports: number;
  totalPayments: number;
  pendingPayments: number;
  verifiedPayments: number;
  rejectedPayments: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  completedWithdrawals: number;
  totalWithdrawalAmount: number;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalWalletBalance: number;
  activeUsers: number;
  totalProductDownloads?: number;
}

interface AdminStatsProps {
  stats: StatsData;
}

const AdminStats = ({ stats }: AdminStatsProps) => {
  const statCards = [
    {
      icon: Users,
      value: stats.totalUsers,
      label: 'Total Users',
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      icon: CheckCircle2,
      value: stats.activeUsers,
      label: 'Active Users',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600',
    },
    {
      icon: FileText,
      value: stats.totalReports,
      label: 'Total Reports',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600',
    },
    {
      icon: IndianRupee,
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      label: 'Total Revenue',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600',
      isHighlight: true,
    },
    {
      icon: TrendingUp,
      value: stats.totalPayments,
      label: 'Total Payments',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600',
    },
    {
      icon: Clock,
      value: stats.pendingPayments,
      label: 'Pending Payments',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600',
    },
    {
      icon: CheckCircle2,
      value: stats.verifiedPayments,
      label: 'Verified Payments',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600',
    },
    {
      icon: XCircle,
      value: stats.rejectedPayments,
      label: 'Rejected Payments',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600',
    },
    {
      icon: Wallet,
      value: stats.pendingWithdrawals,
      label: 'Pending Withdrawals',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600',
    },
    {
      icon: Wallet,
      value: `₹${stats.totalWithdrawalAmount.toLocaleString('en-IN')}`,
      label: 'Total Withdrawals',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
      iconColor: 'text-cyan-600',
    },
    {
      icon: Gift,
      value: stats.totalReferrals,
      label: 'Total Referrals',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      iconColor: 'text-pink-600',
    },
    {
      icon: IndianRupee,
      value: `₹${stats.totalWalletBalance.toLocaleString('en-IN')}`,
      label: 'Total Wallet Balance',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600',
    },
    {
      icon: TrendingUp,
      value: stats.totalProductDownloads || 0,
      label: 'Product Downloads',
      bgColor: 'bg-violet-100 dark:bg-violet-900/30',
      iconColor: 'text-violet-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className={stat.isHighlight ? 'border-green-500/50 shadow-lg' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-lg font-bold truncate ${stat.isHighlight ? 'text-green-600' : ''}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStats;
