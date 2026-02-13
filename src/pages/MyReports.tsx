import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  ArrowLeft, 
  Download, 
  Calendar,
  Building,
  GraduationCap,
  FileDown,
  FolderOpen
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

const fetchImageAsBuffer = async (keyword: string, index: number): Promise<ArrayBuffer | null> => {
  try {
    const response = await fetch(
      `https://loremflickr.com/640/400/${encodeURIComponent(keyword)}?lock=${index}`,
      { redirect: 'follow' }
    );
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
};

const getImageKeywords = (report: Report): string[] => {
  const title = report.internship_title.toLowerCase();
  const topic = report.company_name.toLowerCase();
  const keywords = [
    title.split(' ').slice(0, 2).join(' '),
    'office workplace',
    'internship student',
    'business meeting',
    'computer technology',
    'teamwork collaboration',
    'professional work',
    'data analysis',
    'presentation corporate',
    'learning education',
  ];
  return keywords.slice(0, 8);
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
}

const MyReports = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

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
      new Paragraph({
        children: [new PageBreak()],
      })
    );

    // Track image insertion points (after major headings)
    let imageIndex = 0;
    const imageInsertAfterHeadings = new Set([1, 3, 5, 7, 9, 11, 13, 15]); // Insert images after these heading occurrences
    let headingCount = 0;

    // Parse and add content with images
    sections.forEach(section => {
      if (section.trim()) {
        if (section.startsWith('# ')) {
          headingCount++;
          children.push(
            new Paragraph({
              text: section.replace('# ', ''),
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            })
          );
          // Insert image after certain headings
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
        } else if (section.startsWith('## ')) {
          headingCount++;
          children.push(
            new Paragraph({
              text: section.replace('## ', ''),
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
        } else if (section.startsWith('### ')) {
          children.push(
            new Paragraph({
              text: section.replace('### ', ''),
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 },
            })
          );
        } else {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: section, size: 24 })],
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

    toast({
      title: 'Downloaded!',
      description: `Your report has been downloaded with ${imageIndex} images.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground">Completed</Badge>;
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
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">My Reports</h1>
          <p className="text-muted-foreground">View and download your previously generated reports</p>
        </div>

        {reports.length === 0 ? (
          <Card className="border-0 shadow-soft">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">No Reports Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't generated any reports yet. Create your first one!
              </p>
              <Link to="/create-report">
                <Button variant="gradient">Create Your First Report</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="border-0 shadow-soft hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display font-semibold text-lg">{report.internship_title}</h3>
                        {getStatusBadge(report.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {report.company_name}
                        </div>
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
                    </div>
                    <div className="flex gap-2">
                      {report.status === 'completed' && report.report_content && (
                        <Button 
                          variant="gradient" 
                          onClick={() => downloadReport(report)}
                        >
                          <Download className="w-4 h-4" />
                          Download DOCX
                        </Button>
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
