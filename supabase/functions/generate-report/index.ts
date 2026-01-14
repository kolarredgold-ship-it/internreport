import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== AUTHENTICATION ==========
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create client with user's auth context
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("JWT validation failed:", claimsError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      console.error("No user ID in token claims");
      return new Response(
        JSON.stringify({ error: 'Invalid token: no user ID' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated user:", userId);

    // ========== INPUT VALIDATION ==========
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Define required fields (excluding userId - comes from JWT)
    const requiredFields = [
      'studentName', 'registerNumber', 'course', 'collegeName',
      'university', 'guideName', 'internshipTitle', 'companyName',
      'companyLocation', 'internshipDuration', 'academicYear',
      'topicSpecialization', 'pagesCount'
    ];

    // Check all required fields exist
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate pagesCount type and range
    if (typeof body.pagesCount !== 'number' || !Number.isInteger(body.pagesCount)) {
      return new Response(
        JSON.stringify({ error: 'pagesCount must be an integer' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.pagesCount < 3 || body.pagesCount > 40) {
      return new Response(
        JSON.stringify({ error: 'pagesCount must be between 3 and 40' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate string fields
    const maxLength = 200;
    for (const field of requiredFields) {
      if (field === 'pagesCount') continue;
      
      if (typeof body[field] !== 'string') {
        return new Response(
          JSON.stringify({ error: `${field} must be a string` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (body[field].length > maxLength) {
        return new Response(
          JSON.stringify({ error: `${field} exceeds maximum length of ${maxLength} characters` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Sanitize and trim strings
    const sanitize = (str: string) => str.trim().substring(0, maxLength);

    const studentName = sanitize(body.studentName);
    const registerNumber = sanitize(body.registerNumber);
    const course = sanitize(body.course);
    const collegeName = sanitize(body.collegeName);
    const university = sanitize(body.university);
    const guideName = sanitize(body.guideName);
    const internshipTitle = sanitize(body.internshipTitle);
    const companyName = sanitize(body.companyName);
    const companyLocation = sanitize(body.companyLocation);
    const internshipDuration = sanitize(body.internshipDuration);
    const academicYear = sanitize(body.academicYear);
    const topicSpecialization = sanitize(body.topicSpecialization);
    const pagesCount = body.pagesCount;

    console.log("Input validation passed for user:", userId);

    // ========== BUSINESS LOGIC ==========
    // Initialize Supabase admin client for database operations
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Atomically claim a generation slot before processing (prevents race condition)
    const { data: claimResult, error: claimError } = await supabase
      .rpc('claim_generation_slot', { p_user_id: userId });

    if (claimError) {
      console.error('Failed to claim generation slot:', claimError);
      throw new Error('Failed to verify generation limit');
    }

    if (!claimResult.success) {
      return new Response(
        JSON.stringify({ error: claimResult.error }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newCount = claimResult.generations_used;
    console.log(`Generation slot claimed. User now has ${newCount} generations used.`);

    // Generate report using DeepSeek AI
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    
    if (!DEEPSEEK_API_KEY) {
      throw new Error("DeepSeek API key not configured");
    }

    // Calculate word count based on pages (approximately 300-350 words per page for academic reports)
    const targetWordCount = pagesCount * 350;
    
    const prompt = `You are an expert academic report writer specializing in Indian university internship project reports. Your task is to generate an EXTREMELY DETAILED and COMPREHENSIVE internship project report.

CRITICAL REQUIREMENTS:
- Target Length: ${pagesCount} pages (approximately ${targetWordCount} words minimum)
- Each chapter MUST be extensively detailed with multiple paragraphs
- Every subsection should contain 500-800 words of detailed content
- Include real-world examples, case studies, and practical applications
- Use formal academic language with proper citations style
- Write elaborate explanations, not brief summaries

Student Information:
- Name: ${studentName}
- Register Number: ${registerNumber}
- Course: ${course}
- College: ${collegeName}
- University: ${university}
- Guide Name: ${guideName}

Internship Details:
- Title: ${internshipTitle}
- Company: ${companyName}
- Location: ${companyLocation}
- Duration: ${internshipDuration}
- Academic Year: ${academicYear}
- Topic/Specialization: ${topicSpecialization}

Generate an EXHAUSTIVELY DETAILED internship project report. Each section must be FULLY ELABORATED with extensive content:

# CERTIFICATE
(Write a formal certificate of 150+ words with proper institutional formatting, signatures placeholders, and official language)

# DECLARATION
(Student declaration statement of 200+ words with formal legal language)

# ACKNOWLEDGEMENT
(Professional acknowledgment section of 300+ words thanking institution, guide, company, family, and colleagues individually with specific mentions)

# ABSTRACT
(Comprehensive abstract of 400+ words summarizing the entire internship experience, methodology, key findings, and conclusions)

# TABLE OF CONTENTS
(Detailed table with all chapters, sections, and page numbers)

# LIST OF FIGURES
# LIST OF TABLES
# LIST OF ABBREVIATIONS

# CHAPTER 1: INTRODUCTION (Minimum 1500 words)
## 1.1 Background of the Study
(Elaborate on the industry context, historical development, current trends, and relevance of ${topicSpecialization} in today's market - minimum 400 words)
## 1.2 Objectives of the Internship
(List and explain at least 8-10 specific objectives with detailed descriptions - minimum 300 words)
## 1.3 Scope of the Study
(Define boundaries, limitations, and coverage area in detail - minimum 300 words)
## 1.4 Need for the Study
(Justify the importance with market data, industry requirements, and academic relevance - minimum 300 words)
## 1.5 Research Methodology
(Explain the approach, data collection methods, and analysis techniques used - minimum 200 words)

# CHAPTER 2: INDUSTRY AND COMPANY PROFILE (Minimum 2000 words)
## 2.1 Industry Overview
(Detailed analysis of the ${topicSpecialization} industry, market size, growth trends, key players - minimum 500 words)
## 2.2 About ${companyName}
(Comprehensive company history, founding story, milestones, achievements - minimum 400 words)
## 2.3 Vision, Mission, and Core Values
(Elaborate on company philosophy and guiding principles - minimum 200 words)
## 2.4 Products and Services Portfolio
(Detailed description of all offerings with features and benefits - minimum 400 words)
## 2.5 Organizational Structure and Hierarchy
(Explain departments, reporting structure, team compositions - minimum 300 words)
## 2.6 SWOT Analysis
(Comprehensive strengths, weaknesses, opportunities, threats analysis - minimum 300 words)

# CHAPTER 3: LITERATURE REVIEW (Minimum 2500 words)
## 3.1 Theoretical Framework
(Discuss relevant theories, models, and frameworks related to ${topicSpecialization} - minimum 600 words)
## 3.2 Review of Previous Studies
(Cite and discuss at least 10-15 relevant academic studies with findings - minimum 800 words)
## 3.3 Industry Best Practices
(Document current industry standards and methodologies - minimum 400 words)
## 3.4 Technological Advancements
(Discuss latest technologies and innovations in the field - minimum 400 words)
## 3.5 Research Gap Analysis
(Identify gaps in existing knowledge that this internship addresses - minimum 300 words)

# CHAPTER 4: INTERNSHIP ACTIVITIES AND RESPONSIBILITIES (Minimum 3000 words)
## 4.1 Department Overview
(Detailed description of the department where internship was conducted - minimum 300 words)
## 4.2 Roles and Responsibilities Assigned
(Comprehensive list of all duties with detailed explanations - minimum 500 words)
## 4.3 Week-wise Activity Log
(Detailed week-by-week account of activities for entire ${internshipDuration} - minimum 800 words)
## 4.4 Projects Undertaken
(Describe 3-5 major projects with objectives, methodology, and outcomes - minimum 700 words)
## 4.5 Tools and Technologies Used
(List and explain all software, tools, and technologies with usage context - minimum 400 words)
## 4.6 Team Collaboration and Communication
(Describe teamwork experiences, meetings, and coordination - minimum 300 words)

# CHAPTER 5: TECHNICAL LEARNING AND SKILL DEVELOPMENT (Minimum 2000 words)
## 5.1 Technical Skills Acquired
(Detailed description of each technical skill with proficiency levels - minimum 500 words)
## 5.2 Soft Skills Developed
(Communication, leadership, time management, etc. with examples - minimum 400 words)
## 5.3 Domain Knowledge Enhancement
(Specific knowledge gained about ${topicSpecialization} - minimum 400 words)
## 5.4 Professional Competencies
(Industry-specific competencies developed - minimum 400 words)
## 5.5 Certifications and Training
(Any training programs or certifications completed - minimum 300 words)

# CHAPTER 6: DATA ANALYSIS AND FINDINGS (Minimum 2500 words)
## 6.1 Data Collection Methodology
(Explain how data was gathered during internship - minimum 400 words)
## 6.2 Analysis Framework
(Describe analytical methods and tools used - minimum 300 words)
## 6.3 Key Findings and Observations
(Present 8-10 major findings with detailed explanations - minimum 800 words)
## 6.4 Comparative Analysis
(Compare findings with industry standards and literature - minimum 500 words)
## 6.5 Interpretation of Results
(Discuss implications and significance of findings - minimum 500 words)

# CHAPTER 7: CHALLENGES AND PROBLEM-SOLVING (Minimum 1500 words)
## 7.1 Technical Challenges Encountered
(Describe technical difficulties faced with detailed context - minimum 400 words)
## 7.2 Organizational Challenges
(Workplace and process-related challenges - minimum 300 words)
## 7.3 Problem-Solving Approaches
(Methods used to overcome each challenge - minimum 400 words)
## 7.4 Lessons Learned
(Key takeaways from challenges faced - minimum 400 words)

# CHAPTER 8: SUGGESTIONS AND RECOMMENDATIONS (Minimum 1500 words)
## 8.1 Recommendations for ${companyName}
(5-7 specific, actionable recommendations with justifications - minimum 500 words)
## 8.2 Process Improvement Suggestions
(Detailed suggestions for operational improvements - minimum 400 words)
## 8.3 Technology Adoption Recommendations
(Suggest new technologies and their benefits - minimum 300 words)
## 8.4 Future Scope and Opportunities
(Identify growth areas and opportunities - minimum 300 words)

# CHAPTER 9: CONCLUSION (Minimum 1000 words)
## 9.1 Summary of Internship Experience
(Comprehensive summary of the entire experience - minimum 300 words)
## 9.2 Achievement of Objectives
(Map achievements against initial objectives - minimum 300 words)
## 9.3 Personal and Professional Growth
(Reflect on development during internship - minimum 200 words)
## 9.4 Future Career Aspirations
(Connect internship learning to career goals - minimum 200 words)

# BIBLIOGRAPHY
(Include 20-25 properly formatted academic references in APA style including journals, books, websites, and industry reports)

# ANNEXURES
## Annexure A: Sample Work Documents
## Annexure B: Photographs from Internship
## Annexure C: Completion Certificate
## Annexure D: Weekly Report Samples
## Annexure E: Feedback Form

IMPORTANT INSTRUCTIONS:
1. Write EXTENSIVE, DETAILED content for EVERY section - no brief overviews
2. Each paragraph should be 100-150 words minimum
3. Use formal academic English with proper grammar
4. Include specific examples, statistics, and data points
5. Make content relevant to ${topicSpecialization} and ${companyName}
6. Ensure content is unique, plagiarism-free, and human-like
7. Total word count MUST be at least ${targetWordCount} words
8. DO NOT skip any section - all must be fully elaborated`;

    console.log("Calling DeepSeek API for detailed report generation...");
    
    // DeepSeek API has max_tokens limit of 8192, so we make multiple calls for long reports
    const chaptersPerCall = pagesCount <= 10 ? 9 : 3; // Split into multiple calls for longer reports
    const numCalls = pagesCount <= 10 ? 1 : 3; // 1 call for short, 3 calls for long reports
    
    let fullContent = "";
    
    // Define chapter groups for multiple calls
    const chapterGroups = [
      // Group 1: Front matter + Chapters 1-3
      `Generate the following sections with FULL DETAIL for an internship report:

# CERTIFICATE (150+ words)
# DECLARATION (200+ words)  
# ACKNOWLEDGEMENT (300+ words)
# ABSTRACT (400+ words)
# TABLE OF CONTENTS
# LIST OF FIGURES
# LIST OF TABLES
# LIST OF ABBREVIATIONS

# CHAPTER 1: INTRODUCTION (1500+ words with all subsections 1.1-1.5)
# CHAPTER 2: INDUSTRY AND COMPANY PROFILE (2000+ words with all subsections 2.1-2.6)
# CHAPTER 3: LITERATURE REVIEW (2500+ words with all subsections 3.1-3.5)`,

      // Group 2: Chapters 4-6
      `Continue the internship report with these chapters with FULL DETAIL:

# CHAPTER 4: INTERNSHIP ACTIVITIES AND RESPONSIBILITIES (3000+ words with subsections 4.1-4.6)
# CHAPTER 5: TECHNICAL LEARNING AND SKILL DEVELOPMENT (2000+ words with subsections 5.1-5.5)
# CHAPTER 6: DATA ANALYSIS AND FINDINGS (2500+ words with subsections 6.1-6.5)`,

      // Group 3: Chapters 7-9 + Back matter
      `Complete the internship report with these final sections with FULL DETAIL:

# CHAPTER 7: CHALLENGES AND PROBLEM-SOLVING (1500+ words with subsections 7.1-7.4)
# CHAPTER 8: SUGGESTIONS AND RECOMMENDATIONS (1500+ words with subsections 8.1-8.4)
# CHAPTER 9: CONCLUSION (1000+ words with subsections 9.1-9.4)
# BIBLIOGRAPHY (20-25 APA references)
# ANNEXURES (A-E with descriptions)`
    ];

    const baseContext = `Student: ${studentName}, Reg: ${registerNumber}, Course: ${course}
College: ${collegeName}, University: ${university}, Guide: ${guideName}
Internship: ${internshipTitle} at ${companyName}, ${companyLocation}
Duration: ${internshipDuration}, Year: ${academicYear}, Topic: ${topicSpecialization}
Target: ${pagesCount} pages total`;

    for (let i = 0; i < numCalls; i++) {
      const chapterPrompt = numCalls === 1 ? prompt : `${baseContext}\n\n${chapterGroups[i]}`;
      
      console.log(`Making DeepSeek API call ${i + 1} of ${numCalls}...`);
      
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are an expert academic writer creating a ${pagesCount}-page internship project report for an Indian university student. Write EXTREMELY DETAILED content with formal academic language. Each section must be fully elaborated with multiple paragraphs. Never write brief summaries.`
            },
            {
              role: "user",
              content: chapterPrompt
            }
          ],
          max_tokens: 8000,
          temperature: 0.75,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("DeepSeek API error:", response.status, errorText);
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const partContent = data.choices[0]?.message?.content;
      
      if (partContent) {
        fullContent += (fullContent ? "\n\n" : "") + partContent;
      }
      
      console.log(`Call ${i + 1} completed successfully`);
    }

    const generatedContent = fullContent;

    if (!generatedContent) {
      throw new Error("No content generated");
    }

    // Save report to database
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        student_name: studentName,
        register_number: registerNumber,
        course: course,
        college_name: collegeName,
        university: university,
        guide_name: guideName,
        internship_title: internshipTitle,
        company_name: companyName,
        company_location: companyLocation,
        internship_duration: internshipDuration,
        academic_year: academicYear,
        topic_specialization: topicSpecialization,
        pages_count: pagesCount,
        report_content: generatedContent,
        status: "completed",
      })
      .select()
      .single();

    if (reportError) {
      console.error("Report save error:", reportError);
      throw new Error("Failed to save report");
    }

    console.log("Report generated and saved successfully for user:", userId);

    return new Response(
      JSON.stringify({
        content: generatedContent,
        reportId: report.id,
        generationsUsed: newCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate report error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
