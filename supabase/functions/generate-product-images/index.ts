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

    const body = await req.json().catch(() => null);
    const productId = body?.productId;
    const title = typeof body?.title === "string" ? body.title.trim().slice(0, 300) : "";

    if (!isUuid(productId) || !title) {
      return json(400, { error: "A valid productId and title are required" });
    }

    // No AI image models are used. Thumbnails come from a royalty-free stock source.
    const stockUrl = `https://picsum.photos/seed/${encodeURIComponent(title)}/800/600`;
    const stockResp = await fetch(stockUrl, { redirect: "follow" });
    if (!stockResp.ok) {
      return json(502, { error: "Could not fetch a thumbnail image" });
    }
    const ext = "jpg";
    const bytes = new Uint8Array(await stockResp.arrayBuffer());


    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, bytes, { contentType: "image/jpeg" });

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
