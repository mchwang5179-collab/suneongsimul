import { useEffect, useRef } from "react";
import { LISTENING_EVENT_ID, PHASE_ICON, PHASE_LABEL } from "@/mocks/csatSchedule";
import type { CsatSchedule } from "@/mocks/csatSchedule";

interface AnnouncementListProps {
  schedule: CsatSchedule;
  activeEventId: string | null;
  onJump: (eventId: string) => void;
}

export default function AnnouncementList({
  schedule,
  activeEventId,
  onJump,
}: AnnouncementListProps) {
  const events = schedule.events;
  const listRef = useRef<HTMLUListElement>(null);

  /* 방송이 넘어가면 현재 재생 중인 항목이 목록에 자동으로 따라오게 한다.
     페이지 전체는 그대로 두고 목록 컨테이너만 부드럽게 스크롤한다. */
  useEffect(() => {
    const list = listRef.current;
    if (!activeEventId || !list) return;
    const target = list.querySelector<HTMLElement>(
      `[data-event-id="${activeEventId}"]`,
    );
    if (!target) return;

    const listRect = list.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const pad = 8;

    if (targetRect.top < listRect.top) {
      list.scrollTo({
        top: list.scrollTop + (targetRect.top - listRect.top) - pad,
        behavior: "smooth",
      });
    } else if (targetRect.bottom > listRect.bottom) {
      list.scrollTo({
        top: list.scrollTop + (targetRect.bottom - listRect.bottom) + pad,
        behavior: "smooth",
      });
    }
  }, [activeEventId]);

  return (
    <section className="rounded-lg border border-background-200 bg-background-50 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="ri-play-list-line text-lg text-primary-700" aria-hidden="true"></i>
          <h2 className="font-heading text-base font-bold text-foreground-950">
            안내방송 목록
          </h2>
        </div>
        <span className="rounded-full bg-background-200 px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-foreground-700">
          {events.length}개
        </span>
      </div>

      <p className="mt-3 flex items-center gap-1.5 rounded-md bg-accent-100 px-3 py-2 text-sm font-semibold text-accent-900">
        <i className="ri-cursor-line text-base" aria-hidden="true"></i>
        항목을 클릭하면 해당 시각으로 바로 이동해 그 안내방송을 재생합니다.
      </p>

      <ul
        ref={listRef}
        className="csat-scroll mt-4 max-h-[560px] space-y-2 overflow-y-auto pr-1"
      >
        {events.map((event) => {
          const active = activeEventId === event.id;
          return (
            <li key={event.id}>
              <button
                type="button"
                data-event-id={event.id}
                onClick={() => onJump(event.id)}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-md border p-3 text-left transition-colors ${
                  active
                    ? "border-primary-400 bg-primary-100"
                    : "border-background-200 bg-background-100 hover:bg-background-200/70"
                }`}
              >
                <span className="w-10 shrink-0 text-[11px] font-semibold tabular-nums text-foreground-600">
                  {event.time}
                </span>
                <i
                  className={`${PHASE_ICON[event.type]} shrink-0 text-base ${
                    active ? "text-primary-700" : "text-foreground-500"
                  }`}
                  aria-hidden="true"
                ></i>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-foreground-900">
                    {event.title}
                  </span>
                  <span className="block text-[10px] text-foreground-500">
                    {event.period} · {PHASE_LABEL[event.type]}
                  </span>
                </span>
                {event.id === LISTENING_EVENT_ID ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold text-primary-900">
                    <i className="ri-headphone-line" aria-hidden="true"></i>
                    듣기
                  </span>
                ) : event.audioNo ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-semibold text-accent-900">
                    <i className="ri-album-fill" aria-hidden="true"></i>
                    {event.audioNo}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-background-200 px-1.5 py-0.5 text-[10px] font-medium text-foreground-500">
                    자막
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}