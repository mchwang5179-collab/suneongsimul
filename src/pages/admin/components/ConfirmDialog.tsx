import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  tone = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "bg-primary-600 hover:bg-primary-700 text-background-50 dark:text-foreground-950"
      : "bg-secondary-500 hover:bg-secondary-600 text-background-50 dark:text-foreground-950";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-950/40 p-4">
      <div className="w-full max-w-[420px] animate-fade-in rounded-lg border border-background-200 bg-background-50 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              tone === "danger"
                ? "bg-primary-100 text-primary-700"
                : "bg-secondary-100 text-secondary-900"
            }`}
          >
            <i
              className={tone === "danger" ? "ri-alert-line text-xl" : "ri-question-line text-xl"}
              aria-hidden="true"
            ></i>
          </span>
          <div>
            <h3 className="text-base font-bold text-foreground-950">{title}</h3>
            <div className="mt-1 text-sm leading-relaxed text-foreground-700">{description}</div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 px-4 py-2 text-sm font-medium text-foreground-700 transition-colors hover:bg-background-100 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${confirmClass}`}
          >
            {loading && <i className="ri-loader-4-line animate-spin" aria-hidden="true"></i>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}