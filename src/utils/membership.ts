export const MEMBERSHIP_FEE = 5000;

export const BANK_INFO = {
  bank: "케이뱅크",
  account: "100-105-356887",
  holder: "황명철",
} as const;

export const MEMBERSHIP_YEARS = 1;

export const EXPIRY_WARNING_DAYS = 30;

export function daysUntilExpiry(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
}

export function formatFee(value: number): string {
  return value.toLocaleString("ko-KR");
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

export function addOneYear(base: Date = new Date()): Date {
  const d = new Date(base);
  d.setFullYear(d.getFullYear() + MEMBERSHIP_YEARS);
  return d;
}