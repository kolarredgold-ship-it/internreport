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

# "Inventory Management System at Flipkart, Bangalore"

Submitted by
Amanda John
Register No: U19ze283838

Under the guidance of
Prof. Irshad

Bachelor of Business Administration
Academic Year: 2025 - 26

---

# EXECUTIVE SUMMARY

This internship project report documents the practical learning experience gained during a 15-day internship at Flipkart, Bangalore, focusing on their Inventory Management System. The internship provided valuable exposure to real-world e-commerce operations, supply chain management, and the technological infrastructure that powers India's leading online marketplace.

Key highlights of the internship include hands-on experience with warehouse management systems, understanding of inventory control mechanisms, and analysis of demand forecasting techniques. The report presents observations, learnings, and recommendations derived from this practical exposure, bridging the gap between academic knowledge and industry practices.

---

# CHAPTER 1: INTRODUCTION

## 1.1 Background of the Study

The Indian e-commerce industry, particularly the segment dealing with inventory and logistics management, represents a critical and resilient pillar of the national economy. Characterized by consistent demand driven by a large and growing population, increasing urbanization, and rising disposable incomes, this sector encompasses a wide range of essential operations. Flipkart, headquartered in Bangalore, Karnataka, operates within this dynamic and competitive landscape as one of India's leading e-commerce giants.

As a pioneer in Indian e-commerce, the company caters to the fundamental requirements of millions of Indian consumers, a market segment that has witnessed exponential growth in recent years. The advent of digital payments, smartphone penetration, and evolving consumer preferences towards online shopping have compelled traditional retailers to re-evaluate their operational strategies while enabling digital-first companies like Flipkart to thrive.

## 1.2 Objectives of the Internship

The primary aim of this internship was to conduct an in-depth analysis of the inventory management system at Flipkart and to evaluate its effectiveness in supporting the company's pan-India distribution strategy. The specific objectives were:

1. To understand and document the existing inventory management process at Flipkart
2. To analyze the key performance metrics and tools currently employed for inventory control
3. To identify the challenges and bottlenecks within the current inventory management system
4. To provide practical, actionable recommendations for improvement

## 1.3 Scope of the Study

This study is centered on the inventory management processes at Flipkart, Bangalore. The scope includes examination of procedures for inventory procurement, warehousing, tracking, order processing, and dispatch. The study does not constitute a formal financial audit or detailed analysis of supplier management policies.

---

# CHAPTER 2: DESCRIPTION OF THE ORGANISATION

## 2.1 Company Overview

Flipkart is India's leading e-commerce marketplace, founded in 2007 by Sachin and Binny Bansal. Headquartered in Bangalore, Karnataka, the company has grown from a small online bookstore into a comprehensive e-commerce platform offering millions of products across categories including electronics, fashion, home goods, groceries, and more.

The company's operations are characterized by a sophisticated logistics and supply chain infrastructure, encompassing a vast network of fulfillment centers, sortation hubs, and last-mile delivery capabilities.

## 2.2 Organizational Structure

The company operates through various departments including:
- Supply Chain & Logistics
- Technology & Engineering
- Customer Experience
- Marketing & Brand Management
- Finance & Operations

## 2.3 Vision, Mission, and Core Values

**Vision:** To create a technology-driven e-commerce ecosystem that empowers every Indian to access quality products at affordable prices.

**Mission:** To transform commerce in India through technology, provide value-for-money products, and create a million jobs in the process.

**Core Values:**
1. Customer First: Every decision starts with the customer
2. Innovation: Constantly pushing boundaries to improve
3. Integrity: Operating with transparency and fairness
4. Collaboration: Working together to achieve shared goals
5. Excellence: Striving for the highest standards

---

# CHAPTER 3: EXTERNAL LEARNING

## 3.1 Industry Knowledge Gained

Throughout this internship, I gained comprehensive knowledge about the e-commerce industry:

- Understanding of supply chain dynamics in large-scale retail operations
- Insights into warehouse management and inventory optimization techniques
- Knowledge of demand forecasting using AI and machine learning
- Exposure to industry best practices in logistics and fulfillment

## 3.2 Technical Skills Acquired

**Technical Skills:**
- Proficiency in inventory management software and WMS
- Data analysis using Excel and basic SQL queries
- Understanding of barcode and RFID technology
- Report generation and interpretation

## 3.3 Professional Development

**Soft Skills:**
- Enhanced communication and teamwork abilities
- Problem-solving in dynamic environments
- Time management and prioritization
- Professional workplace etiquette

---

# CHAPTER 4: INTERNSHIP OUTCOMES AND CONCLUSION

## 4.1 Key Findings

1. **High Inventory Accuracy Rate:** The analysis revealed an impressive inventory accuracy rate of 98.5%, significantly above industry benchmarks.

2. **Efficient Order Processing:** Average order processing time was under 2 hours from order receipt to dispatch readiness.

3. **Advanced Technology Integration:** The company effectively utilizes AI for demand forecasting and robotics for warehouse operations.

4. **Scalable Infrastructure:** The warehouse system demonstrates excellent scalability during peak seasons like festive sales.

## 4.2 Recommendations

Based on my analysis, I recommend:
1. Enhanced real-time tracking implementation
2. Expanded use of predictive analytics
3. Continued investment in automation technologies
4. Regular training programs for warehouse staff

## 4.3 Conclusion

This internship at Flipkart provided invaluable exposure to inventory management practices at scale. The experience bridged the gap between academic learning and practical application, offering insights into how India's largest e-commerce company manages millions of products efficiently.

The key takeaway is that successful inventory management requires a combination of advanced technology, skilled personnel, and continuous process improvement. I am grateful for this opportunity and confident that the skills and knowledge gained will contribute significantly to my future career in business administration.

---

# CHAPTER 5: BIBLIOGRAPHY

1. Chopra, S., & Meindl, P. (2021). Supply Chain Management: Strategy, Planning, and Operation (7th ed.). Pearson Education.

2. Flipkart Official Website. (2025). About Us. Retrieved from https://www.flipkart.com

3. IBEF. (2025). E-commerce Industry in India. India Brand Equity Foundation.

4. Kumar, R. (2023). Inventory Management in Indian E-commerce. Journal of Business Logistics, 44(2), 156-172.

5. Ministry of Commerce and Industry. (2024). Annual Report on E-commerce Sector. Government of India.

6. Simchi-Levi, D., Kaminsky, P., & Simchi-Levi, E. (2022). Designing and Managing the Supply Chain (4th ed.). McGraw-Hill.

---

**Student Declaration:**
I, Amanda John, hereby declare that this internship project report is based on my genuine work experience at Flipkart, Bangalore. All data and findings presented are authentic and prepared under the guidance of Prof. Irshad.

Date: January 2026
Place: Bangalore`;

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
