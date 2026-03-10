import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import banner1 from '@/assets/banner-1.jpg';
import banner2 from '@/assets/banner-2.jpg';
import banner3 from '@/assets/banner-3.jpg';

const slides = [
  {
    image: banner1,
    title: 'AI-Powered Internship Reports',
    subtitle: 'Generate university-compliant reports in minutes. Perfect for BCA, BTech, MBA & more.',
    cta: 'Get Started Free',
    ctaLink: '/auth?signup=true',
    ctaLoggedIn: '/dashboard',
  },
  {
    image: banner2,
    title: 'Smart Report Generation',
    subtitle: 'Advanced AI creates exam-ready, plagiarism-free content with proper academic formatting.',
    cta: 'Generate Report',
    ctaLink: '/auth?signup=true',
    ctaLoggedIn: '/create-report',
  },
  {
    image: banner3,
    title: 'Join 10,000+ Students',
    subtitle: 'Trusted by students across India. Get your internship report ready for submission today.',
    cta: 'Join Now',
    ctaLink: '/auth?signup=true',
    ctaLoggedIn: '/dashboard',
  },
];

const HeroBanner = () => {
  const { user } = useAuth();
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 4500);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative w-full overflow-hidden aspect-[4/3] sm:aspect-[16/7] lg:aspect-[21/8]">
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-all duration-700 ease-in-out"
          style={{
            opacity: current === i ? 1 : 0,
            transform: current === i ? 'scale(1)' : 'scale(1.05)',
          }}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          {/* Overlay - stronger on mobile for readability */}
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-foreground/80 via-foreground/50 to-foreground/20 sm:from-foreground/70 sm:via-foreground/40 sm:to-transparent" />
          
          {/* Content */}
          <div className="absolute inset-0 flex items-end sm:items-center pb-10 sm:pb-0">
            <div className="w-full px-4 sm:px-6 md:px-12">
              <div className="max-w-lg space-y-2 sm:space-y-3 md:space-y-4">
                <h2
                  className="font-display text-lg sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight transition-all duration-700"
                  style={{
                    opacity: current === i ? 1 : 0,
                    transform: current === i ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: current === i ? '200ms' : '0ms',
                  }}
                >
                  {slide.title}
                </h2>
                <p
                  className="text-xs sm:text-sm md:text-base lg:text-lg text-white/85 leading-relaxed transition-all duration-700 line-clamp-2 sm:line-clamp-none"
                  style={{
                    opacity: current === i ? 1 : 0,
                    transform: current === i ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: current === i ? '350ms' : '0ms',
                  }}
                >
                  {slide.subtitle}
                </p>
                <div
                  className="transition-all duration-700"
                  style={{
                    opacity: current === i ? 1 : 0,
                    transform: current === i ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: current === i ? '500ms' : '0ms',
                  }}
                >
                  <Link to={user ? slide.ctaLoggedIn : slide.ctaLink}>
                    <Button variant="hero" size="sm" className="sm:!px-6 sm:!py-3 sm:!text-base">
                      {slide.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}


      {/* Dots */}
      <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
              current === i ? 'w-5 sm:w-6 bg-white' : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;
