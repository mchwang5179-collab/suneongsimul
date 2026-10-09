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

interface RenewMember {
  name: string | null;
  email: string | null;
  phone: string | null;
  expires_at: string | null;
}

function toDateLabel(iso: string | null): string {
  if (!iso) return "-";
  return iso.slice(0, 10).replace(/-/g, ".");
}

function buildAdminEmailHtml(member: RenewMember): string {
  const name = member.name || "(이름 없음)";
  const email = member.email || "-";
  const phone = member.phone || "-";
  const expired = toDateLabel(member.expires_at);

  return `<!doctype html>
<html lang="ko">
  <body style="margin:0;padding:0;background:#f4f4f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Malgun Gothic',sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border:1px solid #e6e6e2;border-radius:12px;padding:28px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.04em;color:#9a6a1f;">재가입 신청 알림</p>
        <h1 style="margin:0 0 16px;font-size:20px;font-weight:800;color:#1c1c1a;">재가입(연장) 신청이 접수되었습니다</h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4a4a47;">
          만료된 회원이 재가입(1년 연장)을 신청했습니다. 입금 확인 후 회원 관리 화면에서 재승인해 주세요.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tbody>
            <tr><td style="padding:8px 0;color:#8a8a86;width:96px;">이름</td><td style="padding:8px 0;color:#1c1c1a;font-weight:700;">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#8a8a86;">이메일</td><td style="padding:8px 0;color:#1c1c1a;">${email}</td></tr>
            <tr><td style="padding:8px 0;color:#8a8a86;">연락처</td><td style="padding:8px 0;color:#1c1c1a;">${phone}</td></tr>
            <tr><td style="padding:8px 0;color:#8a8a86;">기존 만료일</td><td style="padding:8px 0;color:#1c1c1a;">${expired}</td></tr>
          </tbody>
        </table>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6a6a67;">재승인 시 승인한 날부터 다시 1년간 이용할 수 있습니다.</p>
      </div>
      <p style="margin:16px 0 0;text-align:center;font-size:11px;color:#a0a09c;">수능 안내방송 시뮬레이터 · 회원 관리 알림</p>
    </div>
  </body>
</html>`;
}

async function notifyAdmins(
  admin: ReturnType<typeof createClient>,
  member: RenewMember,
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromDomain = Deno.env.get("RESEND_FROM_DOMAIN");
  if (!apiKey || !fromDomain) {
    return { sent: false, reason: "email_not_configured" };
  }

  try {
    const { data: admins, error: adminErr } = await admin
      .from("profiles")
      .select("email")
      .eq("role", "admin");
    if (adminErr) return { sent: false, reason: adminErr.message };

    const recipients = (admins ?? [])
      .map((row) => (row as { email: string | null }).email)
      .filter((value): value is string => Boolean(value));
    if (recipients.length === 0) return { sent: false, reason: "no_admin_email" };

    const subject = `[수능 안내방송 시뮬레이터] 재가입 신청 - ${member.name || member.email || "회원"}`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `수능 안내방송 시뮬레이터 <noreply@${fromDomain}>`,
        to: recipients,
        subject,
        html: buildAdminEmailHtml(member),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { sent: false, reason: text || `resend_status_${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: (e as Error).message };
  }
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

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("id, role, status, name, email, phone, expires_at")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (profileErr) return json({ error: profileErr.message }, 400);
    if (!profile) return json({ error: "회원 정보를 찾을 수 없습니다." }, 404);

    if (profile.role === "admin") {
      return json({ error: "운영자는 재가입 신청이 필요하지 않습니다." }, 400);
    }

    if (profile.status === "renew_pending") {
      return json({ ok: true, alreadyRequested: true });
    }

    const expiresAt = profile.expires_at ? new Date(profile.expires_at).getTime() : null;
    const isExpired = expiresAt !== null && expiresAt < Date.now();

    if (!isExpired) {
      return json({ error: "이용 기간이 아직 만료되지 않아 재가입 신청을 할 수 없습니다." }, 400);
    }

    const { error: updateErr } = await admin
      .from("profiles")
      .update({ status: "renew_pending" })
      .eq("id", userData.user.id);
    if (updateErr) return json({ error: updateErr.message }, 400);

    // 신청이 접수된 뒤 운영자에게 이메일 알림 (실패해도 신청은 유지)
    const notify = await notifyAdmins(admin, {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      expires_at: profile.expires_at,
    });

    return json({ ok: true, emailSent: notify.sent, emailReason: notify.reason });
  } catch (e) {
    return json({ error: (e as Error).message || "재가입 신청 처리 중 오류가 발생했습니다." }, 500);
  }
});
