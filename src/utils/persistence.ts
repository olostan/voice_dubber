import { AudioTake, Character, OriginalAudioMode, Player, ScriptData, VideoSource, VoiceEffect, JudgeResult } from '../types';
import { PresetClipInfo, PRESET_CLIPS } from './presetClips';
import { blobToAudioBuffer } from './audioEngine';

const DB_NAME = 'voice_dubber_db';
const DB_VERSION = 1;
const STORE_NAME = 'dub_session';
const SESSION_KEY = 'current_working_dub';

interface SavedTakeData {
  id: string;
  playerId: string;
  characterId: string;
  lineId?: string;
  audioBlob: Blob;
  duration: number;
  startTimeOffset: number;
  volume: number;
  muted: boolean;
  solo: boolean;
  effect: VoiceEffect;
  waveformData?: number[];
  vadSegments?: { start: number; end: number }[];
  recordedAt: number;
}

interface SavedVideoSourceData {
  type: 'screen_capture' | 'preset' | 'upload';
  title: string;
  duration: number;
  width: number;
  height: number;
  hasAudioTrack: boolean;
  trimStartOffset?: number;
  trimEndOffset?: number;
  videoBlob?: Blob; // Stored for screen captures & uploads
}

export interface SavedDubSession {
  version: number;
  updatedAt: number;
  duration: number;
  videoVolume: number;
  originalAudioMode: OriginalAudioMode;
  characters: Character[];
  players: Player[];
  scriptData: ScriptData;
  activeRecordingCharacterId: string;
  activeVoiceEffect: VoiceEffect;
  latencyOffsetMs: number;
  useCountIn: boolean;
  judgeResult: JudgeResult | null;
  presetClipId?: string | null;
  videoSourceData?: SavedVideoSourceData | null;
  takes: SavedTakeData[];
}

// Open IndexedDB database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e: any) => {
      const db = e.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save complete working dub session to IndexedDB (supports global working session and per-project keying)
export async function saveDubSession(
  session: {
    duration: number;
    videoVolume: number;
    originalAudioMode: OriginalAudioMode;
    characters: Character[];
    players: Player[];
    scriptData: ScriptData;
    activeRecordingCharacterId: string;
    activeVoiceEffect: VoiceEffect;
    latencyOffsetMs: number;
    useCountIn: boolean;
    judgeResult: JudgeResult | null;
    presetClip: PresetClipInfo | null;
    videoSource: VideoSource | null;
    audioTakes: AudioTake[];
    videoBlob?: Blob | null;
  },
  projectId?: string | null
): Promise<void> {
  try {
    const db = await openDB();

    let videoSourceData: SavedVideoSourceData | null = null;
    if (session.videoSource) {
      let blobToSave = session.videoBlob;
      // If no explicit blob passed, try fetching from object URL
      if (!blobToSave && session.videoSource.url && session.videoSource.url.startsWith('blob:')) {
        try {
          const res = await fetch(session.videoSource.url);
          blobToSave = await res.blob();
        } catch {
          // ignore
        }
      }

      videoSourceData = {
        type: session.videoSource.type,
        title: session.videoSource.title,
        duration: session.videoSource.duration,
        width: session.videoSource.width,
        height: session.videoSource.height,
        hasAudioTrack: session.videoSource.hasAudioTrack,
        trimStartOffset: session.videoSource.trimStartOffset,
        trimEndOffset: session.videoSource.trimEndOffset,
        videoBlob: blobToSave || undefined,
      };
    }

    const takesToSave: SavedTakeData[] = session.audioTakes.map((take) => ({
      id: take.id,
      playerId: take.playerId,
      characterId: take.characterId,
      lineId: take.lineId,
      audioBlob: take.audioBlob,
      duration: take.duration,
      startTimeOffset: take.startTimeOffset,
      volume: take.volume,
      muted: take.muted,
      solo: take.solo,
      effect: take.effect,
      waveformData: take.waveformData,
      vadSegments: take.vadSegments,
      recordedAt: take.recordedAt,
    }));

    const sessionPayload: SavedDubSession = {
      version: 1,
      updatedAt: Date.now(),
      duration: session.duration,
      videoVolume: session.videoVolume,
      originalAudioMode: session.originalAudioMode,
      characters: session.characters,
      players: session.players,
      scriptData: session.scriptData,
      activeRecordingCharacterId: session.activeRecordingCharacterId,
      activeVoiceEffect: session.activeVoiceEffect,
      latencyOffsetMs: session.latencyOffsetMs,
      useCountIn: session.useCountIn,
      judgeResult: session.judgeResult,
      presetClipId: session.presetClip?.id || null,
      videoSourceData,
      takes: takesToSave,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      // Save to global active session
      store.put(sessionPayload, SESSION_KEY);

      // Also save to dedicated project cache if projectId exists
      if (projectId) {
        store.put(sessionPayload, `project_${projectId}`);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save dub session to IndexedDB:', err);
  }
}

// Load working dub session from IndexedDB and reconstruct URLs and AudioBuffers
export async function loadDubSession(projectId?: string | null): Promise<{
  duration: number;
  videoVolume: number;
  originalAudioMode: OriginalAudioMode;
  characters: Character[];
  players: Player[];
  scriptData: ScriptData;
  activeRecordingCharacterId: string;
  activeVoiceEffect: VoiceEffect;
  latencyOffsetMs: number;
  useCountIn: boolean;
  judgeResult: JudgeResult | null;
  presetClip: PresetClipInfo | null;
  videoSource: VideoSource | null;
  audioTakes: AudioTake[];
  videoBlob: Blob | null;
} | null> {
  try {
    const db = await openDB();

    const saved: SavedDubSession | null = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      if (projectId) {
        const projReq = store.get(`project_${projectId}`);
        projReq.onsuccess = () => {
          if (projReq.result) {
            resolve(projReq.result);
          } else {
            const fallbackReq = store.get(SESSION_KEY);
            fallbackReq.onsuccess = () => resolve(fallbackReq.result || null);
            fallbackReq.onerror = () => reject(fallbackReq.error);
          }
        };
        projReq.onerror = () => reject(projReq.error);
      } else {
        const getReq = store.get(SESSION_KEY);
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => reject(getReq.error);
      }
    });

    if (!saved) return null;

    // 1. Reconstruct Preset Clip if any
    let presetClip: PresetClipInfo | null = null;
    if (saved.presetClipId) {
      presetClip = PRESET_CLIPS.find((p) => p.id === saved.presetClipId) || null;
    }

    // 2. Reconstruct VideoSource & Blob URL if any
    let videoSource: VideoSource | null = null;
    let videoBlob: Blob | null = null;
    if (saved.videoSourceData) {
      const data = saved.videoSourceData;
      if (data.videoBlob) {
        videoBlob = data.videoBlob;
        const videoUrl = URL.createObjectURL(data.videoBlob);
        videoSource = {
          type: data.type,
          url: videoUrl,
          title: data.title,
          duration: data.duration,
          width: data.width,
          height: data.height,
          hasAudioTrack: data.hasAudioTrack,
          trimStartOffset: data.trimStartOffset,
          trimEndOffset: data.trimEndOffset,
        };
      }
    }

    // 3. Reconstruct AudioTakes, Blob URLs, and AudioBuffers
    const audioTakes: AudioTake[] = await Promise.all(
      saved.takes.map(async (t) => {
        const audioUrl = URL.createObjectURL(t.audioBlob);
        let audioBuffer: AudioBuffer | undefined;
        try {
          audioBuffer = await blobToAudioBuffer(t.audioBlob);
        } catch {
          // audio buffer will be created upon user playback interaction
        }

        return {
          id: t.id,
          playerId: t.playerId,
          characterId: t.characterId,
          lineId: t.lineId,
          audioBlob: t.audioBlob,
          audioUrl,
          audioBuffer,
          duration: t.duration,
          startTimeOffset: t.startTimeOffset,
          volume: t.volume,
          muted: t.muted,
          solo: t.solo,
          effect: t.effect,
          waveformData: t.waveformData,
          vadSegments: t.vadSegments,
          recordedAt: t.recordedAt,
        };
      })
    );

    return {
      duration: saved.duration || 15,
      videoVolume: saved.videoVolume ?? 0.8,
      originalAudioMode: saved.originalAudioMode || 'duck_10',
      characters: saved.characters || [],
      players: saved.players || [],
      scriptData: saved.scriptData || {
        scriptTitle: 'Scene Dialogue',
        synopsis: '',
        genre: 'Custom',
        characters: [],
        lines: [],
      },
      activeRecordingCharacterId: saved.activeRecordingCharacterId || 'char-1',
      activeVoiceEffect: saved.activeVoiceEffect || 'none',
      latencyOffsetMs: saved.latencyOffsetMs || 0,
      useCountIn: saved.useCountIn ?? true,
      judgeResult: saved.judgeResult || null,
      presetClip,
      videoSource,
      audioTakes,
      videoBlob,
    };
  } catch (err) {
    console.warn('Failed to load dub session from IndexedDB:', err);
    return null;
  }
}

// Clear the current dub session from IndexedDB
export async function clearDubSession(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const delReq = store.delete(SESSION_KEY);

      delReq.onsuccess = () => resolve();
      delReq.onerror = () => reject(delReq.error);
    });
  } catch (err) {
    console.warn('Failed to clear dub session:', err);
  }
}
