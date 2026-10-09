import { useState } from "react";
import { formatDateTime } from "@/utils/membership";
import InquiryStatusBadge from "@/components/feature/InquiryStatusBadge";
import { INQUIRY_MAX_LENGTH, type Inquiry } from "@/utils/inquiry";

interface InquiryDetailDialogProps {
  inquiry: Inquiry;
  loading: boolean;
  onClose: () => void;
  onSubmitAnswer: (answer: string) => void;
  onDelete: () => void;
}

export default function InquiryDetailDialog({
  inquiry,
  loading,
  onClose,
  onSubmitAnswer,
  onDelete,
}: InquiryDetailDialogProps) {
  const [answer, setAnswer] = useState(inquiry.answer ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-950/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-[560px] animate-fade-in flex-col overflow-hidden rounded-lg border border-background-200 bg-background-50">
        <div className="flex items-start justify-between gap-3 border-b border-background-200 px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <InquiryStatusBadge status={inquiry.status} />
              <span className="text-[11px] text-foreground-500">
                접수 {formatDateTime(inquiry.created_at)}
              </span>
            </div>
            <p className="mt-2 truncate text-xs text-foreground-600">
              {inquiry.name || "(이름 없음)"} · {inquiry.email || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-foreground-500 transition-colors hover:bg-background-100"
            aria-label="닫기"
          >
            <i className="ri-close-line text-lg" aria-hidden="true"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h3 className="font-heading text-base font-bold text-foreground-950">{inquiry.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground-800">
            {inquiry.content}
          </p>

          <div className="mt-5">
            <label className="flex items-center justify-between text-sm font-medium text-foreground-800">
              <span className="flex items-center gap-1.5">
                <i className="ri-shield-star-line text-primary-700" aria-hidden="true"></i>
                운영자 답변
              </span>
              <span className="text-xs font-normal text-foreground-500">
                {answer.length}/{INQUIRY_MAX_LENGTH}
              </span>
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value.slice(0, INQUIRY_MAX_LENGTH))}
              rows={5}
              maxLength={INQUIRY_MAX_LENGTH}
              placeholder="회원에게 전달할 답변을 작성해 주세요. (최대 500자)"
              className="mt-1.5 w-full resize-none rounded-md border border-background-300 bg-background-50 px-3 py-2.5 text-sm leading-relaxed text-foreground-950 outline-none placeholder:text-foreground-400 focus:border-primary-400"
            />
            {inquiry.answered_at && (
              <p className="mt-1.5 text-[11px] text-foreground-500">
                마지막 답변 {formatDateTime(inquiry.answered_at)}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-background-200 px-5 py-4">
          {confirmingDelete ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-foreground-700">
                이 문의를 삭제하면 되돌릴 수 없습니다. 삭제할까요?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={loading}
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-md border border-background-300 px-3.5 py-2 text-xs font-medium text-foreground-700 transition-colors hover:bg-background-100 disabled:opacity-60"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={loading}
                  className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-600 px-3.5 py-2 text-xs font-semibold text-background-50 transition-colors hover:bg-primary-700 disabled:opacity-60 dark:text-foreground-950"
                >
                  {loading ? (
                    <i className="ri-loader-4-line animate-spin" aria-hidden="true"></i>
                  ) : (
                    <i className="ri-delete-bin-6-line" aria-hidden="true"></i>
                  )}
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-primary-200 px-3.5 py-2 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50"
              >
                <i className="ri-delete-bin-6-line" aria-hidden="true"></i>
                문의 삭제
              </button>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-md border border-background-300 px-3.5 py-2 text-xs font-medium text-foreground-700 transition-colors hover:bg-background-100"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => onSubmitAnswer(answer.trim())}
                  disabled={loading || answer.trim().length === 0}
                  className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-500 px-4 py-2 text-xs font-semibold text-background-50 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-foreground-950"
                >
                  {loading ? (
                    <i className="ri-loader-4-line animate-spin" aria-hidden="true"></i>
                  ) : (
                    <i className="ri-send-plane-fill" aria-hidden="true"></i>
                  )}
                  {inquiry.status === "answered" ? "답변 수정" : "답변 등록"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}