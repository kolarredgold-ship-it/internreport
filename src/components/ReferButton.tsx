import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ReferButton = () => {
  return (
    <Link to="/refer">
      <Button
        variant="outline"
        className="w-full border-green-500 text-green-600 hover:bg-green-500/10 hover:text-green-700"
      >
        <Gift className="w-4 h-4 mr-2" />
        Refer & Earn ₹150 Per Referral
      </Button>
    </Link>
  );
};

export default ReferButton;
