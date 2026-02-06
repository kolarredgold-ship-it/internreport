import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("admin-update-password: request received", {
      method: req.method,
      hasAuthHeader: !!req.headers.get("Authorization"),
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "Unauthorized" });
    }

    const token = authHeader.slice("Bearer ".length);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error("admin-update-password: missing env vars");
      return json(500, { error: "Server misconfigured" });
    }

    // Verify JWT with signing keys (works with verify_jwt=false)
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("admin-update-password: invalid token", claimsError?.message);
      return json(401, { error: "Unauthorized" });
    }

    const requesterUserId = claimsData.claims.sub;

    // Service client for privileged ops (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Check admin role directly (has_role uses auth.uid() which is null in edge functions)
    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.error("admin-update-password: role check error", roleError.message);
      return json(500, { error: "Failed to verify admin role" });
    }

    if (!roleData) {
      console.log("admin-update-password: user is not admin", { requesterUserId });
      return json(403, { error: "Admin access required" });
    }

    const body = await req.json().catch(() => null) as null | {
      userId?: unknown;
      newPassword?: unknown;
    };

    const userId = body?.userId;
    const newPassword = body?.newPassword;

    if (!isUuid(userId)) {
      return json(400, { error: "Valid userId (uuid) is required" });
    }

    if (typeof newPassword !== "string") {
      return json(400, { error: "newPassword is required" });
    }

    const password = newPassword.trim();
    if (password.length < 6) {
      return json(400, { error: "Password must be at least 6 characters" });
    }
    if (password.length > 72) {
      return json(400, { error: "Password must be less than 72 characters" });
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password,
    });

    if (updateError) {
      console.error("admin-update-password: update error", updateError.message);
      return json(400, { error: updateError.message });
    }

    console.log("admin-update-password: password updated", { targetUserId: userId });
    return json(200, { success: true });
  } catch (error) {
    console.error("admin-update-password: unexpected error", error);
    return json(500, { error: "Internal server error" });
  }
});

