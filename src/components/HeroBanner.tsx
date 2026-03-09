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
    <div className="relative w-full overflow-hidden rounded-2xl mx-auto" style={{ aspectRatio: '21/8' }}>
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
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
          
          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-6 md:px-12">
              <div className="max-w-lg space-y-3 md:space-y-4">
                <h2
                  className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight transition-all duration-700"
                  style={{
                    opacity: current === i ? 1 : 0,
                    transform: current === i ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: current === i ? '200ms' : '0ms',
                  }}
                >
                  {slide.title}
                </h2>
                <p
                  className="text-sm md:text-base lg:text-lg text-white/85 leading-relaxed transition-all duration-700"
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
                    <Button variant="hero" size="lg">
                      {slide.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              current === i ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;
