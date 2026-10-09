import { useState } from "react";
import { formatDateTime } from "@/utils/membership";
import InquiryStatusBadge from "@/components/feature/InquiryStatusBadge";
import type { Inquiry } from "@/utils/inquiry";

interface MyInquiryListProps {
  inquiries: Inquiry[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export default function MyInquiryList({
  inquiries,
  loading,
  error,
  onRetry,
}: MyInquiryListProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-100 text-secondary-900">
          <i className="ri-file-list-3-line" aria-hidden="true"></i>
        </span>
        <div>
          <h2 className="font-heading text-base font-bold text-foreground-950">내 문의 내역</h2>
          <p className="text-xs text-foreground-600">접수한 문의와 운영자 답변을 확인할 수 있어요.</p>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-background-200 bg-background-50 px-4 py-12">
            <i className="ri-loader-4-line animate-spin text-2xl text-primary-600" aria-hidden="true"></i>
            <p className="text-sm text-foreground-600">문의 내역을 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-background-200 bg-background-50 px-4 py-12 text-center">
            <i className="ri-error-warning-line text-2xl text-primary-700" aria-hidden="true"></i>
            <p className="text-sm text-foreground-700">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-500 px-4 py-2 text-xs font-semibold text-background-50 transition-colors hover:bg-primary-600 dark:text-foreground-950"
            >
              <i className="ri-refresh-line" aria-hidden="true"></i>
              다시 시도
            </button>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-background-300 bg-background-50 px-4 py-12 text-center">
            <i className="ri-inbox-line text-2xl text-foreground-400" aria-hidden="true"></i>
            <p className="text-sm text-foreground-600">아직 접수한 문의가 없습니다.</p>
            <p className="text-xs text-foreground-500">왼쪽에서 첫 문의를 남겨 보세요.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {inquiries.map((item) => {
              const open = openId === item.id;
              return (
                <li
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-background-200 bg-background-50"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : item.id)}
                    className="flex w-full cursor-pointer items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-background-100"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground-950">
                        {item.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-foreground-600">
                        {item.content}
                      </p>
                      <p className="mt-1.5 text-[11px] text-foreground-500">
                        접수 {formatDateTime(item.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <InquiryStatusBadge status={item.status} />
                      <i
                        className={open ? "ri-arrow-up-s-line text-foreground-500" : "ri-arrow-down-s-line text-foreground-500"}
                        aria-hidden="true"
                      ></i>
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-background-200 px-4 py-3">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground-800">
                        {item.content}
                      </p>

                      {item.status === "answered" ? (
                        <div className="mt-3 rounded-md border border-accent-200 bg-accent-50 p-3">
                          <p className="flex items-center gap-1.5 text-xs font-bold text-accent-900">
                            <i className="ri-shield-star-line" aria-hidden="true"></i>
                            운영자 답변
                            <span className="font-normal text-accent-900/70">
                              {formatDateTime(item.answered_at)}
                            </span>
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground-800">
                            {item.answer}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-3 flex items-center gap-1.5 rounded-md bg-background-100 px-3 py-2 text-xs text-foreground-600">
                          <i className="ri-time-line" aria-hidden="true"></i>
                          아직 답변이 등록되지 않았습니다. 운영자 확인 후 답변드립니다.
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}