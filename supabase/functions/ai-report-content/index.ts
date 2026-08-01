import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ========== AUTHENTICATION ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "Authentication required" });
    }
    const token = authHeader.slice("Bearer ".length);
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;
    if (claimsError || !userId) {
      return json(401, { error: "Invalid or expired token" });
    }

    // ========== INPUT VALIDATION ==========
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json(400, { error: "Invalid request body" });
    }
    const course = clean(body.course, 200);
    const topic = clean(body.topic, 500);
    const description = clean(body.description, 2000);
    if (!course || !topic) {
      return json(400, { error: "course and topic are required" });
    }

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) {
      console.error("DEEPSEEK_API_KEY not configured");
      return json(500, { error: "Service temporarily unavailable" });
    }

    const prompt = `Generate a professional internship/project report content for:
Course: ${course}
Topic: ${topic}
${description ? `Description: ${description}` : ''}

Generate the following 5 sections in JSON format with keys: abstract, introduction, methodology, results, conclusion.
Each section should be 300-500 words, professional and academic in tone. Include real-world examples, statistics, and industry references.
Make each section comprehensive with multiple well-developed paragraphs.
Return ONLY valid JSON like: {"abstract":"...","introduction":"...","methodology":"...","results":"...","conclusion":"..."}`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
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
      console.error("DeepSeek error:", response.status, errText);
      return json(502, { error: "Content generation failed, please try again" });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    let content;
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
      content = JSON.parse(jsonMatch[1].trim());
    } catch {
      content = { abstract: raw, introduction: "", methodology: "", results: "", conclusion: "" };
    }

    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("ai_usage_log").insert({
      user_id: userId,
      feature: "report-content",
      tokens_used: data.usage?.total_tokens || 0,
      model: "deepseek-chat",
    });

    return json(200, { content });
  } catch (error) {
    console.error("Error:", error);
    return json(500, { error: "Unexpected error, please try again" });
  }
});
