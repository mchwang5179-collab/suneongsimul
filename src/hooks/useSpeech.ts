import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseSpeechResult {
  supported: boolean;
  speaking: boolean;
  /** 실제 방송 음원을 재생한다. 음원이 없으면 아무 소리도 내지 않는다. */
  playAnnouncement: (audioUrl?: string, onDone?: () => void) => void;
  /**
   * 영어 듣기 음원을 '보호 채널'로 재생한다.
   * 재생이 끝날 때까지 다른 안내방송이 끼어들어 끊지 못한다.
   * startOffset(초)을 주면 그 위치부터 이어서 재생한다.
   * (예: 13:30으로 이동 → 13:07에서 23분 지난 지점부터 재생)
   */
  playListening: (
    audioUrl?: string,
    onDone?: () => void,
    startOffset?: number,
  ) => void;
  /**
   * 영어 듣기 플레이어를 미리 준비(unlock + 선버퍼링)한다.
   * 사용자가 버튼을 누르는 순간(제스처)에 호출해야 브라우저가 이후
   * 타이머 자동 재생을 막지 않는다.
   */
  primeListening: (audioUrl?: string) => void;
  /**
   * 재생 중인 영어 듣기 음원을 즉시 멈춘다.
   * (예: 듣기 방송 이후의 안내로 넘어갈 때 듣기가 끊기지 않고 계속 나오는 것을 방지)
   */
  stopListening: () => void;
  /** 재생 배속을 설정한다. (기본 1배속) */
  setRate: (value: number) => void;
  /** 안내방송 음량을 설정한다. (0 ~ 1) */
  setVolume: (value: number) => void;
  cancel: () => void;
  /** 재생 중인 안내방송을 잠시 멈춘다. (위치 유지) */
  pauseAudio: () => void;
  /** 멈춰둔 안내방송을 이어서 재생한다. */
  resumeAudio: () => void;
}

/*
 * 영어 듣기 전용 플레이어는 "모듈 레벨 단일 인스턴스"로 만들어 화면(DOM)에 붙여 둔다.
 * - React 가 다시 그려지거나 컴포넌트가 잠깐 내려가도 브라우저가 재생을 회수하지 못한다.
 * - 재생이 도중에 멈추면(pause/stalled/error) 스스로 그 위치에서 이어서 재생한다.
 * - 1배속일 때는 playbackRate/volume 을 건드리지 않는다.
 *   (긴 VBR mp3 재생 중 속성 변경이 원인인 경우를 피한다)
 */
let sharedListeningAudio: HTMLAudioElement | null = null;
let listeningWanted = false;
let listeningSession = false;
let listeningResumeTimer: number | null = null;
let listeningResumeAttempts = 0;

const MAX_RESUME_ATTEMPTS = 10;

function clearResumeTimer(): void {
  if (listeningResumeTimer !== null) {
    window.clearTimeout(listeningResumeTimer);
    listeningResumeTimer = null;
  }
}

function ensureListeningElement(): HTMLAudioElement | null {
  if (typeof document === "undefined" || typeof Audio === "undefined") return null;
  if (sharedListeningAudio && sharedListeningAudio.isConnected) {
    return sharedListeningAudio;
  }

  const audio = new Audio();
  audio.preload = "auto";
  audio.setAttribute("playsinline", "true");
  audio.style.cssText =
    "position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";

  const scheduleResume = () => {
    if (!listeningWanted || audio.ended) return;
    if (listeningResumeTimer !== null) return;
    if (listeningResumeAttempts >= MAX_RESUME_ATTEMPTS) return;
    listeningResumeTimer = window.setTimeout(() => {
      listeningResumeTimer = null;
      if (!listeningWanted || audio.ended || !audio.paused) return;
      listeningResumeAttempts += 1;
      try {
        const played = audio.play();
        if (played && typeof played.catch === "function") {
          void played.catch(() => {
            /* 자동재생 차단 등은 조용히 무시 */
          });
        }
      } catch {
        /* 무시 */
      }
    }, 350);
  };

  /* 실제로 재생이 흐르면 재시도 횟수를 초기화한다. */
  audio.addEventListener("timeupdate", () => {
    listeningResumeAttempts = 0;
  });
  /* 브라우저/네트워크가 예기치 않게 멈추면 그 자리에서 이어서 재생한다. */
  audio.addEventListener("pause", () => {
    if (!audio.ended) scheduleResume();
  });
  audio.addEventListener("stalled", scheduleResume);
  audio.addEventListener("error", scheduleResume);

  if (document.body) document.body.appendChild(audio);
  sharedListeningAudio = audio;
  return audio;
}

/**
 * 실제 방송 녹음 음원만 재생한다. (브라우저 음성 합성 TTS는 사용하지 않는다)
 *
 * 영어 듣기는 별도의 '보호 채널'에서 재생한다.
 * - 화면(DOM)에 붙은 단일 플레이어를 재사용한다.
 * - 사용자가 버튼을 누를 때 primeListening 으로 미리 활성화시켜 둔다.
 * - 끊기면 스스로 이어서 재생한다.
 */
export function useSpeech(): UseSpeechResult {
  const audioSupported =
    typeof window !== "undefined" && typeof Audio !== "undefined";

  const [speaking, setSpeaking] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingRef = useRef<{ url?: string; onDone?: () => void } | null>(null);
  const tokenRef = useRef(0);
  const rateRef = useRef(1);
  const volumeRef = useRef(1);

  const setRate = useCallback((value: number) => {
    rateRef.current = value;
    // 1배속은 굳이 건드리지 않는다. (긴 VBR 음원이 끊기는 문제 회피)
    if (value === 1) return;
    const targets = [audioRef.current, sharedListeningAudio];
    targets.forEach((audio) => {
      if (!audio) return;
      try {
        audio.playbackRate = value;
      } catch {
        /* 무시 */
      }
    });
  }, []);

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    volumeRef.current = clamped;
    if (audioRef.current) audioRef.current.volume = clamped;
    if (sharedListeningAudio) sharedListeningAudio.volume = clamped;
  }, []);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.onended = null;
    audio.onerror = null;
    audio.onplay = null;
    audio.pause();
    audioRef.current = null;
  }, []);

  const stopListening = useCallback(() => {
    listeningWanted = false;
    listeningSession = false;
    clearResumeTimer();
    const audio = sharedListeningAudio;
    if (!audio) return;
    audio.onended = null;
    audio.onerror = null;
    audio.onplay = null;
    try {
      audio.pause();
    } catch {
      /* 무시 */
    }
  }, []);

  const cancel = useCallback(() => {
    tokenRef.current += 1;
    pendingRef.current = null;
    stopAudio();
    stopListening();
    setSpeaking(false);
  }, [stopAudio, stopListening]);

  const pauseAudio = useCallback(() => {
    // 사용자가 직접 멈춘 것이므로 자동 재개는 하지 않는다.
    listeningWanted = false;
    clearResumeTimer();
    if (audioRef.current) audioRef.current.pause();
    if (sharedListeningAudio) sharedListeningAudio.pause();
    setSpeaking(false);
  }, []);

  const resumeAudio = useCallback(() => {
    if (listeningSession) listeningWanted = true;
    const targets = [audioRef.current, sharedListeningAudio];
    targets.forEach((audio) => {
      if (!audio) return;
      const played = audio.play();
      if (played && typeof played.catch === "function") {
        void played.catch(() => {
          /* 재생 실패는 무시 */
        });
      }
    });
  }, []);

  /**
   * 일반 안내방송 재생. 영어 듣기가 재생 중이면 곧바로 끊지 않고,
   * 듣기가 끝난 뒤로 미뤄서 이어서 재생한다.
   */
  const playAnnouncement = useCallback(
    (audioUrl?: string, onDone?: () => void) => {
      if (listeningWanted) {
        pendingRef.current = { url: audioUrl, onDone };
        return;
      }

      const token = tokenRef.current + 1;
      tokenRef.current = token;

      stopAudio();

      const finish = () => {
        if (tokenRef.current !== token) return;
        audioRef.current = null;
        setSpeaking(false);
        onDone?.();
      };

      // 음원이 없으면 아무 소리도 내지 않는다.
      if (!audioUrl || !audioSupported) {
        finish();
        return;
      }

      try {
        const audio = new Audio(audioUrl);
        if (volumeRef.current !== 1) audio.volume = volumeRef.current;
        if (rateRef.current !== 1) audio.playbackRate = rateRef.current;
        audioRef.current = audio;
        audio.onplay = () => {
          if (tokenRef.current === token) setSpeaking(true);
        };
        audio.onended = finish;
        audio.onerror = finish;

        const played = audio.play();
        if (played && typeof played.catch === "function") {
          void played.catch(finish);
        }
      } catch {
        finish();
      }
    },
    [audioSupported, stopAudio],
  );

  /**
   * 영어 듣기 플레이어를 사용자 제스처 시점에 미리 활성화(unlock)하고 선버퍼링한다.
   * 무음으로 아주 잠깐 재생했다가 멈춰 두면, 이후 타이머로 자동 재생해도
   * 브라우저가 "사용자 시작 재생"으로 인정하도록 한다.
   */
  const primeListening = useCallback((audioUrl?: string) => {
    if (listeningWanted) return;
    const audio = ensureListeningElement();
    if (!audio || !audioUrl) return;
    try {
      audio.muted = true;
      if (audio.src !== audioUrl) audio.src = audioUrl;
      const played = audio.play();
      if (played && typeof played.catch === "function") {
        void played.catch(() => {
          /* 무시 */
        });
      }
      window.setTimeout(() => {
        if (listeningWanted) return;
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {
          /* 무시 */
        }
        audio.muted = false;
      }, 300);
    } catch {
      /* 무시 */
    }
  }, []);

  /**
   * 영어 듣기 재생. 보호 채널을 쓰기 때문에 이 음원이 재생되는 동안
   * 다른 안내방송 요청은 모두 대기(pending)로 밀리고, 듣기가 끝나면 이어서 나온다.
   */
  const playListening = useCallback(
    (audioUrl?: string, onDone?: () => void, startOffset?: number) => {
      const token = tokenRef.current + 1;
      tokenRef.current = token;

      stopAudio();
      stopListening();
      pendingRef.current = null;

      const finish = () => {
        if (tokenRef.current !== token) return;
        listeningWanted = false;
        listeningSession = false;
        clearResumeTimer();
        const audio = sharedListeningAudio;
        if (audio) {
          audio.onended = null;
          audio.onerror = null;
          audio.onplay = null;
        }
        setSpeaking(false);
        onDone?.();

        const pending = pendingRef.current;
        pendingRef.current = null;
        if (pending) playAnnouncement(pending.url, pending.onDone);
      };

      if (!audioUrl || !audioSupported) {
        finish();
        return;
      }

      const audio = ensureListeningElement();
      if (!audio) {
        finish();
        return;
      }

      listeningSession = true;
      listeningWanted = true;
      listeningResumeAttempts = 0;
      audio.muted = false;
      if (volumeRef.current !== 1) audio.volume = volumeRef.current;

      audio.onplay = () => {
        if (tokenRef.current === token) setSpeaking(true);
      };
      audio.onended = () => {
        if (tokenRef.current === token) finish();
      };
      // 재생 실패 시 음성 표시만 잠시 끄고, 모듈 레벨 리스너가 자동으로 이어서 재생한다.
      audio.onerror = () => {
        if (tokenRef.current === token) setSpeaking(false);
      };

      // 소스가 다를 때만 새로 지정한다. (같으면 불필요한 재로딩 방지)
      if (audio.src !== audioUrl) {
        try {
          audio.src = audioUrl;
        } catch {
          /* 무시 */
        }
      }

      // 배속은 재생 시작 직전에 한 번만 적용한다. (1배속은 건드리지 않음)
      if (rateRef.current !== 1) {
        try {
          audio.playbackRate = rateRef.current;
        } catch {
          /* 무시 */
        }
      }

      // 이동한 시각에 맞춰 듣기 음원의 재생 위치를 맞춘다.
      // 13:07에 도달하면 0초부터, 13:30으로 이동하면 13:07 기준 23분 지점부터 재생된다.
      const offset =
        typeof startOffset === "number" && Number.isFinite(startOffset)
          ? Math.max(0, startOffset)
          : 0;
      const applySeek = () => {
        try {
          audio.currentTime = offset;
        } catch {
          /* 무시 */
        }
      };
      if (audio.readyState >= 1) {
        applySeek();
      } else {
        // 메타데이터가 아직 없으면 로드된 뒤에 위치를 맞춘다.
        audio.addEventListener("loadedmetadata", applySeek, { once: true });
      }

      const played = audio.play();
      if (played && typeof played.catch === "function") {
        void played.catch(() => {
          /* 자동재생 차단 등은 조용히 무시 (자동 재개 로직이 이후 처리) */
        });
      }
    },
    [audioSupported, stopAudio, stopListening, playAnnouncement],
  );

  useEffect(
    () => () => {
      stopAudio();
      stopListening();
    },
    [stopAudio, stopListening],
  );

  return useMemo(
    () => ({
      supported: audioSupported,
      speaking,
      playAnnouncement,
      playListening,
      primeListening,
      stopListening,
      setRate,
      setVolume,
      cancel,
      pauseAudio,
      resumeAudio,
    }),
    [
      audioSupported,
      speaking,
      playAnnouncement,
      playListening,
      primeListening,
      stopListening,
      setRate,
      setVolume,
      cancel,
      pauseAudio,
      resumeAudio,
    ],
  );
}