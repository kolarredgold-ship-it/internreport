import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ShareButtons from './ShareButtons';
import { Gift, Sparkles, X } from 'lucide-react';

interface SharePopupProps {
  trigger?: 'download' | 'scroll' | 'time';
  delay?: number;
}

const SharePopup = ({ trigger = 'time', delay = 30000 }: SharePopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if already shown in this session
    const shown = sessionStorage.getItem('sharePopupShown');
    if (shown) {
      setHasShown(true);
      return;
    }

    if (trigger === 'time' && !hasShown) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
        sessionStorage.setItem('sharePopupShown', 'true');
      }, delay);
      return () => clearTimeout(timer);
    }

    if (trigger === 'scroll' && !hasShown) {
      const handleScroll = () => {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent > 50) {
          setIsOpen(true);
          setHasShown(true);
          sessionStorage.setItem('sharePopupShown', 'true');
          window.removeEventListener('scroll', handleScroll);
        }
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [trigger, delay, hasShown]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-pulse">
              <Gift className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Share & Help Fellow Students!
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </span>
          </DialogTitle>
          <DialogDescription className="text-center">
            Share InternReport.in with 3 friends to unlock more free resources and earn rewards!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="text-sm text-center text-green-700 dark:text-green-400 font-medium">
              🎁 Earn ₹150 for every friend who signs up using your referral!
            </p>
          </div>
          
          <ShareButtons />
          
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SharePopup;
