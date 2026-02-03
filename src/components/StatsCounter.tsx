import { useEffect, useState } from 'react';
import { Users, FileText, Star, Download } from 'lucide-react';

interface StatItem {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
}

const StatsCounter = () => {
  const [mounted, setMounted] = useState(false);
  const [counts, setCounts] = useState([0, 0, 0, 0]);

  const stats: StatItem[] = [
    { icon: Users, value: 10000, suffix: '+', label: 'Students Served' },
    { icon: FileText, value: 25000, suffix: '+', label: 'Reports Generated' },
    { icon: Star, value: 4.8, suffix: '/5', label: 'Average Rating' },
    { icon: Download, value: 50000, suffix: '+', label: 'Downloads' },
  ];

  useEffect(() => {
    setMounted(true);
    
    const duration = 2000;
    const steps = 50;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setCounts(stats.map(stat => {
        if (stat.value < 10) {
          // For decimal values like rating
          return Number((stat.value * progress).toFixed(1));
        }
        return Math.floor(stat.value * progress);
      }));

      if (currentStep >= steps) {
        clearInterval(timer);
        setCounts(stats.map(stat => stat.value));
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8">
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <stat.icon className="w-6 h-6 text-primary" />
          </div>
          <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">
            {counts[index]}{stat.suffix}
          </div>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCounter;
