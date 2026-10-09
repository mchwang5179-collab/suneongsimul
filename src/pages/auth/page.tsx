import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import PageLoader from "@/components/feature/PageLoader";
import LoginForm from "@/pages/auth/components/LoginForm";
import SignupForm from "@/pages/auth/components/SignupForm";

type AuthTab = "login" | "signup";

export default function AuthPage() {
  const [tab, setTab] = useState<AuthTab>("login");
  const { session, isApproved, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (session) navigate(isApproved ? "/" : "/pending");
  }, [loading, session, isApproved, navigate]);

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-background-100 font-body">
      <div className="mx-auto grid min-h-screen w-full max-w-[1200px] grid-cols-1 gap-0 lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden overflow-hidden lg:block">
          <img
            src="https://readdy.ai/api/search-image?query=calm%20minimalist%20study%20desk%20with%20warm%20cream%20tones%2C%20open%20notebook%20and%20pen%2C%20soft%20morning%20light%2C%20muted%20beige%20and%20olive%20palette%2C%20editorial%20photography%2C%20quiet%20and%20focused%20mood%2C%20clean%20composition&width=900&height=1200&seq=csat-auth-hero-01&orientation=portrait"
            alt="수능 안내방송 시뮬레이터 회원 안내"
            title="수능 안내방송 시뮬레이터 회원 안내"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/35 to-black/60"></div>
          <div className="relative flex h-full flex-col justify-between p-10 text-background-50">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-500 text-background-50 dark:text-foreground-950">
                <i className="ri-megaphone-fill text-xl" aria-hidden="true"></i>
              </span>
              <span className="font-heading text-lg font-bold">수능 안내방송 시뮬레이터</span>
            </div>
            <div>
              <h2 className="font-heading text-3xl font-bold leading-snug">
                2027년 전 · 2028년 이후
                <br />
                수능 안내방송을 그대로 재현
              </h2>
              <ul className="mt-6 space-y-3 text-sm text-background-50/90">
                <li className="flex items-center gap-2">
                  <i className="ri-checkbox-circle-fill text-primary-300" aria-hidden="true"></i>
                  실제 시험장 안내방송 순서와 멘트 재현
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-checkbox-circle-fill text-primary-300" aria-hidden="true"></i>
                  두 가지 수능 시간표 버전 전환 재생
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-checkbox-circle-fill text-primary-300" aria-hidden="true"></i>
                  가입비 5,000원 · 1년 이용
                </li>
              </ul>
            </div>
            <p className="text-xs text-background-50/70">
              회원가입 후 입금 확인을 거쳐 운영자 승인 시 이용할 수 있습니다.
            </p>
          </div>
        </aside>

        <main className="flex items-center justify-center px-4 py-10 md:px-8">
          <div className="w-full max-w-[460px]">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-500 text-background-50 dark:text-foreground-950">
                <i className="ri-megaphone-fill text-lg" aria-hidden="true"></i>
              </span>
              <span className="font-heading text-base font-bold text-foreground-950">
                수능 안내방송 시뮬레이터
              </span>
            </div>

            <div className="rounded-lg border border-background-200 bg-background-50 p-5 md:p-7">
              <h1 className="font-heading text-xl font-bold text-foreground-950 md:text-2xl">
                {tab === "login" ? "로그인" : "회원가입"}
              </h1>
              <p className="mt-1 text-sm text-foreground-600">
                {tab === "login"
                  ? "가입한 이메일과 비밀번호로 로그인해 주세요."
                  : "가입비 입금 후 운영자 승인을 거쳐 이용할 수 있습니다."}
              </p>

              <div className="mt-5 inline-flex items-center gap-1 rounded-full border border-background-200 bg-background-100 p-1">
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  aria-pressed={tab === "login"}
                  className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    tab === "login"
                      ? "bg-primary-500 text-background-50 dark:text-foreground-950"
                      : "text-foreground-700 hover:bg-background-200/70"
                  }`}
                >
                  <i className="ri-login-box-line" aria-hidden="true"></i>
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => setTab("signup")}
                  aria-pressed={tab === "signup"}
                  className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    tab === "signup"
                      ? "bg-primary-500 text-background-50 dark:text-foreground-950"
                      : "text-foreground-700 hover:bg-background-200/70"
                  }`}
                >
                  <i className="ri-user-add-line" aria-hidden="true"></i>
                  회원가입
                </button>
              </div>

              <div className="mt-6">
                {tab === "login" ? (
                  <LoginForm onSwitch={() => setTab("signup")} />
                ) : (
                  <SignupForm
                    onSwitch={() => setTab("login")}
                    onApplied={() => navigate("/pending")}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}