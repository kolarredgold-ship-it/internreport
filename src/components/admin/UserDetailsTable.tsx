import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Key, Search, Eye, FileText, Wallet, Gift, MessageCircle } from 'lucide-react';

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
}

interface UserReport {
  user_id: string;
  count: number;
}

interface UserPayment {
  user_id: string;
  verified_count: number;
  total_paid: number;
}

interface UserDetailsTableProps {
  users: UserProfile[];
  wallets: UserWallet[];
  reportCounts: UserReport[];
  paymentCounts: UserPayment[];
  onRefresh: () => void;
  onEditPassword: (user: UserProfile) => void;
  onViewUser: (user: UserProfile) => void;
}

const UserDetailsTable = ({
  users,
  wallets,
  reportCounts,
  paymentCounts,
  onRefresh,
  onEditPassword,
  onViewUser,
}: UserDetailsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getWalletData = (userId: string) => {
    return wallets.find(w => w.user_id === userId);
  };

  const getReportCount = (userId: string) => {
    return reportCounts.find(r => r.user_id === userId)?.count || 0;
  };

  const getPaymentData = (userId: string) => {
    return paymentCounts.find(p => p.user_id === userId);
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(term) ||
      user.full_name?.toLowerCase().includes(term) ||
      user.mobile_number?.includes(term) ||
      user.college_name?.toLowerCase().includes(term)
    );
  });

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="font-display">All Users ({users.length})</CardTitle>
          <CardDescription>Complete user details with wallet and report info</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Joined</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>College</TableHead>
                <TableHead>Reports</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Referred By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const wallet = getWalletData(user.user_id);
                  const reports = getReportCount(user.user_id);
                  const payment = getPaymentData(user.user_id);
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(user.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.full_name || '-'}
                      </TableCell>
                      <TableCell className="text-sm">{user.email || '-'}</TableCell>
                      <TableCell className="text-sm font-mono">{user.mobile_number || '-'}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate" title={user.college_name || ''}>
                        {user.college_name || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium">{reports}</span>
                          <span className="text-muted-foreground text-xs">
                            ({user.generations_used || 0}/1)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment && payment.verified_count > 0 ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            ₹{payment.total_paid}
                          </Badge>
                        ) : (
                          <Badge variant="outline">₹0</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Wallet className="w-3 h-3 text-green-600" />
                          <span className="font-medium text-green-600">
                            ₹{wallet?.total_balance || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {user.referred_by ? (
                          <div className="flex items-center gap-1">
                            <Gift className="w-3 h-3 text-pink-500" />
                            <span className="text-xs">{user.referred_by}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewUser(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditPassword(user)}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserDetailsTable;
