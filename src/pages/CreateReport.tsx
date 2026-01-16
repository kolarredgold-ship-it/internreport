import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, ArrowLeft, Loader2, Download, Sparkles, CreditCard, Clock, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } from 'docx';
import { saveAs } from 'file-saver';
import PaymentModal from '@/components/PaymentModal';

interface FormData {
  studentName: string;
  registerNumber: string;
  course: string;
  collegeName: string;
  university: string;
  guideName: string;
  internshipTitle: string;
  companyName: string;
  companyLocation: string;
  internshipDuration: string;
  academicYear: string;
  topicSpecialization: string;
  pagesCount: number;
}

const initialFormData: FormData = {
  studentName: '',
  registerNumber: '',
  course: '',
  collegeName: '',
  university: '',
  guideName: '',
  internshipTitle: '',
  companyName: '',
  companyLocation: '',
  internshipDuration: '',
  academicYear: '',
  topicSpecialization: '',
  pagesCount: 10,
};

const CreateReport = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [generating, setGenerating] = useState(false);
  const [generatingPart, setGeneratingPart] = useState<'A' | 'B' | null>(null);
  const [partAContent, setPartAContent] = useState<string | null>(null);
  const [partBContent, setPartBContent] = useState<string | null>(null);
  const [canGenerate, setCanGenerate] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'none' | 'pending' | 'verified'>('none');
  const [hasApprovedPayment, setHasApprovedPayment] = useState(false);
  const [generationsUsed, setGenerationsUsed] = useState(0);
  const [needsTopup, setNeedsTopup] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationPhase, setGenerationPhase] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkUserStatus();
    }
  }, [user]);

  const checkUserStatus = async () => {
    setCheckingStatus(true);
    try {
      // Check generations used
      const { data: profileData } = await supabase
        .from('profiles')
        .select('generations_used')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      const usedCount = profileData?.generations_used || 0;
      setGenerationsUsed(usedCount);

      // Check if user has any verified payment
      const { data: paymentData } = await supabase
        .from('payments')
        .select('id, status')
        .eq('user_id', user?.id)
        .eq('status', 'verified')
        .limit(1);

      const hasVerifiedPayment = paymentData && paymentData.length > 0;
      setHasApprovedPayment(hasVerifiedPayment);

      // User can generate if: has verified payment AND used < 3
      // OR: no payment yet (first 3 are free after first payment)
      if (hasVerifiedPayment && usedCount < 3) {
        setCanGenerate(true);
        setNeedsTopup(false);
      } else if (hasVerifiedPayment && usedCount >= 3) {
        // Check if they have a topup payment verified after reaching limit
        const { data: topupPayments } = await supabase
          .from('payments')
          .select('id, created_at')
          .eq('user_id', user?.id)
          .eq('status', 'verified')
          .eq('payment_type', 'topup')
          .order('created_at', { ascending: false })
          .limit(1);

        if (topupPayments && topupPayments.length > 0) {
          // Check how many reports generated after latest topup
          const { count: reportsAfterTopup } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user?.id)
            .eq('status', 'completed')
            .gt('created_at', topupPayments[0].created_at);

          if ((reportsAfterTopup || 0) < 3) {
            setCanGenerate(true);
            setNeedsTopup(false);
          } else {
            setCanGenerate(false);
            setNeedsTopup(true);
          }
        } else {
          setCanGenerate(false);
          setNeedsTopup(true);
        }
      } else if (!hasVerifiedPayment) {
        // No verified payment yet - need to pay first
        setCanGenerate(false);
        setNeedsTopup(false);
      }

      // Check for pending payments
      const { data: pendingPayment } = await supabase
        .from('payments')
        .select('id, report_id')
        .eq('user_id', user?.id)
        .eq('status', 'pending')
        .limit(1);

      if (pendingPayment && pendingPayment.length > 0) {
        setPaymentStatus('pending');
        if (pendingPayment[0].report_id) {
          setPendingReportId(pendingPayment[0].report_id);
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculatePrice = () => {
    const pages = formData.pagesCount;
    if (pages <= 10) return 99;    // 3-10 pages: ₹99
    if (pages <= 20) return 299;   // 11-20 pages: ₹299
    return 499;                     // Above 20 pages: ₹499
  };

  const validateForm = () => {
    const requiredFields = [
      'studentName', 'registerNumber', 'course', 'collegeName', 
      'university', 'guideName', 'internshipTitle', 'companyName',
      'companyLocation', 'internshipDuration', 'academicYear', 'topicSpecialization'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof FormData]) {
        toast({
          title: 'Missing information',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return false;
      }
    }
    return true;
  };

  const handleProceedToPayment = async () => {
    if (!validateForm()) return;

    try {
      // Create a pending report first
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert({
          user_id: user?.id,
          student_name: formData.studentName,
          register_number: formData.registerNumber,
          course: formData.course,
          college_name: formData.collegeName,
          university: formData.university,
          guide_name: formData.guideName,
          internship_title: formData.internshipTitle,
          company_name: formData.companyName,
          company_location: formData.companyLocation,
          internship_duration: formData.internshipDuration,
          academic_year: formData.academicYear,
          topic_specialization: formData.topicSpecialization,
          pages_count: formData.pagesCount,
          status: 'pending_payment',
        })
        .select()
        .single();

      if (reportError) throw reportError;

      setPendingReportId(reportData.id);
      setShowPaymentModal(true);
    } catch (error: any) {
      console.error('Create report error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleTopupPayment = () => {
    setPendingReportId(null); // No specific report for topup
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentStatus('pending');
    setShowPaymentModal(false);
    toast({
      title: 'Payment submitted!',
      description: 'Your payment is under review. Report will be generated after verification.',
    });
  };

  const handleGeneratePart = async (part: 'A' | 'B') => {
    if (!canGenerate) {
      toast({
        title: 'Generation limit reached',
        description: 'Please top up to continue generating reports.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateForm()) return;

    setGenerating(true);
    setGeneratingPart(part);
    setGenerationProgress(0);
    setGenerationPhase(`Initializing AI engine for Part ${part}...`);

    // Progress phases based on part
    const progressPhasesA = [
      { progress: 10, phase: 'Generating Certificate & Declaration...', delay: 3000 },
      { progress: 25, phase: 'Writing Acknowledgement & Abstract...', delay: 8000 },
      { progress: 40, phase: 'Composing Chapter 1: Introduction...', delay: 15000 },
      { progress: 55, phase: 'Composing Chapter 2: Company Profile...', delay: 25000 },
      { progress: 70, phase: 'Writing Chapter 3: Literature Review...', delay: 40000 },
      { progress: 85, phase: 'Detailing Chapter 4: Internship Activities...', delay: 55000 },
      { progress: 95, phase: 'Writing Chapter 5: Technical Learning...', delay: 70000 },
    ];
    
    const progressPhasesB = [
      { progress: 15, phase: 'Analyzing Chapter 6: Findings...', delay: 5000 },
      { progress: 35, phase: 'Composing Chapter 7: Challenges...', delay: 15000 },
      { progress: 55, phase: 'Writing Chapter 8: Recommendations...', delay: 30000 },
      { progress: 75, phase: 'Completing Chapter 9: Conclusion...', delay: 45000 },
      { progress: 90, phase: 'Adding Bibliography & Annexures...', delay: 60000 },
    ];

    const progressPhases = part === 'A' ? progressPhasesA : progressPhasesB;

    // Start progress simulation
    const progressIntervals: NodeJS.Timeout[] = [];
    progressPhases.forEach(({ progress, phase, delay }) => {
      const interval = setTimeout(() => {
        setGenerationProgress(progress);
        setGenerationPhase(phase);
      }, delay);
      progressIntervals.push(interval);
    });

    try {
      // Call edge function to generate report part
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          ...formData,
          userId: user?.id,
          part: part, // Pass which part to generate
        },
      });

      // Clear all progress intervals
      progressIntervals.forEach(clearTimeout);

      if (error) throw error;

      if (data.content) {
        setGenerationProgress(100);
        setGenerationPhase(`Part ${part} completed!`);
        
        if (part === 'A') {
          setPartAContent(data.content);
        } else {
          setPartBContent(data.content);
        }
        
        // Update generations count if provided
        if (data.generationsUsed !== undefined) {
          await supabase
            .from('profiles')
            .update({ generations_used: data.generationsUsed })
            .eq('user_id', user?.id);
        }

        toast({
          title: `Part ${part} generated!`,
          description: `Part ${part} of your report is ready for download.`,
        });
      }
    } catch (error: any) {
      // Clear all progress intervals
      progressIntervals.forEach(clearTimeout);
      console.error('Generation error:', error);
      toast({
        title: 'Generation failed',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
      setGeneratingPart(null);
      setGenerationProgress(0);
      setGenerationPhase('');
    }
  };

  const downloadAsDocx = async (content: string, partLabel: string) => {
    if (!content) return;

    const sections = content.split('\n\n');
    const children: Paragraph[] = [];

    // Title page (only for Part A or full report)
    if (partLabel === 'Part A' || partLabel === 'Full') {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: formData.university.toUpperCase(), bold: true, size: 32 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [new TextRun({ text: formData.collegeName, bold: true, size: 28 })],
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
          children: [new TextRun({ text: `"${formData.internshipTitle}"`, bold: true, size: 28, italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Submitted by`, size: 24 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: formData.studentName, bold: true, size: 28 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Register No: ${formData.registerNumber}`, size: 24 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Under the guidance of`, size: 24 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: formData.guideName, bold: true, size: 28 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `${formData.course}`, size: 24 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Academic Year: ${formData.academicYear}`, size: 24 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }

    // Parse and add content
    sections.forEach(section => {
      if (section.trim()) {
        if (section.startsWith('# ')) {
          children.push(
            new Paragraph({
              text: section.replace('# ', ''),
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            })
          );
        } else if (section.startsWith('## ')) {
          children.push(
            new Paragraph({
              text: section.replace('## ', ''),
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            })
          );
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
    const filename = `${formData.studentName.replace(/\s+/g, '_')}_Internship_Report_${partLabel}.docx`;
    saveAs(blob, filename);

    toast({
      title: 'Downloaded!',
      description: `${partLabel} of your report has been downloaded as DOCX.`,
    });
  };

  const downloadFullReport = async () => {
    if (!partAContent || !partBContent) return;
    const fullContent = partAContent + '\n\n' + partBContent;
    await downloadAsDocx(fullContent, 'Full');
  };

  if (authLoading) {
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
            <span className="font-display font-bold text-xl">IPRG</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Create New Report</h1>
          <p className="text-muted-foreground">Fill in your internship details to generate a report</p>
        </div>

        {(partAContent || partBContent) ? (
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Report Parts Generated
              </CardTitle>
              <CardDescription>
                Download each part or generate the remaining part.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Part A Section */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Part A (Chapters 1-5)</h3>
                  {partAContent ? (
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded">
                      ✓ Generated
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">
                      Not generated
                    </span>
                  )}
                </div>
                {partAContent && (
                  <div className="bg-muted/50 rounded-lg p-4 max-h-48 overflow-y-auto mb-3">
                    <pre className="whitespace-pre-wrap text-xs font-sans">{partAContent.substring(0, 1000)}...</pre>
                  </div>
                )}
                <div className="flex gap-2">
                  {partAContent ? (
                    <Button variant="gradient" onClick={() => downloadAsDocx(partAContent, 'Part A')} className="flex-1">
                      <Download className="w-4 h-4" />
                      Download Part A
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => handleGeneratePart('A')} 
                      disabled={generating}
                      className="flex-1"
                    >
                      {generatingPart === 'A' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Part A
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Part B Section */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Part B (Chapters 6-9 + Bibliography)</h3>
                  {partBContent ? (
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded">
                      ✓ Generated
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">
                      Not generated
                    </span>
                  )}
                </div>
                {partBContent && (
                  <div className="bg-muted/50 rounded-lg p-4 max-h-48 overflow-y-auto mb-3">
                    <pre className="whitespace-pre-wrap text-xs font-sans">{partBContent.substring(0, 1000)}...</pre>
                  </div>
                )}
                <div className="flex gap-2">
                  {partBContent ? (
                    <Button variant="gradient" onClick={() => downloadAsDocx(partBContent, 'Part B')} className="flex-1">
                      <Download className="w-4 h-4" />
                      Download Part B
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => handleGeneratePart('B')} 
                      disabled={generating}
                      className="flex-1"
                    >
                      {generatingPart === 'B' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Part B
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Full Report Download */}
              {partAContent && partBContent && (
                <div className="border-t pt-4">
                  <Button variant="hero" onClick={downloadFullReport} className="w-full" size="lg">
                    <Download className="w-5 h-5" />
                    Download Full Report (Part A + B Combined)
                  </Button>
                </div>
              )}

              {/* Progress indicator */}
              {generating && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center animate-pulse">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">Generating Part {generatingPart}</p>
                      <p className="text-xs text-muted-foreground">{generationPhase}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-primary">{generationProgress}%</p>
                    </div>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={() => { setPartAContent(null); setPartBContent(null); }} 
                className="w-full"
              >
                Create Another Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="font-display">Internship Details</CardTitle>
              <CardDescription>
                All fields are required. Provide accurate information for the best results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                {/* Student Information */}
                <div className="space-y-4">
                  <h3 className="font-display font-semibold text-lg">Student Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentName">Full Name *</Label>
                      <Input
                        id="studentName"
                        name="studentName"
                        value={formData.studentName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerNumber">Register Number *</Label>
                      <Input
                        id="registerNumber"
                        name="registerNumber"
                        value={formData.registerNumber}
                        onChange={handleInputChange}
                        placeholder="Enter your register number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="course">Course *</Label>
                      <Input
                        id="course"
                        name="course"
                        value={formData.course}
                        onChange={handleInputChange}
                        placeholder="Enter your course"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="academicYear">Academic Year *</Label>
                      <Input
                        id="academicYear"
                        name="academicYear"
                        value={formData.academicYear}
                        onChange={handleInputChange}
                        placeholder="Enter academic year"
                      />
                    </div>
                  </div>
                </div>

                {/* Institution Details */}
                <div className="space-y-4">
                  <h3 className="font-display font-semibold text-lg">Institution Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="collegeName">College Name *</Label>
                      <Input
                        id="collegeName"
                        name="collegeName"
                        value={formData.collegeName}
                        onChange={handleInputChange}
                        placeholder="Enter your college name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="university">University *</Label>
                      <Input
                        id="university"
                        name="university"
                        value={formData.university}
                        onChange={handleInputChange}
                        placeholder="Enter your university name"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="guideName">Guide/Supervisor Name *</Label>
                      <Input
                        id="guideName"
                        name="guideName"
                        value={formData.guideName}
                        onChange={handleInputChange}
                        placeholder="Enter guide/supervisor name"
                      />
                    </div>
                  </div>
                </div>

                {/* Internship Details */}
                <div className="space-y-4">
                  <h3 className="font-display font-semibold text-lg">Internship Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="internshipTitle">Internship Title *</Label>
                      <Input
                        id="internshipTitle"
                        name="internshipTitle"
                        value={formData.internshipTitle}
                        onChange={handleInputChange}
                        placeholder="Enter internship title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyLocation">Company Location *</Label>
                      <Input
                        id="companyLocation"
                        name="companyLocation"
                        value={formData.companyLocation}
                        onChange={handleInputChange}
                        placeholder="Enter company location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="internshipDuration">Internship Duration *</Label>
                      <Input
                        id="internshipDuration"
                        name="internshipDuration"
                        value={formData.internshipDuration}
                        onChange={handleInputChange}
                        placeholder="Enter internship duration"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pagesCount">Number of Pages *</Label>
                      <Select
                        value={String(formData.pagesCount)}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, pagesCount: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select pages" />
                        </SelectTrigger>
                        <SelectContent>
                          {[3, 5, 10, 15, 20, 25, 30, 35, 40].map(num => (
                            <SelectItem key={num} value={String(num)}>{num} pages</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topicSpecialization">Topic/Specialization *</Label>
                    <Textarea
                      id="topicSpecialization"
                      name="topicSpecialization"
                      value={formData.topicSpecialization}
                      onChange={handleInputChange}
                      placeholder="Enter the topic or specialization"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Status & Action Section */}
                {checkingStatus ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Checking your status...</span>
                  </div>
                ) : needsTopup ? (
                  // User has used 3 generations, needs topup
                  <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
                      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CreditCard className="w-6 h-6 text-amber-600" />
                      </div>
                      <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 mb-3 inline-block">
                        <span className="font-bold text-lg">3/3 Generations Used</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">Generation Limit Reached</h3>
                      <p className="text-muted-foreground text-sm mb-3">
                        You have reached your limit of 3 free report generations. Top up to continue generating reports.
                      </p>
                      <div className="bg-primary/10 rounded-lg p-4 mb-4">
                        <p className="font-display text-2xl font-bold text-primary">₹499</p>
                        <p className="text-xs text-muted-foreground">for 3 more generations</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="hero"
                      size="xl"
                      className="w-full"
                      onClick={handleTopupPayment}
                    >
                      <CreditCard className="w-5 h-5" />
                      Top Up - ₹499
                    </Button>
                  </div>
                ) : paymentStatus === 'pending' ? (
                  // Payment is pending verification
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Payment Under Review</h3>
                    <p className="text-muted-foreground text-sm">
                      Your payment is being verified. Your report will be generated once payment is approved.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Status: <span className="text-amber-600 font-medium">Inactive (Waiting for payment verification)</span>
                    </p>
                  </div>
                ) : hasApprovedPayment && canGenerate ? (
                  // User has approved payment and can generate
                  <div className="space-y-4">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        ✓ Payment verified • {3 - (generationsUsed % 3)} generations remaining
                      </p>
                    </div>
                    
                    {generating && (
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center animate-pulse">
                            <Sparkles className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">Generating Part {generatingPart}</p>
                            <p className="text-sm text-muted-foreground">{generationPhase}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-xl font-bold text-primary">{generationProgress}%</p>
                          </div>
                        </div>
                        
                        <Progress value={generationProgress} className="h-2" />
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Estimated time: 1-2 minutes per part</span>
                        </div>
                      </div>
                    )}

                    {/* Part A and Part B generation buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant="hero"
                        size="lg"
                        className="w-full"
                        onClick={() => handleGeneratePart('A')}
                        disabled={generating}
                      >
                        {generatingPart === 'A' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate Part A
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="hero"
                        size="lg"
                        className="w-full"
                        onClick={() => handleGeneratePart('B')}
                        disabled={generating}
                      >
                        {generatingPart === 'B' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate Part B
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <p className="text-xs text-center text-muted-foreground">
                      Part A: Chapters 1-5 (Front matter + Core content)<br />
                      Part B: Chapters 6-9 (Analysis, Conclusion + Bibliography)
                    </p>
                  </div>
                ) : (
                  // User needs to make first payment
                  <div className="space-y-4">
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display font-semibold text-lg">Report Price</p>
                          <p className="text-muted-foreground text-sm">
                            {formData.pagesCount} pages • AI-generated content
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-3xl font-bold text-primary">₹{calculatePrice()}</p>
                          <p className="text-xs text-muted-foreground">
                            {formData.pagesCount <= 10 ? '3-10 pages' : formData.pagesCount <= 20 ? '11-20 pages' : 'Above 20 pages'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="hero"
                      size="xl"
                      className="w-full"
                      onClick={handleProceedToPayment}
                      disabled={generating}
                    >
                      <CreditCard className="w-5 h-5" />
                      Proceed to Payment - ₹{calculatePrice()}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={needsTopup ? 499 : calculatePrice()}
        reportId={pendingReportId}
        userId={user?.id || ''}
        onSuccess={handlePaymentSuccess}
        paymentType={needsTopup ? 'topup' : 'report'}
      />
    </div>
  );
};

export default CreateReport;
