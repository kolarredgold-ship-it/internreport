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
    
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

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

    const requiredFields = [
      'studentName', 'registerNumber', 'course', 'collegeName',
      'university', 'guideName', 'internshipTitle', 'companyName',
      'companyLocation', 'internshipDuration', 'academicYear',
      'topicSpecialization', 'pagesCount'
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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
    // Chapter number: 1-9 for individual chapters, or 'front' for front matter
    const chapter = body.chapter || null;

    console.log("Input validation passed for user:", userId, "Chapter:", chapter || "Full");

    // ========== BUSINESS LOGIC ==========
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For chapter-based generation, skip generation slot claiming
    let newCount = 0;
    if (!chapter) {
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
      console.log(`Generating Chapter ${chapter} - no generation slot claimed`);
    }

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    
    if (!DEEPSEEK_API_KEY) {
      throw new Error("DeepSeek API key not configured");
    }

    // Base context for all prompts
    const baseContext = `Student: ${studentName}, Reg: ${registerNumber}, Course: ${course}
College: ${collegeName}, University: ${university}, Guide: ${guideName}
Internship: ${internshipTitle} at ${companyName}, ${companyLocation}
Duration: ${internshipDuration}, Year: ${academicYear}, Topic: ${topicSpecialization}
Target: ${pagesCount} pages total`;

    // Chapter-specific prompts (each optimized for ~8000 tokens output)
    const chapterPrompts: Record<string, { prompt: string; label: string }> = {
      'front': {
        label: 'Front Matter',
        prompt: `${baseContext}

Generate the FRONT MATTER for an internship report with FULL DETAIL:

# CERTIFICATE
(Write a formal certificate - 150+ words with institutional formatting, signatures placeholders)

# DECLARATION
(Write student declaration - 200+ words with formal legal language)

# ACKNOWLEDGEMENT
(Write detailed acknowledgement - 300+ words thanking institution, guide, company supervisors, colleagues, family)

# ABSTRACT
(Write comprehensive abstract - 400+ words summarizing the entire internship experience, objectives, methodology, findings, and conclusions)

# TABLE OF CONTENTS
(List all chapters with section numbers)

# LIST OF FIGURES
(Placeholder list)

# LIST OF TABLES
(Placeholder list)

# LIST OF ABBREVIATIONS
(Include 10-15 relevant abbreviations used in the report)

Write EXTENSIVE, DETAILED content with formal academic English.`
      },
      '1': {
        label: 'Chapter 1: Introduction',
        prompt: `${baseContext}

Generate CHAPTER 1: INTRODUCTION with FULL DETAIL (2000+ words):

# CHAPTER 1: INTRODUCTION

## 1.1 Background of the Study
(Write 500+ words - elaborate on industry context, current trends, market scenario, relevance of ${topicSpecialization})

## 1.2 Objectives of the Internship
(Write 400+ words - list 8-10 specific, measurable objectives with explanations)

## 1.3 Scope of the Study
(Write 400+ words - define boundaries, what is included/excluded, limitations)

## 1.4 Need for the Study
(Write 400+ words - justify importance with industry data, statistics, and real-world relevance)

## 1.5 Research Methodology
(Write 300+ words - describe approach, data collection methods, tools used)

Write EXTENSIVE, DETAILED content with formal academic English.`
      },
      '2': {
        label: 'Chapter 2: Industry & Company Profile',
        prompt: `${baseContext}

Generate CHAPTER 2: INDUSTRY AND COMPANY PROFILE with FULL DETAIL (2500+ words):

# CHAPTER 2: INDUSTRY AND COMPANY PROFILE

## 2.1 Industry Overview
(Write 600+ words - detailed analysis of ${topicSpecialization} industry, market size, growth rate, key players, trends)

## 2.2 About ${companyName}
(Write 500+ words - comprehensive company history, founding, milestones, current operations)

## 2.3 Vision, Mission, and Core Values
(Write 250+ words - company philosophy, goals, guiding principles)

## 2.4 Products and Services Portfolio
(Write 500+ words - detailed description of all major offerings, USP, market positioning)

## 2.5 Organizational Structure
(Write 350+ words - departments, hierarchy, team composition, reporting structure)

## 2.6 SWOT Analysis
(Write 400+ words - comprehensive strengths, weaknesses, opportunities, threats with examples)

Write EXTENSIVE, DETAILED content with formal academic English.`
      },
      '3': {
        label: 'Chapter 3: Literature Review',
        prompt: `${baseContext}

Generate CHAPTER 3: LITERATURE REVIEW with FULL DETAIL (2500+ words):

# CHAPTER 3: LITERATURE REVIEW

## 3.1 Theoretical Framework
(Write 700+ words - relevant theories, models, and frameworks for ${topicSpecialization}, explain each theory)

## 3.2 Review of Previous Studies
(Write 900+ words - cite and discuss 12-15 academic studies with author names, years, key findings)

## 3.3 Industry Best Practices
(Write 450+ words - current industry standards, benchmarks, successful case studies)

## 3.4 Technological Advancements
(Write 450+ words - latest technologies, digital transformation, innovations in the field)

## 3.5 Research Gap Analysis
(Write 350+ words - identify gaps in existing research that this internship addresses)

Write EXTENSIVE, DETAILED content with formal academic English. Include proper citations in APA format.`
      },
      '4': {
        label: 'Chapter 4: Internship Activities',
        prompt: `${baseContext}

Generate CHAPTER 4: INTERNSHIP ACTIVITIES AND RESPONSIBILITIES with FULL DETAIL (3000+ words):

# CHAPTER 4: INTERNSHIP ACTIVITIES AND RESPONSIBILITIES

## 4.1 Department Overview
(Write 400+ words - detailed department description, function, role in organization)

## 4.2 Roles and Responsibilities Assigned
(Write 600+ words - comprehensive list of 10-15 duties with detailed descriptions)

## 4.3 Week-wise Activity Log
(Write 1000+ words - detailed week-by-week account for ${internshipDuration}, specific tasks, learnings each week)

## 4.4 Projects Undertaken
(Write 700+ words - describe 4-5 major projects with objectives, methodology, outcomes)

## 4.5 Tools and Technologies Used
(Write 500+ words - list all software, tools, technologies with usage context and proficiency gained)

## 4.6 Team Collaboration
(Write 400+ words - teamwork experiences, meetings, communication methods, collaborative projects)

Write EXTENSIVE, DETAILED content with formal academic English.`
      },
      '5': {
        label: 'Chapter 5: Technical Learning',
        prompt: `${baseContext}

Generate CHAPTER 5: TECHNICAL LEARNING AND SKILL DEVELOPMENT with FULL DETAIL (2500+ words):

# CHAPTER 5: TECHNICAL LEARNING AND SKILL DEVELOPMENT

## 5.1 Technical Skills Acquired
(Write 600+ words - list 10-12 technical skills with detailed descriptions of what was learned, proficiency level)

## 5.2 Soft Skills Developed
(Write 500+ words - communication, leadership, time management, problem-solving with specific examples)

## 5.3 Domain Knowledge Enhancement
(Write 500+ words - specific knowledge about ${topicSpecialization}, industry insights, specialized learning)

## 5.4 Professional Competencies
(Write 500+ words - industry-specific competencies, professional standards, workplace ethics)

## 5.5 Certifications and Training
(Write 400+ words - training programs attended, online courses, workshops, certifications obtained)

Write EXTENSIVE, DETAILED content with formal academic English.`
      },
      '6': {
        label: 'Chapter 6: Data Analysis & Findings',
        prompt: `${baseContext}

Generate CHAPTER 6: DATA ANALYSIS AND FINDINGS with FULL DETAIL (2500+ words):

# CHAPTER 6: DATA ANALYSIS AND FINDINGS

## 6.1 Data Collection Methodology
(Write 500+ words - how data was gathered, sources, sample size, tools used)

## 6.2 Analysis Framework
(Write 400+ words - analytical methods, tools, frameworks used for analysis)

## 6.3 Key Findings and Observations
(Write 800+ words - present 10-12 major findings with detailed explanations, data points)

## 6.4 Comparative Analysis
(Write 500+ words - compare findings with industry standards, benchmarks, previous studies)

## 6.5 Interpretation of Results
(Write 500+ words - explain implications, significance, what the data reveals)

Include relevant tables and figures placeholders. Write EXTENSIVE, DETAILED content with formal academic English.`
      },
      '7': {
        label: 'Chapter 7: Challenges & Solutions',
        prompt: `${baseContext}

Generate CHAPTER 7: CHALLENGES AND PROBLEM-SOLVING with FULL DETAIL (2000+ words):

# CHAPTER 7: CHALLENGES AND PROBLEM-SOLVING

## 7.1 Technical Challenges Encountered
(Write 500+ words - 5-6 technical difficulties with context, impact, and how they were addressed)

## 7.2 Organizational Challenges
(Write 400+ words - workplace, process, and communication challenges faced)

## 7.3 Problem-Solving Approaches
(Write 500+ words - specific methods, frameworks, strategies used to overcome challenges)

## 7.4 Lessons Learned
(Write 500+ words - key takeaways from challenges, how they contributed to growth)

Write EXTENSIVE, DETAILED content with formal academic English.`
      },
      '8': {
        label: 'Chapter 8: Recommendations',
        prompt: `${baseContext}

Generate CHAPTER 8: SUGGESTIONS AND RECOMMENDATIONS with FULL DETAIL (2000+ words):

# CHAPTER 8: SUGGESTIONS AND RECOMMENDATIONS

## 8.1 Recommendations for ${companyName}
(Write 600+ words - 6-8 detailed, actionable recommendations with justification and expected benefits)

## 8.2 Process Improvement Suggestions
(Write 500+ words - operational improvements, efficiency enhancements, workflow optimizations)

## 8.3 Technology Adoption Recommendations
(Write 450+ words - new technologies, tools, systems that could benefit the organization)

## 8.4 Future Scope and Opportunities
(Write 450+ words - growth areas, market opportunities, expansion possibilities)

Write EXTENSIVE, DETAILED content with formal academic English.`
      },
      '9': {
        label: 'Chapter 9: Conclusion & References',
        prompt: `${baseContext}

Generate CHAPTER 9: CONCLUSION and BIBLIOGRAPHY with FULL DETAIL:

# CHAPTER 9: CONCLUSION (1200+ words)

## 9.1 Summary of Internship Experience
(Write 400+ words - comprehensive summary of the entire internship journey)

## 9.2 Achievement of Objectives
(Write 400+ words - map achievements to initial objectives, degree of completion)

## 9.3 Personal and Professional Growth
(Write 250+ words - development during internship, transformation)

## 9.4 Future Career Aspirations
(Write 250+ words - connect learning to career goals, next steps)

# BIBLIOGRAPHY
(Include 25-30 properly formatted references in APA style:
- 10 academic journal articles
- 5 books/textbooks
- 5 industry reports
- 5 reputable websites
All relevant to ${topicSpecialization})

# ANNEXURES
## Annexure A: Sample Work Documents (placeholder)
## Annexure B: Photographs from Internship (placeholder)
## Annexure C: Completion Certificate (placeholder)
## Annexure D: Weekly Report Samples (placeholder)
## Annexure E: Feedback Form (placeholder)

Write EXTENSIVE, DETAILED content with formal academic English.`
      }
    };

    // Determine which prompt to use
    let chapterPrompt: string;
    let chapterLabel: string;
    
    if (chapter && chapterPrompts[chapter]) {
      chapterPrompt = chapterPrompts[chapter].prompt;
      chapterLabel = chapterPrompts[chapter].label;
    } else {
      // Default to front matter for legacy/full report
      chapterPrompt = chapterPrompts['front'].prompt;
      chapterLabel = "Front Matter";
    }
    
    console.log(`Generating ${chapterLabel}...`);
    
    // 90-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    
    let generatedContent = "";
    
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
              content: `You are an expert academic writer creating a ${pagesCount}-page internship project report for an Indian university student. Write EXTREMELY DETAILED content with formal academic language. Each section must be fully elaborated with multiple paragraphs. Never write brief summaries. Use proper markdown formatting.`
            },
            {
              role: "user",
              content: chapterPrompt
            }
          ],
          max_tokens: 8000,
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
      generatedContent = data.choices[0]?.message?.content || "";
      
      console.log(`API call completed successfully for ${chapterLabel}, content length: ${generatedContent.length}`);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`DeepSeek API call timed out after 90 seconds`);
        throw new Error('AI generation timed out. Please try again.');
      }
      throw fetchError;
    }

    if (!generatedContent) {
      throw new Error("No content generated");
    }

    // For chapter-based generation, return content directly
    if (chapter) {
      console.log(`Chapter ${chapter} generated successfully for user:`, userId);
      return new Response(
        JSON.stringify({
          content: generatedContent,
          chapter: chapter,
          label: chapterLabel,
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate report" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
