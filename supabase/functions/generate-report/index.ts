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
    const part = body.part || null; // 'A1', 'A2', 'B1', 'B2', or null for full report

    console.log("Input validation passed for user:", userId, "Part:", part || "Full");

    // ========== BUSINESS LOGIC ==========
    // Initialize Supabase admin client for database operations
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For part-based generation, skip generation slot claiming
    // The slot is only claimed when user generates a full report or both parts
    let newCount = 0;
    if (!part) {
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

      newCount = claimResult.generations_used;
      console.log(`Generation slot claimed. User now has ${newCount} generations used.`);
    } else {
      console.log(`Generating Part ${part} - no generation slot claimed`);
    }

    // Generate report using DeepSeek AI
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    
    if (!DEEPSEEK_API_KEY) {
      throw new Error("DeepSeek API key not configured");
    }

    // Calculate word count based on pages (approximately 300-350 words per page for academic reports)
    const targetWordCount = pagesCount * 350;
    
    // Define base context
    const baseContext = `Student: ${studentName}, Reg: ${registerNumber}, Course: ${course}
College: ${collegeName}, University: ${university}, Guide: ${guideName}
Internship: ${internshipTitle} at ${companyName}, ${companyLocation}
Duration: ${internshipDuration}, Year: ${academicYear}, Topic: ${topicSpecialization}
Target: ${pagesCount} pages total`;

    // Define prompts for each part (4 parts to minimize timeouts)
    const partA1Prompt = `${baseContext}

Generate the FRONT MATTER and CHAPTER 1 with FULL DETAIL for an internship report:

# CERTIFICATE (150+ words - formal certificate with institutional formatting)
# DECLARATION (200+ words - student declaration with formal legal language)
# ACKNOWLEDGEMENT (300+ words - thank institution, guide, company, family individually)
# ABSTRACT (400+ words - comprehensive summary of internship experience)
# TABLE OF CONTENTS (list all chapters and sections)
# LIST OF FIGURES
# LIST OF TABLES
# LIST OF ABBREVIATIONS

# CHAPTER 1: INTRODUCTION (1500+ words)
## 1.1 Background of the Study (400+ words - elaborate on industry context, trends, relevance)
## 1.2 Objectives of the Internship (300+ words - list 8-10 specific objectives)
## 1.3 Scope of the Study (300+ words - define boundaries and limitations)
## 1.4 Need for the Study (300+ words - justify importance with data)
## 1.5 Research Methodology (200+ words - approach and data collection methods)

Write EXTENSIVE, DETAILED content with formal academic English.`;

    const partA2Prompt = `${baseContext}

Generate CHAPTERS 2 and 3 with FULL DETAIL for an internship report:

# CHAPTER 2: INDUSTRY AND COMPANY PROFILE (2000+ words)
## 2.1 Industry Overview (500+ words - detailed analysis of ${topicSpecialization} industry, market size, trends)
## 2.2 About ${companyName} (400+ words - comprehensive company history, milestones)
## 2.3 Vision, Mission, and Core Values (200+ words - company philosophy)
## 2.4 Products and Services Portfolio (400+ words - detailed description of offerings)
## 2.5 Organizational Structure and Hierarchy (300+ words - departments, team composition)
## 2.6 SWOT Analysis (300+ words - comprehensive strengths, weaknesses, opportunities, threats)

# CHAPTER 3: LITERATURE REVIEW (2500+ words)
## 3.1 Theoretical Framework (600+ words - relevant theories and models for ${topicSpecialization})
## 3.2 Review of Previous Studies (800+ words - cite 10-15 academic studies with findings)
## 3.3 Industry Best Practices (400+ words - current industry standards)
## 3.4 Technological Advancements (400+ words - latest technologies in the field)
## 3.5 Research Gap Analysis (300+ words - gaps this internship addresses)

Write EXTENSIVE, DETAILED content with formal academic English.`;

    const partB1Prompt = `${baseContext}

Generate CHAPTERS 4, 5, and 6 with FULL DETAIL for an internship report:

# CHAPTER 4: INTERNSHIP ACTIVITIES AND RESPONSIBILITIES (3000+ words)
## 4.1 Department Overview (300+ words - detailed department description)
## 4.2 Roles and Responsibilities Assigned (500+ words - comprehensive list of duties)
## 4.3 Week-wise Activity Log (800+ words - detailed week-by-week account for ${internshipDuration})
## 4.4 Projects Undertaken (700+ words - describe 3-5 major projects with objectives and outcomes)
## 4.5 Tools and Technologies Used (400+ words - software, tools with usage context)
## 4.6 Team Collaboration and Communication (300+ words - teamwork experiences)

# CHAPTER 5: TECHNICAL LEARNING AND SKILL DEVELOPMENT (2000+ words)
## 5.1 Technical Skills Acquired (500+ words - detailed technical skills with proficiency)
## 5.2 Soft Skills Developed (400+ words - communication, leadership with examples)
## 5.3 Domain Knowledge Enhancement (400+ words - specific knowledge about ${topicSpecialization})
## 5.4 Professional Competencies (400+ words - industry-specific competencies)
## 5.5 Certifications and Training (300+ words - training programs completed)

# CHAPTER 6: DATA ANALYSIS AND FINDINGS (2500+ words)
## 6.1 Data Collection Methodology (400+ words - how data was gathered)
## 6.2 Analysis Framework (300+ words - analytical methods and tools)
## 6.3 Key Findings and Observations (800+ words - 8-10 major findings detailed)
## 6.4 Comparative Analysis (500+ words - compare with industry standards)
## 6.5 Interpretation of Results (500+ words - implications and significance)

Write EXTENSIVE, DETAILED content with formal academic English.`;

    const partB2Prompt = `${baseContext}

Generate CHAPTERS 7, 8, 9, BIBLIOGRAPHY, and ANNEXURES with FULL DETAIL for an internship report:

# CHAPTER 7: CHALLENGES AND PROBLEM-SOLVING (1500+ words)
## 7.1 Technical Challenges Encountered (400+ words - technical difficulties with context)
## 7.2 Organizational Challenges (300+ words - workplace and process challenges)
## 7.3 Problem-Solving Approaches (400+ words - methods to overcome challenges)
## 7.4 Lessons Learned (400+ words - key takeaways from challenges)

# CHAPTER 8: SUGGESTIONS AND RECOMMENDATIONS (1500+ words)
## 8.1 Recommendations for ${companyName} (500+ words - 5-7 actionable recommendations)
## 8.2 Process Improvement Suggestions (400+ words - operational improvements)
## 8.3 Technology Adoption Recommendations (300+ words - new technologies and benefits)
## 8.4 Future Scope and Opportunities (300+ words - growth areas)

# CHAPTER 9: CONCLUSION (1000+ words)
## 9.1 Summary of Internship Experience (300+ words - comprehensive summary)
## 9.2 Achievement of Objectives (300+ words - map achievements to initial objectives)
## 9.3 Personal and Professional Growth (200+ words - development during internship)
## 9.4 Future Career Aspirations (200+ words - connect learning to career goals)

# BIBLIOGRAPHY
(Include 20-25 properly formatted academic references in APA style including journals, books, websites, and industry reports relevant to ${topicSpecialization})

# ANNEXURES
## Annexure A: Sample Work Documents
## Annexure B: Photographs from Internship
## Annexure C: Completion Certificate
## Annexure D: Weekly Report Samples
## Annexure E: Feedback Form

Write EXTENSIVE, DETAILED content with formal academic English.`;

    // Determine which prompt to use based on part parameter
    let chapterPrompt: string;
    let partLabel: string;
    
    switch (part) {
      case 'A1':
        chapterPrompt = partA1Prompt;
        partLabel = "A1 (Front Matter + Ch1)";
        break;
      case 'A2':
        chapterPrompt = partA2Prompt;
        partLabel = "A2 (Ch2-3)";
        break;
      case 'B1':
        chapterPrompt = partB1Prompt;
        partLabel = "B1 (Ch4-6)";
        break;
      case 'B2':
        chapterPrompt = partB2Prompt;
        partLabel = "B2 (Ch7-9 + Refs)";
        break;
      default:
        // Full report (legacy behavior) - use Part A1 for now
        chapterPrompt = partA1Prompt;
        partLabel = "Full (legacy)";
    }
    
    console.log(`Generating ${partLabel}...`);
    
    // Create an AbortController with 90-second timeout (shorter for smaller parts)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    
    let fullContent = "";
    
    try {
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
          max_tokens: 6000, // Reduced for smaller parts
          temperature: 0.75,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("DeepSeek API error:", response.status, errorText);
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const partContent = data.choices[0]?.message?.content;
      
      if (partContent) {
        fullContent = partContent;
      }
      
      console.log(`API call completed successfully for ${partLabel}`);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`DeepSeek API call timed out after 90 seconds`);
        throw new Error('AI generation timed out. Please try again.');
      }
      throw fetchError;
    }

    const generatedContent = fullContent;

    if (!generatedContent) {
      throw new Error("No content generated");
    }

    // For part-based generation, don't save to database - just return the content
    if (part) {
      console.log(`Part ${part} generated successfully for user:`, userId);
      return new Response(
        JSON.stringify({
          content: generatedContent,
          part: part,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save full report to database (legacy behavior)
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
