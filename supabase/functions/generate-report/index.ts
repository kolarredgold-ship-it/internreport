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
 
     const maxLength = 500;
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
     const chapter = body.chapter || null;
     const part = body.part || null;
 
     console.log("Input validation passed for user:", userId, "Chapter:", chapter || "Full", "Part:", part || "Full");
 
     // ========== BUSINESS LOGIC ==========
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
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
 Duration: ${internshipDuration}, Year: ${academicYear}
 Topic/Specialization: ${topicSpecialization}
 Target: ${pagesCount} pages total`;
 
     // NEW DETAILED 4-CHAPTER STRUCTURE (as per user requirements)
     const chapterPrompts: Record<string, { prompt: string; label: string }> = {
       'front': {
         label: 'Front Matter',
         prompt: `${baseContext}
 
 Generate the FRONT MATTER for an internship report (1500-2000 words total):
 
 # CERTIFICATE
 (Write a formal certificate - 80-100 words with institutional formatting, signatures placeholders for Principal, HOD, and Guide)
 
 # DECLARATION
 (Write student declaration - 100-120 words with formal legal language stating authenticity)
 
 # ACKNOWLEDGEMENT
 (Write acknowledgement - 150-180 words thanking institution, guide, company supervisors, colleagues, family)
 
# ABSTRACT
(Write abstract - 200-250 words summarizing the internship experience, objectives, methodology, findings)

# EXECUTIVE SUMMARY
(Write executive summary - 300-400 words providing a comprehensive overview of the entire internship report. Include: purpose of the internship, company background briefly, key responsibilities handled, major skills acquired, significant findings, and overall conclusions. This should give readers a complete snapshot of the report without reading the full document. Write in third person, formal academic tone.)

# TABLE OF CONTENTS
(Create a simple, clean table of contents WITHOUT page numbers in this exact format:

Certificate
Declaration
Acknowledgement
Abstract
Executive Summary

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

ANNEXURES)
 
 # LIST OF FIGURES
 (Placeholder list)
 
 # LIST OF TABLES
 (Placeholder list)
 
 # LIST OF ABBREVIATIONS
 (Include 10-15 relevant abbreviations used in the report)
 
 Write clear, professional content with formal academic English. Keep it concise.`
       },
       '1': {
         label: 'Chapter I: Introduction',
         prompt: `${baseContext}
 
Generate CHAPTER I: INTRODUCTION (2500-3500 words total, 5-8 pages equivalent).
 
CRITICAL INSTRUCTION: This chapter focuses ONLY on the internship TOPIC and FIELD OF STUDY. DO NOT mention any company name in this chapter. Focus purely on the subject matter, industry concepts, and academic aspects.

This chapter introduces the topic "${internshipTitle}", provides background information about the topic/field, and outlines the objectives and scope of the study.
 
 # CHAPTER I: INTRODUCTION
 
## 1.1 Background of the Study
(Write 400-500 words - Elaborate extensively on the industry context, historical development of the field related to ${topicSpecialization}, current market scenario, relevance of this study area, importance of internships in bridging academic and professional gaps. DO NOT mention any company name. Focus on the general industry and topic.)
 
## 1.2 Meaning of ${topicSpecialization}
(Write 350-450 words - Define and explain the core concept of ${topicSpecialization}, theoretical framework, key terminologies, evolution of the concept, its application in modern business context. Include definitions from various scholars. NO company references.)
 
## 1.3 Importance of ${topicSpecialization} in the Industry
(Write 350-450 words - Discuss why ${topicSpecialization} is crucial for the industry in general, industry statistics, competitive advantages it provides, current trends and future outlook. Elaborate with examples and data. NO company references - discuss the industry as a whole.)
 
## 1.4 Objectives of the Study
(Write a brief introductory paragraph followed by objectives in bullet format. Format as:
"The objectives of the study are:"
• To study [specific aspect related to ${topicSpecialization}]
• To analyse [specific aspect related to the internship topic]
• To experience [practical learning aspect during the internship]
• To understand [relevant business/industry aspect]
• To evaluate [assessment aspect related to the topic]
• To identify [discovery aspect]
Each objective should be a single clear sentence starting with "To". NO company name in objectives.)
 
## 1.5 Scope of the Study
(Write 250-350 words - Clearly define what is included and excluded, time period of ${internshipDuration}, functional areas covered related to ${topicSpecialization}, limitations of scope. NO company name - focus on the topic scope.)
 
## 1.6 Need and Significance of the Study
(Write 300-400 words - Justify the importance for academia, industry, and personal development. Explain the gap this study fills, contribution to existing knowledge about ${topicSpecialization}, practical relevance. NO company references.)
 
## 1.7 Research Methodology
(Write 250-350 words - Describe research design, data collection methods (primary/secondary), sampling techniques, tools used, observation and analysis techniques. Be comprehensive about the approach. NO company name.)
 
## 1.8 Limitations of the Study
(Write 200-300 words - Honestly discuss constraints faced during the study, time limitations, resource constraints, scope limitations, how they were managed. NO company references.)
 
CRITICAL RULES:
- DO NOT mention any company name anywhere in this chapter
- DO NOT include "(In-Depth)", "(In Deep)", or any similar markers
- Write naturally flowing academic prose
- No asterisks or bold formatting
- Focus purely on the topic/field of study`
       },
       '2': {
         label: 'Chapter II: Description of the Organisation',
         prompt: `${baseContext}
 
 Generate CHAPTER II: DESCRIPTION OF THE ORGANISATION (3000-4000 words total, 8-12 pages equivalent):
 
 This chapter provides a detailed description of ${companyName}, including its history, vision, mission, organizational structure, and the products and services it offers.
 
 # CHAPTER II: DESCRIPTION OF THE ORGANISATION
 
## 2.1 Company Profile
(Write 400-500 words - Comprehensive overview of ${companyName}, founding year, founders, headquarters at ${companyLocation}, nature of business, scale of operations, employee strength, annual turnover if available, key milestones. Provide rich company details.)
 
## 2.2 History of the Organisation
(Write 350-450 words - Detailed chronological development of the company, major events, expansion phases, acquisitions if any, evolution over the years, key turning points. Present as a narrative journey.)
 
## 2.3 Vision and Mission
(Write 300-400 words - State and elaborate on the company's vision statement, mission statement, core values, explain how these guide company operations, alignment with industry goals.)
 
## 2.4 Organizational Structure
(Write 350-450 words - Describe the hierarchy, departments, key positions, reporting structure, describe an organizational chart structure, management levels, decision-making process. Explain how the organization is structured.)
 
## 2.5 Products and Services
(Write 400-500 words - Detailed description of all major products/services offered by ${companyName}, unique selling propositions, product categories, service portfolio, pricing strategy overview, target customer segments. Be specific about offerings.)
 
## 2.6 Market Presence
(Write 300-400 words - Geographical presence, market share, distribution network, customer base, brand positioning, competitive standing in ${companyLocation} and beyond. Discuss market reach and positioning.)
 
## 2.7 Role of ${topicSpecialization} in the Organisation
(Write 400-500 words - Explain how ${topicSpecialization} functions within ${companyName}, its strategic importance, integration with other functions, investment in this area, specific initiatives and campaigns. Connect the topic to organizational strategy.)
 
IMPORTANT: DO NOT include "(In-Depth)", "(In Deep)", or any similar markers in the output. Write naturally flowing academic prose. No asterisks or bold formatting.`
       },
       '3': {
         label: 'Chapter III: Experiential Learning',
         prompt: `${baseContext}
 
 Generate CHAPTER III: EXPERIENTIAL LEARNING (2500-3500 words total, 6-10 pages equivalent):
 
 This chapter describes the intern's practical experience while working at ${companyName}, including tasks undertaken, skills acquired, challenges faced, and lessons learned during ${internshipDuration}.
 
 # CHAPTER III: EXPERIENTIAL LEARNING
 
## 3.1 Internship Overview
(Write 350-450 words - Comprehensive overview of the internship at ${companyName}, ${companyLocation}, role assigned, reporting structure, team members, department placement, initial orientation and training received. Set the context for the experience.)
 
## 3.2 Department Worked
(Write 300-400 words - Detailed description of the specific department/team, its functions, role in the organization, team composition, department objectives, KPIs monitored. Explain the departmental context.)
 
## 3.3 Daily Activities and Tasks Undertaken
(Write 500-600 words - Day-by-day or week-by-week breakdown of activities during ${internshipDuration}, specific tasks assigned, projects contributed to, responsibilities handled, tools and systems used. Provide detailed account of work performed.)
 
## 3.4 Skills and Knowledge Acquired
(Write 450-550 words - Comprehensive discussion of 8-10 technical and soft skills developed:
 - Technical skills related to ${topicSpecialization}
 - Software and tools proficiency
 - Industry-specific knowledge
 - Communication and presentation skills
 - Teamwork and collaboration
 - Problem-solving abilities
 - Time management
 - Professional conduct and workplace ethics)
 
## 3.5 Challenges Faced
(Write 350-450 words - Honest discussion of difficulties encountered, learning curve challenges, adaptation issues, how these were overcome, support received, lessons learned from each challenge. Be reflective and genuine.)
 
IMPORTANT: DO NOT include "(In-Depth)", "(In Deep)", or any similar markers in the output. Write naturally flowing academic prose. No asterisks or bold formatting.`
       },
       '4': {
         label: 'Chapter IV: Internship Outcomes and Conclusion',
         prompt: `${baseContext}
 
 Generate CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION (2500-3500 words total, 6-10 pages equivalent):
 
 This chapter presents the outcomes of the internship, including findings related to ${topicSpecialization}. It includes a conclusion summarizing key points and recommendations for improvement.
 
 # CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION
 
## 4.1 Outcomes of Internship
(Write 350-450 words - Comprehensive summary of what was achieved during the internship, deliverables completed, contributions made to ${companyName}, tangible and intangible outcomes. Highlight achievements.)
 
## 4.2 Findings Related to ${topicSpecialization}
(Write 400-500 words - Present 5-7 major findings from the study, observations about how ${topicSpecialization} operates at ${companyName}, data-backed insights where possible, comparison with industry standards. Be analytical and insightful.)
 
## 4.3 Operational Impact on Business Performance
(Write 350-450 words - Analyze how ${topicSpecialization} impacts business results at ${companyName}, metrics observed, efficiency improvements, customer impact, revenue/cost implications. Connect marketing to business outcomes.)
 
## 4.4 Key Learnings
(Write 300-400 words - Consolidate the most important lessons from the internship, professional growth, personal development, knowledge gained, perspective changes. Be reflective about the learning journey.)
 
## 4.5 Suggestions and Recommendations
(Write 350-450 words - Provide 5-6 actionable recommendations for ${companyName} based on observations, suggest improvements, propose new initiatives, recommendations for future interns. Be constructive and practical.)
 
## 4.6 Conclusion
(Write 350-450 words - Comprehensive summary of the entire internship experience, achievement of stated objectives, personal and professional growth, future career aspirations, acknowledgment of the opportunity. End on a positive note.)
 
IMPORTANT: DO NOT include "(In-Depth)", "(In Deep)", or any similar markers in the output. Write naturally flowing academic prose. No asterisks or bold formatting.`
       },
       '5': {
         label: 'Bibliography & Annexures',
         prompt: `${baseContext}
 
 Generate BIBLIOGRAPHY AND ANNEXURES (800-1200 words total):
 
 # BIBLIOGRAPHY
 
 ## References
(Include 20-25 properly formatted references in APA style. Format each reference on its own line with proper indentation:
 - 6-8 academic journal articles relevant to ${topicSpecialization}
 - 4-5 books/textbooks on the subject
 - 3-4 industry reports and white papers
 - 2-3 brochures/catalogues/company documents
 - 5-6 reputable websites and online resources
 All references should be relevant to the internship topic and industry. Include publications from 2020-2026.)
 
 ---
 
 # ANNEXURES
 
 ## Annexure A: Internship Offer Letter
 (Placeholder for offer letter)
 
 ## Annexure B: Sample Work Documents
 (Placeholder for work samples)
 
 ## Annexure C: Photographs from Internship
 (Placeholder for photos)
 
 ## Annexure D: Weekly/Daily Report Samples
 (Placeholder for progress reports)
 
 ## Annexure E: Internship Completion Certificate
 (Placeholder for certificate)
 
 ## Annexure F: Supervisor Feedback Form
 (Placeholder for supervisor evaluation)
 
 ## Annexure G: Interview Transcripts/Survey Questionnaires (if applicable)
 (Placeholder for research instruments)
 
 ---
 
 **Student Declaration:**
 I, ${studentName} (Register No: ${registerNumber}), hereby declare that this internship project report titled "${internshipTitle}" is based on my genuine work experience at ${companyName}, ${companyLocation}. All data, findings, and information presented are authentic and have been prepared under the guidance of ${guideName}.
 
 I further declare that this report has not been submitted to any other institution for the award of any degree or diploma.
 
 Date: ${academicYear}
 Place: ${companyLocation}
 
 Signature of Student: _______________
 
Write clear, professional content with formal academic English. No markers like "(In-Depth)" in output.`
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
            prompt: `${baseContext}\n\nGenerate ONLY these sections (500-600 words total):\n\n# ABSTRACT\n(Write 200-250 words)\n\n# TABLE OF CONTENTS\n(Create a simple, clean table WITHOUT page numbers - just list: Certificate, Declaration, Acknowledgement, Abstract, CHAPTER I: INTRODUCTION with subsections, CHAPTER II: DESCRIPTION OF THE ORGANISATION with subsections, CHAPTER III: EXPERIENTIAL LEARNING with subsections, CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION with subsections, BIBLIOGRAPHY, ANNEXURES)\n\n# LIST OF FIGURES\n# LIST OF TABLES\n# LIST OF ABBREVIATIONS\n\nWrite clear, professional content.`
         }
       },
       '1': {
         'part1_background': {
           label: 'Chapter I (Background, Meaning)',
            prompt: `${baseContext}\n\n# CHAPTER I: INTRODUCTION (Part 1) - 800-1000 words total\n\n## 1.1 Background of the Study\n(Write 400-500 words on industry context for ${topicSpecialization}. Elaborate extensively.)\n\n## 1.2 Meaning of ${topicSpecialization}\n(Write 350-450 words on definition and theoretical framework. Include scholarly definitions.)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part2_importance': {
           label: 'Chapter I (Importance, Objectives)',
            prompt: `${baseContext}\n\n# CHAPTER I: INTRODUCTION (Part 2) - 700-900 words total\n\n## 1.3 Importance of ${topicSpecialization} in the Industry\n(Write 350-450 words elaborating on industry significance)\n\n## 1.4 Objectives of the Study\n(Write a brief intro then list objectives as bullet points starting with "To study...", "To analyse...", "To experience...", "To understand...", "To evaluate...", "To identify...")\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part3_scope': {
           label: 'Chapter I (Scope, Need, Methodology, Limitations)',
            prompt: `${baseContext}\n\n# CHAPTER I: INTRODUCTION (Part 3) - 900-1100 words total\n\n## 1.5 Scope of the Study\n(Write 250-350 words on boundaries and coverage)\n\n## 1.6 Need and Significance of the Study\n(Write 300-400 words justifying importance)\n\n## 1.7 Research Methodology\n(Write 250-350 words on research approach and data collection)\n\n## 1.8 Limitations of the Study\n(Write 200-300 words on constraints faced)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         }
       },
       '2': {
         'part1_company': {
           label: 'Chapter II (Profile, History, Vision)',
            prompt: `${baseContext}\n\n# CHAPTER II: DESCRIPTION OF THE ORGANISATION (Part 1) - 1000-1200 words total\n\n## 2.1 Company Profile\n(Write 400-500 words on ${companyName} comprehensive overview)\n\n## 2.2 History of the Organisation\n(Write 350-450 words on chronological development)\n\n## 2.3 Vision and Mission\n(Write 300-400 words on company vision, mission, values)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part2_structure': {
           label: 'Chapter II (Structure, Products, Market)',
            prompt: `${baseContext}\n\n# CHAPTER II: DESCRIPTION OF THE ORGANISATION (Part 2) - 1100-1400 words total\n\n## 2.4 Organizational Structure\n(Write 350-450 words on hierarchy and departments)\n\n## 2.5 Products and Services\n(Write 400-500 words on detailed offerings)\n\n## 2.6 Market Presence\n(Write 300-400 words on geographical presence and positioning)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part3_role': {
           label: 'Chapter II (Role of Topic in Organisation)',
            prompt: `${baseContext}\n\n# CHAPTER II: DESCRIPTION OF THE ORGANISATION (Part 3) - 400-500 words total\n\n## 2.7 Role of ${topicSpecialization} in the Organisation\n(Write 400-500 words on strategic importance and initiatives)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         }
       },
       '3': {
         'part1_overview': {
           label: 'Chapter III (Overview, Department)',
            prompt: `${baseContext}\n\n# CHAPTER III: EXPERIENTIAL LEARNING (Part 1) - 700-900 words total\n\n## 3.1 Internship Overview\n(Write 350-450 words on comprehensive internship overview)\n\n## 3.2 Department Worked\n(Write 300-400 words on department details and functions)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part2_activities': {
           label: 'Chapter III (Activities, Skills)',
            prompt: `${baseContext}\n\n# CHAPTER III: EXPERIENTIAL LEARNING (Part 2) - 1000-1200 words total\n\n## 3.3 Daily Activities and Tasks Undertaken\n(Write 500-600 words for ${internshipDuration} with detailed account)\n\n## 3.4 Skills and Knowledge Acquired\n(Write 450-550 words on 8-10 technical and soft skills developed)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part3_challenges': {
           label: 'Chapter III (Challenges)',
            prompt: `${baseContext}\n\n# CHAPTER III: EXPERIENTIAL LEARNING (Part 3) - 350-450 words total\n\n## 3.5 Challenges Faced\n(Write 350-450 words on difficulties encountered and how they were overcome)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         }
       },
       '4': {
         'part1_outcomes': {
           label: 'Chapter IV (Outcomes, Findings)',
            prompt: `${baseContext}\n\n# CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION (Part 1) - 800-1000 words total\n\n## 4.1 Outcomes of Internship\n(Write 350-450 words on achievements and deliverables)\n\n## 4.2 Findings Related to ${topicSpecialization}\n(Write 400-500 words presenting 5-7 major findings)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part2_impact': {
           label: 'Chapter IV (Impact, Learnings)',
            prompt: `${baseContext}\n\n# CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION (Part 2) - 700-900 words total\n\n## 4.3 Operational Impact on Business Performance\n(Write 350-450 words analyzing business impact)\n\n## 4.4 Key Learnings\n(Write 300-400 words on most important lessons)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part3_conclusion': {
           label: 'Chapter IV (Suggestions, Conclusion)',
            prompt: `${baseContext}\n\n# CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION (Part 3) - 700-900 words total\n\n## 4.5 Suggestions and Recommendations\n(Write 350-450 words with 5-6 actionable recommendations)\n\n## 4.6 Conclusion\n(Write 350-450 words summarizing experience and future aspirations)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         }
       },
       '5': {
         'part1_references': {
           label: 'Bibliography',
           prompt: `${baseContext}\n\n# BIBLIOGRAPHY - 600-800 words total\n\n## References\n(Include 20-25 APA style references relevant to ${topicSpecialization}:\n- 6-8 journal articles\n- 4-5 books\n- 3-4 industry reports\n- 2-3 brochures/company documents\n- 5-6 websites)\n\nWrite clear, properly formatted references.`
         },
         'part2_annexures': {
           label: 'Annexures & Declaration',
           prompt: `${baseContext}\n\n# ANNEXURES\n\n## Annexure A: Internship Offer Letter (placeholder)\n## Annexure B: Sample Work Documents (placeholder)\n## Annexure C: Photographs from Internship (placeholder)\n## Annexure D: Weekly Report Samples (placeholder)\n## Annexure E: Internship Completion Certificate (placeholder)\n## Annexure F: Supervisor Feedback Form (placeholder)\n## Annexure G: Interview Transcripts/Survey Questionnaires (placeholder)\n\n---\n\n**Student Declaration:**\nI, ${studentName} (Register No: ${registerNumber}), hereby declare that this internship report titled "${internshipTitle}" is based on my genuine work at ${companyName}, ${companyLocation}. Prepared under guidance of ${guideName}.\n\nDate: ${academicYear}\nPlace: ${companyLocation}\n\nSignature of Student: _______________`
         }
       }
     };
 
     // Determine which prompt to use
     let chapterPrompt: string;
     let chapterLabel: string;
     
     if (chapter && part && partPrompts[chapter]?.[part]) {
       chapterPrompt = partPrompts[chapter][part].prompt;
       chapterLabel = partPrompts[chapter][part].label;
       console.log(`Generating part: ${part} of ${chapter}...`);
     } else if (chapter && chapterPrompts[chapter]) {
       chapterPrompt = chapterPrompts[chapter].prompt;
       chapterLabel = chapterPrompts[chapter].label;
     } else {
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
                content: `You are an expert academic writer creating an internship project report for an Indian university student. Write clear, professional content with formal academic language.

CRITICAL FORMATTING RULES:
1. Each section MUST be comprehensive and deeply elaborated with multiple paragraphs
2. Use ## for section headers only - NO asterisks, bold, or italic formatting
3. DO NOT include "(In-Depth)", "(In Deep)", "In-Depth:", or any similar markers in the output
4. For "Objectives of the Study" section, format as: brief intro sentence followed by bullet points starting with "To study...", "To analyse...", "To experience...", etc.
5. Table of contents should be simple - just section names without page numbers
6. Write naturally flowing academic prose without any instruction markers`
             },
             {
               role: "user",
               content: chapterPrompt
             }
           ],
           max_tokens: 6000,
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

        // Clean up any markers or formatting artifacts from the output
        generatedContent = generatedContent.replace(/\(In-Depth\)/gi, '');
        generatedContent = generatedContent.replace(/\(In Deep\)/gi, '');
        generatedContent = generatedContent.replace(/In-Depth:/gi, '');
        generatedContent = generatedContent.replace(/In Deep:/gi, '');
        generatedContent = generatedContent.replace(/\*\*/g, '');
        generatedContent = generatedContent.replace(/\*/g, '');

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