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
import { ArrowLeft, Brain, BookOpen, Code, Briefcase, ChevronRight, RotateCcw, Loader2, ArrowRight, Star, Sparkles, GraduationCap } from 'lucide-react';

// Data definitions
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

  // Mock interview state
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
        // If no preloaded questions, generate with AI
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

      // Save result
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
  const difficultyColor = (d: string) => d === 'easy' ? 'bg-green-100 text-green-700' : d === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';

  return (
    <div className="min-h-screen hero-gradient">
      <Helmet>
        <title>AI Mock Interview Training - InternReport.in</title>
        <meta name="description" content="Practice interview questions with AI feedback. Course-based, programming, and job role training." />
      </Helmet>

      <nav className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {view !== 'select-mode' ? (
              <Button variant="ghost" size="sm" onClick={goBack}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
            ) : (
              <Link to="/ai"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> AI Platform</Button></Link>
            )}
          </div>
          <span className="font-display font-bold">Mock Interview Training</span>
          <Link to="/ai/report-generator">
            <Button variant="outline" size="sm">← Report Generator</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Mode Selection */}
        {view === 'select-mode' && (
          <div className="animate-slide-up">
            <h1 className="font-display text-3xl font-bold text-center mb-2">Choose Training Type</h1>
            <p className="text-center text-muted-foreground mb-10">Select how you want to prepare</p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { mode: 'course' as TrainingMode, icon: GraduationCap, title: 'Course Based', desc: 'Questions by academic course', color: 'from-blue-500 to-indigo-600' },
                { mode: 'language' as TrainingMode, icon: Code, title: 'Programming Languages', desc: 'Concepts, syntax & interview Qs', color: 'from-emerald-500 to-teal-600' },
                { mode: 'role' as TrainingMode, icon: Briefcase, title: 'Job Role Based', desc: 'Role-specific interview prep', color: 'from-purple-500 to-pink-600' },
              ].map((item, i) => (
                <Card key={i} className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-soft" onClick={() => handleSelectMode(item.mode)}>
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Option Selection */}
        {view === 'select-option' && (
          <div className="animate-slide-up">
            <h2 className="font-display text-2xl font-bold text-center mb-8">
              Select {mode === 'course' ? 'Course' : mode === 'language' ? 'Language' : 'Job Role'}
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {getOptions().map((opt) => (
                <Card key={opt} className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all border-0 shadow-soft" onClick={() => handleSelectOption(opt)}>
                  <CardContent className="p-6 text-center">
                    <h3 className="font-display font-semibold">{opt}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Flash Cards */}
        {view === 'flashcards' && (
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold">{selectedOption} - Flash Cards</h2>
              <Button onClick={startMockInterview} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <Brain className="w-4 h-4 mr-2" /> Start AI Mock Interview
              </Button>
            </div>

            {loadingQuestions ? (
              <Card className="border-0 shadow-soft">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading questions...</p>
                </CardContent>
              </Card>
            ) : questions.length === 0 ? (
              <Card className="border-0 shadow-soft">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No questions available. Try the AI Mock Interview instead!</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="text-center text-sm text-muted-foreground mb-4">
                  {currentIndex + 1} / {questions.length}
                </div>

                {/* Flash Card */}
                <div
                  className="cursor-pointer perspective-1000 mx-auto max-w-2xl"
                  onClick={() => setFlipped(!flipped)}
                  style={{ perspective: '1000px' }}
                >
                  <div
                    className="relative transition-transform duration-500"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
                      minHeight: '300px',
                    }}
                  >
                    {/* Front */}
                    <Card className="absolute inset-0 border-0 shadow-lg" style={{ backfaceVisibility: 'hidden' }}>
                      <CardContent className="p-8 flex flex-col items-center justify-center h-full min-h-[300px]">
                        <Badge className={`mb-4 ${difficultyColor(currentQ?.difficulty || 'medium')}`}>
                          {currentQ?.difficulty || 'medium'}
                        </Badge>
                        <p className="text-sm text-muted-foreground mb-2">QUESTION</p>
                        <p className="font-display text-xl text-center font-semibold">{currentQ?.question}</p>
                        <p className="text-xs text-muted-foreground mt-6">Click to flip</p>
                      </CardContent>
                    </Card>

                    {/* Back */}
                    <Card className="absolute inset-0 border-0 shadow-lg bg-primary/5" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                      <CardContent className="p-8 flex flex-col items-center justify-center h-full min-h-[300px]">
                        <p className="text-sm text-primary mb-2 font-semibold">ANSWER</p>
                        <p className="text-center text-muted-foreground whitespace-pre-wrap">{currentQ?.answer}</p>
                        <p className="text-xs text-muted-foreground mt-6">Click to flip back</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-center gap-4 mt-6">
                  <Button variant="outline" disabled={currentIndex === 0} onClick={() => { setCurrentIndex(prev => prev - 1); setFlipped(false); }}>
                    ← Previous
                  </Button>
                  <Button variant="outline" onClick={() => { setFlipped(false); setCurrentIndex(0); }}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Reset
                  </Button>
                  <Button variant="outline" disabled={currentIndex === questions.length - 1} onClick={() => { setCurrentIndex(prev => prev + 1); setFlipped(false); }}>
                    Next →
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Mock Interview */}
        {view === 'mock-interview' && (
          <div className="animate-slide-up max-w-3xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-center mb-6">
              AI Mock Interview — {selectedOption || 'General'}
            </h2>

            {loadingQuestion ? (
              <Card className="border-0 shadow-soft">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">AI is preparing your question...</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Round {interviewRound}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-secondary/30 rounded-xl p-6">
                    <p className="text-sm text-muted-foreground mb-1">Interview Question:</p>
                    <p className="font-display font-semibold text-lg">{interviewQuestion}</p>
                  </div>

                  {!result ? (
                    <>
                      <Textarea
                        value={userAnswer}
                        onChange={e => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        rows={6}
                        className="text-base"
                      />
                      <Button onClick={submitAnswer} disabled={evaluating} variant="gradient" className="w-full" size="lg">
                        {evaluating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Evaluating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Submit Answer</>}
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      {/* Score */}
                      <div className="text-center">
                        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold ${result.score >= 7 ? 'bg-green-100 text-green-700' : result.score >= 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          <Star className="w-5 h-5" />
                          Score: {result.score}/10
                        </div>
                      </div>

                      {/* Feedback */}
                      <div className="bg-blue-50 rounded-xl p-4">
                        <p className="font-semibold mb-1 text-blue-700">Feedback</p>
                        <p className="text-sm text-blue-900">{result.feedback}</p>
                      </div>

                      {/* Suggestions */}
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="font-semibold mb-1 text-green-700">Improvement Suggestions</p>
                        <p className="text-sm text-green-900">{result.suggestions}</p>
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
