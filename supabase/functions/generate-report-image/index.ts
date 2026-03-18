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
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Generate a professional, realistic photograph suitable for an academic internship report. The image should depict: ${keyword}. Style: Clean, corporate, professional photography. No text or watermarks. High quality, well-lit, modern setting.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          { role: "user", content: prompt }
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI image generation error:", response.status, errText);
      
      // Fallback to picsum if AI image gen fails
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
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (imageUrl && imageUrl.startsWith("data:image")) {
      // Extract base64 from data URL
      const base64Data = imageUrl.split(",")[1];
      return new Response(JSON.stringify({ image: base64Data, source: "ai" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback to picsum if no image returned
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
