import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // anon client ONLY for verifying the caller's token
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "로그인이 필요합니다." }, 401);
    }

    // service-role client for privileged work
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (!profile || profile.role !== "admin") {
      return json({ error: "운영자만 접근할 수 있습니다." }, 403);
    }

    let body: { action?: string; userId?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const action = String(body.action ?? "");

    if (action === "delete") {
      const userId = String(body.userId ?? "");
      if (!userId) return json({ error: "삭제할 회원을 찾을 수 없습니다." }, 400);
      if (userId === userData.user.id) {
        return json({ error: "본인 계정은 삭제할 수 없습니다." }, 400);
      }
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, deleted: 1 });
    }

    return json({ error: "지원하지 않는 요청입니다." }, 400);
  } catch (e) {
    return json({ error: (e as Error).message || "처리 중 오류가 발생했습니다." }, 500);
  }
});
