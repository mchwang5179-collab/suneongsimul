import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface SharedTrack {
  id: string;
  label: string;
  url: string;
  storagePath: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface UseSharedTracksResult {
  tracks: SharedTrack[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  register: (file: File, label: string) => Promise<SharedTrack>;
  remove: (track: SharedTrack) => Promise<void>;
}

/** 운영자가 등록한 공용 영어 듣기 음원을 보관하는 저장 버킷 */
const BUCKET = "listening-audio";

interface SharedTrackRow {
  id: string;
  label: string;
  url: string;
  storage_path: string | null;
  created_by: string | null;
  created_at: string;
}

function mapRow(row: SharedTrackRow): SharedTrack {
  return {
    id: row.id,
    label: row.label,
    url: row.url,
    storagePath: row.storage_path,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

/** 저장소에 안전하게 쓸 수 있도록 파일 이름을 정리한다. */
function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : "";
  const safeBase =
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "audio";
  const safeExt = ext.replace(/[^a-z0-9.]/g, "") || ".mp3";
  return `${safeBase}${safeExt}`;
}

/**
 * 운영자가 등록한 공용 영어 듣기 음원 목록을 불러오고, 등록/삭제를 처리한다.
 * 등록·삭제는 운영자만 가능하도록 서버(RLS)에서 제한되어 있다.
 */
export function useSharedTracks(): UseSharedTracksResult {
  const [tracks, setTracks] = useState<SharedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("shared_listening_tracks")
        .select("id, label, url, storage_path, created_by, created_at")
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setTracks(((data as SharedTrackRow[]) ?? []).map(mapRow));
    } catch (err) {
      setError((err as Error).message || "공용 음원을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const register = useCallback(
    async (file: File, label: string): Promise<SharedTrack> => {
      const path = `${Date.now()}-${safeFileName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type || "audio/mpeg",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const { data, error: insertError } = await supabase
        .from("shared_listening_tracks")
        .insert({
          label,
          url: publicData.publicUrl,
          storage_path: path,
        })
        .select("id, label, url, storage_path, created_by, created_at")
        .maybeSingle();

      if (insertError) {
        try {
          await supabase.storage.from(BUCKET).remove([path]);
        } catch {
          /* 업로드 롤백 실패는 무시 */
        }
        throw insertError;
      }

      await reload();
      return mapRow(data as SharedTrackRow);
    },
    [reload],
  );

  const remove = useCallback(
    async (track: SharedTrack) => {
      if (track.storagePath) {
        try {
          await supabase.storage.from(BUCKET).remove([track.storagePath]);
        } catch {
          /* 파일 삭제 실패는 무시하고 레코드는 지운다 */
        }
      }
      const { error: deleteError } = await supabase
        .from("shared_listening_tracks")
        .delete()
        .eq("id", track.id);
      if (deleteError) throw deleteError;
      await reload();
    },
    [reload],
  );

  return { tracks, loading, error, reload, register, remove };
}