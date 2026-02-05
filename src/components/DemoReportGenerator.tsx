import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Sparkles, Loader2, FileText, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const DEMO_REPORT_CONTENT = `# BENGALURU NORTH UNIVERSITY
 
 # Christ Degree College
 
 # INTERNSHIP PROJECT REPORT
 
 # On
 
 # "A Study Report on Marketing at AGROES SERVICE Pvt. Ltd, Kolar"
 
 Submitted by
 Amanda John
 Register No: U19ze283838
 
 Under the guidance of
 Prof. Irshad
 
 Bachelor of Business Administration
 Academic Year: 2025 - 26
 
 ---
 
 # CERTIFICATE
 
 This is to certify that Ms. Amanda John (Register No: U19ze283838), a student of Bachelor of Business Administration at Christ Degree College, affiliated to Bengaluru North University, has successfully completed the internship project report titled "A Study Report on Marketing at AGROES SERVICE Pvt. Ltd, Kolar" under my guidance for the academic year 2025-26.
 
 Guide Signature: _______________
 HOD Signature: _______________
 Principal Signature: _______________
 
 ---
 
 # DECLARATION
 
 I, Amanda John, hereby declare that this internship project report titled "A Study Report on Marketing at AGROES SERVICE Pvt. Ltd, Kolar" is my original work carried out during my internship period. The information and data presented are authentic and have not been submitted for any other degree or diploma.
 
 ---
 
 # ACKNOWLEDGEMENT
 
 I express my sincere gratitude to Prof. Irshad for valuable guidance throughout this project. I thank the management of Christ Degree College for providing this opportunity. Special thanks to the team at AGROES SERVICE Pvt. Ltd, Kolar for their support and cooperation during my internship. I also thank my family and friends for their constant encouragement.
 
 ---
 
 # ABSTRACT
 
 This internship report presents a comprehensive study on marketing practices at AGROES SERVICE Pvt. Ltd, Kolar. The study examines the company's marketing strategies, digital marketing initiatives, and their impact on business performance. Key findings reveal effective use of multi-channel marketing approaches, strong customer engagement through digital platforms, and opportunities for enhanced market penetration. The report provides actionable recommendations for improving marketing effectiveness.
 
 ---
 
 # TABLE OF CONTENTS
 
 Certificate
 Declaration
 Acknowledgement
 Abstract
 
 CHAPTER I: INTRODUCTION
    Background of the Study
    Meaning and Concepts
    Importance in the Industry
    Objectives of the Study
    Scope of the Study
    Need and Significance
    Methodology
    Limitations
 
 CHAPTER II: DESCRIPTION OF THE ORGANISATION
    Company Profile
    History
    Vision and Mission
    Organizational Structure
    Products and Services
    Market Presence
    Role of Marketing
 
 CHAPTER III: EXPERIENTIAL LEARNING
    Internship Overview
    Department Worked
    Daily Activities and Tasks
    Skills and Knowledge Acquired
    Challenges Faced
 
 CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION
    Outcomes of Internship
    Findings
    Operational Impact
    Key Learnings
    Suggestions and Recommendations
    Conclusion
 
 BIBLIOGRAPHY
 
 ANNEXURES
 
 ---
 
 # CHAPTER I: INTRODUCTION
 
 ## 1.1 Background of the Study
 
 The agricultural services sector in India has witnessed remarkable transformation over the past decade, driven by technological advancements, changing farmer needs, and government initiatives promoting modern agricultural practices. AGROES SERVICE Pvt. Ltd, operating from Kolar, Karnataka, represents a new wave of agri-service companies bridging the gap between traditional farming methods and modern agricultural solutions.
 
 The importance of marketing in agricultural services cannot be overstated. With increasing competition and the need to reach diverse farmer segments, effective marketing strategies have become critical success factors. This study explores how AGROES SERVICE leverages various marketing channels to connect with farmers and stakeholders across Karnataka and neighboring states.
 
 The evolution of digital marketing has particularly revolutionized how agri-service companies communicate with their target audience. From social media platforms to mobile applications, the digital landscape offers unprecedented opportunities for customer engagement and brand building.
 
 ## 1.2 Meaning of Marketing in Agricultural Services
 
 Marketing in agricultural services encompasses all activities related to promoting, selling, and distributing agricultural products and services to target customers. It involves understanding farmer needs, developing appropriate service offerings, pricing strategies, distribution channels, and promotional activities.
 
 In the context of AGROES SERVICE, marketing includes digital marketing campaigns, field demonstrations, farmer meetings, dealer network development, and customer relationship management. The company employs a mix of traditional and modern marketing approaches to reach diverse farmer segments.
 
 The theoretical framework for agricultural marketing draws from both classical marketing theories and sector-specific adaptations. Key concepts include the 4Ps (Product, Price, Place, Promotion) adapted for services, relationship marketing principles, and digital marketing strategies tailored for rural audiences.
 
 ## 1.3 Importance of Marketing in Agricultural Services Industry
 
 Marketing plays a pivotal role in the agricultural services industry for several reasons. First, it creates awareness about new technologies and services among farmers who may not have access to traditional information channels. Second, it builds trust and credibility, essential factors in an industry where farmers often rely on word-of-mouth recommendations.
 
 The agricultural services market in India is projected to grow at 12% CAGR, reaching ₹50,000 crores by 2028. This growth is driven by increasing mechanization, precision farming adoption, and government subsidies for agricultural inputs. Companies that invest in effective marketing strategies are better positioned to capture this growing market.
 
 Digital marketing specifically has transformed customer acquisition in agricultural services. With over 500 million smartphone users in India and increasing internet penetration in rural areas, digital channels offer cost-effective ways to reach farmers directly.
 
 ## 1.4 Objectives of the Study
 
 The objectives of the study are:
 • To study the existing marketing strategies employed by AGROES SERVICE Pvt. Ltd
 • To analyse the effectiveness of digital marketing initiatives in customer acquisition
 • To experience the practical application of marketing concepts in agricultural services
 • To understand the role of traditional marketing channels in rural market penetration
 • To evaluate customer perception and satisfaction with marketing communications
 • To identify challenges faced in marketing agricultural services
 • To develop actionable recommendations for marketing improvement
 
 ## 1.5 Scope of the Study
 
 This study focuses on the marketing function at AGROES SERVICE Pvt. Ltd, Kolar. The geographical scope includes the company's operations in Karnataka, with specific emphasis on the Kolar district. The temporal scope covers the period of internship and historical marketing data from the past two years.
 
 The study examines both digital and traditional marketing activities, customer engagement strategies, and marketing performance metrics. It does not include detailed financial analysis or competitor intelligence beyond publicly available information.
 
 ## 1.6 Need and Significance of the Study
 
 This study addresses a significant gap in understanding how agricultural service companies can effectively market their offerings in semi-urban and rural markets. For academia, it provides practical insights into marketing theory application in a specialized sector. For the industry, it offers benchmarks and recommendations that can improve marketing effectiveness.
 
 The significance extends to understanding the digital transformation of agricultural marketing, a relatively under-researched area. The findings can benefit similar companies seeking to improve their marketing strategies.
 
 ## 1.7 Research Methodology
 
 The study employs a mixed-methods research design combining qualitative and quantitative approaches. Primary data was collected through observation, interviews with marketing team members, and analysis of marketing campaign data. Secondary data was gathered from company reports, industry publications, and academic literature.
 
 Data analysis involved both descriptive statistics for quantitative data and thematic analysis for qualitative information. The methodology ensures a comprehensive understanding of marketing practices at AGROES SERVICE.
 
 ## 1.8 Limitations of the Study
 
 Key limitations include the short internship duration limiting depth of analysis, restricted access to confidential marketing budget data, and geographical limitation to Kolar operations. Additionally, customer feedback was limited to available records rather than fresh surveys.
 
 ---
 
 # CHAPTER II: DESCRIPTION OF THE ORGANISATION
 
 ## 2.1 Company Profile
 
 AGROES SERVICE Pvt. Ltd is a leading agricultural services company headquartered in Kolar, Karnataka. Founded in 2018, the company has grown to become a trusted partner for farmers across the region. The company employs over 150 professionals and serves more than 10,000 farmers annually.
 
 The company operates in the agri-input distribution, farm advisory services, and agricultural equipment rental segments. With a strong network of dealers and direct farmer relationships, AGROES SERVICE has established a significant market presence in Karnataka.
 
 ## 2.2 History of the Organisation
 
 AGROES SERVICE was founded by a group of agricultural professionals with a vision to modernize farming practices in Karnataka. Starting with a single office in Kolar in 2018, the company expanded to five locations by 2022. Key milestones include the launch of their mobile app in 2020, partnership with leading agri-input manufacturers in 2021, and achieving ₹50 crore turnover in 2024.
 
 ## 2.3 Vision and Mission
 
 Vision: To be the most trusted agricultural services partner for every farmer in Karnataka, enabling sustainable and profitable farming.
 
 Mission: To deliver innovative agricultural solutions through technology, expertise, and farmer-centric services, contributing to rural prosperity and food security.
 
 ## 2.4 Organizational Structure
 
 The company follows a functional organizational structure with departments including Marketing, Sales, Operations, Finance, and Human Resources. The marketing department comprises 15 professionals handling digital marketing, field marketing, dealer relations, and customer service.
 
 ## 2.5 Products and Services
 
 AGROES SERVICE offers a comprehensive portfolio including fertilizers, pesticides, seeds, farm equipment rental, soil testing services, and agricultural advisory. The company represents major brands and also offers private-label products. Services are available through dealer networks, company-owned stores, and digital platforms.
 
 ## 2.6 Market Presence
 
 The company has a strong presence in Kolar, Chikballapur, Tumkur, and Bangalore Rural districts. With over 200 authorized dealers and 5 company-owned service centers, AGROES SERVICE reaches farmers across urban, semi-urban, and rural areas. The company commands an estimated 15% market share in its operating regions.
 
 ## 2.7 Role of Marketing in the Organisation
 
 Marketing at AGROES SERVICE is considered a strategic function driving business growth. The marketing team handles brand building, lead generation, customer engagement, and dealer support. The company invests approximately 8% of revenue in marketing activities, with increasing allocation to digital channels. Recent initiatives include social media campaigns, WhatsApp business integration, and YouTube educational content.
 
 ---
 
 # CHAPTER III: EXPERIENTIAL LEARNING
 
 ## 3.1 Internship Overview
 
 My internship at AGROES SERVICE Pvt. Ltd commenced on January 15, 2026, for a duration of 15 days. I was placed in the Marketing Department under the supervision of the Marketing Manager. The team welcomed me warmly and provided comprehensive orientation on company operations, products, and marketing strategies.
 
 ## 3.2 Department Worked
 
 The Marketing Department at AGROES SERVICE handles all promotional activities, digital presence management, dealer communications, and customer engagement. The team of 15 includes digital marketing specialists, field marketing executives, content creators, and customer relationship managers. The department works closely with Sales for lead conversion.
 
 ## 3.3 Daily Activities and Tasks Undertaken
 
 Week 1:
 During the first week, I attended orientation sessions on company products and services. I observed digital marketing campaign management practices and assisted in social media content scheduling. I also participated in a dealer network meeting and analyzed customer feedback data.
 
 Week 2:
 In the second week, I conducted competitor analysis for marketing strategies and helped create content for WhatsApp marketing campaigns. I attended a field marketing event with the team, prepared marketing performance reports, and contributed to marketing plan discussions.
 
 ## 3.4 Skills and Knowledge Acquired
 
 During the internship, I acquired valuable skills including:
 
 Digital Marketing Tools: I developed proficiency in social media management tools, email marketing platforms, and analytics dashboards.
 
 Content Creation: I gained understanding of content creation tailored for agricultural audiences and rural markets.
 
 Data Analysis: I acquired skills in analyzing marketing metrics and customer data to derive actionable insights.
 
 Communication: My professional communication abilities were enhanced through regular interactions with team members and stakeholders.
 
 Teamwork: I gained collaborative work experience in a marketing team environment.
 
 Industry Knowledge: I developed deep understanding of agricultural services marketing and its unique challenges.
 
 Customer Insights: I learned to understand farmer needs and preferences through data analysis and field observations.
 
 Project Management: I gained experience in marketing campaign management and coordination.
 
 ## 3.5 Challenges Faced
 
 Key challenges included understanding agricultural terminology initially, adapting to the fast-paced marketing environment, and analyzing large datasets without prior experience. I overcame these through proactive learning, seeking guidance from team members, and dedicating extra time to understand the industry context.
 
 ---
 
 # CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION
 
 ## 4.1 Outcomes of Internship
 
 The internship resulted in meaningful contributions including completion of competitor analysis report, assistance in two marketing campaigns, creation of content pieces for social media, and preparation of customer feedback analysis. These deliverables provided practical value to the marketing team.
 
 ## 4.2 Findings Related to Marketing
 
 Multi-Channel Effectiveness: The company effectively uses both digital and traditional channels, with digital contributing 40% of leads.
 
 Customer Engagement: WhatsApp marketing shows highest engagement rates at 65%.
 
 Content Relevance: Video content in local language receives 3x more engagement than text-based content.
 
 Dealer Network: Strong dealer relationships drive 60% of rural sales.
 
 Seasonal Patterns: Marketing effectiveness varies significantly by agricultural season.
 
 ## 4.3 Operational Impact on Business Performance
 
 Marketing activities directly impact business performance through lead generation, brand awareness, and customer retention. The digital marketing initiatives have reduced customer acquisition cost by 30% compared to traditional methods. Customer satisfaction surveys show 85% satisfaction with marketing communications.
 
 ## 4.4 Key Learnings
 
 The internship taught me that effective marketing in agricultural services requires deep customer understanding, localized content, and a balanced mix of digital and traditional channels. I learned the importance of data-driven decision making and the value of building long-term customer relationships.
 
 ## 4.5 Suggestions and Recommendations
 
 Based on my observations, I recommend:
 
 Increase investment in video marketing for higher engagement with rural audiences.
 
 Develop a mobile app with marketing features specifically designed for farmers.
 
 Implement marketing automation tools for improved efficiency and consistency.
 
 Expand influencer partnerships with progressive farmers who can advocate for the brand.
 
 Create a loyalty program to enhance customer retention and repeat business.
 
 Establish a formal marketing analytics dashboard for real-time performance monitoring.
 
 ## 4.6 Conclusion
 
 This internship at AGROES SERVICE Pvt. Ltd provided invaluable exposure to marketing practices in agricultural services. I achieved my learning objectives and contributed meaningfully to the marketing team. The experience has strengthened my interest in agricultural marketing and equipped me with practical skills for my future career. I am grateful for this opportunity and the guidance received from Prof. Irshad and the AGROES SERVICE team.
 
 ---
 
 # BIBLIOGRAPHY
 
 Kotler, P., and Keller, K. L. (2022). Marketing Management. 16th Edition, Pearson Education, New Delhi.
 
 Agricultural Marketing in India: Theory and Practice. (2023). ICAR Publications, New Delhi.
 
 Digital Marketing for Agribusiness. (2024). FAO Technical Report, Rome.
 
 AGROES SERVICE Pvt. Ltd. (2026). Company Website. www.agroes.com
 
 Ministry of Agriculture. (2025). Agricultural Marketing Report. Government of India, New Delhi.
 
 Karnataka Agricultural Marketing Board. (2024). Annual Report. Government of Karnataka, Bangalore.
 
 Journal of Agricultural Marketing. (2023). Various articles on digital marketing in agriculture.
 
 NABARD. (2024). Agricultural Services Sector Report. Mumbai.
 
 Ramaswamy, V.S. and Namakumari, S. (2023). Marketing Management: Indian Context. 7th Edition, McGraw Hill Education, New Delhi.
 
 Chaffey, D. and Ellis-Chadwick, F. (2024). Digital Marketing: Strategy, Implementation and Practice. 8th Edition, Pearson Education, London.
 
 ---
 
 # ANNEXURES
 
 Annexure A: Internship Offer Letter
 (Attach copy of internship offer letter from AGROES SERVICE Pvt. Ltd)
 
 Annexure B: Sample Work Documents
 (Attach relevant work samples and marketing materials created during the internship)
 
 Annexure C: Photographs from Internship
 (Attach photographs of workplace, team activities, and field marketing events)
 
 Annexure D: Weekly Reports
 (Attach weekly progress reports submitted during the internship period)
 
 Annexure E: Internship Completion Certificate
 (Attach copy of internship completion certificate)
 
 Annexure F: Supervisor Feedback Form
 (Attach supervisor evaluation and feedback form)
 
 ---
 
 Student Declaration:
 I, Amanda John (Register No: U19ze283838), hereby declare that this internship project report titled "A Study Report on Marketing at AGROES SERVICE Pvt. Ltd, Kolar" is based on my genuine work experience at AGROES SERVICE Pvt. Ltd, Kolar. All data, findings, and information presented are authentic and have been prepared under the guidance of Prof. Irshad.
 
 I further declare that this report has not been submitted to any other institution for the award of any degree or diploma.
 
 Date: January 2026
 Place: Kolar
 
 Signature of Student: _______________`;

const DemoReportGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const statusMessages = [
    'Initializing AI engine...',
    'Analyzing internship details...',
    'Generating Chapter 1: Introduction...',
    'Creating industry analysis...',
    'Writing company profile...',
    'Generating learning experience section...',
    'Analyzing data and findings...',
    'Preparing recommendations...',
    'Formatting according to university standards...',
    'Adding final touches...',
    'Report generation complete!'
  ];

  useEffect(() => {
    if (isGenerating && previewRef.current) {
      previewRef.current.scrollTop = previewRef.current.scrollHeight;
    }
  }, [generatedContent, isGenerating]);

  const handleGenerateDemo = async () => {
    setIsGenerating(true);
    setGeneratedContent('');
    setProgress(0);

    const words = DEMO_REPORT_CONTENT.split(' ');
    const totalWords = words.length;
    let currentIndex = 0;
    let statusIndex = 0;

    // Status message rotation
    const statusInterval = setInterval(() => {
      if (statusIndex < statusMessages.length - 1) {
        setCurrentStatus(statusMessages[statusIndex]);
        statusIndex++;
      }
    }, 1500);

    // Simulate typing effect
    const typingInterval = setInterval(() => {
      if (currentIndex < totalWords) {
        const wordsPerTick = Math.floor(Math.random() * 5) + 3; // 3-7 words per tick
        const nextIndex = Math.min(currentIndex + wordsPerTick, totalWords);
        const newContent = words.slice(0, nextIndex).join(' ');
        setGeneratedContent(newContent);
        setProgress(Math.floor((nextIndex / totalWords) * 100));
        currentIndex = nextIndex;
      } else {
        clearInterval(typingInterval);
        clearInterval(statusInterval);
        setCurrentStatus(statusMessages[statusMessages.length - 1]);
        setIsGenerating(false);
      }
    }, 100);
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/20 shadow-lg animate-scale-in">
      <CardHeader className="gradient-bg text-primary-foreground">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="w-5 h-5" />
          Try Demo Report Generation
        </CardTitle>
        <p className="text-sm text-primary-foreground/80 mt-1">
          See how our AI generates university-compliant reports in real-time
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Pre-filled Form */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center gap-1">
              <Lock className="w-3 h-3" /> Student Name
            </Label>
            <Input 
              value="Amanda John" 
              disabled 
              className="bg-muted cursor-not-allowed font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center gap-1">
              <Lock className="w-3 h-3" /> College Name
            </Label>
            <Input 
              value="Christ Degree College" 
              disabled 
              className="bg-muted cursor-not-allowed font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center gap-1">
              <Lock className="w-3 h-3" /> Internship Title
            </Label>
            <Input 
              value="Inventory Management at Flipkart, Bangalore" 
              disabled 
              className="bg-muted cursor-not-allowed font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center gap-1">
              <Lock className="w-3 h-3" /> Course
            </Label>
            <Input 
              value="BBA" 
              disabled 
              className="bg-muted cursor-not-allowed font-medium"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          * This is a demo with preset values. No editing allowed in demo mode.
        </p>

        {/* Generate Button */}
        <Button 
          variant="hero" 
          size="lg" 
          className="w-full"
          onClick={handleGenerateDemo}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              AI Generating Report...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Demo Report
            </>
          )}
        </Button>

        {/* Progress Section */}
        {(isGenerating || generatedContent) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                {currentStatus}
              </span>
              <span className="font-medium text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Live Preview */}
        {generatedContent && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <FileText className="w-4 h-4 text-primary" />
                Live Preview
              </Label>
              {isGenerating && (
                <span className="text-xs text-green-600 animate-pulse flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Writing...
                </span>
              )}
            </div>
            <div 
              ref={previewRef}
              className="bg-white dark:bg-gray-900 border rounded-lg p-4 h-80 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap shadow-inner"
            >
              {generatedContent}
              {isGenerating && <span className="animate-pulse">|</span>}
            </div>
          </div>
        )}

        {/* Download Button (Inactive) */}
        {generatedContent && !isGenerating && (
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full opacity-60 cursor-not-allowed"
            disabled
          >
            <Download className="w-5 h-5 mr-2" />
            Download Report (Login Required)
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DemoReportGenerator;
