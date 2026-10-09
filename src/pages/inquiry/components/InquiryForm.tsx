import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { INQUIRY_MAX_LENGTH } from "@/utils/inquiry";

interface InquiryFormProps {
  onSubmitted: () => void;
}

export default function InquiryForm({ onSubmitted }: InquiryFormProps) {
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setDone("");

    if (!profile) {
      setError("로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.");
      return;
    }
    if (!title.trim()) {
      setError("문의 제목을 입력해 주세요.");
      return;
    }
    if (!content.trim()) {
      setError("문의 내용을 입력해 주세요.");
      return;
    }
    if (content.length > INQUIRY_MAX_LENGTH) {
      setError(`문의 내용은 ${INQUIRY_MAX_LENGTH}자 이내로 입력해 주세요.`);
      return;
    }

    setLoading(true);
    try {
      const { error: insertError } = await supabase.from("inquiries").insert({
        user_id: profile.id,
        name: profile.name,
        email: profile.email,
        title: title.trim(),
        content: content.trim(),
      });
      if (insertError) throw insertError;

      setTitle("");
      setContent("");
      setDone("문의가 접수되었습니다. 운영자 확인 후 답변드립니다.");
      onSubmitted();
    } catch (err) {
      setError((err as Error).message || "문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <i className="ri-question-answer-line" aria-hidden="true"></i>
        </span>
        <div>
          <h2 className="font-heading text-base font-bold text-foreground-950">문의하기</h2>
          <p className="text-xs text-foreground-600">
            궁금한 점이나 불편한 점을 남겨 주세요. 운영자가 확인 후 답변합니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-2 rounded-md bg-background-100 px-3 py-2 text-xs text-foreground-700 sm:grid-cols-2">
          <span className="truncate">
            <span className="text-foreground-500">이름 · </span>
            {profile?.name || "-"}
          </span>
          <span className="truncate">
            <span className="text-foreground-500">이메일 · </span>
            {profile?.email || "-"}
          </span>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground-800">제목</span>
          <span className="flex items-center gap-2 rounded-md border border-background-300 bg-background-50 px-3 py-2.5 focus-within:border-primary-400">
            <i className="ri-price-tag-3-line text-foreground-500" aria-hidden="true"></i>
            <input
              type="text"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문의 제목을 입력해 주세요"
              className="w-full bg-transparent text-sm text-foreground-950 outline-none placeholder:text-foreground-400"
            />
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between text-sm font-medium text-foreground-800">
            <span>문의 내용</span>
            <span className="text-xs font-normal text-foreground-500">
              {content.length}/{INQUIRY_MAX_LENGTH}
            </span>
          </span>
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, INQUIRY_MAX_LENGTH))}
            rows={6}
            maxLength={INQUIRY_MAX_LENGTH}
            placeholder="문의 내용을 자세히 적어 주시면 더 정확히 안내해 드릴 수 있습니다. (최대 500자)"
            className="w-full resize-none rounded-md border border-background-300 bg-background-50 px-3 py-2.5 text-sm leading-relaxed text-foreground-950 outline-none placeholder:text-foreground-400 focus:border-primary-400"
          />
        </label>

        {error && (
          <p className="flex items-center gap-1.5 rounded-md bg-primary-50 px-3 py-2 text-xs font-medium text-primary-800">
            <i className="ri-error-warning-line" aria-hidden="true"></i>
            {error}
          </p>
        )}
        {done && (
          <p className="flex items-center gap-1.5 rounded-md bg-accent-50 px-3 py-2 text-xs font-medium text-accent-900">
            <i className="ri-checkbox-circle-line" aria-hidden="true"></i>
            {done}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary-500 px-4 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-foreground-950"
        >
          <i
            className={loading ? "ri-loader-4-line animate-spin" : "ri-send-plane-fill"}
            aria-hidden="true"
          ></i>
          {loading ? "접수 중..." : "문의 접수하기"}
        </button>
      </form>
    </div>
  );
}