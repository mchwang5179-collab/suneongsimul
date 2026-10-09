import { useEffect, useState } from "react";

interface SharedUploadDialogProps {
  open: boolean;
  fileName: string;
  saving: boolean;
  error: string;
  onRegister: (label: string) => void;
  onUsePersonal: () => void;
  onCancel: () => void;
}

/**
 * 운영자가 파일을 올릴 때, 공용 음원으로 등록할지 개인용으로만 쓸지 고르는 창.
 */
export default function SharedUploadDialog({
  open,
  fileName,
  saving,
  error,
  onRegister,
  onUsePersonal,
  onCancel,
}: SharedUploadDialogProps) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (open) {
      setLabel(fileName.replace(/\.[^.]+$/, ""));
    }
  }, [open, fileName]);

  if (!open) return null;

  const trimmed = label.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-md rounded-lg border border-background-200 bg-background-50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-100 text-primary-700">
              <i className="ri-upload-cloud-2-line text-lg" aria-hidden="true"></i>
            </span>
            <h3 className="font-heading text-base font-bold text-foreground-950">
              음원 사용 방법 선택
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-500 transition-colors hover:bg-background-100 disabled:cursor-not-allowed"
            aria-label="닫기"
          >
            <i className="ri-close-line text-lg" aria-hidden="true"></i>
          </button>
        </div>

        <p className="mt-3 flex items-center gap-1.5 rounded-md bg-background-100 px-3 py-2 text-[12px] text-foreground-600">
          <i className="ri-file-music-line text-base text-foreground-500" aria-hidden="true"></i>
          <span className="min-w-0 truncate">{fileName}</span>
        </p>

        <label className="mt-4 block">
          <span className="text-[11px] font-semibold text-foreground-600">
            공용 음원 이름
          </span>
          <input
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={80}
            disabled={saving}
            placeholder="예: 2026학년도 6월 모의고사 영어듣기"
            className="mt-1.5 w-full rounded-md border border-background-300 bg-background-50 px-3 py-2 text-sm text-foreground-950 outline-none placeholder:text-foreground-400 focus:border-primary-400 disabled:opacity-60"
          />
        </label>

        <div className="mt-3 flex items-start gap-2 rounded-md border border-accent-300 bg-accent-100 px-3 py-2.5">
          <i className="ri-information-line mt-0.5 text-base text-accent-900" aria-hidden="true"></i>
          <p className="text-[11px] leading-relaxed text-accent-900">
            <strong className="font-semibold">공용 음원으로 등록</strong>하면 모든 회원이
            목록에서 골라 쓸 수 있습니다.{" "}
            <strong className="font-semibold">개인용으로만 사용</strong>하면 지금 이
            브라우저에서만 재생됩니다.
          </p>
        </div>

        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-primary-700">
            <i className="ri-error-warning-line" aria-hidden="true"></i>
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onRegister(trimmed)}
            disabled={saving || !trimmed}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-primary-500 px-4 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-foreground-950"
          >
            <i
              className={saving ? "ri-loader-4-line animate-spin" : "ri-share-forward-line"}
              aria-hidden="true"
            ></i>
            {saving ? "등록 중..." : "공용 음원으로 등록"}
          </button>
          <button
            type="button"
            onClick={onUsePersonal}
            disabled={saving}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 bg-background-50 px-4 py-2.5 text-sm font-medium text-foreground-700 transition-colors hover:bg-background-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="ri-user-line" aria-hidden="true"></i>
            개인용으로만 사용
          </button>
        </div>
      </div>
    </div>
  );
}