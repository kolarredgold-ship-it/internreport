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
    // Part: for generating chapters in smaller sections (e.g., 'part1_background', 'part2_objectives')
    const part = body.part || null;

    console.log("Input validation passed for user:", userId, "Chapter:", chapter || "Full", "Part:", part || "Full");

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

    // Chapter-specific prompts (each optimized for 1500-2000 words output)
    const chapterPrompts: Record<string, { prompt: string; label: string }> = {
      'front': {
        label: 'Front Matter',
        prompt: `${baseContext}

Generate the FRONT MATTER for an internship report (1500-2000 words total):

# CERTIFICATE
(Write a formal certificate - 80-100 words with institutional formatting, signatures placeholders)

# DECLARATION
(Write student declaration - 100-120 words with formal legal language)

# ACKNOWLEDGEMENT
(Write acknowledgement - 150-180 words thanking institution, guide, company supervisors, colleagues, family)

# ABSTRACT
(Write abstract - 200-250 words summarizing the internship experience, objectives, methodology, findings)

# TABLE OF CONTENTS
(List all chapters with section numbers:
- Executive Summary
- Chapter 1: Introduction
- Chapter 2: Description of the Organisation
- Chapter 3: External Learning
- Chapter 4: Internship Outcomes and Conclusion
- Chapter 5: Bibliography)

# LIST OF FIGURES
(Placeholder list)

# LIST OF TABLES
(Placeholder list)

# LIST OF ABBREVIATIONS
(Include 8-10 relevant abbreviations used in the report)

Write clear, professional content with formal academic English. Keep it concise.`
      },
      'exec': {
        label: 'Executive Summary',
        prompt: `${baseContext}

Generate EXECUTIVE SUMMARY (800-1000 words total):

# EXECUTIVE SUMMARY

Write a comprehensive executive summary covering:

## Overview
(Write 200-250 words - brief introduction to the internship, company, and role)

## Key Objectives
(Write 150-200 words - main goals and objectives of the internship)

## Major Learnings
(Write 200-250 words - key skills and knowledge acquired)

## Key Findings and Outcomes
(Write 200-250 words - important discoveries, achievements, and results)

## Conclusion
(Write 100-150 words - summarize the overall value and impact of the internship)

Write clear, professional content with formal academic English.`
      },
      '1': {
        label: 'Chapter 1: Introduction',
        prompt: `${baseContext}

Generate CHAPTER 1: INTRODUCTION (1500-2000 words total):

# CHAPTER 1: INTRODUCTION

## 1.1 Background of the Study
(Write 400-500 words - elaborate on industry context, current trends for ${topicSpecialization}, importance of internships in professional development)

## 1.2 Objectives of the Internship
(Write 300-350 words - list 5-6 specific objectives with brief explanations)

## 1.3 Scope of the Study
(Write 300-350 words - define boundaries, what is included/excluded from this internship report)

## 1.4 Need for the Study
(Write 250-300 words - justify importance with industry relevance, personal and academic benefits)

## 1.5 Research Methodology
(Write 250-300 words - describe approach, data collection methods, observation techniques used)

Write clear, professional content with formal academic English.`
      },
      '2': {
        label: 'Chapter 2: Description of the Organisation',
        prompt: `${baseContext}

Generate CHAPTER 2: DESCRIPTION OF THE ORGANISATION (1500-2000 words total):

# CHAPTER 2: DESCRIPTION OF THE ORGANISATION

## 2.1 Company Overview
(Write 300-350 words - history, founding, headquarters, operations of ${companyName})

## 2.2 Vision, Mission, and Core Values
(Write 200-250 words - company philosophy, goals, guiding principles)

## 2.3 Organizational Structure
(Write 250-300 words - departments, hierarchy, management structure)

## 2.4 Products and Services Portfolio
(Write 300-350 words - description of major offerings, market presence)

## 2.5 Industry Position and Competitors
(Write 250-300 words - market standing, key competitors, competitive advantages)

## 2.6 SWOT Analysis
(Write 250-300 words - strengths, weaknesses, opportunities, threats of the organization)

Write clear, professional content with formal academic English.`
      },
      '3': {
        label: 'Chapter 3: External Learning',
        prompt: `${baseContext}

Generate CHAPTER 3: EXTERNAL LEARNING (1500-2000 words total):

# CHAPTER 3: EXTERNAL LEARNING

## 3.1 Industry Knowledge Gained
(Write 350-400 words - understanding of ${topicSpecialization} industry, market dynamics, trends observed)

## 3.2 Technical Skills Acquired
(Write 350-400 words - list 6-8 technical skills with descriptions and how they were developed)

## 3.3 Soft Skills Developed
(Write 300-350 words - communication, leadership, teamwork, problem-solving with examples)

## 3.4 Professional Competencies
(Write 280-320 words - industry-specific competencies, workplace ethics, professional conduct)

## 3.5 Tools and Technologies Used
(Write 250-300 words - software, tools, systems learned and utilized during internship)

Write clear, professional content with formal academic English.`
      },
      '4': {
        label: 'Chapter 4: Internship Outcomes and Conclusion',
        prompt: `${baseContext}

Generate CHAPTER 4: INTERNSHIP OUTCOMES AND CONCLUSION (1800-2200 words total):

# CHAPTER 4: INTERNSHIP OUTCOMES AND CONCLUSION

## 4.1 Week-wise Activity Log
(Write 400-500 words - week-by-week account of activities during ${internshipDuration})

## 4.2 Key Projects Undertaken
(Write 300-350 words - describe 2-3 major projects with outcomes)

## 4.3 Major Findings and Observations
(Write 300-350 words - present 4-5 major findings with explanations)

## 4.4 Challenges Faced and Solutions
(Write 250-300 words - challenges encountered and how they were overcome)

## 4.5 Recommendations
(Write 250-300 words - 3-4 actionable recommendations for the organization)

## 4.6 Conclusion
(Write 300-350 words - summary of internship experience, achievement of objectives, personal and professional growth, future career aspirations)

Write clear, professional content with formal academic English.`
      },
      '5': {
        label: 'Chapter 5: Bibliography',
        prompt: `${baseContext}

Generate CHAPTER 5: BIBLIOGRAPHY (800-1000 words total):

# CHAPTER 5: BIBLIOGRAPHY

## References
(Include 15-20 properly formatted references in APA style:
- 5-6 academic journal articles relevant to ${topicSpecialization}
- 3-4 books/textbooks on the subject
- 3-4 industry reports and white papers
- 4-5 reputable websites and online resources
All references should be relevant to the internship topic and industry)

# ANNEXURES

## Annexure A: Sample Work Documents
(Placeholder for work samples)

## Annexure B: Photographs from Internship
(Placeholder for photos)

## Annexure C: Internship Completion Certificate
(Placeholder for certificate)

## Annexure D: Weekly Report Samples
(Placeholder for weekly reports)

## Annexure E: Feedback Form
(Placeholder for supervisor feedback)

---

**Student Declaration:**
I, ${studentName}, hereby declare that this internship project report titled "${internshipTitle}" is based on my genuine work experience at ${companyName}, ${companyLocation}. All data and findings presented are authentic and prepared under the guidance of ${guideName}.

Date: ${academicYear}
Place: ${companyLocation}

Write clear, professional content with formal academic English.`
      }
    };

    // Part-specific prompts for generating chapters in smaller sections (for timeout fallback)
    const partPrompts: Record<string, Record<string, { prompt: string; label: string }>> = {
      'front': {
        'part1_certificate': {
          label: 'Front Matter (Certificate, Declaration, Acknowledgement)',
          prompt: `${baseContext}\n\nGenerate ONLY these sections (400-500 words total):\n\n# CERTIFICATE\n(Write 80-100 words)\n\n# DECLARATION\n(Write 100-120 words)\n\n# ACKNOWLEDGEMENT\n(Write 150-180 words)\n\nWrite clear, professional content.`
        },
        'part2_abstract': {
          label: 'Front Matter (Abstract, TOC, Lists)',
          prompt: `${baseContext}\n\nGenerate ONLY these sections (500-600 words total):\n\n# ABSTRACT\n(Write 200-250 words)\n\n# TABLE OF CONTENTS\n(List: Executive Summary, Chapter 1: Introduction, Chapter 2: Description of the Organisation, Chapter 3: External Learning, Chapter 4: Internship Outcomes and Conclusion, Chapter 5: Bibliography)\n\n# LIST OF FIGURES\n# LIST OF TABLES\n# LIST OF ABBREVIATIONS\n\nWrite clear, professional content.`
        }
      },
      'exec': {
        'part1_overview': {
          label: 'Executive Summary (Overview, Objectives)',
          prompt: `${baseContext}\n\n# EXECUTIVE SUMMARY (Part 1) - 400-500 words total\n\n## Overview\n(Write 200-250 words on internship introduction)\n\n## Key Objectives\n(Write 150-200 words on main goals)\n\nWrite clear, professional content.`
        },
        'part2_findings': {
          label: 'Executive Summary (Learnings, Findings)',
          prompt: `${baseContext}\n\n# EXECUTIVE SUMMARY (Part 2) - 400-500 words total\n\n## Major Learnings\n(Write 200-250 words on skills acquired)\n\n## Key Findings and Outcomes\n(Write 200-250 words on results)\n\nWrite clear, professional content.`
        }
      },
      '1': {
        'part1_background': {
          label: 'Chapter 1 (Background, Objectives)',
          prompt: `${baseContext}\n\n# CHAPTER 1: INTRODUCTION (Part 1) - 700-850 words total\n\n## 1.1 Background of the Study\n(Write 400-500 words on industry context for ${topicSpecialization})\n\n## 1.2 Objectives of the Internship\n(Write 300-350 words - list 5-6 objectives)\n\nWrite clear, professional content.`
        },
        'part2_scope': {
          label: 'Chapter 1 (Scope, Need, Methodology)',
          prompt: `${baseContext}\n\n# CHAPTER 1: INTRODUCTION (Part 2) - 800-950 words total\n\n## 1.3 Scope of the Study\n(Write 300-350 words)\n\n## 1.4 Need for the Study\n(Write 250-300 words)\n\n## 1.5 Research Methodology\n(Write 250-300 words)\n\nWrite clear, professional content.`
        }
      },
      '2': {
        'part1_company': {
          label: 'Chapter 2 (Company Overview, Vision)',
          prompt: `${baseContext}\n\n# CHAPTER 2: DESCRIPTION OF THE ORGANISATION (Part 1) - 500-600 words total\n\n## 2.1 Company Overview\n(Write 300-350 words on ${companyName} history and operations)\n\n## 2.2 Vision, Mission, Core Values\n(Write 200-250 words)\n\nWrite clear, professional content.`
        },
        'part2_structure': {
          label: 'Chapter 2 (Structure, Products, SWOT)',
          prompt: `${baseContext}\n\n# CHAPTER 2: DESCRIPTION OF THE ORGANISATION (Part 2) - 800-950 words total\n\n## 2.3 Organizational Structure\n(Write 250-300 words)\n\n## 2.4 Products and Services Portfolio\n(Write 300-350 words)\n\n## 2.5 Industry Position and Competitors\n(Write 250-300 words)\n\n## 2.6 SWOT Analysis\n(Write 250-300 words)\n\nWrite clear, professional content.`
        }
      },
      '3': {
        'part1_industry': {
          label: 'Chapter 3 (Industry Knowledge, Technical Skills)',
          prompt: `${baseContext}\n\n# CHAPTER 3: EXTERNAL LEARNING (Part 1) - 700-800 words total\n\n## 3.1 Industry Knowledge Gained\n(Write 350-400 words on ${topicSpecialization} industry understanding)\n\n## 3.2 Technical Skills Acquired\n(Write 350-400 words on 6-8 technical skills)\n\nWrite clear, professional content.`
        },
        'part2_skills': {
          label: 'Chapter 3 (Soft Skills, Competencies, Tools)',
          prompt: `${baseContext}\n\n# CHAPTER 3: EXTERNAL LEARNING (Part 2) - 830-970 words total\n\n## 3.3 Soft Skills Developed\n(Write 300-350 words)\n\n## 3.4 Professional Competencies\n(Write 280-320 words)\n\n## 3.5 Tools and Technologies Used\n(Write 250-300 words)\n\nWrite clear, professional content.`
        }
      },
      '4': {
        'part1_activities': {
          label: 'Chapter 4 (Weekly Log, Projects, Findings)',
          prompt: `${baseContext}\n\n# CHAPTER 4: INTERNSHIP OUTCOMES AND CONCLUSION (Part 1) - 1000-1200 words total\n\n## 4.1 Week-wise Activity Log\n(Write 400-500 words for ${internshipDuration})\n\n## 4.2 Key Projects Undertaken\n(Write 300-350 words on 2-3 projects)\n\n## 4.3 Major Findings and Observations\n(Write 300-350 words on 4-5 findings)\n\nWrite clear, professional content.`
        },
        'part2_conclusion': {
          label: 'Chapter 4 (Challenges, Recommendations, Conclusion)',
          prompt: `${baseContext}\n\n# CHAPTER 4: INTERNSHIP OUTCOMES AND CONCLUSION (Part 2) - 800-950 words total\n\n## 4.4 Challenges Faced and Solutions\n(Write 250-300 words)\n\n## 4.5 Recommendations\n(Write 250-300 words with 3-4 recommendations)\n\n## 4.6 Conclusion\n(Write 300-350 words on overall experience and growth)\n\nWrite clear, professional content.`
        }
      },
      '5': {
        'part1_references': {
          label: 'Chapter 5 (Bibliography)',
          prompt: `${baseContext}\n\n# CHAPTER 5: BIBLIOGRAPHY - 500-600 words total\n\n## References\n(Include 15-20 APA style references relevant to ${topicSpecialization}:\n- 5-6 journal articles\n- 3-4 books\n- 3-4 industry reports\n- 4-5 websites)\n\nWrite clear, properly formatted references.`
        },
        'part2_annexures': {
          label: 'Chapter 5 (Annexures, Declaration)',
          prompt: `${baseContext}\n\n# ANNEXURES\n\n## Annexure A: Sample Work Documents (placeholder)\n## Annexure B: Photographs from Internship (placeholder)\n## Annexure C: Internship Completion Certificate (placeholder)\n## Annexure D: Weekly Report Samples (placeholder)\n## Annexure E: Feedback Form (placeholder)\n\n---\n\n**Student Declaration:**\nI, ${studentName}, hereby declare that this internship report is based on my genuine work at ${companyName}. Prepared under guidance of ${guideName}.\n\nDate: ${academicYear}\nPlace: ${companyLocation}`
        }
      }
    };

    // Determine which prompt to use
    let chapterPrompt: string;
    let chapterLabel: string;
    
    // Check if we're generating a part of a chapter
    if (chapter && part && partPrompts[chapter]?.[part]) {
      chapterPrompt = partPrompts[chapter][part].prompt;
      chapterLabel = partPrompts[chapter][part].label;
      console.log(`Generating part: ${part} of ${chapter}...`);
    } else if (chapter && chapterPrompts[chapter]) {
      chapterPrompt = chapterPrompts[chapter].prompt;
      chapterLabel = chapterPrompts[chapter].label;
    } else {
      // Default to front matter for legacy/full report
      chapterPrompt = chapterPrompts['front'].prompt;
      chapterLabel = "Front Matter";
    }
    
    console.log(`Generating ${chapterLabel}...`);
    
    // 120-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    
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
              content: `You are an expert academic writer creating an internship project report for an Indian university student. Write clear, professional content with formal academic language. IMPORTANT: Keep each chapter between 1500-2000 words maximum. Be concise but comprehensive. Use proper markdown formatting.`
            },
            {
              role: "user",
              content: chapterPrompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.7,
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
        console.error(`DeepSeek API call timed out after 120 seconds`);
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
