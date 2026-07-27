import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const COURSES = ['BA', 'B.Com', 'BBA', 'BCA', 'M.Com', 'MBA', 'MA', 'MSc', 'M.Ed.', 'PhD', 'M.Phil'];
const REPORT_TYPES = ['Internship Report', 'Project Report', 'Dissertation', 'Thesis Assistance'];
const UNIVERSITIES = [
  'Anna University', 'VTU', 'AKTU', 'Mumbai University', 'JNTU',
  'Pune University', 'Calicut University', 'SPPU', 'GTU', 'Other',
];

const suggestReportType = (course: string): string => {
  if (['PhD', 'M.Phil'].includes(course)) return 'Thesis Assistance';
  if (['MBA', 'M.Com', 'MA', 'MSc', 'M.Ed.'].includes(course)) return 'Dissertation';
  if (['BCA', 'BBA', 'B.Com', 'BA'].includes(course)) return 'Internship Report';
  return 'Project Report';
};

const pageOptions: Record<string, { label: string; value: number }[]> = {
  'Internship Report': [
    { label: '30 pages', value: 30 }, { label: '40 pages', value: 40 }, { label: '50 pages', value: 50 },
  ],
  'Project Report': [
    { label: '60 pages', value: 60 }, { label: '80 pages', value: 80 }, { label: '100 pages', value: 100 },
  ],
  Dissertation: [
    { label: '60 pages', value: 60 }, { label: '80 pages', value: 80 }, { label: '100 pages', value: 100 },
  ],
  'Thesis Assistance': [
    { label: '100 pages', value: 100 }, { label: '150 pages', value: 150 }, { label: '200 pages', value: 200 },
  ],
};

type Kind = 'internship' | 'project' | 'thesis';

const KIND_CONFIG: Record<Kind, {
  slug: Kind;
  heading: string;
  tagline: string;
  defaultType: string;
  types: string[];
  courses: string[];
}> = {
  internship: {
    slug: 'internship',
    heading: 'Internship Report',
    tagline: 'Company-based internship report with certificate, chapters & annexures.',
    defaultType: 'Internship Report',
    types: ['Internship Report'],
    courses: ['BA', 'B.Com', 'BBA', 'BCA', 'M.Com', 'MBA', 'MA', 'MSc', 'M.Ed.'],
  },
  project: {
    slug: 'project',
    heading: 'Project Report',
    tagline: 'Academic project & case-study report formatted to university guidelines.',
    defaultType: 'Project Report',
    types: ['Project Report', 'Dissertation'],
    courses: ['BA', 'B.Com', 'BBA', 'BCA', 'M.Com', 'MBA', 'MA', 'MSc', 'M.Ed.'],
  },
  thesis: {
    slug: 'thesis',
    heading: 'Thesis / Dissertation',
    tagline: 'Structure and format your research for PhD, M.Phil & PG dissertations.',
    defaultType: 'Thesis Assistance',
    types: ['Thesis Assistance', 'Dissertation'],
    courses: ['PhD', 'M.Phil', 'MBA', 'M.Com', 'MA', 'MSc', 'M.Ed.'],
  },
};

const STORAGE_KEY_BASE = 'generate_form_draft_v1';

interface FormState {
  course: string;
  reportType: string;
  university: string;
  universityOther: string;
  fullName: string;
  rollNumber: string;
  semesterYear: string;
  department: string;
  guideName: string;
  // internship
  companyName: string;
  internshipStart: string;
  internshipEnd: string;
  internshipRole: string;
  workDescription: string;
  // project / dissertation
  projectTopic: string;
  caseStudyCompany: string;
  objective: string;
  // thesis
  researchTitle: string;
  researchArea: string;
  researchSummary: string;
  // format
  pagesCount: number;
  fontStyle: string;
  includeAppendix: boolean;
}

const initialState: FormState = {
  course: '', reportType: '', university: '', universityOther: '',
  fullName: '', rollNumber: '', semesterYear: '', department: '', guideName: '',
  companyName: '', internshipStart: '', internshipEnd: '', internshipRole: '', workDescription: '',
  projectTopic: '', caseStudyCompany: '', objective: '',
  researchTitle: '', researchArea: '', researchSummary: '',
  pagesCount: 30, fontStyle: 'Times New Roman 12pt (Standard)', includeAppendix: true,
};

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

const Generate = ({ kind: kindProp }: { kind?: Kind }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const urlCourse = searchParams.get('course') || '';
  const urlType = searchParams.get('type') || '';
  const courseMap: Record<string, string> = {
    ba: 'BA', bcom: 'B.Com', bba: 'BBA', bca: 'BCA', mcom: 'M.Com',
    mba: 'MBA', ma: 'MA', msc: 'MSc', med: 'M.Ed.', phd: 'PhD', mphil: 'M.Phil',
  };
  const typeMap: Record<string, string> = {
    internship: 'Internship Report', project: 'Project Report',
    dissertation: 'Dissertation', thesis: 'Thesis Assistance',
  };

  const pathKind = (location.pathname.split('/')[2] || '') as Kind;
  const kind: Kind = (kindProp || (KIND_CONFIG[pathKind] ? pathKind : undefined)
    || (urlType.toLowerCase() === 'thesis' || urlType.toLowerCase() === 'dissertation'
        ? 'thesis'
        : urlType.toLowerCase() === 'project' ? 'project' : 'internship')) as Kind;
  const config = KIND_CONFIG[kind];
  const STORAGE_KEY = `${STORAGE_KEY_BASE}_${kind}`;

  const prefilledCourse = courseMap[urlCourse.toLowerCase()] || '';
  const prefilledType = typeMap[urlType.toLowerCase()] || config.defaultType;
  const step1Skipped = false;

  const [data, setData] = useState<FormState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialState,
          ...parsed,
          course: prefilledCourse || parsed.course || '',
          reportType: config.types.includes(parsed.reportType) ? parsed.reportType : config.defaultType,
        };
      }
    } catch {}
    return {
      ...initialState,
      course: prefilledCourse,
      reportType: prefilledType,
      pagesCount: pageOptions[prefilledType]?.[0]?.value || 30,
    };
  });

  const [step, setStep] = useState(step1Skipped ? 2 : 1);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Persist last course + type as URL slugs for "Resume last report" shortcut
    try {
      const courseSlug = Object.keys(courseMap).find(k => courseMap[k] === data.course) || '';
      const typeSlug = kind;
      if (courseSlug || typeSlug) {
        localStorage.setItem('last_generate_selection', JSON.stringify({
          course: courseSlug, type: typeSlug, savedAt: Date.now(),
        }));
      }
    } catch {}
  }, [data]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setData(prev => ({ ...prev, [k]: v }));

  const isInternship = kind === 'internship';
  const isProject = kind === 'project';
  const isThesis = kind === 'thesis';

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const stepLabels = ['Course & University', 'Student Details', config.heading + ' Details', 'Format', 'Review'];

  const validate = (s: number): string | null => {
    if (s === 1) {
      if (!data.course) return 'Please select your course';
      if (!data.reportType) return 'Please select a report type';
      if (!data.university) return 'Please select a university';
      if (data.university === 'Other' && !data.universityOther.trim()) return 'Enter your university';
    }
    if (s === 2) {
      if (!data.fullName.trim()) return 'Enter your full name';
      if (!data.rollNumber.trim()) return 'Enter your roll / registration number';
      if (!data.semesterYear.trim()) return 'Enter your semester / year';
      if (!data.department.trim()) return 'Enter your department / specialization';
    }
    if (s === 3) {
      if (isInternship) {
        if (!data.companyName.trim()) return 'Enter company name';
        if (!data.internshipStart || !data.internshipEnd) return 'Enter internship duration';
        if (!data.internshipRole.trim()) return 'Enter department / role';
        if (wordCount(data.workDescription) < 50) return 'Work description must be at least 50 words';
      } else if (isProject) {
        if (!data.projectTopic.trim()) return 'Enter your project / research topic';
        if (wordCount(data.objective) < 50) return 'Objective must be at least 50 words';
      } else if (isThesis) {
        if (!data.researchTitle.trim()) return 'Enter research title';
        if (!data.researchArea.trim()) return 'Enter research area';
        if (!data.researchSummary.trim()) return 'Paste your research summary';
      }
    }
    return null;
  };

  const next = () => {
    const err = validate(step);
    if (err) {
      toast({ title: 'Missing info', description: err, variant: 'destructive' });
      return;
    }
    setStep(s => Math.min(totalSteps, s + 1));
  };
  const back = () => setStep(s => Math.max(step1Skipped ? 2 : 1, s - 1));

  const handleSuggestTopics = async () => {
    setSuggesting(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('ai-report-content', {
        body: {
          course: data.course,
          topic: `Suggest 5 short project topics for a ${data.course} ${data.department} student`,
          description: 'Return only a numbered list of 5 topics, no explanation.',
          userId: user?.id,
          mode: 'suggest',
        },
      });
      if (error) throw error;
      const text = typeof res?.content === 'string' ? res.content : (res?.content?.abstract || '');
      const parsed = String(text)
        .split('\n')
        .map((l: string) => l.replace(/^\s*\d+[\).\s-]+/, '').trim())
        .filter((l: string) => l.length > 6)
        .slice(0, 5);
      if (parsed.length) setSuggestions(parsed);
      else toast({ title: 'No suggestions', description: 'Try adding your specialization.' });
    } catch (e: any) {
      // Fallback local suggestions
      setSuggestions([
        `Financial Analysis of a Leading ${data.department || 'Indian'} Company`,
        `A Study on Consumer Behavior in ${data.department || 'Retail'} Sector`,
        `Impact of Digital Marketing on ${data.department || 'SMEs'}`,
        `Working Capital Management: A Case Study`,
        `Employee Engagement Practices in ${data.department || 'IT'} Industry`,
      ]);
    } finally {
      setSuggesting(false);
    }
  };

  const handleGenerate = () => {
    if (!user) {
      navigate('/auth?redirect=/generate');
      return;
    }
    setGenerating(true);
    // Map to CreateReport form data
    const finalUni = data.university === 'Other' ? data.universityOther : data.university;
    const topicSpec = isInternship
      ? data.workDescription
      : isProject
        ? `${data.projectTopic}${data.caseStudyCompany ? ` (Case Study: ${data.caseStudyCompany})` : ''}\n\n${data.objective}`
        : `${data.researchTitle} — ${data.researchArea}\n\n${data.researchSummary}`;

    const payload = {
      studentName: data.fullName,
      registerNumber: data.rollNumber,
      course: data.course,
      collegeName: finalUni,
      university: finalUni,
      guideName: data.guideName,
      internshipTitle: isInternship ? data.internshipRole : (isProject ? data.projectTopic : data.researchTitle),
      companyName: isInternship ? data.companyName : (data.caseStudyCompany || ''),
      companyLocation: '',
      internshipDuration: isInternship ? `${data.internshipStart} to ${data.internshipEnd}` : '',
      academicYear: data.semesterYear,
      topicSpecialization: topicSpec,
      pagesCount: data.pagesCount,
      reportType: data.reportType,
      includeAppendix: data.includeAppendix,
    };
    sessionStorage.setItem('prefill_report_form', JSON.stringify(payload));
    localStorage.removeItem(STORAGE_KEY);
    navigate('/create-report?from=generate');
  };

  const StepDot = ({ n, label }: { n: number; label: string }) => {
    const active = step === n;
    const done = step > n;
    return (
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
          done ? 'bg-primary text-primary-foreground' :
          active ? 'bg-accent text-accent-foreground ring-2 ring-accent/40' :
          'bg-muted text-muted-foreground'
        }`}>
          {done ? <CheckCircle2 className="w-4 h-4" /> : n}
        </div>
        <span className={`text-xs sm:text-sm truncate ${active ? 'font-semibold' : 'text-muted-foreground'}`}>{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${config.heading} Generator — InternReport.in`}</title>
        <meta name="description" content={config.tagline} />
      </Helmet>

      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/generate"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Change type</Button></Link>
          <span className="font-display font-bold truncate">{config.heading}</span>
          <Link to="/"><Button variant="ghost" size="sm">Home</Button></Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="mb-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/10 p-4 sm:p-5">
          <h1 className="font-display text-xl sm:text-2xl font-bold">{config.heading}</h1>
          <p className="text-sm text-muted-foreground mt-1">{config.tagline}</p>
        </div>

        {/* Stepper */}
        <div className="mb-6 space-y-3">
          <Progress value={progress} className="h-2" />
          <div className="hidden sm:flex items-center justify-between gap-2">
            {stepLabels.map((label, i) => <StepDot key={i} n={i + 1} label={label} />)}
          </div>
          <p className="sm:hidden text-sm text-muted-foreground text-center">
            Step {step} of {totalSteps}: <span className="font-semibold text-foreground">{stepLabels[step - 1]}</span>
          </p>
        </div>


        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="font-display">{stepLabels[step - 1]}</CardTitle>
            <CardDescription>
              {step === 1 && 'Tell us what you need to generate.'}
              {step === 2 && 'Your academic details for the title page.'}
              {step === 3 && (isInternship ? 'Details about your internship.' : isProject ? 'Topic and objectives.' : 'Your existing research.')}
              {step === 4 && 'Length and formatting preferences.'}
              {step === 5 && 'Review everything before we generate.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <Label>Degree / Course *</Label>
                  <Select
                    value={data.course}
                    onValueChange={v => {
                      update('course', v);
                      if (!data.reportType) update('reportType', suggestReportType(v));
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select your course" /></SelectTrigger>
                    <SelectContent>
                      {COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Report Type *</Label>
                  <Select value={data.reportType} onValueChange={v => {
                    update('reportType', v);
                    update('pagesCount', pageOptions[v]?.[0]?.value || 30);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select report type" /></SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {data.course && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Suggested for {data.course}: <span className="font-medium">{suggestReportType(data.course)}</span>
                    </p>
                  )}
                </div>
                <div>
                  <Label>University / College *</Label>
                  <Select value={data.university} onValueChange={v => update('university', v)}>
                    <SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger>
                    <SelectContent>
                      {UNIVERSITIES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {data.university === 'Other' && (
                    <Input
                      className="mt-2"
                      placeholder="Enter your university name"
                      value={data.universityOther}
                      onChange={e => update('universityOther', e.target.value)}
                    />
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <Label>Full Name *</Label>
                  <Input value={data.fullName} onChange={e => update('fullName', e.target.value)} placeholder="As on your ID" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Roll / Registration No. *</Label>
                    <Input value={data.rollNumber} onChange={e => update('rollNumber', e.target.value)} />
                  </div>
                  <div>
                    <Label>Semester / Year *</Label>
                    <Input value={data.semesterYear} onChange={e => update('semesterYear', e.target.value)} placeholder="e.g. VI Semester / 2024-25" />
                  </div>
                </div>
                <div>
                  <Label>Department / Specialization *</Label>
                  <Input
                    value={data.department}
                    onChange={e => update('department', e.target.value)}
                    placeholder="e.g. Finance, Marketing, Computer Applications"
                  />
                </div>
                <div>
                  <Label>Guide / Supervisor Name (optional)</Label>
                  <Input value={data.guideName} onChange={e => update('guideName', e.target.value)} />
                </div>
              </>
            )}

            {step === 3 && isInternship && (
              <>
                <div>
                  <Label>Company / Organization *</Label>
                  <Input value={data.companyName} onChange={e => update('companyName', e.target.value)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Start Date *</Label>
                    <Input type="date" value={data.internshipStart} onChange={e => update('internshipStart', e.target.value)} />
                  </div>
                  <div>
                    <Label>End Date *</Label>
                    <Input type="date" value={data.internshipEnd} onChange={e => update('internshipEnd', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Department / Role *</Label>
                  <Input value={data.internshipRole} onChange={e => update('internshipRole', e.target.value)} placeholder="e.g. Marketing Intern" />
                </div>
                <div>
                  <Label>Brief Description of Work Done * <span className="text-xs text-muted-foreground">(min 50 words — {wordCount(data.workDescription)}/50)</span></Label>
                  <Textarea rows={6} value={data.workDescription} onChange={e => update('workDescription', e.target.value)}
                    placeholder="Describe the tasks, tools, projects, and learnings during your internship. The more detail, the less generic your report." />
                </div>
              </>
            )}

            {step === 3 && isProject && (
              <>
                <div>
                  <Label>Project / Research Topic *</Label>
                  <div className="flex gap-2">
                    <Input value={data.projectTopic} onChange={e => update('projectTopic', e.target.value)} placeholder="Enter topic or leave blank for suggestions" />
                    <Button type="button" variant="outline" onClick={handleSuggestTopics} disabled={suggesting}>
                      {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span className="ml-1 hidden sm:inline">Suggest</span>
                    </Button>
                  </div>
                  {suggestions.length > 0 && (
                    <div className="mt-2 space-y-1 border rounded-md p-2">
                      <p className="text-xs text-muted-foreground mb-1">Tap a topic to use it:</p>
                      {suggestions.map((s, i) => (
                        <button key={i} type="button"
                          onClick={() => { update('projectTopic', s); setSuggestions([]); }}
                          className="w-full text-left text-sm p-2 rounded hover:bg-muted transition">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label>Case Study Company / Organization (optional)</Label>
                  <Input value={data.caseStudyCompany} onChange={e => update('caseStudyCompany', e.target.value)}
                    placeholder="e.g. Reliance Industries" />
                </div>
                <div>
                  <Label>Objective / Scope of Study * <span className="text-xs text-muted-foreground">(min 50 words — {wordCount(data.objective)}/50)</span></Label>
                  <Textarea rows={6} value={data.objective} onChange={e => update('objective', e.target.value)}
                    placeholder="What are you studying, why, and what outcomes do you expect?" />
                </div>
              </>
            )}

            {step === 3 && isThesis && (
              <>
                <div className="flex gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>This tool assists with structure, formatting, and academic writing conventions. All research data, findings, and original contributions must be your own.</span>
                </div>
                <div>
                  <Label>Research Title *</Label>
                  <Input value={data.researchTitle} onChange={e => update('researchTitle', e.target.value)} />
                </div>
                <div>
                  <Label>Research Area / Field *</Label>
                  <Input value={data.researchArea} onChange={e => update('researchArea', e.target.value)} />
                </div>
                <div>
                  <Label>Paste Your Research Summary, Findings, or Data *</Label>
                  <Textarea rows={8} value={data.researchSummary} onChange={e => update('researchSummary', e.target.value)}
                    placeholder="Paste your existing research — this tool structures and formats it. It does not generate findings for you." />
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div>
                  <Label>Page Count Target</Label>
                  <Select value={String(data.pagesCount)} onValueChange={v => update('pagesCount', Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(pageOptions[data.reportType] || pageOptions['Internship Report']).map(o =>
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Font / Format Style</Label>
                  <Select value={data.fontStyle} onValueChange={v => update('fontStyle', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Times New Roman 12pt (Standard)">Times New Roman 12pt (Standard)</SelectItem>
                      <SelectItem value="Arial 12pt">Arial 12pt</SelectItem>
                      <SelectItem value="Calibri 12pt">Calibri 12pt</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Most universities accept the standard. Change only if required.</p>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label className="cursor-pointer">Include Appendix / Annexures?</Label>
                    <p className="text-xs text-muted-foreground">Adds a formatted annexure section at the end.</p>
                  </div>
                  <Switch checked={data.includeAppendix} onCheckedChange={v => update('includeAppendix', v)} />
                </div>
              </>
            )}

            {step === 5 && (
              <div className="space-y-3 text-sm">
                <SummaryRow label="Course" value={data.course} />
                <SummaryRow label="Report Type" value={data.reportType} />
                <SummaryRow label="University" value={data.university === 'Other' ? data.universityOther : data.university} />
                <div className="border-t pt-3" />
                <SummaryRow label="Name" value={data.fullName} />
                <SummaryRow label="Roll No." value={data.rollNumber} />
                <SummaryRow label="Semester / Year" value={data.semesterYear} />
                <SummaryRow label="Specialization" value={data.department} />
                {data.guideName && <SummaryRow label="Guide" value={data.guideName} />}
                <div className="border-t pt-3" />
                {isInternship && <>
                  <SummaryRow label="Company" value={data.companyName} />
                  <SummaryRow label="Duration" value={`${data.internshipStart} to ${data.internshipEnd}`} />
                  <SummaryRow label="Role" value={data.internshipRole} />
                </>}
                {isProject && <>
                  <SummaryRow label="Topic" value={data.projectTopic} />
                  {data.caseStudyCompany && <SummaryRow label="Case Study" value={data.caseStudyCompany} />}
                </>}
                {isThesis && <>
                  <SummaryRow label="Research Title" value={data.researchTitle} />
                  <SummaryRow label="Area" value={data.researchArea} />
                </>}
                <div className="border-t pt-3" />
                <SummaryRow label="Pages" value={`${data.pagesCount} pages`} />
                <SummaryRow label="Font" value={data.fontStyle} />
                <SummaryRow label="Appendix" value={data.includeAppendix ? 'Yes' : 'No'} />
              </div>
            )}

            {/* Nav buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={back} disabled={step === (step1Skipped ? 2 : 1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              {step < totalSteps ? (
                <Button onClick={next} variant="gradient">
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleGenerate} variant="gradient" size="lg" disabled={generating}>
                  {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Generate Report
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-right break-words">{value || '—'}</span>
  </div>
);

export default Generate;
