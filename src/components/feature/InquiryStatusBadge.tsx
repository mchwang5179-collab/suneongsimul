import { INQUIRY_STATUS_META, type InquiryStatus } from "@/utils/inquiry";

export default function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  const meta = INQUIRY_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}
    >
      <i className={meta.icon} aria-hidden="true"></i>
      {meta.label}
    </span>
  );
}