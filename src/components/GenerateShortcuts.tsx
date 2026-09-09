import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, FolderKanban, ScrollText, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const COURSES = [
  { label: 'BA', slug: 'ba' },
  { label: 'B.Com', slug: 'bcom' },
  { label: 'BBA', slug: 'bba' },
  { label: 'BCA', slug: 'bca' },
  { label: 'M.Com', slug: 'mcom' },
  { label: 'MBA', slug: 'mba' },
  { label: 'MA', slug: 'ma' },
  { label: 'MSc', slug: 'msc' },
  { label: 'M.Ed.', slug: 'med' },
  { label: 'PhD', slug: 'phd' },
  { label: 'M.Phil', slug: 'mphil' },
];

const CATEGORIES = [
  {
    key: 'internship',
    title: 'Internship Report',
    description: 'Company-based internship reports with certificate, chapters & annexures.',
    icon: Briefcase,
    accent: 'from-primary/10 to-primary/5',
    iconBg: 'bg-primary/10 text-primary',
  },
  {
    key: 'project',
    title: 'Project Report',
    description: 'Academic project & case-study reports formatted to university guidelines.',
    icon: FolderKanban,
    accent: 'from-primary/5 to-primary/10',
    iconBg: 'bg-primary/10 text-primary',
  },
  {
    key: 'thesis',
    title: 'Thesis / Dissertation',
    description: 'Structure and format your research for PhD, M.Phil & PG dissertations.',
    icon: ScrollText,
    accent: 'from-primary/10 to-primary/5',
    iconBg: 'bg-primary/10 text-primary',
  },
];

const CourseSlider = ({ categoryKey }: { categoryKey: string }) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.7), behavior: 'smooth' });
  };

  return (
    <div className="relative -mx-2 mb-4 group/slider">
      <button
        type="button"
        aria-label="Scroll courses left"
        onClick={() => scrollBy(-1)}
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center rounded-full bg-background border border-border shadow-soft text-foreground/70 hover:text-primary hover:border-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div
        ref={trackRef}
        className="flex gap-2 overflow-x-auto px-2 sm:px-8 pb-2 snap-x snap-mandatory scroll-smooth scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {COURSES.map(c => (
          <Link
            key={c.slug}
            to={`/generate/${categoryKey}?course=${c.slug}`}
            className="shrink-0 snap-start px-3.5 py-2 rounded-full text-xs font-medium bg-background/80 border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 transition-all whitespace-nowrap"
          >
            {c.label}
          </Link>
        ))}
      </div>

      <button
        type="button"
        aria-label="Scroll courses right"
        onClick={() => scrollBy(1)}
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center rounded-full bg-background border border-border shadow-soft text-foreground/70 hover:text-primary hover:border-primary transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const GenerateShortcuts = () => {
  return (
    <section className="container mx-auto px-4 py-8 lg:py-12">
      <div className="bento-card p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-1">Jump straight to your course</h2>
          <p className="text-sm text-muted-foreground">Pick a course and we'll pre-fill the right form for you.</p>
        </div>

        <div className="space-y-6">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <div key={cat.key} className="min-w-0">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cat.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base truncate">{cat.title}</span>
                  </div>
                  <Link
                    to={`/generate/${cat.key}`}
                    className="shrink-0 inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-accent hover:underline"
                  >
                    Start <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <CourseSlider categoryKey={cat.key} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};


export default GenerateShortcuts;
