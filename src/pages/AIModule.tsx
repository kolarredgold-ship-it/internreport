import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { FileText, MessageSquare, Brain, BookOpen, Code, Briefcase, Sparkles, Download, Star, Users, Gift, IndianRupee, CheckCircle2, Package, ArrowRight, Zap, GraduationCap, Shield, Clock } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import WalletHeader from '@/components/WalletHeader';
import ShareButtons from '@/components/ShareButtons';
import SharePopup from '@/components/SharePopup';
import FloatingShareButton from '@/components/FloatingShareButton';
import StatsCounter from '@/components/StatsCounter';
import StickyBanner from '@/components/StickyBanner';
import DemoReportGenerator from '@/components/DemoReportGenerator';

const studentReviews = [
  { name: "Priya Sharma", college: "BMS College, Bangalore", course: "BBA", review: "Amazing service! Got my 40-page marketing internship report in just 10 minutes.", avatar: "PS" },
  { name: "Rahul Kumar", college: "Christ University", course: "BCom", review: "Saved me 2 weeks of work! The AI understood my internship at a CA firm perfectly.", avatar: "RK" },
  { name: "Sneha Patil", college: "Mount Carmel College", course: "MBA", review: "Best ₹499 I ever spent! My HR internship report was accepted without any changes.", avatar: "SP" },
  { name: "Arun Reddy", college: "PES University", course: "BCA", review: "The report quality is excellent. My guide was impressed with the structure and content.", avatar: "AR" },
  { name: "Kavitha M", college: "Jain University", course: "BBM", review: "I was skeptical at first, but the report was beyond my expectations.", avatar: "KM" },
  { name: "Vikram Singh", college: "REVA University", course: "BCom", review: "Got my banking internship report done in minutes! Great value!", avatar: "VS" },
  { name: "Ananya Rao", college: "St. Joseph's College", course: "BBA", review: "The instant download feature is a lifesaver! Submitted my report just before deadline.", avatar: "AR" },
  { name: "Mohammed Faisal", college: "CMR University", course: "MBA", review: "Professional quality report with proper citations. Perfectly documented.", avatar: "MF" },
  { name: "Deepika S", college: "Dayananda Sagar College", course: "BCA", review: "Used it for my IT internship report. The technical content was accurate. 5 stars!", avatar: "DS" },
  { name: "Karthik Nair", college: "Kristu Jayanti College", course: "BCom", review: "The customer support was helpful and the report was delivered instantly.", avatar: "KN" },
  { name: "Pooja Hegde", college: "Presidency College", course: "BBA", review: "My sales & marketing internship report was perfect!", avatar: "PH" },
  { name: "Suresh Babu", college: "MES College", course: "MBA", review: "Excellent service! Got my supply chain management report with all diagrams.", avatar: "SB" },
];

const AIModule = () => {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const demoRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('digital_products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4);
      if (data) setFeaturedProducts(data);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchParams.get('demo') === 'true' && demoRef.current) {
      setTimeout(() => {
        demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen hero-gradient">
      <Helmet>
        <title>InternReport.in - AI Report Generator & Mock Interview | Free Internship Reports</title>
        <meta name="description" content="AI-powered internship report generator and mock interview training. Free samples for BCA, BTech, MBA, BCom students. Trusted by 10,000+ students." />
        <meta name="keywords" content="internship report, AI report generator, mock interview, free internship report, BCA, BTech, MBA" />
        <link rel="canonical" href="https://internreport.in/" />
      </Helmet>

      <SharePopup trigger="time" delay={30000} />
      <FloatingShareButton />
      <StickyBanner />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">InternReport.in</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/home">
              <Button variant="outline" size="sm" className="hidden sm:flex gap-1">
                <BookOpen className="w-4 h-4" /> Reports
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-1">
                <Package className="w-4 h-4" /> Products
              </Button>
            </Link>
            <WalletHeader />
            {user ? (
              <Link to="/dashboard">
                <Button variant="gradient">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/auth?signup=true">
                  <Button variant="gradient">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-28">
        <div className="max-w-4xl mx-auto text-center animate-slide-up">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">10,000+ Students Served</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-600">
              <Star className="w-4 h-4 fill-yellow-500" />
              <span className="text-sm font-medium">4.8/5 Rating</span>
            </div>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Your <span className="gradient-text">AI-Powered</span> Career &
            <br />Internship Platform
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            Generate internship reports, prepare for interviews with AI mock training, and access premium career resources — all in one place.
          </p>
          
          <p className="text-sm text-muted-foreground mb-8 max-w-xl mx-auto">
            Free samples for BCA, BTech, MBA, BCom, BBA • AI Mock Interviews • Digital Resources
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link to={user ? "/create-report" : "/auth?signup=true"}>
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                <Download className="w-5 h-5" />
                Download Free Reports
              </Button>
            </Link>
            <Link to={user ? "/ai/mock-interview" : "/auth?redirect=/ai/mock-interview"}>
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                <Brain className="w-5 h-5" />
                Start Mock Interview
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Share:</span>
            <ShareButtons variant="inline" />
          </div>
        </div>

        {/* Demo Report Generator */}
        <div ref={demoRef} className="max-w-3xl mx-auto mt-16">
          <DemoReportGenerator />
        </div>
      </section>

      {/* Stats Counter */}
      <section className="container mx-auto px-4 py-8 bg-secondary/30 rounded-3xl my-8">
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Trusted by Students Across India</h2>
          <p className="text-muted-foreground">Join thousands of students who saved time with InternReport.in</p>
        </div>
        <StatsCounter />
      </section>

      {/* AI Platform Cards */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Platform</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Choose Your <span className="gradient-text">AI Service</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Powerful AI tools designed for students — generate reports or prepare for interviews
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card 1 - Report Generator */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-soft overflow-hidden animate-scale-in">
            <CardContent className="p-8 flex flex-col h-full">
              <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4">AI Report Generator</h3>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  { icon: BookOpen, text: 'Generate internship reports' },
                  { icon: Sparkles, text: 'Improve report content' },
                  { icon: FileText, text: 'Create project documentation' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <Link to={user ? "/create-report" : "/auth?redirect=/create-report"}>
                <Button variant="gradient" size="lg" className="w-full">
                  Start Report Generator
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card 2 - Mock Interview */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-soft overflow-hidden animate-scale-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-8 flex flex-col h-full">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4">AI Mock Interview Training</h3>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  { icon: MessageSquare, text: 'Interview preparation' },
                  { icon: Code, text: 'Programming interview questions' },
                  { icon: Briefcase, text: 'Job readiness training' },
                  { icon: Brain, text: 'AI feedback & scoring' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <item.icon className="w-4 h-4 text-accent flex-shrink-0" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <Link to={user ? "/ai/mock-interview" : "/auth?redirect=/ai/mock-interview"}>
                <Button size="lg" className="w-full bg-gradient-to-r from-accent to-primary text-primary-foreground hover:opacity-90">
                  Start Mock Interview Training
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Why Choose InternReport.in?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Built specifically for Indian university students</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Zap, title: 'AI-Powered', description: 'Advanced AI creates exam-ready, university-compliant reports in minutes' },
            { icon: GraduationCap, title: 'University Format', description: 'Follows Indian university patterns including Bengaluru North University' },
            { icon: Shield, title: 'Plagiarism Free', description: 'Each report is uniquely generated for your specific internship' },
            { icon: Clock, title: 'Instant Delivery', description: 'Get perfectly formatted Word documents ready for submission' },
          ].map((f, i) => (
            <Card key={i} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-soft animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Refer & Earn */}
      <section className="container mx-auto px-4 py-8">
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
                <Gift className="w-4 h-4" />
                <span className="text-sm font-medium">Refer & Earn Program</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                Earn ₹150 For Every Friend You Invite!
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join thousands of students earning real money by sharing InternReport.in
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {[
                { step: '1', title: 'Sign Up & Get ₹100', desc: 'Create account and receive ₹100 welcome bonus instantly' },
                { step: '2', title: 'Share Your Referral ID', desc: 'Share your mobile number as referral ID via WhatsApp' },
                { step: '3', title: 'Earn ₹150 Per Referral', desc: 'Get ₹150 when your friend makes a payment. Withdraw via UPI!' },
              ].map((s, i) => (
                <div key={i} className="text-center p-4 bg-background/50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="font-bold text-primary">{s.step}</span>
                  </div>
                  <h4 className="font-semibold mb-1">{s.title}</h4>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-primary/5 rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">Bonus: +₹50 for 2nd Level Referrals!</p>
                    <p className="text-sm text-muted-foreground">When your referral invites someone, you earn ₹50 extra!</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Link to={user ? "/refer" : "/auth?signup=true"}>
                <Button variant="gradient" size="lg">
                  <Gift className="w-5 h-5 mr-2" />
                  Start Earning Now
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-3">
                ✓ Instant UPI Withdrawals &nbsp; ✓ No Minimum Payout &nbsp; ✓ Real Cash Rewards
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Student Reviews */}
      <section className="container mx-auto px-4 py-16 bg-secondary/30 rounded-3xl my-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-600 mb-4">
            <Star className="w-4 h-4 fill-yellow-500" />
            <span className="text-sm font-medium">Student Reviews</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">What Our Students Say</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Join 10,000+ students who got their reports generated instantly</p>
        </div>
        
        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {studentReviews.map((review, index) => (
              <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <Card className="border-0 shadow-soft hover:shadow-lg transition-all duration-300 h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">"{review.review}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">{review.avatar}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{review.name}</p>
                        <p className="text-xs text-muted-foreground">{review.course} • {review.college}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center gap-2 mt-6">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
        
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Verified Student Reviews</span>
          </div>
        </div>
      </section>

      {/* Digital Products */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Package className="w-4 h-4" />
            <span className="text-sm font-medium">Digital Products</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Premium Digital Resources</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">2000+ templates, prompts, ebooks, bundles & more — instant download</p>
        </div>
        {featuredProducts.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
            {featuredProducts.map((product: any) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-soft group">
                <Link to={`/products/${product.slug}`}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="w-full h-28 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-28 sm:h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Package className="w-8 h-8 sm:w-10 sm:h-10 text-primary/30" />
                    </div>
                  )}
                </Link>
                <CardContent className="p-3 sm:p-4">
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="font-display font-semibold text-sm sm:text-base line-clamp-2 hover:text-primary transition-colors mb-1">{product.title}</h3>
                  </Link>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mb-2">{product.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-primary text-sm sm:text-base">₹{product.offer_price || 299}</span>
                    {(product.actual_price > 0) && (
                      <span className="text-xs text-muted-foreground line-through">₹{product.actual_price}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <div className="text-center">
          <Link to="/products">
            <Button variant="gradient" size="lg">
              View All 2000+ Products <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-xl">InternReport.in</span>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                AI-powered internship report generator & career platform for Indian university students.
              </p>
              <ShareButtons variant="compact" />
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/home" className="hover:text-primary transition-colors">Report Generator</Link></li>
                <li><Link to="/products" className="hover:text-primary transition-colors">Digital Products</Link></li>
                <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">AI Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/ai/mock-interview" className="hover:text-primary transition-colors">Mock Interview</Link></li>
                <li><Link to="/refer" className="hover:text-primary transition-colors">Refer & Earn ₹150</Link></li>
                <li><Link to="/blog" className="hover:text-primary transition-colors">Free Report Samples</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Policies</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 mt-8 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">© 2024 InternReport.in. All rights reserved.</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Contact:</span>
                <span>support@internreport.in</span>
                <span>•</span>
                <span>+91 9738959525</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AIModule;
