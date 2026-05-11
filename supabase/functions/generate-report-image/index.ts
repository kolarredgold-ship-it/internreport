import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { keyword, index } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

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
        return new Response(JSON.stringify({ image: fallback, source: "fallback" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to generate image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find((p: any) => p?.inlineData?.data || p?.inline_data?.data);
    const b64Image = imgPart?.inlineData?.data || imgPart?.inline_data?.data;

    if (b64Image) {
      return new Response(JSON.stringify({ image: b64Image, source: "gemini" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fallback = await picsumFallback(keyword, index);
    if (fallback) {
      return new Response(JSON.stringify({ image: fallback, source: "fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "No image generated" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
