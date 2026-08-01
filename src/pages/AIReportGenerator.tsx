import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, ArrowLeft, Loader2, Copy, Download, Sparkles, RotateCcw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const courses = ['BCom', 'BBA', 'BCA', 'MCA', 'BE/BTech', 'MBA', 'ME/MTech', 'BSc', 'MSc', 'Other'];

const sections = [
  { key: 'abstract', label: 'Abstract' },
  { key: 'introduction', label: 'Introduction' },
  { key: 'methodology', label: 'Methodology' },
  { key: 'results', label: 'Results' },
  { key: 'conclusion', label: 'Conclusion' },
];

const AIReportGenerator = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [course, setCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState('abstract');
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/ai/report-generator');
    }
  }, [user, authLoading, navigate]);

  const handleGenerate = async () => {
    if (!course || !topic) {
      toast({ title: 'Missing fields', description: 'Please select course and enter topic.', variant: 'destructive' });
      return;
    }

    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to generate AI content.', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    setGeneratedContent({});
    setEditedContent({});

    try {
      const { data, error } = await supabase.functions.invoke('ai-report-content', {
        body: { course, topic, description, userId: user?.id },
      });

      if (error) throw error;

      if (data?.content) {
        setGeneratedContent(data.content);
        setEditedContent(data.content);
        toast({ title: 'Content Generated!', description: 'You can now edit, copy, or export the content.' });
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({ title: 'Generation Failed', description: error.message || 'Failed to generate content.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (section: string) => {
    const text = editedContent[section] || generatedContent[section] || '';
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${section} content copied to clipboard.` });
  };

  const handleCopyAll = () => {
    const allText = sections
      .map(s => `## ${s.label}\n\n${editedContent[s.key] || generatedContent[s.key] || ''}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(allText);
    toast({ title: 'Copied All!', description: 'Full report content copied to clipboard.' });
  };

  const handleExport = () => {
    const allText = sections
      .map(s => `${s.label}\n${'='.repeat(s.label.length)}\n\n${editedContent[s.key] || generatedContent[s.key] || ''}`)
      .join('\n\n\n');
    const blob = new Blob([allText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '_')}_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!', description: 'Report exported as text file.' });
  };

  const hasContent = Object.keys(generatedContent).length > 0;

  return (
    <div className="min-h-screen hero-gradient">
      <Helmet>
        <title>AI Report Generator - InternReport.in</title>
        <meta name="description" content="Generate internship report content using AI. Select your course and topic to create professional report sections." />
      </Helmet>

      <nav className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/ai" className="flex items-center gap-2">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> AI Platform</Button>
          </Link>
          <span className="font-display font-bold">AI Report Generator</span>
          <Link to="/ai/mock-interview">
            <Button variant="outline" size="sm">Mock Interview →</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Generate Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Course</Label>
                  <Select value={course} onValueChange={setCourse}>
                    <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>
                      {courses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Project Topic</Label>
                  <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Digital Marketing Strategy" />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of your project..." rows={4} />
                </div>
                <Button onClick={handleGenerate} disabled={generating} variant="gradient" className="w-full" size="lg">
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Report Content</>}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Output */}
          <div className="lg:col-span-3">
            {hasContent ? (
              <Card className="border-0 shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-display">Generated Content</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopyAll}><Copy className="w-3 h-3 mr-1" /> Copy All</Button>
                    <Button size="sm" variant="outline" onClick={handleExport}><Download className="w-3 h-3 mr-1" /> Export</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeSection} onValueChange={setActiveSection}>
                    <TabsList className="w-full flex-wrap h-auto">
                      {sections.map(s => (
                        <TabsTrigger key={s.key} value={s.key} className="text-xs">{s.label}</TabsTrigger>
                      ))}
                    </TabsList>
                    {sections.map(s => (
                      <TabsContent key={s.key} value={s.key}>
                        <div className="flex justify-end mb-2">
                          <Button size="sm" variant="ghost" onClick={() => handleCopy(s.key)}>
                            <Copy className="w-3 h-3 mr-1" /> Copy
                          </Button>
                        </div>
                        <Textarea
                          value={editedContent[s.key] || ''}
                          onChange={e => setEditedContent(prev => ({ ...prev, [s.key]: e.target.value }))}
                          rows={16}
                          className="font-mono text-sm"
                        />
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-soft">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-display text-xl font-semibold mb-2">No Content Yet</h3>
                  <p className="text-muted-foreground">Fill in the form and click Generate to create your report content using AI.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIReportGenerator;
