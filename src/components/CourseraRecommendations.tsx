import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Clock, Users, ExternalLink, Sparkles, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Course {
  id: string;
  title: string;
  partner: string;
  description: string;
  rating: number;
  enrollments: string;
  duration: string;
  level: string;
  isFree: boolean;
  discount: string | null;
  imageUrl: string;
  affiliateUrl: string;
}

interface CourseraRecommendationsProps {
  userDomain?: string;
  className?: string;
}

const CourseraRecommendations = ({ userDomain, className = '' }: CourseraRecommendationsProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('coursera-courses', {
          body: { domain: userDomain || 'default' }
        });

        if (error) {
          console.error('Error fetching courses:', error);
          return;
        }

        if (data?.featuredCourses) {
          setCourses(data.featuredCourses);
        }
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [userDomain]);

  const handleCourseClick = (affiliateUrl: string, courseTitle: string) => {
    // Track click for analytics
    console.log(`Affiliate click: ${courseTitle}`);
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <section className={`py-12 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) return null;

  return (
    <section className={`py-12 bg-gradient-to-br from-secondary/30 via-background to-primary/5 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">
                Recommended Courses
              </h2>
              <p className="text-sm text-muted-foreground">
                Boost your career with top-rated courses from Coursera
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Free & Discounted
          </Badge>
        </div>

        {/* Course Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.slice(0, 6).map((course) => (
            <Card 
              key={course.id}
              className="group overflow-hidden border-0 shadow-soft hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleCourseClick(course.affiliateUrl, course.title)}
            >
              {/* Course Image */}
              <div className="relative h-36 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                <img 
                  src={course.imageUrl} 
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {/* Discount Badge */}
                {(course.isFree || course.discount) && (
                  <div className="absolute top-3 left-3">
                    <Badge className={course.isFree ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}>
                      {course.isFree ? '🎁 FREE' : course.discount}
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                {/* Partner */}
                <p className="text-xs text-muted-foreground mb-1">{course.partner}</p>
                
                {/* Title */}
                <h3 className="font-display font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                
                {/* Description */}
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {course.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{course.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{course.enrollments}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{course.duration}</span>
                  </div>
                </div>

                {/* Level Badge */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {course.level}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-xs gap-1 text-primary hover:text-primary"
                  >
                    Enroll Now
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            📚 Complete an internship report + get certified courses = Perfect combo for placements!
          </p>
          <a 
            href="https://www.coursera.org/?utm_source=internreport" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="gap-2">
              Explore More Courses
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default CourseraRecommendations;
