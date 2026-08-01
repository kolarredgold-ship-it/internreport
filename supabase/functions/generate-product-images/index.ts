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

const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    const callerId = claimsData?.claims?.sub;
    if (claimsError || !callerId) {
      return json(401, { error: "Invalid or expired token" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ========== AUTHORIZATION (admin only) ==========
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return json(403, { error: "Admin access required" });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return json(500, { error: "Service temporarily unavailable" });
    }

    const body = await req.json().catch(() => null);
    const productId = body?.productId;
    const title = typeof body?.title === "string" ? body.title.trim().slice(0, 300) : "";

    if (!isUuid(productId) || !title) {
      return json(400, { error: "A valid productId and title are required" });
    }

    // Generate image using Lovable AI
    const prompt = `Create a professional, modern digital product thumbnail/cover image for "${title}". The image should be a clean, vibrant, eye-catching product card design with bold typography showing the product name, use gradient colors, icons related to the product category, and a premium feel. Make it look like a digital marketplace product listing. 4:3 aspect ratio.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return json(429, { error: "Rate limited, please try again later" });
      }
      return json(502, { error: "Image generation failed, please try again" });
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      return json(502, { error: "No image generated" });
    }

    // Extract base64 data and upload to storage
    const base64Match = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!base64Match) {
      return json(502, { error: "Invalid image data received" });
    }

    const ext = base64Match[1];
    const base64 = base64Match[2];
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, bytes, { contentType: `image/${ext}` });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return json(500, { error: "Failed to store generated image" });
    }

    const publicUrl = supabase.storage.from("product-images").getPublicUrl(fileName).data.publicUrl;

    const { error: updateError } = await supabase
      .from("digital_products")
      .update({ image_url: publicUrl })
      .eq("id", productId);

    if (updateError) {
      console.error("Update error:", updateError);
      return json(500, { error: "Failed to update product" });
    }

    return json(200, { success: true, image_url: publicUrl });
  } catch (error) {
    console.error("Error:", error);
    return json(500, { error: "Unexpected error, please try again" });
  }
});
