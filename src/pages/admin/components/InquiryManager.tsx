import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import InquiryStatusBadge from "@/components/feature/InquiryStatusBadge";
import InquiryDetailDialog from "@/pages/admin/components/InquiryDetailDialog";
import { formatDateTime } from "@/utils/membership";
import type { Inquiry, InquiryStatus } from "@/utils/inquiry";

type FilterKey = "all" | InquiryStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pending", label: "답변 대기" },
  { key: "answered", label: "답변 완료" },
];

export default function InquiryManager() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setInquiries((data as Inquiry[]) ?? []);
    } catch (err) {
      setError((err as Error).message || "문의 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    let pending = 0;
    let answered = 0;
    inquiries.forEach((item) => {
      if (item.status === "answered") answered += 1;
      else pending += 1;
    });
    return { total: inquiries.length, pending, answered };
  }, [inquiries]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return inquiries.filter((item) => {
      const statusOk = filter === "all" || item.status === filter;
      if (!statusOk) return false;
      if (!kw) return true;
      return (
        item.title.toLowerCase().includes(kw) ||
        item.content.toLowerCase().includes(kw) ||
        (item.name ?? "").toLowerCase().includes(kw) ||
        (item.email ?? "").toLowerCase().includes(kw)
      );
    });
  }, [inquiries, filter, keyword]);

  const handleSubmitAnswer = async (answer: string) => {
    if (!selected) return;
    setBusy(true);
    setNotice("");
    try {
      const { error: updateError } = await supabase
        .from("inquiries")
        .update({ status: "answered", answer, answered_at: new Date().toISOString() })
        .eq("id", selected.id);
      if (updateError) throw updateError;
      setNotice("답변을 등록했습니다. 회원이 내 문의 내역에서 확인할 수 있습니다.");
      setSelected(null);
      await load();
    } catch (err) {
      setNotice(`답변 등록 실패: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setBusy(true);
    setNotice("");
    try {
      const { error: deleteError } = await supabase
        .from("inquiries")
        .delete()
        .eq("id", selected.id);
      if (deleteError) throw deleteError;
      setNotice("문의를 삭제했습니다.");
      setSelected(null);
      await load();
    } catch (err) {
      setNotice(`삭제 실패: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const statCards = [
    { key: "total", label: "전체 문의", value: stats.total, icon: "ri-question-answer-line", className: "bg-background-100 text-foreground-800" },
    { key: "pending", label: "답변 대기", value: stats.pending, icon: "ri-time-line", className: "bg-primary-100 text-primary-800" },
    { key: "answered", label: "답변 완료", value: stats.answered, icon: "ri-checkbox-circle-fill", className: "bg-accent-100 text-accent-900" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {statCards.map((card) => (
          <div key={card.key} className="rounded-lg border border-background-200 bg-background-50 p-4">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${card.className}`}>
              <i className={card.icon} aria-hidden="true"></i>
            </span>
            <p className="mt-3 text-2xl font-bold text-foreground-950">{card.value}</p>
            <p className="text-xs text-foreground-600">{card.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
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

          <span className="flex items-center gap-2 rounded-md border border-background-300 bg-background-50 px-3 py-2 focus-within:border-primary-400">
            <i className="ri-search-line text-foreground-500" aria-hidden="true"></i>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="제목 · 내용 · 이름 검색"
              className="w-full bg-transparent text-sm text-foreground-950 outline-none placeholder:text-foreground-400 sm:w-56"
            />
          </span>
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
              <p className="text-sm text-foreground-600">문의 목록을 불러오는 중입니다...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-background-200 bg-background-50 px-4 py-14 text-center">
              <i className="ri-error-warning-line text-2xl text-primary-700" aria-hidden="true"></i>
              <p className="text-sm text-foreground-700">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-500 px-4 py-2 text-xs font-semibold text-background-50 transition-colors hover:bg-primary-600 dark:text-foreground-950"
              >
                <i className="ri-refresh-line" aria-hidden="true"></i>
                다시 시도
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-background-300 bg-background-50 px-4 py-14 text-center">
              <i className="ri-inbox-line text-2xl text-foreground-400" aria-hidden="true"></i>
              <p className="text-sm text-foreground-600">해당하는 문의가 없습니다.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {filtered.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-background-200 bg-background-50 p-4 transition-colors hover:bg-background-100"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <InquiryStatusBadge status={item.status} />
                        <span className="text-[11px] text-foreground-500">
                          {formatDateTime(item.created_at)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground-950">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-foreground-600">{item.content}</p>
                      <p className="mt-1.5 truncate text-[11px] text-foreground-500">
                        <i className="ri-user-line mr-1" aria-hidden="true"></i>
                        {item.name || "(이름 없음)"} · {item.email || "-"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md bg-primary-500 px-3 py-1.5 text-xs font-semibold text-background-50 transition-colors hover:bg-primary-600 dark:text-foreground-950"
                      >
                        <i
                          className={item.status === "answered" ? "ri-edit-line" : "ri-reply-line"}
                          aria-hidden="true"
                        ></i>
                        {item.status === "answered" ? "답변 수정" : "답변하기"}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {selected && (
        <InquiryDetailDialog
          key={selected.id}
          inquiry={selected}
          loading={busy}
          onClose={() => setSelected(null)}
          onSubmitAnswer={handleSubmitAnswer}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}