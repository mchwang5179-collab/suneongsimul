import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth, type Profile } from "@/hooks/useAuth";
import PageLoader from "@/components/feature/PageLoader";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import MemberTable, { getDisplayStatus, type DisplayStatus } from "@/pages/admin/components/MemberTable";
import InquiryManager from "@/pages/admin/components/InquiryManager";
import { addOneYear } from "@/utils/membership";

type FilterKey = "all" | DisplayStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pending", label: "승인 대기" },
  { key: "renew_pending", label: "재가입 대기" },
  { key: "approved", label: "이용 중" },
  { key: "expired", label: "기간 만료" },
  { key: "rejected", label: "승인 거절" },
];

interface StatCard {
  key: string;
  label: string;
  value: number;
  icon: string;
  className: string;
}

export default function AdminPage() {
  const { profile: myProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [keyword, setKeyword] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [target, setTarget] = useState<{ member: Profile; action: "reject" | "delete" } | null>(
    null,
  );
  const [section, setSection] = useState<"members" | "inquiries">("members");

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setMembers((data as Profile[]) ?? []);
    } catch (err) {
      setError((err as Error).message || "회원 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const stats = useMemo(() => {
    const counts = {
      total: members.length,
      pending: 0,
      renewPending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
    };
    members.forEach((m) => {
      const status = getDisplayStatus(m);
      if (status === "pending") counts.pending += 1;
      else if (status === "renew_pending") counts.renewPending += 1;
      else if (status === "approved") counts.approved += 1;
      else if (status === "rejected") counts.rejected += 1;
      else if (status === "expired") counts.expired += 1;
    });
    return counts;
  }, [members]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return members.filter((m) => {
      const statusOk = filter === "all" || getDisplayStatus(m) === filter;
      if (!statusOk) return false;
      if (!kw) return true;
      return (
        (m.name ?? "").toLowerCase().includes(kw) ||
        (m.email ?? "").toLowerCase().includes(kw) ||
        (m.phone ?? "").includes(kw)
      );
    });
  }, [members, filter, keyword]);

  const handleApprove = async (member: Profile) => {
    setBusyId(member.id);
    setNotice("");
    try {
      const wasRenewal =
        member.status === "renew_pending" ||
        (member.expires_at !== null && new Date(member.expires_at).getTime() < Date.now());
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          expires_at: addOneYear().toISOString(),
        })
        .eq("id", member.id);
      if (updateError) throw updateError;
      setNotice(
        wasRenewal
          ? `${member.name || member.email} 님의 재가입을 승인했습니다. 오늘부터 1년간 이용할 수 있습니다.`
          : `${member.name || member.email} 님을 승인했습니다. 오늘부터 1년간 이용할 수 있습니다.`,
      );
      await loadMembers();
    } catch (err) {
      setNotice(`승인 실패: ${(err as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  const runReject = async (member: Profile) => {
    setBusyId(member.id);
    setNotice("");
    try {
      // 재가입(연장) 신청 거절이면 다시 '기간 만료' 상태로 되돌려 재신청할 수 있게 한다.
      const hadPeriod = member.expires_at !== null;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ status: hadPeriod ? "approved" : "rejected" })
        .eq("id", member.id);
      if (updateError) throw updateError;
      setNotice(
        hadPeriod
          ? `${member.name || member.email} 님의 재가입 신청을 거절했습니다. 재입금 후 다시 신청할 수 있습니다.`
          : `${member.name || member.email} 님의 가입을 거절했습니다.`,
      );
      await loadMembers();
    } catch (err) {
      setNotice(`거절 실패: ${(err as Error).message}`);
    } finally {
      setBusyId(null);
      setTarget(null);
    }
  };

  const runDelete = async (member: Profile) => {
    setBusyId(member.id);
    setNotice("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("admin-manage-members", {
        body: { action: "delete", userId: member.id },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setNotice(`${member.name || member.email} 님의 계정을 영구 삭제했습니다.`);
      await loadMembers();
    } catch (err) {
      setNotice(`삭제 실패: ${(err as Error).message}`);
    } finally {
      setBusyId(null);
      setTarget(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const statCards: StatCard[] = [
    { key: "total", label: "전체 회원", value: stats.total, icon: "ri-group-line", className: "bg-background-100 text-foreground-800" },
    { key: "pending", label: "승인 대기", value: stats.pending, icon: "ri-time-line", className: "bg-primary-100 text-primary-800" },
    { key: "renew", label: "재가입 대기", value: stats.renewPending, icon: "ri-refresh-line", className: "bg-secondary-100 text-secondary-900" },
    { key: "approved", label: "이용 중", value: stats.approved, icon: "ri-checkbox-circle-fill", className: "bg-accent-100 text-accent-900" },
    { key: "expired", label: "기간 만료", value: stats.expired, icon: "ri-hourglass-line", className: "bg-background-200 text-foreground-700" },
  ];

  return (
    <div className="min-h-screen bg-background-100 font-body">
      <header className="border-b border-background-200 bg-background-50">
        <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-500 text-background-50 dark:text-foreground-950">
              <i className="ri-shield-user-fill text-lg" aria-hidden="true"></i>
            </span>
            <div>
              <p className="text-[11px] font-medium text-primary-700">운영자 전용</p>
              <h1 className="font-heading text-base font-bold text-foreground-950 md:text-lg">
                회원 관리
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-background-300 px-3 py-1.5 text-xs font-medium text-foreground-700 transition-colors hover:bg-background-100"
            >
              <i className="ri-megaphone-line" aria-hidden="true"></i>
              시뮬레이터로
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background-100 px-3 py-1.5 text-xs font-medium text-foreground-700">
              <i className="ri-user-line text-foreground-500" aria-hidden="true"></i>
              {myProfile?.name || myProfile?.email}
            </span>
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

      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 inline-flex flex-wrap items-center gap-1 rounded-full border border-background-200 bg-background-100 p-1">
          <button
            type="button"
            onClick={() => setSection("members")}
            aria-pressed={section === "members"}
            className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              section === "members"
                ? "bg-primary-500 text-background-50 dark:text-foreground-950"
                : "text-foreground-700 hover:bg-background-200/70"
            }`}
          >
            <i className="ri-group-line" aria-hidden="true"></i>
            회원 관리
          </button>
          <button
            type="button"
            onClick={() => setSection("inquiries")}
            aria-pressed={section === "inquiries"}
            className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              section === "inquiries"
                ? "bg-primary-500 text-background-50 dark:text-foreground-950"
                : "text-foreground-700 hover:bg-background-200/70"
            }`}
          >
            <i className="ri-question-answer-line" aria-hidden="true"></i>
            문의 관리
          </button>
        </div>

        {section === "inquiries" ? (
          <InquiryManager />
        ) : (
          <>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
          {statCards.map((card) => (
            <div
              key={card.key}
              className="rounded-lg border border-background-200 bg-background-50 p-4"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${card.className}`}
              >
                <i className={card.icon} aria-hidden="true"></i>
              </span>
              <p className="mt-3 text-2xl font-bold text-foreground-950">{card.value}</p>
              <p className="text-xs text-foreground-600">{card.label}</p>
            </div>
          ))}
        </div>

        <section className="mt-6 rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-background-200 bg-background-100 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={filter === f.key}
                  className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    filter === f.key
                      ? "bg-primary-500 text-background-50 dark:text-foreground-950"
                      : "text-foreground-700 hover:bg-background-200/70"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="flex items-center gap-2 rounded-md border border-background-300 bg-background-50 px-3 py-2 focus-within:border-primary-400">
                <i className="ri-search-line text-foreground-500" aria-hidden="true"></i>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="이름 · 이메일 검색"
                  className="w-full bg-transparent text-sm text-foreground-950 outline-none placeholder:text-foreground-400 sm:w-48"
                />
              </span>
            </div>
          </div>

          {notice && (
            <p className="mt-4 flex items-center gap-1.5 rounded-md bg-accent-50 px-3 py-2 text-xs font-medium text-accent-900">
              <i className="ri-information-line" aria-hidden="true"></i>
              {notice}
            </p>
          )}

          <div className="mt-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-background-200 bg-background-50 px-4 py-14">
                <i className="ri-loader-4-line animate-spin text-2xl text-primary-600" aria-hidden="true"></i>
                <p className="text-sm text-foreground-600">회원 목록을 불러오는 중입니다...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-background-200 bg-background-50 px-4 py-14 text-center">
                <i className="ri-error-warning-line text-2xl text-primary-700" aria-hidden="true"></i>
                <p className="text-sm text-foreground-700">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadMembers()}
                  className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-500 px-4 py-2 text-xs font-semibold text-background-50 transition-colors hover:bg-primary-600 dark:text-foreground-950"
                >
                  <i className="ri-refresh-line" aria-hidden="true"></i>
                  다시 시도
                </button>
              </div>
            ) : (
              <MemberTable
                members={filtered}
                busyId={busyId}
                onApprove={handleApprove}
                onReject={(member) => setTarget({ member, action: "reject" })}
                onDelete={(member) => setTarget({ member, action: "delete" })}
              />
            )}
          </div>
        </section>

        <p className="mt-6 flex items-center gap-1.5 text-[11px] leading-relaxed text-foreground-500">
          <i className="ri-information-line" aria-hidden="true"></i>
          승인 시 오늘부터 1년간 이용할 수 있습니다. 1년이 지나면 계정은 삭제되지 않고 이용이
          중단되며, 회원이 가입비를 다시 입금하고 재가입을 신청하면 [재가입 대기]에 표시되어
          운영자 재승인 후 1년 더 이용할 수 있습니다.
        </p>
          </>
        )}
      </main>

      <ConfirmDialog
        open={target?.action === "reject"}
        title="가입을 거절할까요?"
        description={
          <>
            <strong className="font-semibold text-foreground-900">
              {target?.member.name || target?.member.email}
            </strong>{" "}
            님의 신청을 거절합니다. 신규 가입이면 계정은 남아 있으니 필요하면 나중에 삭제할 수
            있고, 재가입 신청이면 다시 기간 만료 상태로 돌아가 재신청할 수 있습니다.
          </>
        }
        confirmLabel="거절"
        tone="primary"
        loading={busyId === target?.member.id}
        onConfirm={() => target && runReject(target.member)}
        onCancel={() => setTarget(null)}
      />

      <ConfirmDialog
        open={target?.action === "delete"}
        title="계정을 영구 삭제할까요?"
        description={
          <>
            <strong className="font-semibold text-foreground-900">
              {target?.member.name || target?.member.email}
            </strong>{" "}
            님의 계정과 회원 정보가 완전히 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          </>
        }
        confirmLabel="영구 삭제"
        tone="danger"
        loading={busyId === target?.member.id}
        onConfirm={() => target && runDelete(target.member)}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}