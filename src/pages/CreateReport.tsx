import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useToast } from '@/hooks/use-toast';
import { FileText, ArrowLeft, Loader2, Download, Sparkles, CreditCard, Clock, CheckCircle2, AlertCircle, Eye, EyeOff, Wifi } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
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
  pagesCount: 25,
};

// Chapters to generate (in order)
const CHAPTERS = [
  { key: 'front', label: 'Front Matter', description: 'Certificate, Declaration, Acknowledgement, Abstract, TOC' },
  { key: '1', label: 'Chapter 1', description: 'Introduction' },
  { key: '2', label: 'Chapter 2', description: 'Industry & Company Profile' },
  { key: '3', label: 'Chapter 3', description: 'Literature Review' },
  { key: '4', label: 'Chapter 4', description: 'Internship Activities' },
  { key: '5', label: 'Chapter 5', description: 'Technical Learning' },
  { key: '6', label: 'Chapter 6', description: 'Data Analysis & Findings' },
  { key: '7', label: 'Chapter 7', description: 'Challenges & Solutions' },
  { key: '8', label: 'Chapter 8', description: 'Recommendations' },
  { key: '9', label: 'Chapter 9', description: 'Conclusion & References' },
];

interface ChapterContent {
  [key: string]: string | null;
}

const CreateReport = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [generating, setGenerating] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<string | null>(null);
  const [chapterContent, setChapterContent] = useState<ChapterContent>({});
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
  const [failedChapters, setFailedChapters] = useState<string[]>([]);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [allGeneratedLines, setAllGeneratedLines] = useState<{chapter: string; line: string}[]>([]);
  const [currentLine, setCurrentLine] = useState('');
  const [lineCount, setLineCount] = useState(0);
  const [generateInParts, setGenerateInParts] = useState(false);
  const [currentPart, setCurrentPart] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [allGeneratedLines, currentLine]);

  const completedChapters = Object.keys(chapterContent).filter(k => chapterContent[k]);
  const hasAnyContent = completedChapters.length > 0;
  const hasAllContent = completedChapters.length === CHAPTERS.length;

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
      const { data: profileData } = await supabase
        .from('profiles')
        .select('generations_used')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      const usedCount = profileData?.generations_used || 0;
      setGenerationsUsed(usedCount);

      const { data: paymentData } = await supabase
        .from('payments')
        .select('id, status')
        .eq('user_id', user?.id)
        .eq('status', 'verified')
        .limit(1);

      const hasVerifiedPayment = paymentData && paymentData.length > 0;
      setHasApprovedPayment(hasVerifiedPayment);

      if (hasVerifiedPayment && usedCount < 3) {
        setCanGenerate(true);
        setNeedsTopup(false);
      } else if (hasVerifiedPayment && usedCount >= 3) {
        const { data: topupPayments } = await supabase
          .from('payments')
          .select('id, created_at')
          .eq('user_id', user?.id)
          .eq('status', 'verified')
          .eq('payment_type', 'topup')
          .order('created_at', { ascending: false })
          .limit(1);

        if (topupPayments && topupPayments.length > 0) {
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
        setCanGenerate(false);
        setNeedsTopup(false);
      }

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
    // Fixed price - ₹499 only
    return 499;
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
    setPendingReportId(null);
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

  // Generate a single chapter with retry logic and fallback to parts
  const generateChapter = async (chapterKey: string, retries = 2): Promise<string | null> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Generating chapter ${chapterKey}, attempt ${attempt}/${retries}`);
        
        const { data, error } = await supabase.functions.invoke('generate-report', {
          body: {
            ...formData,
            userId: user?.id,
            chapter: chapterKey,
          },
        });

        if (error) throw error;
        return data?.content || null;
      } catch (error: any) {
        console.error(`Error generating chapter ${chapterKey} (attempt ${attempt}):`, error);
        
        // If this was the last attempt, try generating in parts
        if (attempt === retries) {
          console.log(`Attempting to generate chapter ${chapterKey} in parts...`);
          setAllGeneratedLines(prev => [...prev, { 
            chapter: chapterKey, 
            line: `🔄 Generating in smaller parts...` 
          }]);
          
          const partsContent = await generateChapterInParts(chapterKey);
          if (partsContent) {
            return partsContent;
          }
          return null;
        }
        
        // Show retry notification
        setAllGeneratedLines(prev => [...prev, { 
          chapter: chapterKey, 
          line: `⏳ Retrying... (attempt ${attempt + 1}/${retries})` 
        }]);
        
        // Wait before retrying (2s, 4s)
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    return null;
  };

  // Part labels for display
  const partLabels: Record<string, string> = {
    'part1_certificate': 'Certificate & Declaration',
    'part2_abstract': 'Abstract & TOC',
    'part1_background': 'Background & Context',
    'part2_objectives': 'Objectives & Scope',
    'part1_industry': 'Industry Overview',
    'part2_company': 'Company Profile',
    'part1_theory': 'Theoretical Framework',
    'part2_review': 'Literature & Research',
    'part1_activities': 'Activities & Roles',
    'part2_projects': 'Projects & Tools',
    'part1_technical': 'Technical Skills',
    'part2_soft': 'Soft Skills & Training',
    'part1_methodology': 'Data Methodology',
    'part2_findings': 'Findings & Analysis',
    'part1_challenges': 'Challenges Faced',
    'part2_solutions': 'Solutions & Lessons',
    'part1_recommendations': 'Recommendations',
    'part2_future': 'Future Scope',
    'part1_conclusion': 'Conclusion',
    'part2_references': 'Bibliography & Annexures',
  };

  // Generate chapter in smaller parts when full generation times out
  const generateChapterInParts = async (chapterKey: string): Promise<string | null> => {
    const chapterParts: Record<string, string[]> = {
      'front': ['part1_certificate', 'part2_abstract'],
      '1': ['part1_background', 'part2_objectives'],
      '2': ['part1_industry', 'part2_company'],
      '3': ['part1_theory', 'part2_review'],
      '4': ['part1_activities', 'part2_projects'],
      '5': ['part1_technical', 'part2_soft'],
      '6': ['part1_methodology', 'part2_findings'],
      '7': ['part1_challenges', 'part2_solutions'],
      '8': ['part1_recommendations', 'part2_future'],
      '9': ['part1_conclusion', 'part2_references'],
    };

    const parts = chapterParts[chapterKey] || ['part1', 'part2'];
    const contents: string[] = [];

    for (let partIdx = 0; partIdx < parts.length; partIdx++) {
      const part = parts[partIdx];
      const partLabel = partLabels[part] || part;
      
      try {
        setCurrentPart(partLabel);
        setAllGeneratedLines(prev => [...prev, { 
          chapter: chapterKey, 
          line: `   📝 Part ${partIdx + 1}/${parts.length}: ${partLabel}...` 
        }]);

        const { data, error } = await supabase.functions.invoke('generate-report', {
          body: {
            ...formData,
            userId: user?.id,
            chapter: chapterKey,
            part: part,
          },
        });

        if (error) throw error;
        if (data?.content) {
          contents.push(data.content);
          
          // Show content line by line for parts too
          const lines = data.content.split('\n');
          for (const line of lines) {
            for (let i = 0; i <= line.length; i += 5) {
              setCurrentLine(line.slice(0, i));
              await new Promise(resolve => setTimeout(resolve, 1));
            }
            setAllGeneratedLines(prev => [...prev, { chapter: chapterKey, line }]);
            setLineCount(prev => prev + 1);
            setCurrentLine('');
          }
        }

        // Small delay between parts
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`Error generating ${chapterKey} ${part}:`, error);
        setAllGeneratedLines(prev => [...prev, { 
          chapter: chapterKey, 
          line: `   ⚠️ Failed: ${partLabel}` 
        }]);
      }
    }

    setCurrentPart(null);
    
    if (contents.length > 0) {
      return contents.join('\n\n');
    }
    return null;
  };

  // Retry a single failed chapter
  const handleRetrySingleChapter = async (chapterKey: string) => {
    const chapter = CHAPTERS.find(c => c.key === chapterKey);
    if (!chapter) return;

    setGenerating(true);
    setCurrentChapter(chapterKey);
    setGenerationPhase(`Retrying ${chapter.label}...`);
    
    // Add chapter header to preview
    setAllGeneratedLines(prev => [...prev, { chapter: chapterKey, line: `\n━━━ Retrying ${chapter.label} ━━━\n` }]);
    
    const content = await generateChapter(chapterKey);
    
    if (content) {
      setChapterContent(prev => ({ ...prev, [chapterKey]: content }));
      setFailedChapters(prev => prev.filter(k => k !== chapterKey));
      
      // Show content line by line
      const lines = content.split('\n');
      for (const line of lines) {
        for (let i = 0; i <= line.length; i += 5) {
          setCurrentLine(line.slice(0, i));
          await new Promise(resolve => setTimeout(resolve, 1));
        }
        setAllGeneratedLines(prev => [...prev, { chapter: chapterKey, line }]);
        setLineCount(prev => prev + 1);
        setCurrentLine('');
      }
      
      toast({
        title: 'Chapter generated!',
        description: `${chapter.label} has been generated successfully.`,
      });
    } else {
      setAllGeneratedLines(prev => [...prev, { chapter: chapterKey, line: `⚠️ Still failed to generate ${chapter.label}` }]);
      toast({
        title: 'Generation failed',
        description: `${chapter.label} could not be generated.`,
        variant: 'destructive',
      });
    }

    setGenerating(false);
    setCurrentChapter(null);
    setGenerationPhase('');
    setCurrentLine('');
  };

  // Generate all chapters sequentially
  const handleGenerateReport = async () => {
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
    setFailedChapters([]);
    setAllGeneratedLines([]);
    setCurrentLine('');
    setLineCount(0);
    const newContent: ChapterContent = {};
    const failed: string[] = [];

    for (let i = 0; i < CHAPTERS.length; i++) {
      const chapter = CHAPTERS[i];
      setCurrentChapter(chapter.key);
      setGenerationProgress(Math.round((i / CHAPTERS.length) * 100));
      setGenerationPhase(`Generating ${chapter.label}: ${chapter.description}...`);

      // Add chapter header
      setAllGeneratedLines(prev => [...prev, { chapter: chapter.key, line: `\n━━━ ${chapter.label}: ${chapter.description} ━━━\n` }]);
      setLineCount(prev => prev + 1);
      
      // Use parts mode if enabled, otherwise try full chapter first
      let content: string | null = null;
      
      if (generateInParts) {
        // Direct parts generation for slower connections
        content = await generateChapterInParts(chapter.key);
      } else {
        // Try full chapter first, falls back to parts if it fails
        content = await generateChapter(chapter.key);
      }
      
      if (content) {
        newContent[chapter.key] = content;
        setChapterContent(prev => ({ ...prev, [chapter.key]: content }));
        
        // Only show typing effect if we didn't already do it in parts mode
        if (!generateInParts) {
          // Line-by-line typing effect for all chapters
          const lines = content.split('\n');
          for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            
            // Character-by-character for current line
            for (let charIndex = 0; charIndex <= line.length; charIndex += 5) {
              setCurrentLine(line.slice(0, charIndex));
              await new Promise(resolve => setTimeout(resolve, 1));
            }
            
            // Add completed line to all lines
            setAllGeneratedLines(prev => [...prev, { chapter: chapter.key, line }]);
            setLineCount(prev => prev + 1);
            setCurrentLine('');
          }
        }
      } else {
        failed.push(chapter.key);
        setAllGeneratedLines(prev => [...prev, { chapter: chapter.key, line: `⚠️ Failed to generate ${chapter.label}` }]);
      }

      // Small delay between chapters to avoid rate limiting
      if (i < CHAPTERS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setFailedChapters(failed);
    setGenerating(false);
    setCurrentChapter(null);
    setGenerationProgress(100);
    setGenerationPhase('');
    setCurrentLine('');

    // Update generations count
    if (Object.keys(newContent).length > 0) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('generations_used')
          .eq('user_id', user?.id)
          .maybeSingle();
        
        const newCount = (profileData?.generations_used || 0) + 1;
        await supabase
          .from('profiles')
          .update({ generations_used: newCount })
          .eq('user_id', user?.id);
        
        setGenerationsUsed(newCount);
      } catch (e) {
        console.error('Error updating generations count:', e);
      }
    }

    if (failed.length === 0) {
      toast({
        title: 'Report generated successfully!',
        description: 'All chapters have been generated. Download your report now.',
      });
    } else if (failed.length < CHAPTERS.length) {
      toast({
        title: 'Report partially generated',
        description: `${CHAPTERS.length - failed.length} of ${CHAPTERS.length} chapters generated. You can retry failed chapters.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Generation failed',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Retry failed chapters
  const handleRetryFailed = async () => {
    if (failedChapters.length === 0) return;

    setGenerating(true);
    const stillFailed: string[] = [];

    for (let i = 0; i < failedChapters.length; i++) {
      const chapterKey = failedChapters[i];
      const chapter = CHAPTERS.find(c => c.key === chapterKey);
      if (!chapter) continue;

      setCurrentChapter(chapterKey);
      setGenerationProgress(Math.round((i / failedChapters.length) * 100));
      setGenerationPhase(`Retrying ${chapter.label}: ${chapter.description}...`);

      const content = await generateChapter(chapterKey);
      
      if (content) {
        setChapterContent(prev => ({ ...prev, [chapterKey]: content }));
      } else {
        stillFailed.push(chapterKey);
      }

      if (i < failedChapters.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setFailedChapters(stillFailed);
    setGenerating(false);
    setCurrentChapter(null);
    setGenerationProgress(100);
    setGenerationPhase('');

    if (stillFailed.length === 0) {
      toast({
        title: 'All chapters generated!',
        description: 'Your report is now complete.',
      });
    } else {
      toast({
        title: 'Some chapters still failed',
        description: `${stillFailed.length} chapter(s) could not be generated.`,
        variant: 'destructive',
      });
    }
  };

  // Download full merged report
  const downloadFullReport = async () => {
    if (!hasAnyContent) return;

    // Merge all chapters in order
    const orderedContent = CHAPTERS
      .map(ch => chapterContent[ch.key])
      .filter(Boolean)
      .join('\n\n---\n\n');

    const sections = orderedContent.split('\n\n');
    const children: Paragraph[] = [];

    // Title page
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

    // Parse and add content
    sections.forEach(section => {
      if (section.trim() && section.trim() !== '---') {
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
    const filename = `${formData.studentName.replace(/\s+/g, '_')}_Internship_Report.docx`;
    saveAs(blob, filename);

    toast({
      title: 'Downloaded!',
      description: 'Your complete internship report has been downloaded.',
    });
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

        {hasAnyContent ? (
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Report Generation Progress
              </CardTitle>
              <CardDescription>
                {hasAllContent 
                  ? 'All chapters generated! Download your complete report.'
                  : `${completedChapters.length} of ${CHAPTERS.length} chapters generated.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {CHAPTERS.map(chapter => {
                  const isCompleted = !!chapterContent[chapter.key];
                  const isCurrent = currentChapter === chapter.key;
                  const isFailed = failedChapters.includes(chapter.key);
                  
                  return (
                    <div 
                      key={chapter.key}
                      className={`p-2 rounded-lg text-center text-xs ${
                        isCompleted 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : isCurrent
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 animate-pulse'
                          : isFailed
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <div className="font-semibold">{chapter.label}</div>
                      <div className="text-[10px] opacity-75 truncate">{chapter.description}</div>
                      {isCompleted && <CheckCircle2 className="w-3 h-3 mx-auto mt-1" />}
                      {isCurrent && <Loader2 className="w-3 h-3 mx-auto mt-1 animate-spin" />}
                      {isFailed && !isCompleted && <AlertCircle className="w-3 h-3 mx-auto mt-1" />}
                    </div>
                  );
                })}
              </div>

              {/* Progress indicator during generation */}
              {generating && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center animate-pulse">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">Generating Report</p>
                      <p className="text-xs text-muted-foreground">{generationPhase}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-primary">{generationProgress}%</p>
                    </div>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                  
                  {/* Live Content Preview Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                    <span className="text-xs text-muted-foreground">Live Preview</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLivePreview(!showLivePreview)}
                      className="h-6 px-2"
                    >
                      {showLivePreview ? (
                        <><EyeOff className="w-3 h-3 mr-1" /> Hide</>
                      ) : (
                        <><Eye className="w-3 h-3 mr-1" /> Show</>
                      )}
                    </Button>
                  </div>

                  {/* Live Generated Content Display - All Chapters */}
                  {showLivePreview && (allGeneratedLines.length > 0 || currentLine) && (
                    <div className="mt-3 bg-background/50 rounded-lg border border-border/50 overflow-hidden">
                      <div className="bg-muted/50 px-3 py-1.5 border-b border-border/50 flex items-center gap-2 flex-wrap">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {CHAPTERS.find(c => c.key === currentChapter)?.label}
                          {currentPart && <span className="text-primary ml-1">→ {currentPart}</span>}
                        </span>
                        {generateInParts && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Parts Mode</span>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground/60">
                          {lineCount.toLocaleString()} lines
                        </span>
                      </div>
                      <ScrollArea className="h-80">
                        <div className="p-3 font-mono text-xs leading-relaxed text-foreground/80">
                          {allGeneratedLines.map((item, idx) => (
                            <div 
                              key={idx} 
                              className={`${item.line.includes('━━━') ? 'text-primary font-bold mt-4 mb-2' : ''} ${item.line.includes('⚠️') ? 'text-amber-500' : ''}`}
                            >
                              {item.line}
                            </div>
                          ))}
                          {currentLine && (
                            <div className="inline">
                              {currentLine}
                              <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-0.5 align-middle" />
                            </div>
                          )}
                          <div ref={scrollRef} className="h-1" />
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground text-center">
                    This may take 5-10 minutes. Please keep this page open.
                  </p>
                </div>
              )}

              {/* Failed chapters retry - individual buttons */}
              {failedChapters.length > 0 && !generating && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-amber-700 dark:text-amber-300">
                      {failedChapters.length} chapter(s) failed to generate
                    </span>
                  </div>
                  <div className="space-y-2">
                    {failedChapters.map(chapterKey => {
                      const chapter = CHAPTERS.find(c => c.key === chapterKey);
                      return (
                        <Button 
                          key={chapterKey}
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleRetrySingleChapter(chapterKey)}
                          className="w-full justify-start gap-2"
                        >
                          <Sparkles className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">Retry {chapter?.label}: {chapter?.description}</span>
                        </Button>
                      );
                    })}
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleRetryFailed}
                      className="w-full mt-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Retry All Failed
                    </Button>
                  </div>
                </div>
              )}

              {/* Download Button */}
              {hasAnyContent && !generating && (
                <Button 
                  variant="hero" 
                  onClick={downloadFullReport} 
                  className="w-full" 
                  size="lg"
                >
                  <Download className="w-5 h-5" />
                  Download Complete Report ({completedChapters.length}/{CHAPTERS.length} chapters)
                </Button>
              )}

              <Button 
                variant="outline" 
                onClick={() => {
                  setChapterContent({});
                  setFailedChapters([]);
                }} 
                className="w-full"
                disabled={generating}
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
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Payment Under Review</h3>
                    <p className="text-muted-foreground text-sm">
                      Your payment has been submitted and is being verified. Once approved, you can generate reports.
                      This usually takes less than 24 hours.
                    </p>
                  </div>
                ) : hasApprovedPayment && canGenerate ? (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-emerald-700 dark:text-emerald-300">Ready to Generate</p>
                        <p className="text-xs text-muted-foreground">{generationsUsed}/3 generations used</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                        📋 Your report will include 10 sections:
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        {CHAPTERS.map(ch => (
                          <div key={ch.key}>• {ch.label}</div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        ⏱️ Generation takes 5-10 minutes. Please keep this page open.
                      </p>
                    </div>
                    
                    {/* Slow Connection Mode Toggle */}
                    <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3 border border-border/50">
                      <div className="flex items-center gap-2 flex-1">
                        <Wifi className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Slow Connection Mode</p>
                          <p className="text-xs text-muted-foreground">
                            Generate in smaller parts to avoid timeouts
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={generateInParts}
                        onCheckedChange={setGenerateInParts}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="hero"
                      size="xl"
                      className="w-full"
                      onClick={handleGenerateReport}
                      disabled={generating}
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Complete Report
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-muted-foreground">Report Price:</span>
                        <div className="text-right">
                          <span className="font-display text-3xl font-bold text-primary">₹{calculatePrice()}</span>
                          <p className="text-xs text-muted-foreground">One-time payment</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>✓ AI-powered professional report</p>
                        <p>✓ Customized for your internship</p>
                        <p>✓ 3 report generations included</p>
                        <p>✓ Instant download as DOCX</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="hero"
                      size="xl"
                      className="w-full"
                      onClick={handleProceedToPayment}
                    >
                      <CreditCard className="w-5 h-5" />
                      Proceed to Payment
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
        paymentType={needsTopup ? 'topup' : 'report'}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default CreateReport;
