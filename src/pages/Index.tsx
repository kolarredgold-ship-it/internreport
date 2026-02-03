import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, Zap, Download, CheckCircle2, GraduationCap, BookOpen, Clock, Star, ArrowRight, AlertTriangle, Gift, IndianRupee, Calendar } from 'lucide-react';
import DemoReportGenerator from '@/components/DemoReportGenerator';
import { useAuth } from '@/hooks/useAuth';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { blogPosts } from '@/data/blogPosts';
import WalletHeader from '@/components/WalletHeader';

const Index = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const demoRef = useRef<HTMLDivElement>(null);
  const [showServerBusyDialog, setShowServerBusyDialog] = useState(false);

  // Auto-scroll to demo when ?demo=true is in URL
  useEffect(() => {
    if (searchParams.get('demo') === 'true' && demoRef.current) {
      setTimeout(() => {
        demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  return <div className="min-h-screen hero-gradient">
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">Trusted by 10,000+ Students</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Generate <span className="gradient-text">Internship Reports</span>
            <br />in Minutes, Not Days
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered report generator that creates university-compliant internship project reports. 
            Perfect formatting, academic writing style, exam-ready content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={user ? "/dashboard" : "/auth?signup=true"}>
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Generate Report Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                View Pricing
              </Button>
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-4">₹499 • 3 Report Generations • Instant Download</p>
        </div>

        {/* Demo Report Generator */}
        <div ref={demoRef} className="max-w-3xl mx-auto mt-16">
          <DemoReportGenerator />
        </div>
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

      {/* Pricing */}
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
            Need more than 3 generations? Top up for ₹499 for 3 additional reports.
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

      {/* Recent Blogs Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">From Our Blog</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Latest Internship Report Guides
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Expert tips, templates, and guides to help you write the perfect internship report
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {blogPosts.slice(0, 4).map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-soft group">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {post.category}
                    </Badge>
                  </div>
                  <CardTitle className="font-display text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-xs mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(post.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{post.readTime} min</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/blog">
            <Button variant="outline" size="lg">
              View All Articles
              <ArrowRight className="w-4 h-4 ml-2" />
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
              <p className="text-muted-foreground text-sm">
                AI-powered internship project report generator for Indian university students.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">Login</Link></li>
                <li><Link to="/auth?signup=true" className="hover:text-primary transition-colors">Sign Up</Link></li>
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
            <div>
              <h4 className="font-display font-semibold mb-4">Contact</h4>
              <p className="text-sm text-muted-foreground">
                support@internreport.in<br />
                +91 9738959525<br />
                Omlaytechnologies@gmail.com
              </p>
            </div>
          </div>
          <div className="border-t border-border/50 mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 InternReport.in. All rights reserved. AI-powered Internship Report Generator.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;