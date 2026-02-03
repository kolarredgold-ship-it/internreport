import { useState, useEffect } from 'react';
import { X, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const StickyBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem('stickyBannerDismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show banner after scroll
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('stickyBannerDismissed', 'true');
  };

  if (isDismissed || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-primary to-accent text-primary-foreground py-3 px-4 shadow-lg animate-slide-up">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="hidden sm:flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Limited Time</span>
          </div>
          <p className="text-sm md:text-base font-medium">
            <span className="hidden md:inline">⏰ Save 100+ hours – </span>
            Get ready-made internship reports instantly!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth?signup=true">
            <Button size="sm" variant="secondary" className="whitespace-nowrap">
              Get Started
            </Button>
          </Link>
          <Button 
            size="icon" 
            variant="ghost" 
            className="w-8 h-8 text-primary-foreground hover:bg-white/20"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StickyBanner;
