import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import PageLoader from "@/components/feature/PageLoader";
import BankInfoCard from "@/components/feature/BankInfoCard";
import { MEMBERSHIP_FEE, formatDateTime, formatFee } from "@/utils/membership";

export default function PendingPage() {
  const { session, profile, isApproved, loading, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate("/auth");
      return;
    }
    if (isApproved) navigate("/");
  }, [loading, session, isApproved, navigate]);

  if (loading || (session && profile === null)) {
    return <PageLoader />;
  }
  if (!session) return null;

  const handleRefresh = async () => {
    setChecking(true);
    await refreshProfile();
    setChecking(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleRenew = async () => {
    setRenewing(true);
    setRenewError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("request-renewal", {
        body: {},
      });
      if (fnError) {
        let message = "재가입 신청에 실패했습니다. 잠시 후 다시 시도해 주세요.";
        const context = (fnError as { context?: Response }).context;
        if (context && typeof context.json === "function") {
          try {
            const payload = await context.json();
            if (payload?.error) message = payload.error;
          } catch {
            /* ignore */
          }
        }
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);
      await refreshProfile();
    } catch (err) {
      setRenewError((err as Error).message || "재가입 신청에 실패했습니다.");
    } finally {
      setRenewing(false);
    }
  };

  const status = profile?.status;
  const rejected = status === "rejected";
  const renewPending = status === "renew_pending";
  const expired =
    status === "approved" && profile?.expires_at
      ? new Date(profile.expires_at).getTime() < Date.now()
      : false;

  return (
    <div className="min-h-screen bg-background-100 font-body">
      <header className="border-b border-background-200 bg-background-50">
        <div className="mx-auto flex w-full max-w-[900px] flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-500 text-background-50 dark:text-foreground-950">
              <i className="ri-megaphone-fill text-lg" aria-hidden="true"></i>
            </span>
            <span className="font-heading text-base font-bold text-foreground-950">
              수능 안내방송 시뮬레이터
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/inquiry")}
              className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-background-300 bg-background-50 px-3 py-1.5 text-xs font-semibold text-foreground-700 transition-colors hover:bg-background-100"
            >
              <i className="ri-question-answer-line" aria-hidden="true"></i>
              문의하기
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-800 transition-colors hover:bg-primary-100 disabled:opacity-60"
            >
              <i
                className={checking ? "ri-loader-4-line animate-spin" : "ri-refresh-line"}
                aria-hidden="true"
              ></i>
              승인 상태 확인
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-background-300 px-3 py-1.5 text-xs font-medium text-foreground-700 transition-colors hover:bg-background-100"
            >
              <i className="ri-logout-box-r-line" aria-hidden="true"></i>
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[900px] px-4 py-8 md:px-6 md:py-12">
        {rejected ? (
          <section className="rounded-lg border border-background-200 bg-background-50 p-6 md:p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-200 text-secondary-900">
              <i className="ri-close-circle-line text-2xl" aria-hidden="true"></i>
            </span>
            <h1 className="mt-4 font-heading text-xl font-bold text-foreground-950 md:text-2xl">
              가입이 승인되지 않았습니다
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-foreground-700">
              입금자명과 가입 이름이 일치하지 않거나 입금이 확인되지 않아 승인이 거절되었습니다.
              이름을 확인한 뒤 다시 입금하시거나 운영자에게 문의해 주세요.
            </p>
          </section>
        ) : renewPending ? (
          <section className="rounded-lg border border-background-200 bg-background-50 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 text-secondary-900">
                <i className="ri-refresh-line text-2xl" aria-hidden="true"></i>
              </span>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-900">
                  <i className="ri-loader-4-line animate-spin" aria-hidden="true"></i>
                  재가입 승인 대기 중
                </span>
                <h1 className="mt-2 font-heading text-xl font-bold text-foreground-950 md:text-2xl">
                  재가입 신청이 접수되었습니다
                </h1>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-foreground-700">
              <strong className="font-semibold text-foreground-900">
                {profile?.name} ({profile?.email})
              </strong>{" "}
              님, 아래 계좌로 가입비를 입금해 주세요. 입금자명과 가입 이름이 일치하면 운영자가 확인
              후 재승인합니다. 승인이 완료되면 그때부터 다시{" "}
              <strong className="font-semibold text-foreground-900">1년간</strong> 이용할 수
              있습니다.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <BankInfoCard />
              <div className="rounded-lg border border-background-200 bg-background-100 p-4 text-xs leading-relaxed text-foreground-700">
                <p className="flex items-center gap-2 text-sm font-bold text-foreground-900">
                  <i className="ri-file-list-3-line text-primary-700" aria-hidden="true"></i>
                  신청 정보
                </p>
                <dl className="mt-3 space-y-1.5">
                  <div className="flex justify-between gap-2">
                    <dt className="text-foreground-500">이름</dt>
                    <dd className="font-medium text-foreground-900">{profile?.name}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-foreground-500">이메일</dt>
                    <dd className="font-medium text-foreground-900">{profile?.email}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-foreground-500">기존 만료일</dt>
                    <dd className="font-medium text-foreground-900">
                      {profile?.expires_at ? profile.expires_at.slice(0, 10).replace(/-/g, ".") : "-"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <p className="mt-5 flex items-center gap-1.5 rounded-md bg-background-100 px-3 py-2 text-xs text-foreground-600">
              <i className="ri-refresh-line" aria-hidden="true"></i>
              승인이 완료되면 위의 <strong className="font-semibold">승인 상태 확인</strong> 버튼을
              눌러 주세요.
            </p>
          </section>
        ) : expired ? (
          <section className="rounded-lg border border-background-200 bg-background-50 p-6 md:p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background-200 text-foreground-700">
              <i className="ri-hourglass-line text-2xl" aria-hidden="true"></i>
            </span>
            <h1 className="mt-4 font-heading text-xl font-bold text-foreground-950 md:text-2xl">
              이용 기간이 만료되었습니다
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-foreground-700">
              1년 이용 기간이 지나 이용이 중단되었습니다. <strong className="font-semibold text-foreground-900">계정은
              삭제되지 않으니</strong> 아래 계좌로 가입비를 다시 입금한 뒤 재가입을 신청하면, 운영자
              확인 후 다시 1년간 이용할 수 있습니다.
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground-500">
              <i className="ri-calendar-line" aria-hidden="true"></i>
              만료일 {profile?.expires_at ? profile.expires_at.slice(0, 10).replace(/-/g, ".") : "-"}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <BankInfoCard />
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border border-background-200 bg-background-100 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-foreground-900">
                    <i className="ri-footprint-line text-primary-700" aria-hidden="true"></i>
                    재가입 절차
                  </h3>
                  <ol className="mt-3 space-y-2 text-xs leading-relaxed text-foreground-700">
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-background-50 dark:text-foreground-950">
                        1
                      </span>
                      {formatFee(MEMBERSHIP_FEE)}원 재입금 (입금자명 = 가입 이름)
                    </li>
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-background-50 dark:text-foreground-950">
                        2
                      </span>
                      아래 재가입 신청 버튼 누르기
                    </li>
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-500 text-[10px] font-bold text-background-50 dark:text-foreground-950">
                        3
                      </span>
                      운영자 입금 확인 후 재승인
                    </li>
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-500 text-[10px] font-bold text-background-50 dark:text-foreground-950">
                        4
                      </span>
                      승인 후 1년 연장
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {renewError && (
              <p className="mt-4 flex items-center gap-1.5 rounded-md bg-primary-50 px-3 py-2 text-xs font-medium text-primary-800">
                <i className="ri-error-warning-line" aria-hidden="true"></i>
                {renewError}
              </p>
            )}

            <button
              type="button"
              onClick={handleRenew}
              disabled={renewing}
              className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary-500 px-4 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:text-foreground-950"
            >
              <i
                className={renewing ? "ri-loader-4-line animate-spin" : "ri-refresh-line"}
                aria-hidden="true"
              ></i>
              {renewing ? "신청 중..." : "재가입 신청하기"}
            </button>
          </section>
        ) : (
          <>
            <section className="rounded-lg border border-background-200 bg-background-50 p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                  <i className="ri-time-line text-2xl" aria-hidden="true"></i>
                </span>
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800">
                    <i className="ri-loader-4-line animate-spin" aria-hidden="true"></i>
                    승인 대기 중
                  </span>
                  <h1 className="mt-2 font-heading text-xl font-bold text-foreground-950 md:text-2xl">
                    가입 신청이 접수되었습니다
                  </h1>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-foreground-700">
                <strong className="font-semibold text-foreground-900">
                  {profile?.name} ({profile?.email})
                </strong>{" "}
                님, 아래 계좌로 가입비를 입금해 주세요. 입금자명과 가입 시 입력한 이름이 일치하면
                운영자가 확인 후 승인합니다. 승인이 완료되면 그때부터{" "}
                <strong className="font-semibold text-foreground-900">1년간</strong> 이용할 수
                있으며, 1년이 지나면 계정은 삭제되지 않고 가입비를 다시 입금하고 재가입 신청 후
                운영자 재승인을 받으면 1년 더 이용할 수 있습니다.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <BankInfoCard />
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg border border-background-200 bg-background-100 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-foreground-900">
                      <i className="ri-footprint-line text-primary-700" aria-hidden="true"></i>
                      가입 절차
                    </h3>
                    <ol className="mt-3 space-y-2 text-xs leading-relaxed text-foreground-700">
                      <li className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-background-50 dark:text-foreground-950">
                          1
                        </span>
                        회원가입 신청 (완료)
                      </li>
                      <li className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-background-50 dark:text-foreground-950">
                          2
                        </span>
                        {formatFee(MEMBERSHIP_FEE)}원 입금 (입금자명 = 가입 이름)
                      </li>
                      <li className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-500 text-[10px] font-bold text-background-50 dark:text-foreground-950">
                          3
                        </span>
                        운영자 입금 확인 후 승인
                      </li>
                      <li className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-500 text-[10px] font-bold text-background-50 dark:text-foreground-950">
                          4
                        </span>
                        승인 후 1년간 이용
                      </li>
                    </ol>
                  </div>
                  <div className="rounded-lg border border-background-200 bg-background-100 p-4 text-xs leading-relaxed text-foreground-700">
                    <p className="flex items-center gap-2 text-sm font-bold text-foreground-900">
                      <i className="ri-file-list-3-line text-primary-700" aria-hidden="true"></i>
                      신청 정보
                    </p>
                    <dl className="mt-3 space-y-1.5">
                      <div className="flex justify-between gap-2">
                        <dt className="text-foreground-500">이름</dt>
                        <dd className="font-medium text-foreground-900">{profile?.name}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-foreground-500">이메일</dt>
                        <dd className="font-medium text-foreground-900">{profile?.email}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-foreground-500">신청일</dt>
                        <dd className="font-medium text-foreground-900">
                          {formatDateTime(profile?.created_at)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>

              <p className="mt-5 flex items-center gap-1.5 rounded-md bg-background-100 px-3 py-2 text-xs text-foreground-600">
                <i className="ri-refresh-line" aria-hidden="true"></i>
                승인이 완료되면 위의 <strong className="font-semibold">승인 상태 확인</strong>{" "}
                버튼을 눌러 주세요.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}