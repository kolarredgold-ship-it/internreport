import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, category, subcategory, topic, round, question, answer, userId } = await req.json();

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let responseData: any = {};

    if (action === "generate-questions") {
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

      if (!res.ok) throw new Error(`AI API error: ${res.status}`);
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "[]";

      let questions;
      try {
        const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
        questions = JSON.parse(jsonMatch[1].trim());
      } catch {
        questions = [];
      }

      // Add IDs
      questions = questions.map((q: any, i: number) => ({ ...q, id: `gen-${i}` }));

      // Store generated questions in question_bank
      if (questions.length > 0) {
        const rows = questions.map((q: any) => ({
          category,
          subcategory,
          question: q.question,
          answer: q.answer,
          difficulty: q.difficulty || 'medium',
          tags: [category, subcategory],
        }));
        await supabase.from("question_bank").insert(rows);
      }

      if (userId) {
        await supabase.from("ai_usage_log").insert({
          user_id: userId, feature: "generate-questions",
          tokens_used: data.usage?.total_tokens || 0, model: "deepseek-chat",
        });
      }

      responseData = { questions };
    } else if (action === "ask-question") {
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

      if (!res.ok) throw new Error(`AI API error: ${res.status}`);
      const data = await res.json();

      if (userId) {
        await supabase.from("ai_usage_log").insert({
          user_id: userId, feature: "mock-interview-question",
          tokens_used: data.usage?.total_tokens || 0, model: "deepseek-chat",
        });
      }

      responseData = { question: data.choices?.[0]?.message?.content?.trim() || "Tell me about yourself." };
    } else if (action === "evaluate") {
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

      if (!res.ok) throw new Error(`AI API error: ${res.status}`);
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "";

      try {
        const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
        responseData = JSON.parse(jsonMatch[1].trim());
      } catch {
        responseData = { score: 5, feedback: raw, suggestions: "Try to be more specific." };
      }

      if (userId) {
        await supabase.from("ai_usage_log").insert({
          user_id: userId, feature: "mock-interview-evaluate",
          tokens_used: data.usage?.total_tokens || 0, model: "deepseek-chat",
        });
      }
    }

    return new Response(JSON.stringify(responseData), {
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
