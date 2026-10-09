import { useState } from "react";
import { BANK_INFO, MEMBERSHIP_FEE, formatFee } from "@/utils/membership";

export default function BankInfoCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(BANK_INFO.account);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 md:p-5">
      <div className="flex items-center gap-2 text-primary-800">
        <i className="ri-bank-card-line text-lg" aria-hidden="true"></i>
        <h3 className="text-sm font-bold">입금 계좌 안내</h3>
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-foreground-600">가입비</dt>
          <dd className="font-bold text-foreground-950">{formatFee(MEMBERSHIP_FEE)}원</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-foreground-600">은행</dt>
          <dd className="font-medium text-foreground-900">{BANK_INFO.bank}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-foreground-600">계좌번호</dt>
          <dd className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-foreground-950">
              {BANK_INFO.account}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md border border-primary-300 bg-background-50 px-2 py-1 text-[11px] font-medium text-primary-800 transition-colors hover:bg-primary-100"
            >
              <i
                className={copied ? "ri-check-line" : "ri-file-copy-line"}
                aria-hidden="true"
              ></i>
              {copied ? "복사됨" : "복사"}
            </button>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-foreground-600">예금주</dt>
          <dd className="font-medium text-foreground-900">{BANK_INFO.holder}</dd>
        </div>
      </dl>

      <p className="mt-3 rounded-md bg-background-50 px-3 py-2 text-xs leading-relaxed text-foreground-700">
        <i className="ri-information-line mr-1 text-primary-700" aria-hidden="true"></i>
        <strong className="font-semibold text-foreground-900">
          {formatFee(MEMBERSHIP_FEE)}원
        </strong>
        을 위 계좌로 이체해 주세요. <strong className="font-semibold">이체하신 분의 이름</strong>과{" "}
        <strong className="font-semibold">가입 시 입력한 이름</strong>이 같아야 운영자 확인 후
        승인됩니다.
      </p>
    </div>
  );
}