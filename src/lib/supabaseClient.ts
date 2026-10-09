import { createClient } from "@supabase/supabase-js";

const supabaseUrl = ((import.meta.env.VITE_PUBLIC_SUPABASE_URL as string) ?? "").trim();
const supabaseAnonKey = (
  (import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string) ?? ""
).trim();

/** Supabase 설정(URL/키)이 정상적으로 채워졌는지 여부. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * [중요] 클라이언트 생성 "이전"에 저장소에 남은 만료/손상 세션을 청소한다.
 *
 * supabase-js 는 클라이언트를 만들 때 내부적으로 저장된 세션을 복구(_recoverAndRefresh)하는데,
 * 이때 저장된 access token 이 이미 만료돼 있으면 곧바로 refresh token 으로 서버에
 * 토큰 갱신을 시도한다. 그런데 백엔드 주소가 바뀌었거나 프로젝트가 삭제/일시중지된 경우
 * 이 요청이 "Failed to fetch" 로 실패하면서, 라이브러리 내부에서 처리되지 않은
 * promise 거부(unhandled rejection)로 튀어나와 콘솔/모니터링에 계속 잡힌다.
 *
 * 그래서 만료됐거나 파싱 불가능한 옛 세션은 미리 지워서, 클라이언트가 죽은 서버로
 * 갱신 요청을 아예 보내지 않도록 한다. (정상/미만료 세션은 건드리지 않는다)
 */
function purgeExpiredStoredSessions(): void {
  try {
    const nowSec = Date.now() / 1000;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !/^sb-.*-auth-token$/.test(key)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) {
        keysToRemove.push(key);
        continue;
      }
      let expiresAt: number | null = null;
      try {
        const parsed: unknown = JSON.parse(raw);
        const container = parsed as
          | { currentSession?: { expires_at?: unknown }; expires_at?: unknown }
          | null;
        const session = container?.currentSession ?? container;
        const exp = (session as { expires_at?: unknown } | null)?.expires_at;
        if (typeof exp === "number") expiresAt = exp;
      } catch {
        // 파싱 불가 → 손상된 세션으로 간주하고 제거
        keysToRemove.push(key);
        continue;
      }
      // 만료 시각을 알 수 없거나 이미 지난 세션은 제거
      if (expiresAt === null || expiresAt <= nowSec) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // 저장소 접근 불가 시 무시
  }
}

purgeExpiredStoredSessions();

/**
 * 단일 Supabase 클라이언트.
 *
 * 중요: autoRefreshToken 을 false 로 둔다.
 * 라이브러리 내부의 "백그라운드 자동 갱신"은 실패 시 에러를
 * 처리되지 않은 promise 거부(unhandled rejection)로 던지는데, 이 때문에
 * 브라우저에 남은 오래된 refresh token 으로
 * "Invalid Refresh Token: Refresh Token Not Found" 오류가 페이지 로드 시
 * 콘솔/모니터링에 잡힌다. 그래서 내부 타이머는 끄고,
 * 세션 갱신은 우리가 직접(await + try/catch) 관리한다.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: true,
  },
});

/** refresh token 관련 무효화 에러 메시지인지 판별한다. */
export function isInvalidRefreshTokenMessage(message: string): boolean {
  if (!message) return false;
  return /invalid refresh token|refresh token (not found|already used|revoked|invalid|expired)/i.test(
    message,
  );
}

/**
 * 일시적인 네트워크 실패(오프라인, DNS, 연결 끊김)인지 판별한다.
 * 이런 오류는 세션을 지우면 안 되고, 잠시 후 다시 시도해야 한다.
 */
export function isNetworkErrorMessage(message: string): boolean {
  if (!message) return false;
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed|err_internet_disconnected|the internet connection appears to be offline|timeout|aborted/i.test(
    message,
  );
}

/** 로컬 스토리지에 남은 Supabase 세션 토큰을 지운다. */
function removeStaleAuthStorage(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && /^sb-.*-auth-token/.test(key)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // 저장소 접근 불가 시 무시
  }
}

let clearingSession = false;

/** 만료/무효 세션을 정리한다. 네트워크 호출 없이 로컬만 비운다. */
export async function clearStaleAuthSession(): Promise<void> {
  if (clearingSession) return;
  clearingSession = true;
  try {
    removeStaleAuthStorage();
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // 무시
  } finally {
    clearingSession = false;
  }
}

/**
 * 안전망: 혹시 어디선가 refresh token 무효화 거부가 튀어나오면
 * 기본 로깅을 막고 로컬 세션을 정리한다.
 */
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason: unknown = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : String((reason as { message?: string } | null)?.message ?? "");
    if (isInvalidRefreshTokenMessage(message)) {
      event.preventDefault();
      void clearStaleAuthSession();
      return;
    }
    // 일시적 네트워크 실패는 세션을 지우지 않고 조용히 흡수한다.
    // (연결이 돌아오면 온라인 이벤트에서 다시 갱신된다)
    if (isNetworkErrorMessage(message)) {
      event.preventDefault();
    }
  });
}