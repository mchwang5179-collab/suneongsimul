import type { CsatSchedule, TimetableRow } from "@/mocks/csatSchedule";

interface TimetableProps {
  schedule: CsatSchedule;
  activeRowId: string | null;
  currentMin: number;
}

export default function Timetable({
  schedule,
  activeRowId,
  currentMin,
}: TimetableProps) {
  const rows = schedule.timetableRows;
  const isOutOfRange = currentMin >= schedule.endMin;

  const rowBase: Record<TimetableRow["kind"], string> = {
    banner: "bg-primary-100/50",
    break: "bg-secondary-100/70",
    exam: "bg-background-50",
    footer: "bg-accent-100/70",
  };

  const groupActive = (index: number) => {
    const row = rows[index];
    if (!row.periodRowSpan) return activeRowId === row.id;
    for (let k = index; k < index + row.periodRowSpan; k += 1) {
      if (rows[k]?.id === activeRowId) return true;
    }
    return false;
  };

  const activeMark = (active: boolean) =>
    active ? (
      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary-500 px-2 py-0.5 align-middle text-[10px] font-semibold text-background-50 dark:text-foreground-950">
        <span className="h-1.5 w-1.5 rounded-full bg-background-50"></span>
        진행 중
      </span>
    ) : null;

  const td = "px-3 py-3 align-middle text-center";

  return (
    <section className="rounded-lg border border-background-200 bg-background-50 p-5 md:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <i className="ri-table-line text-lg text-primary-700" aria-hidden="true"></i>
          <h2 className="font-heading text-lg font-bold text-foreground-950">
            시험 시간표
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-0.5 text-[11px] font-medium text-secondary-900">
          <i className="ri-calendar-line" aria-hidden="true"></i>
          {schedule.info.longLabel}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-primary-500 font-heading text-background-50 dark:text-foreground-950">
              <th className="w-[70px] border border-primary-600 px-3 py-3 font-semibold">
                교시
              </th>
              <th className="border border-primary-600 px-3 py-3 font-semibold">
                시험영역
              </th>
              <th className="w-[210px] border border-primary-600 px-3 py-3 font-semibold">
                시험시간 (소요시간)
              </th>
              <th className="w-[80px] border border-primary-600 px-3 py-3 font-semibold">
                문항 수
              </th>
              <th className="w-[240px] border border-primary-600 px-3 py-3 font-semibold">
                비고
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const active = activeRowId === row.id;
              const cls = [
                "border-b border-background-200 transition-colors",
                isOutOfRange ? "opacity-55" : "",
                active ? "bg-primary-100" : rowBase[row.kind],
              ].join(" ");

              if (row.kind === "banner" || row.kind === "break" || row.kind === "footer") {
                const textColor =
                  row.kind === "footer"
                    ? "font-semibold text-accent-900"
                    : row.kind === "banner"
                      ? "font-semibold text-primary-900"
                      : "font-medium text-secondary-900";
                return (
                  <tr key={row.id} className={cls}>
                    <td
                      colSpan={5}
                      className={`border border-background-200 px-4 py-3 text-center ${textColor}`}
                    >
                      {row.text}
                      {activeMark(active)}
                    </td>
                  </tr>
                );
              }

              const isGroupStart = Boolean(row.period);
              const showPeriodActive = isGroupStart ? groupActive(index) : false;

              return (
                <tr key={row.id} className={cls}>
                  {row.period ? (
                    <td
                      rowSpan={row.periodRowSpan ?? 1}
                      className={`${td} border border-background-200 font-heading font-bold ${
                        showPeriodActive
                          ? "bg-primary-100 text-primary-900"
                          : "text-foreground-900"
                      }`}
                    >
                      {row.period}
                    </td>
                  ) : null}
                  <td className={`${td} font-medium text-foreground-900`}>
                    {row.area?.includes("\n") ? (
                      <span className="whitespace-pre-line">{row.area}</span>
                    ) : (
                      row.area
                    )}
                    {activeMark(active)}
                  </td>
                  <td className={`${td} tabular-nums text-foreground-800`}>
                    {row.time}
                    {row.duration ? (
                      <>
                        {" "}
                        <span className="text-foreground-500">({row.duration})</span>
                      </>
                    ) : null}
                  </td>
                  <td
                    className={`${td} tabular-nums ${
                      row.questions === "—"
                        ? "text-foreground-400"
                        : "text-foreground-800"
                    }`}
                  >
                    {row.questions}
                  </td>
                  <td
                    className={`${td} text-[12px] leading-snug ${
                      !row.note || row.note === "—"
                        ? "text-foreground-400"
                        : "text-foreground-600"
                    }`}
                  >
                    {row.note?.includes("\n") ? (
                      <span className="whitespace-pre-line">{row.note}</span>
                    ) : (
                      row.note || "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-foreground-500">
        ※ 이 시뮬레이터는 {schedule.meta.range}까지의 안내방송을 실제 방송
        순서대로 재현합니다.
      </p>
    </section>
  );
}