import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Brain, BookOpen, Code, Briefcase, ChevronRight, RotateCcw, Loader2, ArrowRight, Star, Sparkles, GraduationCap, Info, MousePointerClick, ChevronsLeftRight, AlertCircle } from 'lucide-react';

const courseOptions = ['BCom', 'BBA', 'BCA', 'MCA', 'BE/BTech', 'MBA', 'ME/MTech'];
const languageOptions = ['C', 'C++', 'Java', 'Python', 'JavaScript', 'SQL', 'React', 'Node.js'];
const roleOptions = ['Software Developer', 'Full Stack Developer', 'Data Analyst', 'AI Engineer', 'Accountant', 'HR Executive', 'Digital Marketing'];

type TrainingMode = null | 'course' | 'language' | 'role';
type ViewState = 'select-mode' | 'select-option' | 'flashcards' | 'mock-interview';

interface Question {
  id: string;
  question: string;
  answer: string;
  difficulty: string;
}

interface InterviewResult {
  score: number;
  feedback: string;
  suggestions: string;
}

const AIMockInterview = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [view, setView] = useState<ViewState>('select-mode');
  const [mode, setMode] = useState<TrainingMode>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [interviewQuestion, setInterviewQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [interviewRound, setInterviewRound] = useState(0);
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/ai/mock-interview');
    }
  }, [user, authLoading, navigate]);

  const fetchQuestions = async (category: string, subcategory: string) => {
    setLoadingQuestions(true);
    try {
      const { data, error } = await supabase
        .from('question_bank')
        .select('id, question, answer, difficulty')
        .eq('category', category)
        .eq('subcategory', subcategory)
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        setQuestions(data);
      } else {
        const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-mock-interview', {
          body: { action: 'generate-questions', category, subcategory, userId: user?.id },
        });
        if (aiError) throw aiError;
        setQuestions(aiData?.questions || []);
      }
    } catch (error: any) {
      console.error('Fetch questions error:', error);
      toast({ title: 'Error', description: 'Failed to load questions.', variant: 'destructive' });
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSelectMode = (m: TrainingMode) => {
    setMode(m);
    setView('select-option');
  };

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
    const category = mode === 'course' ? 'course' : mode === 'language' ? 'language' : 'role';
    fetchQuestions(category, option);
    setView('flashcards');
    setCurrentIndex(0);
    setFlipped(false);
  };

  const startMockInterview = async () => {
    setView('mock-interview');
    setInterviewRound(0);
    setResult(null);
    setUserAnswer('');
    await fetchNextQuestion();
  };

  const fetchNextQuestion = async () => {
    setLoadingQuestion(true);
    setResult(null);
    setUserAnswer('');
    try {
      const topic = selectedOption || 'general';
      const { data, error } = await supabase.functions.invoke('ai-mock-interview', {
        body: { action: 'ask-question', topic, round: interviewRound + 1, userId: user?.id },
      });
      if (error) throw error;
      setInterviewQuestion(data?.question || 'Tell me about yourself.');
      setInterviewRound(prev => prev + 1);
    } catch (error: any) {
      console.error('Error fetching question:', error);
      toast({ title: 'Error', description: 'Failed to get question.', variant: 'destructive' });
    } finally {
      setLoadingQuestion(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast({ title: 'Empty answer', description: 'Please type your answer.', variant: 'destructive' });
      return;
    }
    setEvaluating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-mock-interview', {
        body: {
          action: 'evaluate',
          question: interviewQuestion,
          answer: userAnswer,
          topic: selectedOption,
          userId: user?.id,
        },
      });
      if (error) throw error;

      setResult({
        score: data?.score || 0,
        feedback: data?.feedback || '',
        suggestions: data?.suggestions || '',
      });

      await supabase.from('mock_interview_results').insert({
        user_id: user!.id,
        role_or_topic: selectedOption || 'general',
        question: interviewQuestion,
        user_answer: userAnswer,
        ai_score: data?.score || 0,
        ai_feedback: data?.feedback || '',
        ai_suggestions: data?.suggestions || '',
      });
    } catch (error: any) {
      console.error('Evaluation error:', error);
      toast({ title: 'Error', description: 'Failed to evaluate answer.', variant: 'destructive' });
    } finally {
      setEvaluating(false);
    }
  };

  const goBack = () => {
    if (view === 'mock-interview') setView('flashcards');
    else if (view === 'flashcards') { setView('select-option'); setQuestions([]); }
    else if (view === 'select-option') { setView('select-mode'); setMode(null); }
  };

  const getOptions = () => {
    if (mode === 'course') return courseOptions;
    if (mode === 'language') return languageOptions;
    if (mode === 'role') return roleOptions;
    return [];
  };

  const currentQ = questions[currentIndex];
  const difficultyColor = (d: string) => d === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : d === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';

  return (
    <div className="min-h-screen hero-gradient overflow-hidden">
      <Helmet>
        <title>AI Mock Interview Training - InternReport.in</title>
        <meta name="description" content="Practice interview questions with AI feedback. Course-based, programming, and job role training." />
      </Helmet>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {view !== 'select-mode' ? (
              <Button variant="ghost" size="sm" onClick={goBack}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
            ) : (
              <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Home</Button></Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-lg">Mock Interview</span>
          </div>
          <Link to="/ai/report-generator">
            <Button variant="outline" size="sm">Report Gen</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* ===== MODE SELECTION ===== */}
        {view === 'select-mode' && (
          <div className="animate-slide-up">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
                <Brain className="w-4 h-4" />
                <span className="text-sm font-medium">AI-Powered Training</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
                Choose Your <span className="gradient-text">Training Path</span>
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                700+ questions across courses, programming languages & job roles with AI-powered feedback
              </p>
            </div>

            {/* Info Notice */}
            <div className="max-w-2xl mx-auto mb-10">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">Note: Limited Question Bank</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">Not all questions and answers are available for every topic. We're continuously expanding our database. If a topic has limited flashcards, try the AI Mock Interview for unlimited AI-generated questions.</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {[
                { mode: 'course' as TrainingMode, icon: GraduationCap, title: 'Course Based', desc: 'BCom, BBA, BCA, MBA & more academic course questions', color: 'from-blue-500 to-indigo-600', badge: '7 Courses' },
                { mode: 'language' as TrainingMode, icon: Code, title: 'Programming', desc: 'C, Java, Python, JS, SQL & more coding interview questions', color: 'from-emerald-500 to-teal-600', badge: '8 Languages' },
                { mode: 'role' as TrainingMode, icon: Briefcase, title: 'Job Roles', desc: 'Software Dev, Data Analyst, HR, Marketing & more', color: 'from-purple-500 to-pink-600', badge: '7 Roles' },
              ].map((item, i) => (
                <Card key={i} className="group cursor-pointer hover-lift border-0 shadow-soft relative overflow-hidden" onClick={() => handleSelectMode(item.mode)}>
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color}`} />
                  <CardContent className="p-8 lg:p-10 text-center">
                    <div className={`w-18 h-18 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                      <item.icon className="w-9 h-9 lg:w-10 lg:h-10 text-white" />
                    </div>
                    <Badge variant="secondary" className="mb-3">{item.badge}</Badge>
                    <h3 className="font-display text-xl lg:text-2xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    <div className="mt-5 flex items-center justify-center gap-1 text-primary text-sm font-medium">
                      <span>Start Training</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ===== OPTION SELECTION ===== */}
        {view === 'select-option' && (
          <div className="animate-slide-up">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                Select {mode === 'course' ? 'Your Course' : mode === 'language' ? 'Programming Language' : 'Job Role'}
              </h2>
              <p className="text-muted-foreground text-sm">Pick a topic to start practicing</p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {getOptions().map((opt) => (
                <Card key={opt} className="cursor-pointer hover-lift border border-border/50 shadow-soft group" onClick={() => handleSelectOption(opt)}>
                  <CardContent className="p-6 text-center">
                    <h3 className="font-display font-semibold text-lg group-hover:text-primary transition-colors">{opt}</h3>
                    <ChevronRight className="w-4 h-4 mx-auto mt-2 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ===== FLASH CARDS ===== */}
        {view === 'flashcards' && (
          <div className="animate-slide-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold">{selectedOption}</h2>
                <p className="text-muted-foreground text-sm mt-1">Flashcard Training</p>
              </div>
              <Button onClick={startMockInterview} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                <Brain className="w-4 h-4 mr-2" /> Start AI Mock Interview
              </Button>
            </div>

            {/* Instruction Hints */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-3 py-2 rounded-full border border-border/50">
                <MousePointerClick className="w-3.5 h-3.5 text-primary" />
                <span>Tap card to see answer</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-3 py-2 rounded-full border border-border/50">
                <ChevronsLeftRight className="w-3.5 h-3.5 text-primary" />
                <span>Use buttons to navigate questions</span>
              </div>
            </div>

            {/* Limited Q&A Notice */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6 max-w-2xl mx-auto">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-500">
                Not all questions & answers are available for this topic. For unlimited questions, try the <strong>AI Mock Interview</strong>.
              </p>
            </div>

            {loadingQuestions ? (
              <Card className="border-0 shadow-soft max-w-2xl mx-auto">
                <CardContent className="p-16 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading questions...</p>
                </CardContent>
              </Card>
            ) : questions.length === 0 ? (
              <Card className="border-0 shadow-soft max-w-2xl mx-auto">
                <CardContent className="p-16 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-display font-semibold text-lg mb-2">No Flashcards Available</p>
                  <p className="text-muted-foreground mb-6">This topic doesn't have preloaded questions yet. Try the AI Mock Interview for unlimited AI-generated questions!</p>
                  <Button onClick={startMockInterview} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    <Brain className="w-4 h-4 mr-2" /> Start AI Mock Interview Instead
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Progress */}
                <div className="max-w-2xl mx-auto mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-primary">{currentIndex + 1} / {questions.length}</span>
                  </div>
                  <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-bg rounded-full transition-all duration-500"
                      style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Flash Card */}
                <div
                  className="cursor-pointer mx-auto max-w-2xl"
                  onClick={() => setFlipped(!flipped)}
                  style={{ perspective: '1000px' }}
                >
                  <div
                    className="relative transition-transform duration-600"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
                      minHeight: '320px',
                    }}
                  >
                    {/* Front */}
                    <Card className="absolute inset-0 border-0 shadow-lg" style={{ backfaceVisibility: 'hidden' }}>
                      <CardContent className="p-8 lg:p-10 flex flex-col items-center justify-center h-full min-h-[320px]">
                        <Badge className={`mb-5 ${difficultyColor(currentQ?.difficulty || 'medium')}`}>
                          {currentQ?.difficulty || 'medium'}
                        </Badge>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">Question</p>
                        <p className="font-display text-xl lg:text-2xl text-center font-semibold leading-relaxed">{currentQ?.question}</p>
                        <div className="mt-8 flex items-center gap-2 text-primary text-sm animate-pulse-slow">
                          <MousePointerClick className="w-4 h-4" />
                          <span>Click to reveal answer</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Back */}
                    <Card className="absolute inset-0 border-0 shadow-lg border-t-4 border-t-primary" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                      <CardContent className="p-8 lg:p-10 flex flex-col items-center justify-center h-full min-h-[320px]">
                        <p className="text-xs uppercase tracking-wider text-primary mb-4 font-bold">Answer</p>
                        <p className="text-center text-muted-foreground whitespace-pre-wrap leading-relaxed text-base lg:text-lg">{currentQ?.answer}</p>
                        <div className="mt-8 flex items-center gap-2 text-muted-foreground text-sm">
                          <MousePointerClick className="w-4 h-4" />
                          <span>Click to see question</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-center gap-3 mt-8">
                  <Button variant="outline" size="lg" disabled={currentIndex === 0} onClick={() => { setCurrentIndex(prev => prev - 1); setFlipped(false); }}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => { setFlipped(false); setCurrentIndex(0); }}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="lg" disabled={currentIndex === questions.length - 1} onClick={() => { setCurrentIndex(prev => prev + 1); setFlipped(false); }}>
                    Next <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== MOCK INTERVIEW ===== */}
        {view === 'mock-interview' && (
          <div className="animate-slide-up max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 mb-3">
                <Brain className="w-4 h-4" />
                <span className="text-sm font-medium">Live AI Interview</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">
                {selectedOption || 'General'} Interview
              </h2>
            </div>

            {loadingQuestion ? (
              <Card className="border-0 shadow-soft">
                <CardContent className="p-16 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">AI is preparing your question...</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-soft overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-600">{interviewRound}</span>
                    </div>
                    Round {interviewRound}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pb-8">
                  <div className="bg-secondary/20 rounded-xl p-6 border border-border/30">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">Interview Question</p>
                    <p className="font-display font-semibold text-lg lg:text-xl leading-relaxed">{interviewQuestion}</p>
                  </div>

                  {!result ? (
                    <>
                      <Textarea
                        value={userAnswer}
                        onChange={e => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here... Be detailed and professional."
                        rows={6}
                        className="text-base border-border/50 focus:border-primary"
                      />
                      <Button onClick={submitAnswer} disabled={evaluating} variant="gradient" className="w-full" size="lg">
                        {evaluating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Evaluating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Submit Answer</>}
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-5">
                      <div className="text-center">
                        <div className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-xl font-bold ${result.score >= 7 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : result.score >= 4 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          <Star className="w-6 h-6" />
                          Score: {result.score}/10
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200/30">
                        <p className="font-semibold mb-2 text-blue-700 dark:text-blue-400 text-sm">💬 Feedback</p>
                        <p className="text-sm text-blue-900 dark:text-blue-300 leading-relaxed">{result.feedback}</p>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-200/30">
                        <p className="font-semibold mb-2 text-green-700 dark:text-green-400 text-sm">✨ Suggestions</p>
                        <p className="text-sm text-green-900 dark:text-green-300 leading-relaxed">{result.suggestions}</p>
                      </div>

                      <Button onClick={fetchNextQuestion} variant="gradient" className="w-full" size="lg">
                        Next Question <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMockInterview;
