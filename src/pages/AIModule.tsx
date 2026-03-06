import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, MessageSquare, Brain, BookOpen, Code, Briefcase, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const AIModule = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen hero-gradient">
      <Helmet>
        <title>AI Platform - InternReport.in</title>
        <meta name="description" content="AI-powered report generator and mock interview training for students." />
      </Helmet>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">InternReport.in</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/home">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" /> Home
              </Button>
            </Link>
            {!user && (
              <Link to="/auth">
                <Button variant="gradient" size="sm">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Platform</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Welcome to <span className="gradient-text">InternReport AI</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your service to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card 1 - Report Generator */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-soft overflow-hidden animate-scale-in">
            <CardContent className="p-8 flex flex-col h-full">
              <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-4">AI Report Generator</h2>
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-4">AI Mock Interview Training</h2>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  { icon: MessageSquare, text: 'Interview preparation' },
                  { icon: Code, text: 'Programming interview questions' },
                  { icon: Briefcase, text: 'Job readiness training' },
                  { icon: Brain, text: 'AI feedback & scoring' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <item.icon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <Link to={user ? "/ai/mock-interview" : "/auth?redirect=/ai/mock-interview"}>
                <Button size="lg" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
                  Start Mock Interview Training
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default AIModule;
