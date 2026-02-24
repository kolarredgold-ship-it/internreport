import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Building, 
  FileText,
  Wallet,
  Gift,
  Calendar,
  Hash
} from 'lucide-react';

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

interface UserDetailsDialogProps {
  user: UserProfile | null;
  wallet: UserWallet | null;
  reportsCount: number;
  paymentsTotal: number;
  isActive: boolean;
  onClose: () => void;
}

const UserDetailsDialog = ({ 
  user, 
  wallet, 
  reportsCount, 
  paymentsTotal,
  isActive,
  onClose 
}: UserDetailsDialogProps) => {
  if (!user) return null;

  const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null }) => (
    <div className="flex items-start gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value || '-'}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <User className="w-5 h-5" />
            User Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge className={isActive ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
              {isActive ? 'Active (Paid)' : 'Inactive (Unpaid)'}
            </Badge>
            <Badge variant="outline">
              {reportsCount} Reports Generated
            </Badge>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-x-4">
            <InfoRow icon={User} label="Full Name" value={user.full_name} />
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Phone} label="Mobile" value={user.mobile_number} />
            <InfoRow icon={Hash} label="Register No." value={user.register_number} />
          </div>

          <Separator />

          {/* Academic Info */}
          <div className="grid grid-cols-2 gap-x-4">
            <InfoRow icon={GraduationCap} label="Course" value={user.course} />
            <InfoRow icon={Building} label="College" value={user.college_name} />
            <InfoRow icon={Building} label="University" value={user.university} />
            <InfoRow icon={Calendar} label="Joined" value={new Date(user.created_at).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })} />
          </div>

          <Separator />

          {/* Financial Info */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Financial Details
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="text-lg font-bold text-green-600">₹{paymentsTotal}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Wallet Balance</p>
                <p className="text-lg font-bold">₹{wallet?.total_balance || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Referral Earnings</p>
                <p className="font-medium text-pink-600">₹{wallet?.referral_earnings || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending Earnings</p>
                <p className="font-medium text-amber-600">₹{wallet?.pending_earnings || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Withdrawable</p>
                <p className="font-medium">₹{wallet?.withdrawable_balance || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Welcome Bonus</p>
                <p className="font-medium">₹{wallet?.welcome_bonus || 0}</p>
              </div>
            </div>
          </div>

          {/* Referral Info */}
          {user.referred_by && (
            <>
              <Separator />
              <div className="flex items-center gap-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3">
                <Gift className="w-5 h-5 text-pink-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Referred By</p>
                  <p className="font-mono font-medium">{user.referred_by}</p>
                </div>
              </div>
            </>
          )}

          {/* Usage Stats */}
          <div className="flex items-center gap-4 bg-muted/50 rounded-lg p-3">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Generation Usage</p>
              <p className="font-medium">
                {user.generations_used || 0} / 1 used 
                <span className="text-muted-foreground ml-1">
                  ({1 - (user.generations_used || 0)} remaining)
                </span>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsDialog;
