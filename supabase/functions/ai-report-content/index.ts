import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { course, topic, description, userId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Generate a professional internship/project report content for:
Course: ${course}
Topic: ${topic}
${description ? `Description: ${description}` : ''}

Generate the following 5 sections in JSON format with keys: abstract, introduction, methodology, results, conclusion.
Each section should be 300-500 words, professional and academic in tone. Include real-world examples, statistics, and industry references.
Make each section comprehensive with multiple well-developed paragraphs.
Return ONLY valid JSON like: {"abstract":"...","introduction":"...","methodology":"...","results":"...","conclusion":"..."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an academic report writing assistant. Return ONLY valid JSON. Write comprehensive, elaborate content with real examples and data." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
      if (response.status === 402) throw new Error("AI credits exhausted. Please contact support.");
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code blocks)
    let content;
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
      content = JSON.parse(jsonMatch[1].trim());
    } catch {
      content = { abstract: raw, introduction: "", methodology: "", results: "", conclusion: "" };
    }

    // Log usage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (userId) {
      await supabase.from("ai_usage_log").insert({
        user_id: userId,
        feature: "report-content",
        tokens_used: data.usage?.total_tokens || 0,
        model: "gemini-3-flash-preview",
      });
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
