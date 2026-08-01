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

const ALLOWED_ACTIONS = ["generate-questions", "ask-question", "evaluate"] as const;
const ALLOWED_CATEGORIES = ["course", "language", "role"] as const;

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

    const action = clean(body.action, 40);
    if (!ALLOWED_ACTIONS.includes(action as typeof ALLOWED_ACTIONS[number])) {
      return json(400, { error: "Unsupported action" });
    }

    const category = clean(body.category, 40);
    const subcategory = clean(body.subcategory, 100);
    const topic = clean(body.topic, 200);
    const round = Number.isFinite(Number(body.round)) ? Math.min(Math.max(Math.trunc(Number(body.round)), 1), 50) : 1;
    const question = clean(body.question, 2000);
    const answer = clean(body.answer, 8000);

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) {
      console.error("DEEPSEEK_API_KEY not configured");
      return json(500, { error: "Service temporarily unavailable" });
    }

    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let responseData: any = {};

    if (action === "generate-questions") {
      if (!ALLOWED_CATEGORIES.includes(category as typeof ALLOWED_CATEGORIES[number])) {
        return json(400, { error: "Unsupported category" });
      }
      if (!subcategory) {
        return json(400, { error: "subcategory is required" });
      }

      const prompt = `Generate 10 interview questions for ${subcategory} (category: ${category}).
For each question, provide a clear, concise answer.
Assign difficulty: easy, medium, or hard.
Return ONLY valid JSON array: [{"question":"...","answer":"...","difficulty":"easy|medium|hard"}]`;

      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "You are an interview preparation expert. Return ONLY valid JSON." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }),
      });

      if (!res.ok) {
        console.error("AI API error:", res.status, await res.text());
        return json(502, { error: "Question generation failed, please try again" });
      }
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "[]";

      let questions;
      try {
        const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
        questions = JSON.parse(jsonMatch[1].trim());
      } catch {
        questions = [];
      }
      if (!Array.isArray(questions)) questions = [];

      questions = questions
        .filter((q: any) => q && typeof q.question === "string")
        .slice(0, 10)
        .map((q: any, i: number) => ({ ...q, id: `gen-${i}` }));

      if (questions.length > 0) {
        const rows = questions.map((q: any) => ({
          category,
          subcategory,
          question: clean(q.question, 2000),
          answer: clean(q.answer, 8000),
          difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium",
          tags: [category, subcategory],
        }));
        await supabase.from("question_bank").insert(rows);
      }

      await supabase.from("ai_usage_log").insert({
        user_id: userId, feature: "generate-questions",
        tokens_used: data.usage?.total_tokens || 0, model: "deepseek-chat",
      });

      responseData = { questions };
    } else if (action === "ask-question") {
      if (!topic) return json(400, { error: "topic is required" });

      const prompt = `You are conducting a job interview for the role/topic: ${topic}.
This is round ${round}. Ask ONE clear, professional interview question.
Return ONLY the question text, nothing else.`;

      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "You are a professional interviewer." },
            { role: "user", content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 200,
        }),
      });

      if (!res.ok) {
        console.error("AI API error:", res.status, await res.text());
        return json(502, { error: "Could not fetch a question, please try again" });
      }
      const data = await res.json();

      await supabase.from("ai_usage_log").insert({
        user_id: userId, feature: "mock-interview-question",
        tokens_used: data.usage?.total_tokens || 0, model: "deepseek-chat",
      });

      responseData = { question: data.choices?.[0]?.message?.content?.trim() || "Tell me about yourself." };
    } else if (action === "evaluate") {
      if (!question || !answer) {
        return json(400, { error: "question and answer are required" });
      }

      const prompt = `Evaluate this interview answer.
Topic: ${topic}
Question: ${question}
Candidate's Answer: ${answer}

Provide:
1. Score (1-10)
2. Feedback (2-3 sentences)
3. Improvement suggestions (2-3 bullet points)

Return ONLY valid JSON: {"score":7,"feedback":"...","suggestions":"..."}`;

      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "You are an expert interview evaluator. Return ONLY valid JSON." },
            { role: "user", content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 500,
        }),
      });

      if (!res.ok) {
        console.error("AI API error:", res.status, await res.text());
        return json(502, { error: "Evaluation failed, please try again" });
      }
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "";

      try {
        const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
        responseData = JSON.parse(jsonMatch[1].trim());
      } catch {
        responseData = { score: 5, feedback: raw, suggestions: "Try to be more specific." };
      }

      await supabase.from("ai_usage_log").insert({
        user_id: userId, feature: "mock-interview-evaluate",
        tokens_used: data.usage?.total_tokens || 0, model: "deepseek-chat",
      });
    }

    return json(200, responseData);
  } catch (error) {
    console.error("Error:", error);
    return json(500, { error: "Unexpected error, please try again" });
  }
});
