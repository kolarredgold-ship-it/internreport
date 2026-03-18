import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword, index } = await req.json();

    const GROK_API_KEY = Deno.env.get("GROK_API_KEY");
    if (!GROK_API_KEY) throw new Error("GROK_API_KEY not configured");

    const prompt = `Generate a professional, realistic photograph suitable for an academic internship report. The image should depict: ${keyword}. Style: Clean, corporate, professional photography. No text or watermarks. High quality, well-lit, modern setting.`;

    const response = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-2-image",
        prompt: prompt,
        n: 1,
        response_format: "b64_json",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Grok image generation error:", response.status, errText);

      // Fallback to picsum if Grok fails
      const seed = `${keyword}-${index}`;
      const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}/640/400`;
      const fallbackResp = await fetch(fallbackUrl, { redirect: "follow" });

      if (fallbackResp.ok) {
        const arrayBuffer = await fallbackResp.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        return new Response(JSON.stringify({ image: base64, source: "fallback" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to generate image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const b64Image = data.data?.[0]?.b64_json;

    if (b64Image) {
      return new Response(JSON.stringify({ image: b64Image, source: "grok" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If no b64 image, check for URL format
    const imageUrl = data.data?.[0]?.url;
    if (imageUrl) {
      const imgResp = await fetch(imageUrl);
      if (imgResp.ok) {
        const arrayBuffer = await imgResp.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        return new Response(JSON.stringify({ image: base64, source: "grok" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fallback to picsum
    const seed = `${keyword}-${index}`;
    const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}/640/400`;
    const fallbackResp = await fetch(fallbackUrl, { redirect: "follow" });

    if (fallbackResp.ok) {
      const arrayBuffer = await fallbackResp.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      return new Response(JSON.stringify({ image: base64, source: "fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "No image generated" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
