import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  ArrowLeft, 
  Download, 
  Calendar,
  Building,
  GraduationCap,
  FileDown,
  FolderOpen,
  Search,
  History as HistoryIcon
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

const fetchImageAsBuffer = async (keyword: string, index: number): Promise<ArrayBuffer | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-report-image', {
      body: { keyword, index },
    });
    if (error || !data?.image) return null;
    const binaryStr = atob(data.image);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
  } catch {
    return null;
  }
};

const getImageKeywords = (report: Report): string[] => {
  const title = report.internship_title.toLowerCase();
  const topic = (report.company_name || '').toLowerCase();
  const specialization = title.split(' ').slice(0, 3).join(' ');
  const keywords = [
    specialization,
    `${specialization} workplace`,
    `${title.split(' ')[0]} technology`,
    'internship student learning',
    'business office professional',
    'corporate team meeting',
    'data analysis computer',
    'project management workflow',
    'presentation skills training',
    'industry workplace modern',
    'digital technology innovation',
    'professional development career',
  ];
  // Return 10 unique keywords (for 7-12 images range)
  return keywords.slice(0, 10);
};

type ReportKind = 'internship' | 'project' | 'thesis';

const KIND_LABELS: Record<ReportKind, string> = {
  internship: 'Internship Report',
  project: 'Project Report',
  thesis: 'Thesis / Dissertation',
};

interface Report {
  id: string;
  student_name: string;
  internship_title: string;
  company_name: string;
  college_name: string;
  university: string;
  pages_count: number;
  status: string;
  report_content: string | null;
  created_at: string;
  guide_name: string;
  register_number: string;
  course: string;
  academic_year: string;
  report_kind: string;
  download_count: number;
  last_downloaded_at: string | null;
}

const MyReports = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | ReportKind>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'generating' | 'pending_payment' | 'failed'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (report: Report) => {
    if (!report.report_content) {
      toast({
        title: 'No content',
        description: 'This report has no content to download.',
        variant: 'destructive',
      });
      return;
    }

    // Clean up any markers before processing
    let cleanContent = report.report_content;
    cleanContent = cleanContent.replace(/\(In-Depth\)/gi, '');
    cleanContent = cleanContent.replace(/\(In Deep\)/gi, '');
    cleanContent = cleanContent.replace(/In-Depth:/gi, '');
    cleanContent = cleanContent.replace(/In Deep:/gi, '');
    cleanContent = cleanContent.replace(/\*\*/g, '');
    cleanContent = cleanContent.replace(/\*/g, '');
    cleanContent = cleanContent.replace(/`/g, '');

    // Fetch 8 free topic-related images
    toast({
      title: 'Preparing report...',
      description: 'Fetching images for your report. This may take a moment.',
    });

    const keywords = getImageKeywords(report);
    const imagePromises = keywords.map((kw, i) => fetchImageAsBuffer(kw, i));
    const imageBuffers = (await Promise.all(imagePromises)).filter(Boolean) as ArrayBuffer[];

    const sections = cleanContent.split('\n\n');
    const children: Paragraph[] = [];

    // Title page
    children.push(
      new Paragraph({
        children: [new TextRun({ text: report.university.toUpperCase(), bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: report.college_name, bold: true, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'INTERNSHIP PROJECT REPORT', bold: true, size: 36 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `On`, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `"${report.internship_title}"`, bold: true, size: 28, italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Submitted by`, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: report.student_name, bold: true, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Register No: ${report.register_number}`, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Under the guidance of`, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: report.guide_name, bold: true, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `${report.course}`, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Academic Year: ${report.academic_year}`, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    // Certificate page
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'CERTIFICATE', bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `This is to certify that ${report.student_name} (Register No: ${report.register_number}) of ${report.course}, ${report.college_name}, has successfully completed the Internship Project Report titled "${report.internship_title}" at ${report.company_name} during the academic year ${report.academic_year}, under the guidance of ${report.guide_name}.`, size: 24 })],
        spacing: { after: 600 },
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Guide', bold: true, size: 24 })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: report.guide_name, size: 24 })],
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Head of Department', bold: true, size: 24 })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: '________________________', size: 24 })],
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'External Examiner', bold: true, size: 24 })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: '________________________', size: 24 })],
        spacing: { after: 400 },
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    // Declaration page
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'DECLARATION', bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `I, ${report.student_name}, hereby declare that the Internship Project Report titled "${report.internship_title}" submitted to ${report.university} is a record of original work done by me during my internship at ${report.company_name}, under the guidance of ${report.guide_name}. This report has not been submitted to any other university or institution for the award of any degree or diploma.`, size: 24 })],
        spacing: { after: 600 },
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [new TextRun({ text: `Place: ________________________`, size: 24 })],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Date: ________________________`, size: 24 })],
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: report.student_name, bold: true, size: 24 })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Register No: ${report.register_number}`, size: 24 })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 400 },
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    // Acknowledgement page
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'ACKNOWLEDGEMENT', bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `I would like to express my sincere gratitude to my guide ${report.guide_name} for the continuous support, guidance, and encouragement throughout the internship period.`, size: 24 })],
        spacing: { after: 300 },
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [new TextRun({ text: `I am grateful to ${report.college_name}, ${report.university} for providing me with the opportunity to undertake this internship.`, size: 24 })],
        spacing: { after: 300 },
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [new TextRun({ text: `I also extend my thanks to ${report.company_name} for allowing me to carry out my internship and for providing the necessary resources and environment to learn and grow.`, size: 24 })],
        spacing: { after: 300 },
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [new TextRun({ text: `Finally, I would like to thank my family and friends for their constant support and motivation.`, size: 24 })],
        spacing: { after: 600 },
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [new TextRun({ text: report.student_name, bold: true, size: 24 })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 400 },
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    // Track image insertion points (after major headings)
    let imageIndex = 0;
    const imageInsertAfterHeadings = new Set([1, 2, 4, 5, 7, 8, 10, 11, 13, 15]);
    let headingCount = 0;

    // Parse and add content with images
    sections.forEach(section => {
      if (section.trim()) {
        const trimmed = section.trim();
        const isChapterHeading = (text: string) => /chapter\s/i.test(text);

        if (trimmed.startsWith('# ')) {
          const headingText = trimmed.replace('# ', '');
          headingCount++;
          // Add page break before each chapter
          if (isChapterHeading(headingText)) {
            children.push(new Paragraph({ children: [new PageBreak()] }));
          }
          children.push(
            new Paragraph({
              text: headingText,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            })
          );
          if (imageInsertAfterHeadings.has(headingCount) && imageIndex < imageBuffers.length) {
            children.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBuffers[imageIndex],
                    transformation: { width: 500, height: 312 },
                    type: 'jpg',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
              }),
              new Paragraph({
                children: [new TextRun({ text: `Figure ${imageIndex + 1}`, italics: true, size: 20, color: '666666' })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
              })
            );
            imageIndex++;
          }
        } else if (trimmed.startsWith('## ')) {
          headingCount++;
          children.push(
            new Paragraph({
              text: trimmed.replace('## ', ''),
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            })
          );
          if (imageInsertAfterHeadings.has(headingCount) && imageIndex < imageBuffers.length) {
            children.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBuffers[imageIndex],
                    transformation: { width: 500, height: 312 },
                    type: 'jpg',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
              }),
              new Paragraph({
                children: [new TextRun({ text: `Figure ${imageIndex + 1}`, italics: true, size: 20, color: '666666' })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
              })
            );
            imageIndex++;
          }
        } else if (trimmed.startsWith('### ')) {
          children.push(
            new Paragraph({
              text: trimmed.replace('### ', ''),
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 },
            })
          );
        } else {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed, size: 24 })],
              spacing: { after: 200 },
              alignment: AlignmentType.JUSTIFIED,
            })
          );
        }
      }
    });

    const doc = new Document({
      sections: [{ properties: {}, children }],
    });

    const blob = await Packer.toBlob(doc);
    const filename = `${report.student_name.replace(/\s+/g, '_')}_Internship_Report.docx`;
    saveAs(blob, filename);
    await recordDownload(report);

    toast({
      title: 'Downloaded!',
      description: `Your report has been downloaded with ${imageIndex} images.`,
    });
  };

  const recordDownload = async (report: Report) => {
    const nextCount = (report.download_count || 0) + 1;
    const now = new Date().toISOString();
    setReports(prev => prev.map(r =>
      r.id === report.id ? { ...r, download_count: nextCount, last_downloaded_at: now } : r
    ));
    try {
      await supabase
        .from('reports')
        .update({ download_count: nextCount, last_downloaded_at: now })
        .eq('id', report.id);
    } catch (e) {
      console.error('Error recording download:', e);
    }
  };

  const normalizedKind = (report: Report): ReportKind => {
    const k = report.report_kind;
    return k === 'project' || k === 'thesis' ? k : 'internship';
  };

  const filteredReports = reports.filter(r => {
    if (kindFilter !== 'all' && normalizedKind(r) !== kindFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.internship_title, r.company_name, r.college_name, r.university, r.course, KIND_LABELS[normalizedKind(r)]]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(q));
  });

  const kindCount = (k: 'all' | ReportKind) =>
    k === 'all' ? reports.length : reports.filter(r => normalizedKind(r) === k).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground">Completed</Badge>;
      case 'generating':
        return <Badge className="bg-accent text-accent-foreground">Generating</Badge>;
      case 'pending_payment':
        return <Badge variant="secondary">Awaiting Payment</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">InternReport.in</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-2">My Reports</h1>
          <p className="text-muted-foreground">Search, filter by report type, and track generation & download history</p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by title, company, college or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {([['all', 'All'], ['internship', 'Internship'], ['project', 'Project'], ['thesis', 'Thesis']] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKindFilter(k as 'all' | ReportKind)}
                className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                  kindFilter === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary'
                }`}
              >
                {label} ({kindCount(k as 'all' | ReportKind)})
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {([['all', 'Any status'], ['completed', 'Completed'], ['generating', 'Generating'], ['pending_payment', 'Awaiting payment'], ['failed', 'Failed']] as const).map(([s, label]) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s as typeof statusFilter)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  statusFilter === s ? 'bg-accent text-accent-foreground border-accent' : 'bg-background border-border hover:border-accent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <Card className="border-0 shadow-soft">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                {reports.length === 0 ? 'No Reports Yet' : 'No Matching Reports'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {reports.length === 0
                  ? "You haven't generated any reports yet. Create your first one!"
                  : 'Try a different search term or filter.'}
              </p>
              <Link to="/create-report">
                <Button variant="gradient">Create Your First Report</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="border-0 shadow-soft hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-display font-semibold text-lg">{report.internship_title}</h3>
                        <Badge variant="outline">{KIND_LABELS[normalizedKind(report)]}</Badge>
                        {getStatusBadge(report.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                        {report.company_name && (
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            {report.company_name}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          {report.college_name}
                        </div>
                        <div className="flex items-center gap-2">
                          <FileDown className="w-4 h-4" />
                          {report.pages_count} pages
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(report.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <HistoryIcon className="w-3.5 h-3.5" />
                          {report.download_count > 0
                            ? `Downloaded ${report.download_count} time${report.download_count === 1 ? '' : 's'}`
                            : 'Never downloaded'}
                        </span>
                        {report.last_downloaded_at && (
                          <span>Last download: {format(new Date(report.last_downloaded_at), 'MMM dd, yyyy • hh:mm a')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {report.status === 'completed' && report.report_content ? (
                        <Button 
                          variant="gradient" 
                          onClick={() => downloadReport(report)}
                        >
                          <Download className="w-4 h-4" />
                          Download DOCX
                        </Button>
                      ) : (
                        <Link to="/create-report">
                          <Button variant="outline">Continue</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyReports;
