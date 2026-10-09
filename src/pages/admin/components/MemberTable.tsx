import type { Profile } from "@/hooks/useAuth";
import { formatDate, formatDateTime } from "@/utils/membership";

export type DisplayStatus = "pending" | "approved" | "rejected" | "expired" | "renew_pending";

export function getDisplayStatus(profile: Profile): DisplayStatus {
  if (profile.status === "renew_pending") return "renew_pending";
  if (profile.status === "approved" && profile.expires_at) {
    if (new Date(profile.expires_at).getTime() < Date.now()) return "expired";
  }
  return profile.status;
}

const STATUS_META: Record<DisplayStatus, { label: string; className: string; icon: string }> = {
  pending: {
    label: "승인 대기",
    className: "bg-primary-100 text-primary-800",
    icon: "ri-time-line",
  },
  renew_pending: {
    label: "재가입 대기",
    className: "bg-secondary-100 text-secondary-900",
    icon: "ri-refresh-line",
  },
  approved: {
    label: "이용 중",
    className: "bg-accent-100 text-accent-900",
    icon: "ri-checkbox-circle-fill",
  },
  rejected: {
    label: "승인 거절",
    className: "bg-secondary-200 text-secondary-900",
    icon: "ri-close-circle-line",
  },
  expired: {
    label: "기간 만료",
    className: "bg-background-200 text-foreground-700",
    icon: "ri-hourglass-line",
  },
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}
    >
      <i className={meta.icon} aria-hidden="true"></i>
      {meta.label}
    </span>
  );
}

interface MemberTableProps {
  members: Profile[];
  busyId: string | null;
  onApprove: (member: Profile) => void;
  onReject: (member: Profile) => void;
  onDelete: (member: Profile) => void;
}

export default function MemberTable({
  members,
  busyId,
  onApprove,
  onReject,
  onDelete,
}: MemberTableProps) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-background-300 bg-background-50 px-4 py-14 text-center">
        <i className="ri-inbox-line text-2xl text-foreground-400" aria-hidden="true"></i>
        <p className="text-sm text-foreground-600">해당하는 회원이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-background-200 bg-background-50">
      <div className="hidden grid-cols-[1.4fr_0.8fr_1fr_0.9fr_auto] gap-3 border-b border-background-200 bg-background-100 px-4 py-3 text-xs font-semibold text-foreground-600 lg:grid">
        <span>회원</span>
        <span>연락처</span>
        <span>신청일 / 만료일</span>
        <span>상태</span>
        <span className="text-right">관리</span>
      </div>

      <ul className="divide-y divide-background-200">
        {members.map((member) => {
          const status = getDisplayStatus(member);
          const busy = busyId === member.id;
          const isAdminMember = member.role === "admin";
          const awaiting = status === "pending" || status === "renew_pending";
          return (
            <li
              key={member.id}
              className="grid grid-cols-1 gap-3 px-4 py-4 lg:grid-cols-[1.4fr_0.8fr_1fr_0.9fr_auto] lg:items-center"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-foreground-950">
                    {member.name || "(이름 없음)"}
                  </span>
                  {isAdminMember && (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-800">
                      <i className="ri-shield-star-line" aria-hidden="true"></i>
                      운영자
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-foreground-600">{member.email}</p>
              </div>

              <div className="text-xs text-foreground-700">
                <span className="lg:hidden text-foreground-400">연락처 · </span>
                {member.phone || "-"}
              </div>

              <div className="text-xs text-foreground-700">
                <p>신청 {formatDateTime(member.created_at)}</p>
                <p className="text-foreground-500">
                  {isAdminMember
                    ? "만료 없음"
                    : member.expires_at
                      ? `만료 ${formatDate(member.expires_at)}`
                      : "승인 시 1년"}
                </p>
              </div>

              <div>
                <StatusBadge status={status} />
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                {!isAdminMember && awaiting && (
                  <button
                    type="button"
                    onClick={() => onApprove(member)}
                    disabled={busy}
                    className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md bg-accent-500 px-3 py-1.5 text-xs font-semibold text-background-50 transition-colors hover:bg-accent-600 disabled:opacity-60 dark:text-foreground-950"
                  >
                    <i className="ri-check-line" aria-hidden="true"></i>
                    {status === "renew_pending" ? "재승인" : "승인"}
                  </button>
                )}
                {!isAdminMember && status === "expired" && (
                  <button
                    type="button"
                    onClick={() => onApprove(member)}
                    disabled={busy}
                    className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md bg-accent-500 px-3 py-1.5 text-xs font-semibold text-background-50 transition-colors hover:bg-accent-600 disabled:opacity-60 dark:text-foreground-950"
                  >
                    <i className="ri-check-line" aria-hidden="true"></i>
                    연장 승인
                  </button>
                )}
                {!isAdminMember && awaiting && (
                  <button
                    type="button"
                    onClick={() => onReject(member)}
                    disabled={busy}
                    className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md border border-background-300 px-3 py-1.5 text-xs font-medium text-foreground-700 transition-colors hover:bg-background-100 disabled:opacity-60"
                  >
                    <i className="ri-close-line" aria-hidden="true"></i>
                    거절
                  </button>
                )}
                {!isAdminMember && (
                  <button
                    type="button"
                    onClick={() => onDelete(member)}
                    disabled={busy}
                    className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50 disabled:opacity-60"
                  >
                    <i className="ri-delete-bin-6-line" aria-hidden="true"></i>
                    삭제
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}