import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Upload, Search, Loader2, Edit2 } from 'lucide-react';

interface Question {
  id: string;
  category: string;
  subcategory: string;
  question: string;
  answer: string;
  difficulty: string;
  tags: string[];
  created_at: string;
}

const AdminQuestions = () => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSubcategory, setFilterSubcategory] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formCategory, setFormCategory] = useState('course');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formDifficulty, setFormDifficulty] = useState('medium');

  // AI usage stats
  const [aiUsage, setAiUsage] = useState<{ feature: string; count: number; total_tokens: number }[]>([]);

  useEffect(() => {
    fetchQuestions();
    fetchAiUsage();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('question_bank')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: 'Failed to load questions.', variant: 'destructive' });
    } else {
      setQuestions(data || []);
    }
    setLoading(false);
  };

  const fetchAiUsage = async () => {
    const { data } = await supabase
      .from('ai_usage_log')
      .select('feature, tokens_used');
    if (data) {
      const grouped: Record<string, { count: number; total_tokens: number }> = {};
      data.forEach(row => {
        if (!grouped[row.feature]) grouped[row.feature] = { count: 0, total_tokens: 0 };
        grouped[row.feature].count++;
        grouped[row.feature].total_tokens += row.tokens_used;
      });
      setAiUsage(Object.entries(grouped).map(([feature, stats]) => ({ feature, ...stats })));
    }
  };

  const handleSave = async () => {
    if (!formQuestion || !formAnswer || !formSubcategory) {
      toast({ title: 'Missing fields', description: 'Fill all required fields.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingQuestion) {
        const { error } = await supabase.from('question_bank').update({
          category: formCategory, subcategory: formSubcategory,
          question: formQuestion, answer: formAnswer, difficulty: formDifficulty,
          tags: [formCategory, formSubcategory],
        }).eq('id', editingQuestion.id);
        if (error) throw error;
        toast({ title: 'Updated!' });
      } else {
        const { error } = await supabase.from('question_bank').insert({
          category: formCategory, subcategory: formSubcategory,
          question: formQuestion, answer: formAnswer, difficulty: formDifficulty,
          tags: [formCategory, formSubcategory],
        });
        if (error) throw error;
        toast({ title: 'Added!' });
      }
      resetForm();
      fetchQuestions();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('question_bank').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Deleted!' }); fetchQuestions(); }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let data: any[];

      if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        data = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => obj[h] = vals[i] || '');
          return obj;
        });
      } else {
        throw new Error('Unsupported file format. Use JSON or CSV.');
      }

      const rows = data.map(d => ({
        category: d.category || 'general',
        subcategory: d.subcategory || '',
        question: d.question,
        answer: d.answer,
        difficulty: d.difficulty || 'medium',
        tags: [d.category || 'general', d.subcategory || ''],
      }));

      const { error } = await supabase.from('question_bank').insert(rows);
      if (error) throw error;

      toast({ title: 'Imported!', description: `${rows.length} questions added.` });
      fetchQuestions();
    } catch (error: any) {
      toast({ title: 'Import Error', description: error.message, variant: 'destructive' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (q: Question) => {
    setEditingQuestion(q);
    setFormCategory(q.category);
    setFormSubcategory(q.subcategory);
    setFormQuestion(q.question);
    setFormAnswer(q.answer);
    setFormDifficulty(q.difficulty);
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setShowAddDialog(false);
    setEditingQuestion(null);
    setFormCategory('course');
    setFormSubcategory('');
    setFormQuestion('');
    setFormAnswer('');
    setFormDifficulty('medium');
  };

  const categories = [...new Set(questions.map(q => q.category))];
  const subcategories = [...new Set(questions.filter(q => filterCategory === 'all' || q.category === filterCategory).map(q => q.subcategory))];

  const filtered = questions.filter(q => {
    if (filterCategory !== 'all' && q.category !== filterCategory) return false;
    if (filterSubcategory !== 'all' && q.subcategory !== filterSubcategory) return false;
    if (searchTerm && !q.question.toLowerCase().includes(searchTerm.toLowerCase()) && !q.answer.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const diffColor = (d: string) => d === 'easy' ? 'bg-green-100 text-green-700' : d === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';

  return (
    <div className="space-y-6">
      {/* AI Usage Stats */}
      {aiUsage.length > 0 && (
        <Card className="border-0 shadow-soft">
          <CardHeader><CardTitle className="text-lg">AI Usage Statistics</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {aiUsage.map(u => (
                <div key={u.feature} className="bg-secondary/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground capitalize">{u.feature.replace(/-/g, ' ')}</p>
                  <p className="text-2xl font-bold">{u.count}</p>
                  <p className="text-xs text-muted-foreground">{u.total_tokens.toLocaleString()} tokens</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search questions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterCategory} onValueChange={v => { setFilterCategory(v); setFilterSubcategory('all'); }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSubcategory} onValueChange={setFilterSubcategory}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sub</SelectItem>
            {subcategories.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }} variant="gradient" size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Question
        </Button>
        <div>
          <input ref={fileInputRef} type="file" accept=".json,.csv" className="hidden" onChange={handleBulkImport} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1" /> Bulk Import
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} questions found</p>

      {/* Questions Table */}
      {loading ? (
        <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : (
        <div className="rounded-lg border overflow-auto max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Sub</TableHead>
                <TableHead className="min-w-[300px]">Question</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 50).map(q => (
                <TableRow key={q.id}>
                  <TableCell><Badge variant="outline">{q.category}</Badge></TableCell>
                  <TableCell className="text-sm">{q.subcategory}</TableCell>
                  <TableCell className="text-sm max-w-[400px] truncate">{q.question}</TableCell>
                  <TableCell><Badge className={diffColor(q.difficulty)}>{q.difficulty}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(q)}><Edit2 className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(q.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={v => { if (!v) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="language">Language</SelectItem>
                    <SelectItem value="role">Job Role</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategory</Label>
                <Input value={formSubcategory} onChange={e => setFormSubcategory(e.target.value)} placeholder="e.g. Python, MBA" />
              </div>
            </div>
            <div>
              <Label>Question</Label>
              <Textarea value={formQuestion} onChange={e => setFormQuestion(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Answer</Label>
              <Textarea value={formAnswer} onChange={e => setFormAnswer(e.target.value)} rows={4} />
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={formDifficulty} onValueChange={setFormDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving} variant="gradient" className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingQuestion ? 'Update' : 'Add'} Question
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminQuestions;
