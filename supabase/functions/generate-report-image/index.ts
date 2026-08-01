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

async function picsumFallback(keyword: string, index: number) {
  const seed = `${keyword}-${index}`;
  const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}/640/400`;
  const fallbackResp = await fetch(fallbackUrl, { redirect: "follow" });
  if (!fallbackResp.ok) return null;
  const arrayBuffer = await fallbackResp.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== AUTHENTICATION ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "Authentication required" });
    }
    const token = authHeader.slice("Bearer ".length);
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return json(401, { error: "Invalid or expired token" });
    }

    // ========== INPUT VALIDATION ==========
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json(400, { error: "Invalid request body" });
    }
    const keyword = typeof body.keyword === "string" ? body.keyword.trim().slice(0, 300) : "";
    const index = Number.isFinite(Number(body.index)) ? Math.trunc(Number(body.index)) : 0;
    if (!keyword) {
      return json(400, { error: "keyword is required" });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
      return json(500, { error: "Service temporarily unavailable" });
    }

    const prompt = `Generate a professional, realistic photograph suitable for an academic internship report. The image should depict: ${keyword}. Style: Clean, corporate, professional photography. No text or watermarks. High quality, well-lit, modern setting.`;

    const model = "gemini-2.5-flash-image";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini image error:", response.status, errText);
      const fallback = await picsumFallback(keyword, index);
      if (fallback) {
        return json(200, { image: fallback, source: "fallback" });
      }
      return json(500, { error: "Failed to generate image" });
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find((p: any) => p?.inlineData?.data || p?.inline_data?.data);
    const b64Image = imgPart?.inlineData?.data || imgPart?.inline_data?.data;

    if (b64Image) {
      return json(200, { image: b64Image, source: "gemini" });
    }

    const fallback = await picsumFallback(keyword, index);
    if (fallback) {
      return json(200, { image: fallback, source: "fallback" });
    }

    return json(500, { error: "No image generated" });
  } catch (error) {
    console.error("Image generation error:", error);
    return json(500, { error: "Unexpected error, please try again" });
  }
});
