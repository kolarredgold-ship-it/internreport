import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const postTypes = [
  "internship_guide",
  "internship_title",
  "download_hook",
  "university_result",
  "career_tips",
];

const universities = [
  "Bengaluru North University", "Bangalore University", "Visvesvaraya Technological University",
  "Mysore University", "Mangalore University", "JNTU Hyderabad", "Osmania University",
  "Anna University", "Mumbai University", "Pune University", "Gujarat University",
  "Delhi University", "Calcutta University", "Madras University", "Kerala University",
  "Andhra University", "Rajasthan University", "Punjab University", "Lucknow University", "Patna University"
];

const domains = [
  "Web Development", "Data Science", "Machine Learning", "Digital Marketing",
  "Content Writing", "Software Testing", "Mobile App Development", "Cloud Computing",
  "Cyber Security", "Business Analytics", "Human Resources", "Finance",
  "Operations Management", "Supply Chain Management", "Sales & Marketing",
  "Accounting", "Banking", "Retail Management", "E-commerce", "UI/UX Design"
];

const categories = [
  "Internship Tips", "Report Writing Guide", "University Guidelines",
  "Career Advice", "Industry Insights", "Technical Guide",
  "Format & Structure", "Examples & Templates", "Commerce & Management", "Sample PDF & Downloads"
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
}

function getPromptForType(postType: string, university: string, domain: string): string {
  switch (postType) {
    case "internship_guide":
      return `Write a detailed SEO-optimized blog post (800-1200 words) about internship report writing for ${domain} students at ${university}. Include practical tips, common mistakes, formatting guidelines, and how to structure each chapter. Use markdown headings (##, ###). The tone should be helpful and student-friendly. Include keywords naturally.`;
    
    case "internship_title":
      return `Write a detailed SEO-optimized blog post (800-1200 words) about a specific internship experience in ${domain}. Create a realistic internship title at a well-known Indian company. Describe what the student learned, daily tasks, skills gained, and how to write a report about this internship. Use markdown headings. Include a "Download Sample Report" call-to-action naturally.`;
    
    case "download_hook":
      return `Write an engaging SEO-optimized blog post (800-1200 words) titled around "Download ${domain} Internship Report PDF - Free Sample for ${university} Students". Focus on what a good internship report looks like, provide an outline, explain each section, and encourage readers to use InternReport.in to generate their reports. Make it highly actionable with a strong CTA.`;
    
    case "university_result":
      return `Write an SEO-optimized blog post (800-1200 words) for ${university} students about preparing internship reports before result season. Cover topics like: when to submit reports, university-specific formatting requirements, last-minute report writing tips, and how AI tools like InternReport.in can help generate reports quickly. Make it timely and urgent.`;
    
    case "career_tips":
      return `Write an SEO-optimized blog post (800-1200 words) about how a ${domain} internship can boost career prospects for students at ${university}. Cover: skills employers look for, how to showcase internship experience, resume tips, and the importance of a well-written internship report. Include practical examples.`;
    
    default:
      return `Write a detailed SEO-optimized blog post (800-1200 words) about internship reports for ${domain} students. Include practical advice and formatting tips.`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse optional count from body
    let postCount = 5;
    try {
      const body = await req.json();
      if (body?.count) postCount = Math.min(body.count, 10);
    } catch { /* default 5 */ }

    const generatedPosts = [];
    const errors = [];

    for (let i = 0; i < postCount; i++) {
      try {
        const postType = postTypes[i % postTypes.length];
        const university = pickRandom(universities);
        const domain = pickRandom(domains);
        const category = pickRandom(categories);
        const prompt = getPromptForType(postType, university, domain);

        console.log(`Generating post ${i + 1}/${postCount}: ${postType} - ${domain} - ${university}`);

        const response = await fetch(DEEPSEEK_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content: `You are an expert SEO blog writer for InternReport.in, an AI-powered internship report generator for Indian university students. Write engaging, informative blog posts that naturally include keywords and drive readers to use InternReport.in. Always respond with a JSON object containing: title (string), excerpt (string, 150-200 chars), content (string, markdown formatted blog content), keywords (array of 5-8 relevant keywords). Do NOT wrap the JSON in markdown code blocks.`
              },
              { role: "user", content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 3000,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`DeepSeek API error for post ${i + 1}:`, errText);
          errors.push(`Post ${i + 1}: API error ${response.status}`);
          continue;
        }

        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (!rawContent) {
          errors.push(`Post ${i + 1}: Empty response`);
          continue;
        }

        // Parse JSON from response (handle potential markdown wrapping)
        let parsed;
        try {
          const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          parsed = JSON.parse(cleaned);
        } catch (parseErr) {
          console.error(`Failed to parse post ${i + 1}:`, rawContent.substring(0, 200));
          errors.push(`Post ${i + 1}: JSON parse error`);
          continue;
        }

        const title = parsed.title || `${domain} Internship Report Guide for ${university}`;
        const timestamp = Date.now();
        const slug = slugify(title) + `-${timestamp}-${i}`;

        const postData = {
          slug,
          title,
          excerpt: parsed.excerpt || title.substring(0, 160),
          content: parsed.content || rawContent,
          category,
          university,
          domain,
          keywords: parsed.keywords || [domain.toLowerCase(), "internship report", university.toLowerCase()],
          read_time: Math.ceil((parsed.content || rawContent).split(/\s+/).length / 200),
          post_type: postType,
          is_published: true,
          published_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase.from("blog_posts").insert(postData);

        if (insertError) {
          console.error(`Insert error for post ${i + 1}:`, insertError);
          errors.push(`Post ${i + 1}: DB insert error - ${insertError.message}`);
          continue;
        }

        generatedPosts.push({ title: postData.title, slug: postData.slug, type: postType });
        console.log(`✅ Generated: ${postData.title}`);

        // Small delay between API calls to avoid rate limiting
        if (i < postCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (postError) {
        console.error(`Error generating post ${i + 1}:`, postError);
        errors.push(`Post ${i + 1}: ${postError instanceof Error ? postError.message : 'Unknown error'}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        generated: generatedPosts.length,
        total_requested: postCount,
        posts: generatedPosts,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-blog-posts error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
