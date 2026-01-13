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
    const {
      userId,
      studentName,
      registerNumber,
      course,
      collegeName,
      university,
      guideName,
      internshipTitle,
      companyName,
      companyLocation,
      internshipDuration,
      academicYear,
      topicSpecialization,
      pagesCount,
    } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check generation limit
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("generations_used")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      throw new Error("Failed to fetch user profile");
    }

    if (profile.generations_used >= 3) {
      return new Response(
        JSON.stringify({ error: "Generation limit reached. Please top up." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate report using Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("Lovable API key not configured");
    }

    const prompt = `You are an expert academic report writer specializing in Indian university internship project reports. Generate a comprehensive internship project report with the following details:

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

Target Pages: ${pagesCount} pages

Generate a detailed, exam-ready internship project report following the Indian university format. Include these sections:

# CERTIFICATE
(Write a formal certificate with proper formatting)

# DECLARATION
(Student declaration statement)

# ACKNOWLEDGEMENT
(Professional acknowledgment section)

# TABLE OF CONTENTS

# CHAPTER 1: INTRODUCTION
## 1.1 Background of the Study
## 1.2 Objectives of the Internship
## 1.3 Scope of the Study
## 1.4 Need for the Study

# CHAPTER 2: COMPANY PROFILE
## 2.1 About ${companyName}
## 2.2 Vision and Mission
## 2.3 Products/Services
## 2.4 Organizational Structure

# CHAPTER 3: LITERATURE REVIEW
## 3.1 Theoretical Background
## 3.2 Previous Studies
## 3.3 Industry Trends

# CHAPTER 4: INTERNSHIP ACTIVITIES
## 4.1 Roles and Responsibilities
## 4.2 Daily Activities
## 4.3 Projects Undertaken
## 4.4 Skills Applied

# CHAPTER 5: LEARNING OUTCOMES
## 5.1 Technical Skills Gained
## 5.2 Soft Skills Developed
## 5.3 Industry Exposure
## 5.4 Practical Applications

# CHAPTER 6: FINDINGS AND ANALYSIS
## 6.1 Key Observations
## 6.2 Analysis of Work Done
## 6.3 Challenges Faced
## 6.4 Solutions Implemented

# CHAPTER 7: SUGGESTIONS AND RECOMMENDATIONS
## 7.1 Recommendations for the Company
## 7.2 Areas for Improvement
## 7.3 Future Scope

# CHAPTER 8: CONCLUSION
## 8.1 Summary
## 8.2 Learning Summary
## 8.3 Future Aspirations

# BIBLIOGRAPHY
(Include relevant academic references)

# ANNEXURES
(Any additional materials)

Write in formal academic English suitable for Indian university evaluation. Be detailed and thorough. Each section should be well-developed with proper paragraphs. The content must be unique, plagiarism-free, and human-like in writing style. Focus on the topic: ${topicSpecialization}`;

    console.log("Calling Lovable AI Gateway...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert academic writer who creates professional internship project reports for Indian university students. Your reports follow university-prescribed formats, use formal academic language, and are exam-ready. Each report you generate is unique and plagiarism-free."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 8000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("AI response received successfully");
    
    const generatedContent = data.choices[0]?.message?.content;

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

    // Update generations count
    const newCount = profile.generations_used + 1;
    await supabase
      .from("profiles")
      .update({ generations_used: newCount })
      .eq("user_id", userId);

    console.log("Report generated and saved successfully");

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
