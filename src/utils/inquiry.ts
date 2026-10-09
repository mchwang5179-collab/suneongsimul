export type InquiryStatus = "pending" | "answered";

export interface Inquiry {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  title: string;
  content: string;
  status: InquiryStatus;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
}

export const INQUIRY_MAX_LENGTH = 500;

export const INQUIRY_STATUS_META: Record<
  InquiryStatus,
  { label: string; className: string; icon: string }
> = {
  pending: {
    label: "답변 대기",
    className: "bg-primary-100 text-primary-800",
    icon: "ri-time-line",
  },
  answered: {
    label: "답변 완료",
    className: "bg-accent-100 text-accent-900",
    icon: "ri-checkbox-circle-fill",
  },
};