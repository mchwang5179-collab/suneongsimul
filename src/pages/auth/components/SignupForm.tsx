import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import BankInfoCard from "@/components/feature/BankInfoCard";
import { MEMBERSHIP_FEE, formatFee } from "@/utils/membership";

interface SignupFormProps {
  onSwitch: () => void;
  onApplied: () => void;
}

export default function SignupForm({ onSwitch, onApplied }: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("이름을 입력해 주세요. (입금자명과 동일하게)");
      return;
    }
    if (!email.trim()) {
      setError("이메일(아이디)을 입력해 주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    if (!agreed) {
      setError("가입 안내 사항을 확인하고 동의해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("register-member", {
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
        },
      });

      if (fnError) {
        let message = "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.";
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

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;

      onApplied();
    } catch (err) {
      setError((err as Error).message || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="rounded-lg border border-accent-200 bg-accent-50 p-3 text-xs leading-relaxed text-accent-900">
        <p className="flex items-start gap-1.5">
          <i className="ri-scales-3-line mt-0.5" aria-hidden="true"></i>
          <span>
            가입비 <strong className="font-semibold">{formatFee(MEMBERSHIP_FEE)}원</strong>을 입금하면{" "}
            <strong className="font-semibold">1년간</strong> 이용할 수 있습니다. 1년이 지나면 계정은
            삭제되지 않고 이용이 중단되며, 가입비를 다시 입금하고 재가입을 신청하면 운영자 재승인 후{" "}
            <strong className="font-semibold">1년 더</strong> 이용할 수 있습니다.
          </span>
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground-800">
          이름 <span className="text-primary-700">(입금자명과 동일)</span>
        </span>
        <span className="flex items-center gap-2 rounded-md border border-background-300 bg-background-50 px-3 py-2.5 focus-within:border-primary-400">
          <i className="ri-user-line text-foreground-500" aria-hidden="true"></i>
          <input
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="홍길동"
            className="w-full bg-transparent text-sm text-foreground-950 outline-none placeholder:text-foreground-400"
          />
        </span>
      </label>

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
        <span className="text-sm font-medium text-foreground-800">
          연락처 <span className="text-foreground-500">(선택)</span>
        </span>
        <span className="flex items-center gap-2 rounded-md border border-background-300 bg-background-50 px-3 py-2.5 focus-within:border-primary-400">
          <i className="ri-phone-line text-foreground-500" aria-hidden="true"></i>
          <input
            type="tel"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="010-0000-0000"
            className="w-full bg-transparent text-sm text-foreground-950 outline-none placeholder:text-foreground-400"
          />
        </span>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground-800">비밀번호</span>
          <span className="flex items-center gap-2 rounded-md border border-background-300 bg-background-50 px-3 py-2.5 focus-within:border-primary-400">
            <i className="ri-lock-line text-foreground-500" aria-hidden="true"></i>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="6자 이상"
              className="w-full bg-transparent text-sm text-foreground-950 outline-none placeholder:text-foreground-400"
            />
          </span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground-800">비밀번호 확인</span>
          <span className="flex items-center gap-2 rounded-md border border-background-300 bg-background-50 px-3 py-2.5 focus-within:border-primary-400">
            <i className="ri-lock-2-line text-foreground-500" aria-hidden="true"></i>
            <input
              type="password"
              name="passwordConfirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="한 번 더 입력"
              className="w-full bg-transparent text-sm text-foreground-950 outline-none placeholder:text-foreground-400"
            />
          </span>
        </label>
      </div>

      <BankInfoCard />

      <label className="flex items-start gap-2 text-xs leading-relaxed text-foreground-700">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[oklch(var(--primary-500))]"
        />
        <span>
          가입비 입금 후 <strong className="font-semibold text-foreground-900">입금자명</strong>과{" "}
          <strong className="font-semibold text-foreground-900">가입 이름</strong>이 같아야
          승인되며, 입금 확인 후 운영자가 승인한다는 점에 동의합니다.
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
        <i
          className={loading ? "ri-loader-4-line animate-spin" : "ri-user-add-line"}
          aria-hidden="true"
        ></i>
        {loading ? "가입 신청 중..." : "가입 신청하기"}
      </button>

      <p className="text-center text-xs text-foreground-600">
        이미 회원이신가요?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="cursor-pointer font-semibold text-primary-700 hover:underline"
        >
          로그인
        </button>
      </p>
    </form>
  );
}