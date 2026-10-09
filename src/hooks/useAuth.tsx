import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  clearStaleAuthSession,
  isInvalidRefreshTokenMessage,
  supabase,
} from "@/lib/supabaseClient";
import {
  bindAuthRefreshListeners,
  refreshSessionNow,
  syncRefreshSchedule,
} from "@/lib/authSession";

export type MemberStatus = "pending" | "approved" | "rejected" | "expired" | "renew_pending";
export type MemberRole = "member" | "admin";

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: MemberRole;
  status: MemberStatus;
  created_at: string;
  approved_at: string | null;
  expires_at: string | null;
  memo: string | null;
}

export function isExpired(profile: Profile | null): boolean {
  if (!profile || !profile.expires_at) return false;
  return new Date(profile.expires_at).getTime() < Date.now();
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  expired: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      setProfile((data as Profile) ?? null);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setSession(data.session);
        syncRefreshSchedule(data.session);
        // 이미 만료됐거나 곧 만료되는 세션이면 즉시 안전하게 갱신 시도
        if (data.session?.expires_at) {
          const expiresAtMs = data.session.expires_at * 1000;
          if (expiresAtMs - Date.now() < 60_000) {
            void refreshSessionNow();
          }
        }
        setLoading(false);
        if (data.session?.user) {
          void fetchProfile(data.session.user.id);
        }
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : String(err);
        if (isInvalidRefreshTokenMessage(message)) {
          await clearStaleAuthSession();
        }
        if (active) {
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };
    void init();

    bindAuthRefreshListeners();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      syncRefreshSchedule(newSession);
      setSession(newSession);
      if (newSession?.user) {
        void fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) await fetchProfile(data.user.id);
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    syncRefreshSchedule(null);
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const expired = isExpired(profile);
    const isAdmin = profile?.role === "admin";
    const isApproved = isAdmin || (profile?.status === "approved" && !expired);
    return {
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isAdmin,
      isApproved,
      expired,
      refreshProfile,
      signOut,
    };
  }, [session, profile, loading, refreshProfile, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}