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
(List all chapters with section numbers)

# LIST OF FIGURES
(Placeholder list)

# LIST OF TABLES
(Placeholder list)

# LIST OF ABBREVIATIONS
(Include 8-10 relevant abbreviations used in the report)

Write clear, professional content with formal academic English. Keep it concise.`
      },
      '1': {
        label: 'Chapter 1: Introduction',
        prompt: `${baseContext}

Generate CHAPTER 1: INTRODUCTION (1500-2000 words total):

# CHAPTER 1: INTRODUCTION

## 1.1 Background of the Study
(Write 300-400 words - elaborate on industry context, current trends for ${topicSpecialization})

## 1.2 Objectives of the Internship
(Write 250-300 words - list 5-6 specific objectives with brief explanations)

## 1.3 Scope of the Study
(Write 250-300 words - define boundaries, what is included/excluded)

## 1.4 Need for the Study
(Write 250-300 words - justify importance with industry relevance)

## 1.5 Research Methodology
(Write 200-250 words - describe approach, data collection methods)

Write clear, professional content with formal academic English.`
      },
      '2': {
        label: 'Chapter 2: Industry & Company Profile',
        prompt: `${baseContext}

Generate CHAPTER 2: INDUSTRY AND COMPANY PROFILE (1500-2000 words total):

# CHAPTER 2: INDUSTRY AND COMPANY PROFILE

## 2.1 Industry Overview
(Write 300-350 words - analysis of ${topicSpecialization} industry, market trends, key players)

## 2.2 About ${companyName}
(Write 250-300 words - company history, operations)

## 2.3 Vision, Mission, and Core Values
(Write 150-180 words - company philosophy, goals)

## 2.4 Products and Services Portfolio
(Write 250-300 words - description of major offerings)

## 2.5 Organizational Structure
(Write 180-220 words - departments, hierarchy)

## 2.6 SWOT Analysis
(Write 250-300 words - strengths, weaknesses, opportunities, threats)

Write clear, professional content with formal academic English.`
      },
      '3': {
        label: 'Chapter 3: Literature Review',
        prompt: `${baseContext}

Generate CHAPTER 3: LITERATURE REVIEW (1500-2000 words total):

# CHAPTER 3: LITERATURE REVIEW

## 3.1 Theoretical Framework
(Write 350-400 words - relevant theories and frameworks for ${topicSpecialization})

## 3.2 Review of Previous Studies
(Write 400-500 words - cite and discuss 6-8 academic studies with key findings)

## 3.3 Industry Best Practices
(Write 250-300 words - current industry standards, benchmarks)

## 3.4 Technological Advancements
(Write 250-300 words - latest technologies in the field)

## 3.5 Research Gap Analysis
(Write 180-220 words - identify gaps this internship addresses)

Write clear, professional content with formal academic English. Include citations in APA format.`
      },
      '4': {
        label: 'Chapter 4: Internship Activities',
        prompt: `${baseContext}

Generate CHAPTER 4: INTERNSHIP ACTIVITIES AND RESPONSIBILITIES (1500-2000 words total):

# CHAPTER 4: INTERNSHIP ACTIVITIES AND RESPONSIBILITIES

## 4.1 Department Overview
(Write 200-250 words - department description, function)

## 4.2 Roles and Responsibilities Assigned
(Write 300-350 words - list of 6-8 duties with descriptions)

## 4.3 Week-wise Activity Log
(Write 400-500 words - week-by-week account for ${internshipDuration})

## 4.4 Projects Undertaken
(Write 300-350 words - describe 2-3 major projects with outcomes)

## 4.5 Tools and Technologies Used
(Write 200-250 words - list software, tools with usage context)

## 4.6 Team Collaboration
(Write 150-200 words - teamwork experiences, communication methods)

Write clear, professional content with formal academic English.`
      },
      '5': {
        label: 'Chapter 5: Technical Learning',
        prompt: `${baseContext}

Generate CHAPTER 5: TECHNICAL LEARNING AND SKILL DEVELOPMENT (1500-2000 words total):

# CHAPTER 5: TECHNICAL LEARNING AND SKILL DEVELOPMENT

## 5.1 Technical Skills Acquired
(Write 350-400 words - list 6-8 technical skills with descriptions)

## 5.2 Soft Skills Developed
(Write 300-350 words - communication, leadership, problem-solving with examples)

## 5.3 Domain Knowledge Enhancement
(Write 300-350 words - specific knowledge about ${topicSpecialization})

## 5.4 Professional Competencies
(Write 280-320 words - industry-specific competencies, workplace ethics)

## 5.5 Certifications and Training
(Write 200-250 words - training programs, workshops attended)

Write clear, professional content with formal academic English.`
      },
      '6': {
        label: 'Chapter 6: Data Analysis & Findings',
        prompt: `${baseContext}

Generate CHAPTER 6: DATA ANALYSIS AND FINDINGS (1500-2000 words total):

# CHAPTER 6: DATA ANALYSIS AND FINDINGS

## 6.1 Data Collection Methodology
(Write 280-320 words - how data was gathered, sources, tools used)

## 6.2 Analysis Framework
(Write 220-260 words - analytical methods, tools used)

## 6.3 Key Findings and Observations
(Write 400-500 words - present 5-6 major findings with explanations)

## 6.4 Comparative Analysis
(Write 280-320 words - compare findings with industry standards)

## 6.5 Interpretation of Results
(Write 280-320 words - explain implications, significance)

Include relevant table/figure placeholders. Write clear, professional content with formal academic English.`
      },
      '7': {
        label: 'Chapter 7: Challenges & Solutions',
        prompt: `${baseContext}

Generate CHAPTER 7: CHALLENGES AND PROBLEM-SOLVING (1500-2000 words total):

# CHAPTER 7: CHALLENGES AND PROBLEM-SOLVING

## 7.1 Technical Challenges Encountered
(Write 350-400 words - 3-4 technical difficulties with context and how addressed)

## 7.2 Organizational Challenges
(Write 280-320 words - workplace, process challenges faced)

## 7.3 Problem-Solving Approaches
(Write 350-400 words - methods and strategies used to overcome challenges)

## 7.4 Lessons Learned
(Write 350-400 words - key takeaways from challenges, contribution to growth)

Write clear, professional content with formal academic English.`
      },
      '8': {
        label: 'Chapter 8: Recommendations',
        prompt: `${baseContext}

Generate CHAPTER 8: SUGGESTIONS AND RECOMMENDATIONS (1500-2000 words total):

# CHAPTER 8: SUGGESTIONS AND RECOMMENDATIONS

## 8.1 Recommendations for ${companyName}
(Write 400-450 words - 4-5 actionable recommendations with justification)

## 8.2 Process Improvement Suggestions
(Write 320-380 words - operational improvements, efficiency enhancements)

## 8.3 Technology Adoption Recommendations
(Write 300-350 words - new technologies that could benefit the organization)

## 8.4 Future Scope and Opportunities
(Write 300-350 words - growth areas, market opportunities)

Write clear, professional content with formal academic English.`
      },
      '9': {
        label: 'Chapter 9: Conclusion & References',
        prompt: `${baseContext}

Generate CHAPTER 9: CONCLUSION and BIBLIOGRAPHY (1500-2000 words total):

# CHAPTER 9: CONCLUSION

## 9.1 Summary of Internship Experience
(Write 280-320 words - summary of the entire internship journey)

## 9.2 Achievement of Objectives
(Write 280-320 words - map achievements to initial objectives)

## 9.3 Personal and Professional Growth
(Write 180-220 words - development during internship)

## 9.4 Future Career Aspirations
(Write 180-220 words - connect learning to career goals)

# BIBLIOGRAPHY
(Include 12-15 properly formatted references in APA style:
- 5 academic journal articles
- 3 books/textbooks
- 3 industry reports
- 4 reputable websites
All relevant to ${topicSpecialization})

# ANNEXURES
## Annexure A: Sample Work Documents (placeholder)
## Annexure B: Photographs from Internship (placeholder)
## Annexure C: Completion Certificate (placeholder)
## Annexure D: Weekly Report Samples (placeholder)
## Annexure E: Feedback Form (placeholder)

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
          prompt: `${baseContext}\n\nGenerate ONLY these sections (500-600 words total):\n\n# ABSTRACT\n(Write 200-250 words)\n\n# TABLE OF CONTENTS\n(List all chapters)\n\n# LIST OF FIGURES\n# LIST OF TABLES\n# LIST OF ABBREVIATIONS\n\nWrite clear, professional content.`
        }
      },
      '1': {
        'part1_background': {
          label: 'Chapter 1 (Background, Objectives)',
          prompt: `${baseContext}\n\n# CHAPTER 1: INTRODUCTION (Part 1) - 600-700 words total\n\n## 1.1 Background of the Study\n(Write 300-400 words on industry context for ${topicSpecialization})\n\n## 1.2 Objectives of the Internship\n(Write 250-300 words - list 5-6 objectives)\n\nWrite clear, professional content.`
        },
        'part2_objectives': {
          label: 'Chapter 1 (Scope, Need, Methodology)',
          prompt: `${baseContext}\n\n# CHAPTER 1: INTRODUCTION (Part 2) - 700-850 words total\n\n## 1.3 Scope of the Study\n(Write 250-300 words)\n\n## 1.4 Need for the Study\n(Write 250-300 words)\n\n## 1.5 Research Methodology\n(Write 200-250 words)\n\nWrite clear, professional content.`
        }
      },
      '2': {
        'part1_industry': {
          label: 'Chapter 2 (Industry Overview)',
          prompt: `${baseContext}\n\n# CHAPTER 2: INDUSTRY AND COMPANY PROFILE (Part 1) - 550-650 words total\n\n## 2.1 Industry Overview\n(Write 300-350 words on ${topicSpecialization} industry)\n\n## 2.2 About ${companyName}\n(Write 250-300 words on company history)\n\nWrite clear, professional content.`
        },
        'part2_company': {
          label: 'Chapter 2 (Company Details, SWOT)',
          prompt: `${baseContext}\n\n# CHAPTER 2: INDUSTRY AND COMPANY PROFILE (Part 2) - 830-1000 words total\n\n## 2.3 Vision, Mission, Core Values\n(Write 150-180 words)\n\n## 2.4 Products and Services\n(Write 250-300 words)\n\n## 2.5 Organizational Structure\n(Write 180-220 words)\n\n## 2.6 SWOT Analysis\n(Write 250-300 words)\n\nWrite clear, professional content.`
        }
      },
      '3': {
        'part1_theory': {
          label: 'Chapter 3 (Theoretical Framework)',
          prompt: `${baseContext}\n\n# CHAPTER 3: LITERATURE REVIEW (Part 1) - 750-900 words total\n\n## 3.1 Theoretical Framework\n(Write 350-400 words on theories for ${topicSpecialization})\n\n## 3.2 Review of Previous Studies\n(Write 400-500 words, cite 6-8 studies)\n\nWrite clear, professional content with citations.`
        },
        'part2_review': {
          label: 'Chapter 3 (Best Practices, Research Gap)',
          prompt: `${baseContext}\n\n# CHAPTER 3: LITERATURE REVIEW (Part 2) - 680-820 words total\n\n## 3.3 Industry Best Practices\n(Write 250-300 words)\n\n## 3.4 Technological Advancements\n(Write 250-300 words)\n\n## 3.5 Research Gap Analysis\n(Write 180-220 words)\n\nWrite clear, professional content.`
        }
      },
      '4': {
        'part1_activities': {
          label: 'Chapter 4 (Department, Roles, Weekly Log)',
          prompt: `${baseContext}\n\n# CHAPTER 4: INTERNSHIP ACTIVITIES (Part 1) - 900-1100 words total\n\n## 4.1 Department Overview\n(Write 200-250 words)\n\n## 4.2 Roles and Responsibilities\n(Write 300-350 words on 6-8 duties)\n\n## 4.3 Week-wise Activity Log\n(Write 400-500 words for ${internshipDuration})\n\nWrite clear, professional content.`
        },
        'part2_projects': {
          label: 'Chapter 4 (Projects, Tools, Team)',
          prompt: `${baseContext}\n\n# CHAPTER 4: INTERNSHIP ACTIVITIES (Part 2) - 650-800 words total\n\n## 4.4 Projects Undertaken\n(Write 300-350 words on 2-3 projects)\n\n## 4.5 Tools and Technologies Used\n(Write 200-250 words)\n\n## 4.6 Team Collaboration\n(Write 150-200 words)\n\nWrite clear, professional content.`
        }
      },
      '5': {
        'part1_technical': {
          label: 'Chapter 5 (Technical Skills)',
          prompt: `${baseContext}\n\n# CHAPTER 5: TECHNICAL LEARNING (Part 1) - 650-750 words total\n\n## 5.1 Technical Skills Acquired\n(Write 350-400 words on 6-8 skills)\n\n## 5.2 Soft Skills Developed\n(Write 300-350 words)\n\nWrite clear, professional content.`
        },
        'part2_soft': {
          label: 'Chapter 5 (Domain Knowledge, Certifications)',
          prompt: `${baseContext}\n\n# CHAPTER 5: TECHNICAL LEARNING (Part 2) - 780-920 words total\n\n## 5.3 Domain Knowledge Enhancement\n(Write 300-350 words on ${topicSpecialization})\n\n## 5.4 Professional Competencies\n(Write 280-320 words)\n\n## 5.5 Certifications and Training\n(Write 200-250 words)\n\nWrite clear, professional content.`
        }
      },
      '6': {
        'part1_methodology': {
          label: 'Chapter 6 (Methodology, Framework)',
          prompt: `${baseContext}\n\n# CHAPTER 6: DATA ANALYSIS (Part 1) - 500-580 words total\n\n## 6.1 Data Collection Methodology\n(Write 280-320 words)\n\n## 6.2 Analysis Framework\n(Write 220-260 words)\n\nWrite clear, professional content.`
        },
        'part2_findings': {
          label: 'Chapter 6 (Findings, Analysis)',
          prompt: `${baseContext}\n\n# CHAPTER 6: DATA ANALYSIS (Part 2) - 960-1140 words total\n\n## 6.3 Key Findings and Observations\n(Write 400-500 words with 5-6 findings)\n\n## 6.4 Comparative Analysis\n(Write 280-320 words)\n\n## 6.5 Interpretation of Results\n(Write 280-320 words)\n\nWrite clear, professional content.`
        }
      },
      '7': {
        'part1_challenges': {
          label: 'Chapter 7 (Challenges)',
          prompt: `${baseContext}\n\n# CHAPTER 7: CHALLENGES (Part 1) - 630-720 words total\n\n## 7.1 Technical Challenges Encountered\n(Write 350-400 words on 3-4 difficulties)\n\n## 7.2 Organizational Challenges\n(Write 280-320 words)\n\nWrite clear, professional content.`
        },
        'part2_solutions': {
          label: 'Chapter 7 (Problem-Solving, Lessons)',
          prompt: `${baseContext}\n\n# CHAPTER 7: CHALLENGES (Part 2) - 700-800 words total\n\n## 7.3 Problem-Solving Approaches\n(Write 350-400 words)\n\n## 7.4 Lessons Learned\n(Write 350-400 words)\n\nWrite clear, professional content.`
        }
      },
      '8': {
        'part1_recommendations': {
          label: 'Chapter 8 (Company Recommendations)',
          prompt: `${baseContext}\n\n# CHAPTER 8: RECOMMENDATIONS (Part 1) - 720-830 words total\n\n## 8.1 Recommendations for ${companyName}\n(Write 400-450 words with 4-5 recommendations)\n\n## 8.2 Process Improvement Suggestions\n(Write 320-380 words)\n\nWrite clear, professional content.`
        },
        'part2_future': {
          label: 'Chapter 8 (Technology, Future Scope)',
          prompt: `${baseContext}\n\n# CHAPTER 8: RECOMMENDATIONS (Part 2) - 600-700 words total\n\n## 8.3 Technology Adoption Recommendations\n(Write 300-350 words)\n\n## 8.4 Future Scope and Opportunities\n(Write 300-350 words)\n\nWrite clear, professional content.`
        }
      },
      '9': {
        'part1_conclusion': {
          label: 'Chapter 9 (Conclusion)',
          prompt: `${baseContext}\n\n# CHAPTER 9: CONCLUSION (Part 1) - 920-1080 words total\n\n## 9.1 Summary of Internship Experience\n(Write 280-320 words)\n\n## 9.2 Achievement of Objectives\n(Write 280-320 words)\n\n## 9.3 Personal and Professional Growth\n(Write 180-220 words)\n\n## 9.4 Future Career Aspirations\n(Write 180-220 words)\n\nWrite clear, professional content.`
        },
        'part2_references': {
          label: 'Chapter 9 (Bibliography, Annexures)',
          prompt: `${baseContext}\n\n# BIBLIOGRAPHY\n(Include 12-15 APA style references relevant to ${topicSpecialization})\n\n# ANNEXURES\n## Annexure A: Sample Work Documents (placeholder)\n## Annexure B: Photographs (placeholder)\n## Annexure C: Completion Certificate (placeholder)\n## Annexure D: Weekly Reports (placeholder)\n## Annexure E: Feedback Form (placeholder)\n\nWrite clear, professional content.`
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
          model: "deepseek-reasoner",
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
