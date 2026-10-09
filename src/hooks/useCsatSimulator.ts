import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CsatEvent, CsatSchedule } from "@/mocks/csatSchedule";

export type SimStatus = "idle" | "running" | "paused" | "finished";

export type EventHandler = (event: CsatEvent, offsetSeconds: number) => void;

export interface UseCsatSimulatorResult {
  status: SimStatus;
  speed: number;
  seconds: number;
  clock: string;
  clockMinute: string;
  progress: number;
  activeEvent: CsatEvent | null;
  nextEvent: CsatEvent | null;
  activeRowId: string | null;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  jumpTo: (eventId: string) => void;
  jumpToMinute: (minute: number) => void;
  reset: () => void;
  setSpeed: (value: number) => void;
}

export function useCsatSimulator(
  schedule: CsatSchedule,
  onEvent?: EventHandler,
): UseCsatSimulatorResult {
  const { events, startMin, endMin, listeningEventId } = schedule;

  const [status, setStatus] = useState<SimStatus>("idle");
  const [speed, setSpeedState] = useState(1);
  const [seconds, setSeconds] = useState(startMin * 60);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [jumpSeq, setJumpSeq] = useState(0);

  const firedRef = useRef<string[]>([]);
  const speedRef = useRef(speed);
  const handlerRef = useRef(onEvent);

  handlerRef.current = onEvent;

  const setSpeed = useCallback((value: number) => {
    speedRef.current = value;
    setSpeedState(value);
  }, []);

  /* 버전이 바뀌면 방송을 처음 상태로 되돌린다. */
  useEffect(() => {
    firedRef.current = [];
    setActiveEventId(null);
    setSeconds(startMin * 60);
    setStatus("idle");
    setJumpSeq((prev) => prev + 1);
  }, [schedule.id, startMin]);

  /* 진행 시계 — 방송 음원이 재생되는 동안에도 멈추지 않고 계속 흐른다. */
  useEffect(() => {
    if (status !== "running") return undefined;
    const timer = window.setInterval(() => {
      setSeconds((prev) => Math.min(endMin * 60, prev + speedRef.current * (200 / 1000)));
    }, 200);
    return () => window.clearInterval(timer);
  }, [status, endMin]);

  /* 시간이 되면 방송을 발송 */
  useEffect(() => {
    if (status !== "running") return;
    const due = events.filter(
      (event) =>
        event.clockMin * 60 <= seconds && !firedRef.current.includes(event.id),
    );
    if (due.length === 0) return;

    due.forEach((event) => firedRef.current.push(event.id));

    const latest = due[due.length - 1];
    setActiveEventId(latest.id);
    handlerRef.current?.(latest, Math.max(0, seconds - latest.clockMin * 60));
  }, [seconds, status, events, jumpSeq]);

  /* 종료 처리 */
  useEffect(() => {
    if (status === "running" && seconds >= endMin * 60) {
      setStatus("finished");
    }
  }, [seconds, status, endMin]);

  const play = useCallback(() => {
    setStatus((prev) => (prev === "finished" ? prev : "running"));
  }, []);

  const pause = useCallback(() => {
    setStatus((prev) => (prev === "running" ? "paused" : prev));
  }, []);

  const toggle = useCallback(() => {
    setStatus((prev) => {
      if (prev === "running") return "paused";
      if (prev === "idle" || prev === "paused") return "running";
      return prev;
    });
  }, []);

  const next = useCallback(() => {
    const upcoming = events.find((event) => !firedRef.current.includes(event.id));
    if (!upcoming) {
      setSeconds(endMin * 60);
      setStatus("finished");
      return;
    }
    setSeconds(upcoming.clockMin * 60);
    setStatus("running");
  }, [events, endMin]);

  /* 특정 안내방송 시각으로 이동해 바로 재생한다. */
  const jumpTo = useCallback(
    (eventId: string) => {
      const target = events.find((event) => event.id === eventId);
      if (!target) return;
      const targetTime = target.clockMin * 60;

      const listeningEvent = events.find((event) => event.id === listeningEventId);
      const afterListening = listeningEvent
        ? events.find((event) => event.clockMin > listeningEvent.clockMin)
        : undefined;
      const listeningStart = listeningEvent ? listeningEvent.clockMin * 60 : -1;
      const listeningEnd = listeningEvent
        ? (afterListening ? afterListening.clockMin * 60 : endMin * 60)
        : -1;
      /* 듣기 구간(예: 13:07~14:10) 안으로 이동하면, 듣기 음원을 '아직 재생되지
         않은 방송'으로 남겨 이동 직후 그 자리에서 바로 재생되게 한다. */
      const inListeningRange =
        listeningEvent !== undefined &&
        targetTime >= listeningStart &&
        targetTime < listeningEnd;

      firedRef.current = events
        .filter(
          (event) =>
            event.clockMin * 60 < targetTime &&
            !(inListeningRange && event.id === listeningEventId),
        )
        .map((event) => event.id);
      setActiveEventId(null);
      setSeconds(targetTime);
      setStatus("running");
      setJumpSeq((prev) => prev + 1);
    },
    [events, endMin, listeningEventId],
  );

  /* 임의의 시각(분 단위)으로 이동해 그 시점부터 방송을 이어서 재생한다. */
  const jumpToMinute = useCallback(
    (minute: number) => {
      const clamped = Math.min(endMin, Math.max(startMin, Math.round(minute)));
      const targetTime = clamped * 60;

      const listeningEvent = events.find((event) => event.id === listeningEventId);
      const afterListening = listeningEvent
        ? events.find((event) => event.clockMin > listeningEvent.clockMin)
        : undefined;
      const listeningStart = listeningEvent ? listeningEvent.clockMin * 60 : -1;
      const listeningEnd = listeningEvent
        ? (afterListening ? afterListening.clockMin * 60 : endMin * 60)
        : -1;
      /* 듣기 구간(예: 13:07~14:10) 안으로 이동하면, 듣기 음원을 '아직 재생되지
         않은 방송'으로 남겨 이동 직후 그 자리에서 바로 재생되게 한다. */
      const inListeningRange =
        listeningEvent !== undefined &&
        targetTime >= listeningStart &&
        targetTime < listeningEnd;

      firedRef.current = events
        .filter(
          (event) =>
            event.clockMin * 60 < targetTime &&
            !(inListeningRange && event.id === listeningEventId),
        )
        .map((event) => event.id);
      const before = events.filter((event) => event.clockMin * 60 <= targetTime);
      const lastBefore = before[before.length - 1];
      setActiveEventId(lastBefore ? lastBefore.id : null);
      setSeconds(targetTime);
      setStatus(targetTime >= endMin * 60 ? "finished" : "running");
      setJumpSeq((prev) => prev + 1);
    },
    [events, startMin, endMin, listeningEventId],
  );

  /* 직전 안내방송 시각으로 이동해 바로 재생한다. */
  const previous = useCallback(() => {
    const anchor = activeEventId
      ? events.find((event) => event.id === activeEventId)
      : undefined;
    const refTime = anchor ? anchor.clockMin * 60 : seconds;
    const before = events.filter((event) => event.clockMin * 60 < refTime);
    if (before.length === 0) return;
    jumpTo(before[before.length - 1].id);
  }, [activeEventId, seconds, events, jumpTo]);

  const reset = useCallback(() => {
    firedRef.current = [];
    setActiveEventId(null);
    setSeconds(startMin * 60);
    setStatus("idle");
  }, [startMin]);

  const activeEvent = useMemo(
    () => events.find((event) => event.id === activeEventId) ?? null,
    [events, activeEventId],
  );

  const nextEvent = useMemo(
    () => events.find((event) => event.clockMin * 60 > seconds) ?? null,
    [events, seconds],
  );

  const progress = Math.min(
    1,
    Math.max(0, (seconds - startMin * 60) / (endMin * 60 - startMin * 60)),
  );

  return {
    status,
    speed,
    seconds,
    clock: formatClock(seconds),
    clockMinute: formatMinute(seconds),
    progress,
    activeEvent,
    nextEvent,
    activeRowId: activeEvent?.rowId ?? null,
    play,
    pause,
    toggle,
    next,
    previous,
    jumpTo,
    jumpToMinute,
    reset,
    setSpeed,
  };
}

export function formatClock(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatMinute(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}`;
}