import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('hold'), 100);
    const exitTimer = setTimeout(() => setPhase('exit'), 2000);
    const completeTimer = setTimeout(onComplete, 2600);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-[spin_8s_linear_infinite] opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/40 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-accent-foreground/30 blur-3xl" />
        </div>
      </div>

      {/* Logo */}
      <div
        className={`relative flex flex-col items-center gap-6 transition-all duration-700 ease-out ${
          phase === 'enter'
            ? 'scale-90 opacity-0 translate-y-4'
            : phase === 'exit'
            ? 'scale-110 opacity-0 -translate-y-4'
            : 'scale-100 opacity-100 translate-y-0'
        }`}
      >
        <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center shadow-glow animate-[pulse_2s_ease-in-out_infinite]">
          <FileText className="w-10 h-10 text-primary-foreground" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            InternReport.in
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            AI-Powered Internship Reports
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              style={{
                animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
