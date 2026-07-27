import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, FolderKanban, ScrollText, ArrowRight } from 'lucide-react';

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
    accent: 'from-accent/10 to-accent/5',
    iconBg: 'bg-accent/10 text-accent',
  },
  {
    key: 'thesis',
    title: 'Thesis / Dissertation',
    description: 'Structure and format your research for PhD, M.Phil & PG dissertations.',
    icon: ScrollText,
    accent: 'from-primary/10 to-accent/5',
    iconBg: 'bg-primary/10 text-primary',
  },
];

const GenerateShortcuts = () => {
  return (
    <section className="container mx-auto px-4 py-14 lg:py-20">
      <div className="grid md:grid-cols-3 gap-6">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          return (
            <Card
              key={cat.key}
              className={`p-5 sm:p-6 border-0 shadow-soft hover-lift min-w-0 w-full overflow-hidden bg-gradient-to-br ${cat.accent}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${cat.iconBg}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold mb-1">{cat.title}</h3>
              <p className="text-sm text-muted-foreground mb-5">{cat.description}</p>

              <div className="-mx-2 mb-4">
                <div className="flex gap-2 overflow-x-auto px-2 pb-2 snap-x snap-mandatory scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible md:snap-none">
                  {COURSES.map(c => (
                    <Link
                      key={c.slug}
                      to={`/generate/${cat.key}?course=${c.slug}`}
                      className="shrink-0 snap-start px-3.5 py-2 rounded-full text-xs font-medium bg-background/80 border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 transition-all whitespace-nowrap"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>

              <Link to={`/generate/${cat.key}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Start {cat.title} <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default GenerateShortcuts;
