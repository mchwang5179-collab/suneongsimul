import { useState, type FormEvent } from "react";
import { isNetworkErrorMessage, supabase } from "@/lib/supabaseClient";

interface LoginFormProps {
  onSwitch: () => void;
}

export default function LoginForm({ onSwitch }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        const invalid = /invalid|credentials/i.test(signInError.message);
        throw new Error(
          invalid ? "이메일 또는 비밀번호가 올바르지 않습니다." : signInError.message,
        );
      }
    } catch (err) {
      const message = (err as Error).message || "로그인에 실패했습니다.";
      if (isNetworkErrorMessage(message)) {
        setError(
          "서버에 연결할 수 없습니다. 네트워크 상태를 확인하고, 잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.",
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground-800">이메일(아이디)</span>
        <span className="flex items-center gap-2 rounded-md border border-background-300 bg-background-50 px-3 py-2.5 focus-within:border-primary-400">
          <i className="ri-mail-line text-foreground-500" aria-hidden="true"></i>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="example@email.com"
            className="w-full bg-transparent text-sm text-foreground-950 outline-none placeholder:text-foreground-400"
          />
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground-800">비밀번호</span>
        <span className="flex items-center gap-2 rounded-md border border-background-300 bg-background-50 px-3 py-2.5 focus-within:border-primary-400">
          <i className="ri-lock-line text-foreground-500" aria-hidden="true"></i>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="비밀번호 입력"
            className="w-full bg-transparent text-sm text-foreground-950 outline-none placeholder:text-foreground-400"
          />
        </span>
      </label>

      {error && (
        <p className="flex items-center gap-1.5 rounded-md bg-primary-50 px-3 py-2 text-xs font-medium text-primary-800">
          <i className="ri-error-warning-line" aria-hidden="true"></i>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary-500 px-4 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-foreground-950"
      >
        <i className={loading ? "ri-loader-4-line animate-spin" : "ri-login-box-line"} aria-hidden="true"></i>
        {loading ? "로그인 중..." : "로그인"}
      </button>

      <p className="text-center text-xs text-foreground-600">
        아직 회원이 아니신가요?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="cursor-pointer font-semibold text-primary-700 hover:underline"
        >
          회원가입
        </button>
      </p>
    </form>
  );
}