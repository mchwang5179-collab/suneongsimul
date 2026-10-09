/**
 * 사용자가 첨부한 영어 듣기 음원을 브라우저에 오래 보관하기 위한 IndexedDB 저장소.
 * 파일(Blob)처럼 큰 데이터를 안전하게 보관할 때 사용한다.
 */

const DB_NAME = "csat-sim-audio";
const DB_VERSION = 1;
const STORE_NAME = "files";

interface StoredAudio {
  key: string;
  name: string;
  type: string;
  blob: Blob;
  savedAt: number;
}

export interface StoredAudioResult {
  name: string;
  blob: Blob;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not supported"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudio(key: string, file: File): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const record: StoredAudio = {
        key,
        name: file.name,
        type: file.type,
        blob: file,
        savedAt: Date.now(),
      };
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function loadAudio(key: string): Promise<StoredAudioResult | null> {
  const db = await openDb();
  try {
    const record = await new Promise<StoredAudio | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!record) return null;
    return { name: record.name, blob: record.blob };
  } finally {
    db.close();
  }
}

export async function removeAudio(key: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}