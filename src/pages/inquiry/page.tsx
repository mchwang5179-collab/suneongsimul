import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import PageLoader from "@/components/feature/PageLoader";
import AccountBar from "@/components/feature/AccountBar";
import InquiryForm from "@/pages/inquiry/components/InquiryForm";
import MyInquiryList from "@/pages/inquiry/components/MyInquiryList";
import type { Inquiry } from "@/utils/inquiry";

export default function InquiryPage() {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<Inquiry[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!profile) return;
    setListLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("inquiries")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setItems((data as Inquiry[]) ?? []);
    } catch (err) {
      setError((err as Error).message || "문의 내역을 불러오지 못했습니다.");
    } finally {
      setListLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate("/auth");
      return;
    }
    if (profile) void load();
  }, [loading, session, profile, navigate, load]);

  if (loading || (session && profile === null)) return <PageLoader />;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-background-100 font-body">
      <header className="border-b border-background-200 bg-background-50">
        <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <Link
            to="/"
            title="시뮬레이터로 돌아가기"
            className="group flex cursor-pointer items-center gap-3 rounded-md px-1 py-1 transition-colors hover:bg-background-100"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-500 text-background-50 dark:text-foreground-950">
              <i className="ri-megaphone-fill text-lg" aria-hidden="true"></i>
            </span>
            <span className="block">
              <span className="block text-[11px] font-medium text-primary-700">
                수능 안내방송 시뮬레이터
              </span>
              <span className="flex items-center gap-1 font-heading text-base font-bold text-foreground-950 transition-colors group-hover:text-primary-700 md:text-lg">
                문의하기
                <i
                  className="ri-arrow-left-line text-sm text-foreground-400 transition-colors group-hover:text-primary-600"
                  aria-hidden="true"
                ></i>
              </span>
            </span>
          </Link>
          <AccountBar />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-primary-200 bg-primary-100/60 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-500 text-background-50 dark:text-foreground-950">
              <i className="ri-megaphone-fill text-lg" aria-hidden="true"></i>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary-900">
                수능 안내방송 시뮬레이터
              </p>
              <p className="mt-0.5 text-xs text-primary-900/75">
                문의를 남긴 뒤에도 언제든 시뮬레이터로 돌아가 이어서 연습할 수 있어요.
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-primary-500 px-4 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600 dark:text-foreground-950"
          >
            <i className="ri-arrow-left-line" aria-hidden="true"></i>
            시뮬레이터로 돌아가기
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <InquiryForm onSubmitted={() => void load()} />
          <MyInquiryList
            inquiries={items}
            loading={listLoading}
            error={error}
            onRetry={() => void load()}
          />
        </div>

        <p className="mt-8 flex items-center gap-1.5 text-[11px] leading-relaxed text-foreground-500">
          <i className="ri-information-line" aria-hidden="true"></i>
          영업일 기준 순차적으로 답변드리며, 답변이 등록되면 이 화면의 내 문의 내역에서 확인할 수
          있습니다.
        </p>
      </main>
    </div>
  );
}