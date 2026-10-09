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
    const { email, password, name, phone } = await req.json();

    const cleanEmail = String(email ?? "").trim().toLowerCase();
    const cleanName = String(name ?? "").trim();
    const cleanPhone = String(phone ?? "").trim();

    if (!cleanEmail || !password || !cleanName) {
      return json({ error: "이메일, 비밀번호, 이름은 필수입니다." }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return json({ error: "올바른 이메일 형식이 아닙니다." }, 400);
    }
    if (String(password).length < 6) {
      return json({ error: "비밀번호는 6자 이상이어야 합니다." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password: String(password),
      email_confirm: true,
      user_metadata: { name: cleanName, phone: cleanPhone },
    });

    if (error) {
      const msg = /already|registered|exists/i.test(error.message)
        ? "이미 가입된 이메일입니다."
        : error.message;
      return json({ error: msg }, 400);
    }

    // 새로 만든 계정의 프로필에 이름/연락처를 반영한다.
    // (on_auth_user_created 트리거가 프로필을 만든 뒤라 여기서 안전하게 업데이트한다)
    if (data.user?.id) {
      try {
        await admin
          .from("profiles")
          .update({ name: cleanName, phone: cleanPhone || null })
          .eq("id", data.user.id);
      } catch {
        // 프로필 보완 실패는 가입 자체를 막지 않는다. (운영자가 관리 화면에서 수정 가능)
      }
    }

    return json({ ok: true, userId: data.user?.id ?? null });
  } catch (e) {
    return json({ error: (e as Error).message || "회원가입 처리 중 오류가 발생했습니다." }, 500);
  }
});
