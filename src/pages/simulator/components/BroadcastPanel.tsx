import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { PHASE_ICON, PHASE_LABEL, SPEED_OPTIONS } from "@/mocks/csatSchedule";
import type { CsatEvent, CsatSchedule } from "@/mocks/csatSchedule";
import type { CsatPhrase } from "@/mocks/csatPhrases";
import type { SimStatus } from "@/hooks/useCsatSimulator";

interface BroadcastPanelProps {
  schedule: CsatSchedule;
  status: SimStatus;
  clock: string;
  progress: number;
  activeEvent: CsatEvent | null;
  nextEvent: CsatEvent | null;
  phrase: CsatPhrase | null;
  speaking: boolean;
  listeningReady: boolean;
  speed: number;
  remainingLabel: string;
  volume: number;
  onVolumeChange: (value: number) => void;
  onSpeedChange: (value: number) => void;
  onSeekMinute: (minute: number) => void;
  onToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
}

const STATUS_TEXT: Record<SimStatus, string> = {
  idle: "대기 중",
  running: "방송 진행 중",
  paused: "일시정지",
  finished: "방송 종료",
};

export default function BroadcastPanel({
  schedule,
  status,
  clock,
  progress,
  activeEvent,
  nextEvent,
  phrase,
  speaking,
  listeningReady,
  speed,
  remainingLabel,
  volume,
  onVolumeChange,
  onSpeedChange,
  onSeekMinute,
  onToggle,
  onPrevious,
  onNext,
  onReset,
}: BroadcastPanelProps) {
  const isLive = status === "running";
  const activeIsListening = activeEvent?.id === schedule.listeningEventId;
  const activeHasAudio = Boolean(activeEvent) && (
    activeIsListening ? listeningReady : Boolean(activeEvent?.audioUrl)
  );
  const isSilentSegment = Boolean(activeEvent) && !activeHasAudio;
  const volumePercent = Math.round(volume * 100);
  const volumeIcon =
    volume === 0
      ? "ri-volume-mute-line"
      : volume < 0.5
        ? "ri-volume-down-line"
        : "ri-volume-up-line";
  const [rangeStart, rangeEnd] = schedule.meta.range.split(" ~ ");
  const { events, startMin, endMin, presets } = schedule;

  const trackRef = useRef<HTMLButtonElement>(null);
  const scrubbingRef = useRef(false);
  const lastSeekRef = useRef<number | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);

  const totalSpan = endMin - startMin;
  const ratioOf = (minute: number) => (minute - startMin) / totalSpan;

  const pad2 = (value: number) => String(value).padStart(2, "0");

  const toClock = (minute: number) => {
    const h = Math.floor(minute / 60);
    const m = minute % 60;
    return `${pad2(h)}:${pad2(m)}`;
  };

  const resolvePointer = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return null;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return { ratio, minute: Math.round(startMin + ratio * totalSpan) };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const res = resolvePointer(event.clientX);
    if (!res) return;
    scrubbingRef.current = true;
    setScrubbing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    lastSeekRef.current = res.minute;
    setHoverRatio(res.ratio);
    onSeekMinute(res.minute);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const res = resolvePointer(event.clientX);
    if (!res) return;
    setHoverRatio(res.ratio);
    if (scrubbingRef.current && res.minute !== lastSeekRef.current) {
      lastSeekRef.current = res.minute;
      onSeekMinute(res.minute);
    }
  };

  const endScrub = (event: ReactPointerEvent<HTMLButtonElement>) => {
    scrubbingRef.current = false;
    setScrubbing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const segments = events.map((event, index) => {
    const next = events[index + 1];
    const start = event.clockMin;
    const end = next ? next.clockMin : endMin;
    const isListening = event.id === schedule.listeningEventId;
    return {
      id: event.id,
      left: ratioOf(start) * 100,
      width: (ratioOf(end) - ratioOf(start)) * 100,
      isListening,
      hasAudio: isListening || Boolean(event.audioUrl),
    };
  });

  const hoverMinute =
    hoverRatio === null ? null : Math.round(startMin + hoverRatio * totalSpan);

  const [clockHourPart, clockMinutePart] = clock.split(":").map(Number);
  const currentMinute =
    (Number.isFinite(clockHourPart) ? clockHourPart : 0) * 60 +
    (Number.isFinite(clockMinutePart) ? clockMinutePart : 0);

  const [jumpHour, setJumpHour] = useState(() => Math.floor(currentMinute / 60));
  const [jumpMin, setJumpMin] = useState(() => currentMinute % 60);

  useEffect(() => {
    const next = Math.min(endMin, Math.max(startMin, currentMinute));
    setJumpHour(Math.floor(next / 60));
    setJumpMin(next % 60);
  }, [schedule.id, startMin, endMin, currentMinute]);

  const hourOptions = Array.from(
    { length: Math.floor(endMin / 60) - Math.floor(startMin / 60) + 1 },
    (_, index) => Math.floor(startMin / 60) + index,
  );
  const minuteOptions = Array.from({ length: 60 }, (_, index) => index);

  const jumpRaw = jumpHour * 60 + jumpMin;
  const jumpClamped = Math.min(endMin, Math.max(startMin, jumpRaw));
  const jumpOutOfRange = jumpRaw < startMin || jumpRaw > endMin;
  const jumpClampedLabel = toClock(jumpClamped);

  const handleJumpTime = () => {
    onSeekMinute(jumpClamped);
  };

  const handlePresetTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    setJumpHour(h);
    setJumpMin(m);
    onSeekMinute(h * 60 + m);
  };

  return (
    <section className="rounded-lg border border-background-200 bg-background-50 p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 text-accent-700">
            <i className="ri-broadcast-line text-lg" aria-hidden="true"></i>
            {isLive && (
              <span className="absolute inset-0 rounded-full animate-pulse-ring"></span>
            )}
          </span>
          <div>
            <p className="font-heading text-base font-bold text-foreground-950">
              시험장 안내방송
            </p>
            <p className="text-xs text-foreground-500">
              시간표에 맞추어 자동으로 진행됩니다
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
              isLive
                ? "bg-accent-100 text-accent-900"
                : "bg-secondary-100 text-secondary-900"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isLive ? "bg-accent-500" : "bg-secondary-400"
              }`}
            ></span>
            {STATUS_TEXT[status]}
          </span>
          {isSilentSegment && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground-950 px-3 py-1 text-xs font-semibold text-background-50">
              <i className="ri-volume-mute-line text-sm" aria-hidden="true"></i>
              자막 안내 중 (무음)
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-background-200 bg-background-100 px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground-900">
          <i className="ri-time-line text-primary-700" aria-hidden="true"></i>
          시각 지정 이동
        </span>

        <div className="flex items-center gap-1.5">
          <select
            value={jumpHour}
            onChange={(event) => setJumpHour(Number(event.target.value))}
            aria-label="시 선택"
            className="cursor-pointer rounded-md border border-background-300 bg-background-50 px-2 py-1.5 text-sm font-semibold tabular-nums text-foreground-900 outline-none"
          >
            {hourOptions.map((value) => (
              <option key={value} value={value}>
                {pad2(value)}시
              </option>
            ))}
          </select>
          <span className="font-heading text-base font-bold text-foreground-400">
            :
          </span>
          <select
            value={jumpMin}
            onChange={(event) => setJumpMin(Number(event.target.value))}
            aria-label="분 선택"
            className="cursor-pointer rounded-md border border-background-300 bg-background-50 px-2 py-1.5 text-sm font-semibold tabular-nums text-foreground-900 outline-none"
          >
            {minuteOptions.map((value) => (
              <option key={value} value={value}>
                {pad2(value)}분
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleJumpTime}
          className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-500 px-3 py-1.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600 dark:text-foreground-950"
        >
          <i className="ri-play-circle-line text-base" aria-hidden="true"></i>
          {toClock(jumpRaw)}부터 재생
        </button>

        {jumpOutOfRange && (
          <span className="inline-flex items-center gap-1 text-[11px] text-accent-700">
            <i className="ri-information-line" aria-hidden="true"></i>
            방송 범위 밖이라 {jumpClampedLabel}로 이동
          </span>
        )}

        <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
          {presets.map((preset) => (
            <button
              key={preset.time}
              type="button"
              onClick={() => handlePresetTime(preset.time)}
              className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border border-background-300 bg-background-50 px-2.5 py-1 text-[11px] font-medium text-foreground-800 transition-colors hover:bg-background-200/70"
            >
              <span className="tabular-nums text-foreground-500">
                {preset.time}
              </span>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-foreground-500">
              현재 시각
            </p>
            <p className="font-heading text-5xl font-bold tabular-nums leading-none text-foreground-950 md:text-6xl">
              {clock}
            </p>
          </div>
          {phrase && (
            <div
              key={phrase.year}
              className="animate-fade-in mb-1 max-w-md rounded-lg border border-accent-300 bg-accent-100/70 px-4 py-3"
            >
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-accent-900">
                <i className="ri-quill-pen-line" aria-hidden="true"></i>
                필적확인란 · {phrase.year}학년도
              </p>
              <p className="mt-1 font-heading text-lg font-bold leading-snug text-accent-900 md:text-xl">
                “{phrase.phrase}”
              </p>
              <p className="mt-0.5 text-[11px] text-accent-900/70">
                {phrase.poet}, {phrase.work}
              </p>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-foreground-500">진행률</p>
          <p className="font-heading text-2xl font-bold tabular-nums text-primary-700">
            {Math.round(progress * 100)}%
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="relative">
          <button
            type="button"
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endScrub}
            onPointerCancel={endScrub}
            onPointerLeave={() => {
              if (!scrubbingRef.current) setHoverRatio(null);
            }}
            aria-label="진행 막대를 누르거나 끌어서 원하는 시각으로 이동"
            title="눌러서 그 위치의 시각으로 이동 · 끌어서 스크럽"
            className={`relative block h-3.5 w-full touch-none overflow-hidden rounded-full bg-background-200 ${
              scrubbing ? "cursor-grabbing" : "cursor-pointer"
            }`}
          >
            {segments.map((segment) => (
              <span
                key={segment.id}
                className={`absolute inset-y-0 block border-r border-background-50 ${
                  segment.isListening
                    ? "bg-primary-400"
                    : segment.hasAudio
                      ? "bg-accent-300"
                      : "bg-background-300"
                }`}
                style={{ left: `${segment.left}%`, width: `${segment.width}%` }}
              ></span>
            ))}
            <span
              className="absolute inset-y-0 left-0 block bg-foreground-950/15"
              style={{ width: `${progress * 100}%` }}
            ></span>
          </button>

          <span
            className="pointer-events-none absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background-50 bg-foreground-950"
            style={{ left: `${progress * 100}%` }}
          ></span>

          {hoverMinute !== null && hoverRatio !== null && (
            <span
              className="pointer-events-none absolute bottom-full z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground-950 px-2 py-1 text-[11px] font-semibold tabular-nums text-background-50 shadow-sm"
              style={{ left: `${hoverRatio * 100}%` }}
            >
              {toClock(hoverMinute)}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 text-[11px] tabular-nums text-foreground-500">
          <span>{rangeStart}</span>
          <span className="inline-flex items-center gap-1 font-medium text-secondary-900">
            <i className="ri-hourglass-line" aria-hidden="true"></i>
            남은 방송 {remainingLabel}
          </span>
          <span>{rangeEnd}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-foreground-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary-400"></span>
            영어 듣기평가
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-300"></span>
            실제 방송 음원
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-background-300"></span>
            자막 안내
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-foreground-500">
            <i className="ri-cursor-line" aria-hidden="true"></i>
            클릭·끌어서 이동
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-background-200 bg-background-100 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <i
              className={`${
                activeEvent ? PHASE_ICON[activeEvent.type] : "ri-volume-mute-line"
              } text-lg text-primary-700`}
              aria-hidden="true"
            ></i>
            <span className="font-medium text-foreground-800">
              {activeEvent ? PHASE_LABEL[activeEvent.type] : "방송 준비"}
            </span>
            {activeEvent && (
              <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-[11px] tabular-nums text-secondary-900">
                {activeEvent.time}
              </span>
            )}
          </div>
          {speaking && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-accent-700">
              <i className="ri-volume-up-line" aria-hidden="true"></i>
              음성 송출 중
            </span>
          )}
        </div>

        {activeEvent ? (
          <div key={activeEvent.id} className="animate-fade-in">
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <p className="font-heading text-lg font-bold text-foreground-950">
                {activeEvent.period} · {activeEvent.title}
              </p>
              {activeHasAudio ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-[11px] font-semibold text-accent-900">
                  <i className="ri-album-fill" aria-hidden="true"></i>
                  {activeIsListening
                    ? "영어 듣기 음원"
                    : `실제 방송 음원${activeEvent.audioNo ? ` #${activeEvent.audioNo}` : ""}`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-foreground-950 px-2.5 py-0.5 text-[11px] font-semibold text-background-50">
                  <i className="ri-volume-mute-line" aria-hidden="true"></i>
                  자막 안내 중 (무음)
                </span>
              )}
            </div>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-foreground-800">
              {activeEvent.announcement}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-500">
            아래 방송 시작 버튼을 누르면 08:05 감독관 입실 안내부터 실제 수능
            방송 순서대로 음원이 재생됩니다.
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md bg-primary-500 px-5 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600 dark:text-foreground-950"
        >
          <i
            className={`${
              isLive ? "ri-pause-fill" : "ri-play-fill"
            } text-lg`}
            aria-hidden="true"
          ></i>
          {isLive
            ? "일시정지"
            : status === "finished"
              ? "다시 시작"
              : status === "paused"
                ? "이어서 재생"
                : "방송 시작"}
        </button>
        <button
          type="button"
          onClick={onPrevious}
          className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border border-background-300 bg-background-50 px-4 py-2.5 text-sm font-medium text-foreground-900 transition-colors hover:bg-background-100"
        >
          <i className="ri-skip-back-line text-lg" aria-hidden="true"></i>
          이전 안내로
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border border-background-300 bg-background-50 px-4 py-2.5 text-sm font-medium text-foreground-900 transition-colors hover:bg-background-100"
        >
          <i className="ri-skip-forward-line text-lg" aria-hidden="true"></i>
          다음 안내로
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border border-background-300 bg-background-50 px-4 py-2.5 text-sm font-medium text-foreground-900 transition-colors hover:bg-background-100"
        >
          <i className="ri-restart-line text-lg" aria-hidden="true"></i>
          처음부터
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-background-200 bg-background-100 px-4 py-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <i className="ri-speed-up-line text-lg text-primary-700" aria-hidden="true"></i>
            <span className="text-sm font-semibold text-foreground-900">
              방송 속도
            </span>
            <span className="hidden text-[11px] text-foreground-500 sm:inline">
              방송 속도를 바꾸면 시계와 실제 방송 음원이 같은 속도로 진행됩니다
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SPEED_OPTIONS.map((option) => {
              const active = option.value === speed;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSpeedChange(option.value)}
                  className={`cursor-pointer whitespace-nowrap rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors ${
                    active
                      ? "border-primary-400 bg-primary-500 text-background-50 dark:text-foreground-950"
                      : "border-background-200 bg-background-50 text-foreground-800 hover:bg-background-200/70"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-background-200 pt-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <i
              className={`${volumeIcon} text-lg text-primary-700`}
              aria-hidden="true"
            ></i>
            <span className="text-sm font-semibold text-foreground-900">
              안내방송 음량
            </span>
            <span className="hidden text-[11px] text-foreground-500 sm:inline">
              방송이 너무 크거나 작으면 조절하세요
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={volumePercent}
              onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
              aria-label="안내방송 음량"
              className="h-1.5 w-full max-w-[260px] cursor-pointer appearance-none rounded-full bg-background-300 accent-primary-500 lg:w-56"
            />
            <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground-900">
              {volumePercent}%
            </span>
          </div>
        </div>
        <p className="flex items-start gap-1.5 border-t border-background-200 pt-3 text-[13px] font-medium leading-relaxed text-primary-700">
          <i className="ri-lightbulb-line mt-0.5 text-base text-primary-600" aria-hidden="true"></i>
          재생속도를 높여서 모의시험을 진행하면 시험시간관리 연습에 도움이 됩니다.
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-md bg-secondary-100/70 px-3 py-2 text-xs text-secondary-900">
        <i className="ri-arrow-right-line" aria-hidden="true"></i>
        {nextEvent ? (
          <span>
            다음 안내: <strong className="font-semibold">{nextEvent.time}</strong>{" "}
            {nextEvent.period} · {nextEvent.title}
          </span>
        ) : (
          <span>예정된 안내방송이 모두 끝났습니다.</span>
        )}
      </div>
    </section>
  );
}