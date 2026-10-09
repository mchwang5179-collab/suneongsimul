import { useCallback, useEffect, useRef, useState } from "react";
import { LISTENING_EVENT_ID } from "@/mocks/csatSchedule";
import { LISTENING_TRACKS } from "@/mocks/listeningLibrary";
import type { ListeningTrack } from "@/mocks/listeningLibrary";
import type { SharedTrack } from "@/hooks/useSharedTracks";
import { loadAudio, removeAudio, saveAudio } from "@/utils/audioStore";

export interface UseListeningAudioResult {
  url: string | null;
  fileName: string | null;
  selectedTrackId: string | null;
  loading: boolean;
  selectTrack: (track: ListeningTrack) => void;
  selectShared: (track: SharedTrack) => void;
  upload: (file: File) => void;
  clear: () => void;
}

/** 선택한 음원을 새로고침 후에도 유지하기 위한 저장 키 */
const PRESET_KEY = "csat-sim-listening-preset";

type SavedSource =
  | { kind: "library"; id: string }
  | { kind: "shared"; id: string; url: string; label: string };

function readSavedSource(): SavedSource | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PRESET_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedSource;
    if (parsed && typeof parsed === "object" && "kind" in parsed) return parsed;
  } catch {
    /* 예전 형식(문자열 id)으로 저장된 값은 아래에서 처리한다 */
    return { kind: "library", id: raw };
  }
  return null;
}

function writeSavedSource(source: SavedSource) {
  try {
    window.localStorage.setItem(PRESET_KEY, JSON.stringify(source));
  } catch {
    /* 무시 */
  }
}

function clearSavedSource() {
  try {
    window.localStorage.removeItem(PRESET_KEY);
  } catch {
    /* 무시 */
  }
}

/**
 * 3교시 영어 듣기 음원을 관리한다.
 * 내장 기출 음원, 운영자가 등록한 공용 음원, 직접 올린 개인 파일을 다룬다.
 * 직접 올린 개인 파일은 IndexedDB에 보관되어 새로고침 후에도 유지된다.
 */
export function useListeningAudio(): UseListeningAudioResult {
  const [url, setUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const blobUrlRef = useRef<string | null>(null);

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const applyBlob = useCallback(
    (blob: Blob, name: string) => {
      revokeBlob();
      const next = URL.createObjectURL(blob);
      blobUrlRef.current = next;
      setUrl(next);
      setFileName(name);
      setSelectedTrackId(null);
    },
    [revokeBlob],
  );

  const applyTrack = useCallback(
    (track: ListeningTrack) => {
      revokeBlob();
      setUrl(track.url);
      setFileName(track.label);
      setSelectedTrackId(track.id);
    },
    [revokeBlob],
  );

  const applyShared = useCallback(
    (track: SharedTrack) => {
      revokeBlob();
      setUrl(track.url);
      setFileName(track.label);
      setSelectedTrackId(track.id);
    },
    [revokeBlob],
  );

  useEffect(() => {
    let active = true;

    const saved = readSavedSource();
    if (saved?.kind === "library") {
      const savedTrack =
        LISTENING_TRACKS.find((track) => track.id === saved.id) ?? null;
      if (savedTrack) {
        applyTrack(savedTrack);
        setLoading(false);
        return undefined;
      }
    } else if (saved?.kind === "shared") {
      revokeBlob();
      setUrl(saved.url);
      setFileName(saved.label);
      setSelectedTrackId(saved.id);
      setLoading(false);
      return undefined;
    }

    loadAudio(LISTENING_EVENT_ID)
      .then((stored) => {
        if (active && stored) applyBlob(stored.blob, stored.name);
      })
      .catch(() => {
        /* 저장소를 사용할 수 없는 환경에서는 무시 */
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applyTrack, applyBlob, revokeBlob]);

  useEffect(() => () => revokeBlob(), [revokeBlob]);

  const selectTrack = useCallback(
    (track: ListeningTrack) => {
      applyTrack(track);
      writeSavedSource({ kind: "library", id: track.id });
      removeAudio(LISTENING_EVENT_ID).catch(() => {
        /* 무시 */
      });
    },
    [applyTrack],
  );

  const selectShared = useCallback(
    (track: SharedTrack) => {
      applyShared(track);
      writeSavedSource({
        kind: "shared",
        id: track.id,
        url: track.url,
        label: track.label,
      });
      removeAudio(LISTENING_EVENT_ID).catch(() => {
        /* 무시 */
      });
    },
    [applyShared],
  );

  const upload = useCallback(
    (file: File) => {
      applyBlob(file, file.name);
      clearSavedSource();
      saveAudio(LISTENING_EVENT_ID, file).catch(() => {
        /* 저장 실패해도 이번 세션에서는 재생 가능 */
      });
    },
    [applyBlob],
  );

  const clear = useCallback(() => {
    revokeBlob();
    setUrl(null);
    setFileName(null);
    setSelectedTrackId(null);
    clearSavedSource();
    removeAudio(LISTENING_EVENT_ID).catch(() => {
      /* 무시 */
    });
  }, [revokeBlob]);

  return {
    url,
    fileName,
    selectedTrackId,
    loading,
    selectTrack,
    selectShared,
    upload,
    clear,
  };
}