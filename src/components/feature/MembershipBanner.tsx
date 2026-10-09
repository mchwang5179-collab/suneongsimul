import { useAuth } from "@/hooks/useAuth";
import { EXPIRY_WARNING_DAYS, daysUntilExpiry, formatDate } from "@/utils/membership";

export default function MembershipBanner() {
  const { profile, isAdmin, isApproved } = useAuth();

  if (!profile || isAdmin || !isApproved) return null;
  if (!profile.expires_at) return null;

  const days = daysUntilExpiry(profile.expires_at);
  if (days === null || days < 0) return null;

  const expiryLabel = formatDate(profile.expires_at);

  if (days <= EXPIRY_WARNING_DAYS) {
    return (
      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-accent-300 bg-accent-100/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-500 text-background-50 dark:text-foreground-950">
            <i className="ri-alarm-warning-line text-lg" aria-hidden="true"></i>
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-accent-900">
              이용 기간 만료가 다가오고 있습니다
              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-bold text-background-50 dark:text-foreground-950">
                D-{days}
              </span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-accent-900/80">
              만료일 {expiryLabel} · 만료 후에도 계정은 삭제되지 않습니다. 가입비를 다시 입금하고
              재가입을 신청하면 운영자 재승인 후 1년 더 이용할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-background-200 bg-background-50 px-4 py-2.5 text-xs md:px-5">
      <span className="inline-flex items-center gap-1.5 font-semibold text-foreground-800">
        <i className="ri-calendar-check-line text-primary-700" aria-hidden="true"></i>
        내 이용 기간
      </span>
      <span className="text-foreground-600">
        {expiryLabel}까지 이용 가능
        <span className="ml-1.5 inline-flex items-center whitespace-nowrap rounded-full bg-secondary-100 px-2 py-0.5 text-[11px] font-semibold text-secondary-900">
          D-{days}
        </span>
      </span>
    </div>
  );
}