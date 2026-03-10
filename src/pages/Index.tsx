import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { FileText, Shield, Zap, Download, CheckCircle2, GraduationCap, BookOpen, Clock, Star, AlertTriangle, Gift, IndianRupee, Sparkles, Users, Award, Package, ArrowRight, Brain, MessageSquare, Code, Briefcase } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import DemoReportGenerator from '@/components/DemoReportGenerator';
import { useAuth } from '@/hooks/useAuth';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import WalletHeader from '@/components/WalletHeader';
import ShareButtons from '@/components/ShareButtons';
import SharePopup from '@/components/SharePopup';
import FloatingShareButton from '@/components/FloatingShareButton';
import StatsCounter from '@/components/StatsCounter';
import StickyBanner from '@/components/StickyBanner';
import HeroBanner from '@/components/HeroBanner';

const Index = () => {
  const {
    user
  } = useAuth();
  const [searchParams] = useSearchParams();
  const demoRef = useRef<HTMLDivElement>(null);
  const [showServerBusyDialog, setShowServerBusyDialog] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);

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
  // Auto-scroll to demo when ?demo=true is in URL
  useEffect(() => {
    if (searchParams.get('demo') === 'true' && demoRef.current) {
      setTimeout(() => {
        demoRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 500);
    }
  }, [searchParams]);
  const features = [{
    icon: Zap,
    title: 'AI-Powered Generation',
    description: 'Advanced AI creates exam-ready, university-compliant reports in minutes'
  }, {
    icon: GraduationCap,
    title: 'University Format',
    description: 'Follows Indian university patterns including Bengaluru North University'
  }, {
    icon: Download,
    title: 'DOCX Download',
    description: 'Get perfectly formatted Word documents ready for submission'
  }, {
    icon: Shield,
    title: 'Plagiarism Free',
    description: 'Each report is uniquely generated for your specific internship'
  }];
  const pricing = [{
    pages: '3-10',
    price: 99,
    popular: false,
    disabled: true
  }, {
    pages: '11-20',
    price: 299,
    popular: false,
    disabled: true
  }, {
    pages: '21-40',
    price: 499,
    popular: true,
    disabled: false
  }];
  const steps = [{
    step: 1,
    title: 'Create Account',
    description: 'Quick signup with email'
  }, {
    step: 2,
    title: 'Fill Details',
    description: 'Enter internship information'
  }, {
    step: 3,
    title: 'Make Payment',
    description: 'Secure Razorpay checkout'
  }, {
    step: 4,
    title: 'Download Report',
    description: 'Get DOCX file instantly'
  }];
  const handlePlanClick = (plan: typeof pricing[0]) => {
    if (plan.disabled) {
      setShowServerBusyDialog(true);
    }
  };
  const studentReviews = [{
    name: "Priya Sharma",
    college: "BMS College, Bangalore",
    course: "BBA",
    review: "Amazing service! Got my 40-page marketing internship report in just 10 minutes. The format was exactly what my professor needed.",
    avatar: "PS"
  }, {
    name: "Rahul Kumar",
    college: "Christ University",
    course: "BCom",
    review: "Saved me 2 weeks of work! The AI understood my internship at a CA firm perfectly. Highly recommend for commerce students.",
    avatar: "RK"
  }, {
    name: "Sneha Patil",
    college: "Mount Carmel College",
    course: "MBA",
    review: "Best ₹499 I ever spent! My HR internship report was accepted without any changes. Thank you InternReport.in!",
    avatar: "SP"
  }, {
    name: "Arun Reddy",
    college: "PES University",
    course: "BCA",
    review: "The report quality is excellent. My guide was impressed with the structure and content. Will definitely use again!",
    avatar: "AR"
  }, {
    name: "Kavitha M",
    college: "Jain University",
    course: "BBM",
    review: "I was skeptical at first, but the report was beyond my expectations. Perfect formatting for Bangalore University.",
    avatar: "KM"
  }, {
    name: "Vikram Singh",
    college: "REVA University",
    course: "BCom",
    review: "Got my banking internship report done in minutes! The content was relevant and plagiarism-free. Great value!",
    avatar: "VS"
  }, {
    name: "Ananya Rao",
    college: "St. Joseph's College",
    course: "BBA",
    review: "The instant download feature is a lifesaver! Submitted my report just before deadline. Super grateful!",
    avatar: "AR"
  }, {
    name: "Mohammed Faisal",
    college: "CMR University",
    course: "MBA",
    review: "Professional quality report with proper citations. My internship at a finance company was perfectly documented.",
    avatar: "MF"
  }, {
    name: "Deepika S",
    college: "Dayananda Sagar College",
    course: "BCA",
    review: "Used it for my IT internship report. The technical content was accurate and well-structured. 5 stars!",
    avatar: "DS"
  }, {
    name: "Karthik Nair",
    college: "Kristu Jayanti College",
    course: "BCom",
    review: "The customer support was helpful and the report was delivered instantly. Best platform for students!",
    avatar: "KN"
  }, {
    name: "Pooja Hegde",
    college: "Presidency College",
    course: "BBA",
    review: "My sales & marketing internship report was perfect! The AI captured all the important aspects of my work.",
    avatar: "PH"
  }, {
    name: "Suresh Babu",
    college: "MES College",
    course: "MBA",
    review: "Excellent service! Got my supply chain management report with all diagrams and flowcharts. Impressed!",
    avatar: "SB"
  }, {
    name: "Lakshmi Devi",
    college: "Acharya Institute",
    course: "BCom",
    review: "The report followed proper academic format. My professor couldn't believe it was AI-generated. Amazing!",
    avatar: "LD"
  }, {
    name: "Ajay Gowda",
    college: "NMKRV College",
    course: "BBA",
    review: "Super fast and reliable! The report content was unique and matched my internship experience perfectly.",
    avatar: "AG"
  }, {
    name: "Meghana R",
    college: "Garden City College",
    course: "MBA",
    review: "Worth every rupee! The digital marketing internship report was comprehensive and well-researched. Thank you!",
    avatar: "MR"
  }];
  return <div className="min-h-screen hero-gradient overflow-hidden">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Internship Report Generator | Free Reports for BCA, BTech, MBA Students – InternReport.in</title>
        <meta name="description" content="Generate professional internship project reports instantly. Free samples for BCA, BTech, MBA, BCom students. AI-powered, plagiarism-free, university-compliant format. Trusted by 10,000+ students across India." />
        <meta name="keywords" content="internship report PDF, internship report format, free internship report, internship certificate, internship report BCA, internship report BTech, internship report MBA, AI report generator, student resources" />
        <link rel="canonical" href="https://internreport.in/" />
      </Helmet>

      {/* Share Popup (after 30 seconds) */}
      <SharePopup trigger="time" delay={30000} />

      {/* Floating Share Button */}
      <FloatingShareButton />

      {/* Sticky Banner */}
      <StickyBanner />

      {/* Server Busy Dialog */}
      <AlertDialog open={showServerBusyDialog} onOpenChange={setShowServerBusyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">Server Busy</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Due to high demand, many users are currently generating reports. This plan is temporarily unavailable.
              <br /><br />
              Please choose the <strong>₹499 Premium Plan</strong> for instant access to report generation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction onClick={() => setShowServerBusyDialog(false)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <WalletHeader />
            {user ? <Link to="/dashboard">
                <Button variant="gradient">Dashboard</Button>
              </Link> : <>
                <Link to="/auth">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/auth?signup=true">
                  <Button variant="gradient">Get Started</Button>
                </Link>
              </>}
          </div>
        </div>
      </nav>

      {/* Sliding Banner */}
      <section className="w-full">
        <HeroBanner />
      </section>

      {/* Hero Section - SEO Optimized */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center animate-slide-up">
          {/* Trust Badge */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">10,000+ Students Served</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-600">
              <Star className="w-4 h-4 fill-yellow-500" />
              <span className="text-sm font-medium">4.8/5 Rating</span>
            </div>
          </div>

          {/* SEO Headline H1 */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Free <span className="gradient-text">Internship Reports Generator</span>
            <br />& Student Career Resources
          </h1>
          
          {/* Sub-heading for trust */}
          <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            AI-powered report generator that creates university-compliant internship project reports. 
            Perfect formatting, academic writing style, exam-ready content.
          </p>
          
          {/* Keywords for SEO */}
          <p className="text-sm text-muted-foreground mb-8 max-w-xl mx-auto">
            Free samples for BCA, BTech, MBA, BCom, BBA • Plagiarism-free • Instant Download
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link to={user ? "/dashboard" : "/auth?signup=true"}>
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                <Download className="w-5 h-5" />
                Download Free Internship Reports
              </Button>
            </Link>
            <Button variant="outline" size="xl" className="w-full sm:w-auto" asChild>
              <a href="#share-section">
                <Sparkles className="w-5 h-5" />
                Share with Friends
              </a>
            </Button>
          </div>

          {/* Quick share buttons */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Share:</span>
            <ShareButtons variant="inline" />
          </div>

          <p className="text-sm text-muted-foreground">₹499 • 3 Report Generations • Instant Download</p>
        </div>

        {/* Demo Report Generator */}
        <div ref={demoRef} className="max-w-3xl mx-auto mt-16">
          <DemoReportGenerator />
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="container mx-auto px-4 py-8 bg-secondary/30 rounded-3xl my-8">
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
            Trusted by Students Across India
          </h2>
          <p className="text-muted-foreground">Join thousands of students who saved time with InternReport.in</p>
        </div>
        <StatsCounter />
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Why Choose InternReport.in?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built specifically for Indian university students with deep understanding of academic requirements
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-soft animate-scale-in" style={{
          animationDelay: `${index * 100}ms`
        }}>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>)}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 bg-secondary/30 rounded-3xl my-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground">Simple 4-step process to get your report</p>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => <div key={index} className="text-center relative animate-fade-in" style={{
          animationDelay: `${index * 150}ms`
        }}>
              <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4 shadow-glow">
                <span className="font-display font-bold text-2xl text-primary-foreground">{step.step}</span>
              </div>
              {index < steps.length - 1 && <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />}
              <h3 className="font-display font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </div>)}
        </div>
      </section>

      {/* AI Mock Interview Training */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Platform</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            AI Mock Interview Training
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Prepare for interviews with 700+ questions, AI-powered feedback, and real-time scoring
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
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-soft overflow-hidden animate-scale-in border-l-4 border-l-accent" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-8 flex flex-col h-full">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-8 h-8 text-accent-foreground" />
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
                <Button variant="gradient" size="lg" className="w-full">
                  Start Mock Interview Training
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>


      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground">Pay only for what you need. No hidden charges.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {pricing.map((plan, index) => <Card key={index} className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${plan.popular ? 'border-primary shadow-glow scale-105' : plan.disabled ? 'border-0 shadow-soft opacity-75' : 'border-0 shadow-soft'}`}>
              {plan.popular && <div className="absolute top-0 left-0 right-0 gradient-bg text-center py-1 text-xs font-semibold text-primary-foreground">
                  RECOMMENDED
                </div>}
              {plan.disabled && <div className="absolute top-0 left-0 right-0 bg-amber-500 text-center py-1 text-xs font-semibold text-white">
                  SERVER BUSY
                </div>}
              <CardContent className={`p-6 ${plan.popular || plan.disabled ? 'pt-10' : ''}`}>
                <div className="text-center">
                  <p className="text-muted-foreground text-sm mb-2">{plan.pages} Pages</p>
                  <div className="flex items-baseline justify-center gap-1 mb-4">
                    <span className={`text-4xl font-display font-bold ${plan.disabled ? 'line-through text-muted-foreground' : ''}`}>₹{plan.price}</span>
                  </div>
                  {plan.disabled ? <Button variant="outline" className="w-full" onClick={() => handlePlanClick(plan)}>
                      Get Started
                    </Button> : <Link to={user ? "/dashboard" : "/auth?signup=true"}>
                      <Button variant="gradient" className="w-full">
                        Get Started
                      </Button>
                    </Link>}
                </div>
              </CardContent>
            </Card>)}
        </div>
        <div className="text-center mt-8">
          <p className="text-muted-foreground text-sm">
            Need more generations? Top up for ₹499 for 3 additional reports.
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-success" />
            <h3 className="font-display font-semibold">100% Secure Payments</h3>
            <p className="text-muted-foreground text-sm">Powered by Razorpay</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <BookOpen className="w-10 h-10 text-primary" />
            <h3 className="font-display font-semibold">Academic Quality</h3>
            <p className="text-muted-foreground text-sm">University-approved format</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Clock className="w-10 h-10 text-accent" />
            <h3 className="font-display font-semibold">Instant Delivery</h3>
            <p className="text-muted-foreground text-sm">Download within minutes</p>
          </div>
        </div>
      </section>

      {/* Share Section - Viral CTA */}
      <section id="share-section" className="container mx-auto px-4 py-8">
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-600 mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Share & Help Students</span>
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Found This Useful? Share with Your Friends!
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Help fellow students discover free internship reports and career resources. Share in your college WhatsApp groups!
            </p>
            <ShareButtons className="justify-center" />
          </CardContent>
        </Card>
      </section>

      {/* Refer & Earn CTA */}
      <section className="container mx-auto px-4 py-8">
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-600 mb-4">
                <Gift className="w-4 h-4" />
                <span className="text-sm font-medium">Refer & Earn Program</span>
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-2">
                Earn ₹150 For Every Friend You Invite!
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join thousands of students earning real money by sharing InternReport.in
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-background/50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-green-600">1</span>
                </div>
                <h4 className="font-semibold mb-1">Sign Up & Get ₹100</h4>
                <p className="text-sm text-muted-foreground">Create account and receive ₹100 welcome bonus instantly</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-green-600">2</span>
                </div>
                <h4 className="font-semibold mb-1">Share Your Referral ID</h4>
                <p className="text-sm text-muted-foreground">Share your mobile number as referral ID via WhatsApp</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-green-600">3</span>
                </div>
                <h4 className="font-semibold mb-1">Earn ₹150 Per Referral</h4>
                <p className="text-sm text-muted-foreground">Get ₹150 when your friend makes a payment. Withdraw via UPI!</p>
              </div>
            </div>
            
            <div className="bg-green-500/10 rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">Bonus: +₹50 for 2nd Level Referrals!</p>
                    <p className="text-sm text-muted-foreground">When your referral invites someone, you earn ₹50 extra!</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Link to={user ? "/refer" : "/auth?signup=true"}>
                <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white">
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

      {/* Student Reviews Section - Auto Slider */}
      <section className="container mx-auto px-4 py-16 bg-secondary/30 rounded-3xl my-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-600 mb-4">
            <Star className="w-4 h-4 fill-yellow-500" />
            <span className="text-sm font-medium">Student Reviews</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            What Our Students Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join 10,000+ students who got their reports generated instantly
          </p>
        </div>
        
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 3000,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
            }),
          ]}
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Verified Student Reviews</span>
          </div>
        </div>
      </section>



      {/* Digital Products Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Package className="w-4 h-4" />
            <span className="text-sm font-medium">Digital Products</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Premium Digital Resources
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            2000+ templates, prompts, ebooks, bundles & more — instant download
          </p>
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
                    <span className="font-bold text-green-600 text-sm sm:text-base">₹{product.offer_price || 299}</span>
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
                AI-powered internship project report generator for Indian university students.
              </p>
              <ShareButtons variant="compact" />
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><Link to="/products" className="hover:text-primary transition-colors">Digital Products</Link></li>
                <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">Login</Link></li>
                <li><Link to="/auth?signup=true" className="hover:text-primary transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/blog" className="hover:text-primary transition-colors">Internship Report Format</Link></li>
                <li><Link to="/blog" className="hover:text-primary transition-colors">Free Report Samples</Link></li>
                <li><Link to="/refer" className="hover:text-primary transition-colors">Refer & Earn ₹150</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Policies</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
                <li><a href="/Terms_of_Use.pdf" download className="hover:text-primary transition-colors">Download Terms (PDF)</a></li>
                <li><a href="/Privacy_Policy.pdf" download className="hover:text-primary transition-colors">Download Privacy (PDF)</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 mt-8 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                © 2024 InternReport.in. All rights reserved. AI-powered Internship Report Generator.
              </p>
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
    </div>;
};
export default Index;