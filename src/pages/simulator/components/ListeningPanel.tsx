import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { LISTENING_TRACKS } from "@/mocks/listeningLibrary";
import type { ListeningTrack } from "@/mocks/listeningLibrary";
import { useAuth } from "@/hooks/useAuth";
import { useSharedTracks } from "@/hooks/useSharedTracks";
import type { SharedTrack } from "@/hooks/useSharedTracks";
import SharedUploadDialog from "@/pages/simulator/components/SharedUploadDialog";

interface ListeningPanelProps {
  fileName: string | null;
  audioUrl: string | null;
  selectedTrackId: string | null;
  loading: boolean;
  onSelectTrack: (track: ListeningTrack) => void;
  onSelectShared: (track: SharedTrack) => void;
  onUpload: (file: File) => void;
  onClear: () => void;
}

export default function ListeningPanel({
  fileName,
  audioUrl,
  selectedTrackId,
  loading,
  onSelectTrack,
  onSelectShared,
  onUpload,
  onClear,
}: ListeningPanelProps) {
  const { isAdmin } = useAuth();
  const shared = useSharedTracks();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<number, ListeningTrack[]>();
    LISTENING_TRACKS.forEach((track) => {
      const list = map.get(track.gradeYear) ?? [];
      list.push(track);
      map.set(track.gradeYear, list);
    });
    return Array.from(map.entries());
  }, []);

  const selectedShared = shared.tracks.find((track) => track.id === selectedTrackId);

  const currentValue = (() => {
    if (!selectedTrackId) return "";
    if (shared.tracks.some((track) => track.id === selectedTrackId)) {
      return `shared:${selectedTrackId}`;
    }
    if (LISTENING_TRACKS.some((track) => track.id === selectedTrackId)) {
      return `lib:${selectedTrackId}`;
    }
    return "";
  })();

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (!value) return;
    const [kind, id] = value.split(":");
    setError(null);
    setNotice("");
    setConfirmId(null);
    if (kind === "shared") {
      const track = shared.tracks.find((item) => item.id === id);
      if (track) onSelectShared(track);
      return;
    }
    const track = LISTENING_TRACKS.find((item) => item.id === id);
    if (track) onSelectTrack(track);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setError("오디오 파일(mp3 등)만 첨부할 수 있습니다.");
      return;
    }
    setError(null);
    setNotice("");
    setPendingFile(file);
    setDialogError("");
    setDialogOpen(true);
  };

  const stopPreview = useCallback(() => {
    const audio = previewRef.current;
    if (audio) {
      audio.onended = null;
      audio.pause();
      audio.currentTime = 0;
      previewRef.current = null;
    }
    setPreviewing(false);
  }, []);

  /* 음원이 바뀌거나 화면을 벗어나면 미리 듣기를 멈춘다. */
  useEffect(() => {
    stopPreview();
  }, [audioUrl, stopPreview]);

  const handlePreview = () => {
    if (!audioUrl) return;
    if (previewing) {
      stopPreview();
      return;
    }
    setError(null);
    const audio = new Audio(audioUrl);
    previewRef.current = audio;
    audio.onplay = () => setPreviewing(true);
    audio.onended = () => {
      previewRef.current = null;
      setPreviewing(false);
    };
    audio.onerror = () => {
      previewRef.current = null;
      setPreviewing(false);
    };
    void audio.play().then(() => setPreviewing(true)).catch(() => {
      previewRef.current = null;
      setPreviewing(false);
      setError("음원을 재생할 수 없습니다. 다른 음원을 선택해 주세요.");
    });
  };

  const handleClear = () => {
    stopPreview();
    onClear();
  };

  const openPicker = () => inputRef.current?.click();

  const handleUsePersonal = () => {
    if (pendingFile) onUpload(pendingFile);
    setDialogOpen(false);
    setPendingFile(null);
  };

  const handleRegister = async (label: string) => {
    if (!pendingFile) return;
    setSaving(true);
    setDialogError("");
    try {
      const created = await shared.register(pendingFile, label);
      setNotice(`공용 음원으로 등록했습니다: ${created.label}`);
      setDialogOpen(false);
      setPendingFile(null);
      onSelectShared(created);
    } catch (err) {
      setDialogError((err as Error).message || "공용 음원 등록에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveShared = async (track: SharedTrack) => {
    setConfirmId(null);
    setNotice("");
    try {
      await shared.remove(track);
      if (selectedTrackId === track.id) onClear();
      setNotice("공용 음원을 삭제했습니다.");
    } catch (err) {
      setError((err as Error).message || "공용 음원 삭제에 실패했습니다.");
    }
  };

  return (
    <section className="rounded-lg border border-background-200 bg-background-50 p-5">
      <div className="flex items-center gap-2">
        <i
          className="ri-headphone-line text-lg text-primary-700"
          aria-hidden="true"
        ></i>
        <h2 className="font-heading text-base font-bold text-foreground-950">
          3교시 영어 듣기 음원
        </h2>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-foreground-500">
        기출 영어 듣기 음원을 선택하면{" "}
        <strong className="font-semibold text-foreground-700">13:07</strong>
        부터 파일이 끝날 때까지 끊기지 않고 자동으로 재생됩니다.
      </p>

      {!isAdmin && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-background-200 bg-background-100 px-3 py-2.5">
          <i
            className="ri-information-line mt-0.5 text-base text-primary-700"
            aria-hidden="true"
          ></i>
          <p className="text-[11px] leading-relaxed text-foreground-600">
            다른 영어 듣기 음원으로 진행하려면, 본인이 미리 준비한 음원을{" "}
            <strong className="font-semibold text-foreground-700">13:07</strong>
            에 직접 재생한 뒤 모의시험을 진행하면 됩니다.
          </p>
        </div>
      )}

      <label
        htmlFor="listening-track"
        className="mt-4 block text-[11px] font-semibold tracking-wide text-foreground-500"
      >
        음원 선택
      </label>
      <div className="relative mt-1.5">
        <select
          id="listening-track"
          value={currentValue}
          onChange={handleSelectChange}
          disabled={loading}
          className="w-full cursor-pointer appearance-none rounded-md border border-background-300 bg-background-50 px-3 py-2.5 pr-9 text-[13px] font-medium text-foreground-900 outline-none transition-colors focus:border-primary-400 disabled:cursor-not-allowed disabled:text-foreground-400"
        >
          <option value="">음원을 선택하세요</option>
          {shared.tracks.length > 0 && (
            <optgroup label="공용 음원 (운영자 등록)">
              {shared.tracks.map((track) => (
                <option key={track.id} value={`shared:${track.id}`}>
                  {track.label}
                </option>
              ))}
            </optgroup>
          )}
          {groups.map(([gradeYear, tracks]) => (
            <optgroup key={gradeYear} label={`${gradeYear}학년도`}>
              {tracks.map((track) => (
                <option key={track.id} value={`lib:${track.id}`}>
                  {track.examType} ({track.adminYear}년 시행)
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <i
          className="ri-arrow-down-s-line pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-foreground-400"
          aria-hidden="true"
        ></i>
      </div>

      {shared.loading && shared.tracks.length === 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-foreground-500">
          <i className="ri-loader-4-line animate-spin" aria-hidden="true"></i>
          공용 음원을 불러오는 중입니다...
        </p>
      )}

      {isAdmin && selectedShared && (
        <div className="mt-2">
          {confirmId === selectedShared.id ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleRemoveShared(selectedShared)}
                className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-md bg-primary-500 px-3 py-1.5 text-[11px] font-semibold text-background-50 hover:bg-primary-600 dark:text-foreground-950"
              >
                삭제 확인
              </button>
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-md border border-background-300 px-3 py-1.5 text-[11px] font-medium text-foreground-600 hover:bg-background-100"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmId(selectedShared.id)}
              className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 px-3 py-1.5 text-[11px] font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-700"
            >
              <i className="ri-delete-bin-line text-sm" aria-hidden="true"></i>
              선택한 공용 음원 삭제
            </button>
          )}
        </div>
      )}

      {notice && (
        <p className="mt-3 flex items-center gap-1.5 rounded-md bg-accent-100 px-3 py-2 text-[11px] font-medium text-accent-900">
          <i className="ri-checkbox-circle-line" aria-hidden="true"></i>
          {notice}
        </p>
      )}

      {fileName && (
        <div className="mt-4 rounded-md border border-accent-300 bg-accent-100 p-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-500/15 text-accent-700">
              <i className="ri-file-music-line text-base" aria-hidden="true"></i>
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-accent-900">
                {fileName}
              </p>
              <p className="text-[11px] text-accent-900/70">13:07 재생 준비됨</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePreview}
              className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                previewing
                  ? "border-primary-400 bg-primary-500 text-background-50 hover:bg-primary-600 dark:text-foreground-950"
                  : "border-accent-300 bg-background-50 text-accent-900 hover:bg-background-100"
              }`}
            >
              <i
                className={previewing ? "ri-stop-circle-line" : "ri-play-circle-line"}
                aria-hidden="true"
              ></i>
              {previewing ? "정지" : "미리 듣기"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 bg-background-50 px-3 py-1.5 text-xs font-medium text-foreground-700 transition-colors hover:bg-background-100"
            >
              <i className="ri-delete-bin-line" aria-hidden="true"></i>
              선택 해제
            </button>
          </div>
        </div>
      )}

      {isAdmin && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleChange}
          />

          <button
            type="button"
            onClick={openPicker}
            disabled={loading}
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-dashed border-primary-300 bg-primary-100/50 px-4 py-2.5 text-sm font-medium text-primary-900 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:text-foreground-400"
          >
            <i className="ri-upload-2-line text-lg" aria-hidden="true"></i>
            {loading ? "음원 불러오는 중..." : "다른 파일 직접 올리기 (운영자)"}
          </button>
        </>
      )}

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-primary-700">
          <i className="ri-error-warning-line" aria-hidden="true"></i>
          {error}
        </p>
      )}

      <SharedUploadDialog
        open={dialogOpen}
        fileName={pendingFile?.name ?? ""}
        saving={saving}
        error={dialogError}
        onRegister={handleRegister}
        onUsePersonal={handleUsePersonal}
        onCancel={() => {
          setDialogOpen(false);
          setPendingFile(null);
        }}
      />
    </section>
  );
}