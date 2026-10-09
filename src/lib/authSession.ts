import type { Session } from "@supabase/supabase-js";
import {
  clearStaleAuthSession,
  isInvalidRefreshTokenMessage,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabaseClient";

/**
 * 직접 관리하는 세션 갱신 관리자.
 *
 * 라이브러리의 autoRefreshToken 을 끈 대신, 만료 60초 전에 미리
 * refreshSession() 을 호출한다. 모든 호출은 await + try/catch 로 감싸서
 * "Invalid Refresh Token" 같은 거부가 처리되지 않은 채로 새어 나가지 않도록 한다.
 *
 * 네트워크가 잠깐 끊긴 상황에서 갱신을 반복 호출하면 "Failed to fetch" 오류가
 * 콘솔/모니터링에 계속 쌓이므로, 짧은 간격의 중복 시도를 막고(스로틀)
 * 실패가 이어지면 재시도 간격을 지수적으로 늘려(백오프) 요청 폭주를 방지한다.
 */

const REFRESH_LEAD_MS = 60_000;
const MIN_DELAY_MS = 10_000;
const NETWORK_RETRY_MS = 30_000;
const MAX_RETRY_MS = 5 * 60_000;
const MIN_ATTEMPT_INTERVAL_MS = 5_000;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let refreshing = false;
let hasSession = false;
let listenersBound = false;
let lastAttemptAt = 0;
let networkFailureStreak = 0;

function clearTimer(): void {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function scheduleAt(expiresAtSeconds?: number | null): void {
  clearTimer();
  if (!expiresAtSeconds) return;
  const expiresAtMs = expiresAtSeconds * 1000;
  const delay = Math.max(expiresAtMs - Date.now() - REFRESH_LEAD_MS, MIN_DELAY_MS);
  refreshTimer = setTimeout(() => {
    void refreshSessionNow();
  }, delay);
}

/** 네트워크 실패가 이어질수록 재시도 간격을 늘린다 (30s → 60s → … 최대 5분). */
function backoffDelay(): number {
  const factor = 2 ** Math.max(networkFailureStreak - 1, 0);
  return Math.min(NETWORK_RETRY_MS * factor, MAX_RETRY_MS);
}

/** 네트워크 실패 등으로 갱신을 못 했을 때 잠시 후 다시 시도하도록 예약한다. */
function scheduleRetry(delayMs: number): void {
  clearTimer();
  refreshTimer = setTimeout(() => {
    void refreshSessionNow();
  }, delayMs);
}

/** 세션을 즉시 갱신한다. 실패해도 절대 밖으로 던지지 않는다. */
export async function refreshSessionNow(force = false): Promise<void> {
  if (!hasSession || refreshing) return;
  if (!isSupabaseConfigured) return;
  // 짧은 시간 내 중복 호출(포커스/가시성 이벤트 폭주 등)을 막는다.
  if (!force && Date.now() - lastAttemptAt < MIN_ATTEMPT_INTERVAL_MS) return;
  // 오프라인이면 시도하지 않는다. 연결이 돌아오면 online 이벤트가 갱신한다.
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    scheduleRetry(backoffDelay());
    return;
  }
  lastAttemptAt = Date.now();
  refreshing = true;
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      if (isInvalidRefreshTokenMessage(error.message)) {
        await clearStaleAuthSession();
        return;
      }
      // 네트워크/일시적 실패로 간주하고 백오프 후 재시도.
      networkFailureStreak += 1;
      scheduleRetry(backoffDelay());
      return;
    }
    networkFailureStreak = 0;
    scheduleAt(data.session?.expires_at);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isInvalidRefreshTokenMessage(message)) {
      await clearStaleAuthSession();
    } else {
      networkFailureStreak += 1;
      scheduleRetry(backoffDelay());
    }
  } finally {
    refreshing = false;
  }
}

/** 현재 세션에 맞춰 갱신 예약을 다시 잡는다. */
export function syncRefreshSchedule(session: Session | null): void {
  hasSession = Boolean(session);
  if (!session) {
    clearTimer();
    return;
  }
  networkFailureStreak = 0;
  scheduleAt(session.expires_at);
}

/** 창 포커스/탭 복귀 시 세션이 살아있도록 갱신한다. (한 번만 등록) */
export function bindAuthRefreshListeners(): void {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;

  window.addEventListener("focus", () => {
    void refreshSessionNow();
  });

  // 네트워크가 돌아오면 즉시 세션 갱신을 다시 시도한다.
  window.addEventListener("online", () => {
    networkFailureStreak = 0;
    void refreshSessionNow(true);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void refreshSessionNow();
    }
  });
}