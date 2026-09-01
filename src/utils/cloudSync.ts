import { Character, ScriptLine, Player, JudgeResult, AudioTake } from '../types';
import { getAuthToken } from './auth';

export interface CloudProjectTake {
  id: string;
  playerId: string;
  characterId: string;
  audioUrl: string;
  duration: number;
  startTimeOffset: number;
  volume: number;
  muted?: boolean;
  solo?: boolean;
  effect: string;
  waveformData?: number[];
  vadSegments?: { start: number; end: number }[];
  recordedAt?: number;
}

export interface CloudProjectPayload {
  shareId?: string;
  id?: string;
  title: string;
  synopsis?: string;
  genre?: string;
  duration: number;
  characters: Character[];
  lines: ScriptLine[];
  players?: Player[];
  authorName?: string;
  authorId?: string;
  authorEmail?: string;
  presetClipId?: string | null;
  videoUrl?: string | null;
  takes?: CloudProjectTake[];
  createdAt?: number;
  updatedAt?: number;
}

export interface CommunityDubItem {
  id: string;
  scriptTitle: string;
  genre: string;
  playersCount: number;
  score: number;
  grade: string;
  badgeAwarded?: string;
  reviewCommentary?: string;
  authorName: string;
  createdAt: number;
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface UploadProgressInfo {
  phase: 'preparing' | 'uploading' | 'finalizing' | 'done' | 'retrying' | 'error';
  percent: number;
  loadedBytes: number;
  totalBytes: number;
  message: string;
  attempt?: number;
  maxAttempts?: number;
}

/**
 * Upload Video & Vocal Takes Media to GCS Cloud Storage with live progress & auto-retry
 */
export async function uploadProjectMedia(
  projectId: string,
  videoBlob: Blob | null,
  audioTakes: AudioTake[],
  onProgress?: (info: UploadProgressInfo) => void
): Promise<{ videoUrl?: string; takes?: CloudProjectTake[] }> {
  const maxAttempts = 3;
  let attempt = 1;

  // Compute total uncompressed bytes
  let totalBytes = (videoBlob ? videoBlob.size : 0) +
    audioTakes.reduce((sum, t) => sum + (t.audioBlob ? t.audioBlob.size : 0), 0);
  if (totalBytes === 0) totalBytes = 1024;

  onProgress?.({
    phase: 'preparing',
    percent: 5,
    loadedBytes: 0,
    totalBytes,
    message: 'Preparing and optimizing media for upload...',
    attempt: 1,
    maxAttempts,
  });

  let videoBase64: string | undefined;
  let videoType: string | undefined;

  if (videoBlob) {
    videoBase64 = await blobToBase64(videoBlob);
    videoType = videoBlob.type;
  }

  const takesPayload = await Promise.all(
    audioTakes.map(async (take) => {
      let audioBase64: string | undefined;
      if (take.audioBlob && take.audioBlob.size > 0) {
        audioBase64 = await blobToBase64(take.audioBlob);
      }
      return {
        id: take.id,
        playerId: take.playerId,
        characterId: take.characterId,
        audioBase64,
        audioUrl: take.audioUrl?.startsWith('http') ? take.audioUrl : undefined,
        duration: take.duration,
        startTimeOffset: take.startTimeOffset,
        volume: take.volume,
        muted: take.muted,
        solo: take.solo,
        effect: take.effect,
        waveformData: take.waveformData,
        vadSegments: take.vadSegments,
        recordedAt: take.recordedAt,
      };
    })
  );

  const token = await getAuthToken();
  const payloadString = JSON.stringify({
    videoBase64,
    videoType,
    takes: takesPayload,
  });
  const uploadPayloadSize = payloadString.length;

  while (attempt <= maxAttempts) {
    try {
      if (attempt > 1) {
        onProgress?.({
          phase: 'retrying',
          percent: 10,
          loadedBytes: 0,
          totalBytes,
          message: `Reconnecting and retrying upload (Attempt ${attempt}/${maxAttempts})...`,
          attempt,
          maxAttempts,
        });
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 2)));
      }

      onProgress?.({
        phase: 'uploading',
        percent: 15,
        loadedBytes: 0,
        totalBytes,
        message: 'Uploading media to Cloud Storage...',
        attempt,
        maxAttempts,
      });

      const result = await new Promise<{ videoUrl?: string; takes?: CloudProjectTake[] }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/projects/${encodeURIComponent(projectId)}/media`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable || uploadPayloadSize > 0) {
            const rawLoaded = e.loaded || 0;
            const rawTotal = e.total || uploadPayloadSize;
            const fraction = Math.min(1, rawLoaded / rawTotal);
            // scale from 15% to 94%
            const scaledPercent = 15 + fraction * 79;
            const estBytes = Math.round(fraction * totalBytes);
            onProgress?.({
              phase: 'uploading',
              percent: scaledPercent,
              loadedBytes: estBytes,
              totalBytes,
              message: `Uploading media (${Math.round(fraction * 100)}%)...`,
              attempt,
              maxAttempts,
            });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              onProgress?.({
                phase: 'finalizing',
                percent: 98,
                loadedBytes: totalBytes,
                totalBytes,
                message: 'Finalizing cloud dub & saving URLs...',
                attempt,
                maxAttempts,
              });
              resolve(res);
            } catch {
              reject(new Error('Invalid response from server'));
            }
          } else {
            let errorMsg = `Upload failed with status ${xhr.status}`;
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.error) errorMsg = res.error;
            } catch {}
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => reject(new Error('Network connection error during upload. Check internet connection.'));
        xhr.ontimeout = () => reject(new Error('Upload timed out. Retrying...'));
        xhr.timeout = 120000; // 120s timeout

        xhr.send(payloadString);
      });

      onProgress?.({
        phase: 'done',
        percent: 100,
        loadedBytes: totalBytes,
        totalBytes,
        message: 'Upload complete! Project ready for Showtime.',
        attempt,
        maxAttempts,
      });

      return result;
    } catch (err: any) {
      if (attempt === maxAttempts) {
        onProgress?.({
          phase: 'error',
          percent: 0,
          loadedBytes: 0,
          totalBytes,
          message: err.message || 'Upload failed. Please check your connection.',
          attempt,
          maxAttempts,
        });
        throw err;
      }
      attempt++;
    }
  }

  throw new Error('Upload failed after multiple attempts');
}

/**
 * 1. Save or Create a Dubbing Project in Cloud via secure server API.
 */
export async function saveProjectToCloud(
  payload: CloudProjectPayload
): Promise<{ shareId: string; shareUrl: string }> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resp = await fetch('/api/projects', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Failed to save project (HTTP ${resp.status})`);
  }

  const data = await resp.json();
  const shareUrl = `${window.location.origin}/view#${data.shareId}`;
  return { shareId: data.shareId, shareUrl };
}

/**
 * 2. Fetch all Dub Projects belonging to the authenticated user.
 */
export async function fetchUserProjects(userId?: string): Promise<CloudProjectPayload[]> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = userId ? `/api/user/projects?userId=${encodeURIComponent(userId)}` : '/api/user/projects';
  const resp = await fetch(url, { headers });

  if (!resp.ok) {
    return [];
  }

  const data = await resp.json();
  return data.items || [];
}

/**
 * 3. Update an existing Dub Project in Cloud.
 */
export async function updateProjectInCloud(
  shareId: string,
  updates: Partial<CloudProjectPayload>
): Promise<void> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resp = await fetch(`/api/projects/${encodeURIComponent(shareId)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update project (HTTP ${resp.status})`);
  }
}

/**
 * 4. Delete a Dub Project from Cloud.
 */
export async function deleteProjectFromCloud(shareId: string): Promise<void> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resp = await fetch(`/api/projects/${encodeURIComponent(shareId)}`, {
    method: 'DELETE',
    headers,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Failed to delete project (HTTP ${resp.status})`);
  }
}

/**
 * 5. Load a Dubbing Project by shareId via secure server API.
 */
export async function loadProjectFromCloud(shareId: string): Promise<CloudProjectPayload | null> {
  try {
    const resp = await fetch(`/api/projects/${encodeURIComponent(shareId)}`);
    if (!resp.ok) {
      return null;
    }
    const data = await resp.json();
    return data as CloudProjectPayload;
  } catch (err) {
    console.warn('Failed to load cloud project:', err);
    return null;
  }
}

/**
 * 3. Publish AI Judge scorecard to the Community Hall of Fame.
 */
export async function publishDubToCommunity(item: {
  scriptTitle: string;
  genre: string;
  playersCount: number;
  judgeResult: JudgeResult;
  authorName: string;
}): Promise<string> {
  const resp = await fetch('/api/community-dubs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scriptTitle: item.scriptTitle,
      genre: item.genre,
      playersCount: item.playersCount,
      score: item.judgeResult.overallScore,
      grade: item.judgeResult.overallScore >= 90 ? 'A+' : item.judgeResult.overallScore >= 80 ? 'A' : 'B',
      badgeAwarded: item.judgeResult.awardBadge,
      reviewCommentary: item.judgeResult.overallVerdict,
      authorName: item.authorName || 'Guest Director',
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Failed to publish dub (HTTP ${resp.status})`);
  }

  const data = await resp.json();
  return data.dubId;
}

/**
 * 4. Fetch recent community dub performances.
 */
export async function fetchRecentCommunityDubs(limitNum: number = 6): Promise<CommunityDubItem[]> {
  try {
    const resp = await fetch(`/api/community-dubs?limit=${limitNum}`);
    if (!resp.ok) {
      return [];
    }
    const data = await resp.json();
    return data.items || [];
  } catch (err) {
    console.warn('Failed to fetch community dubs:', err);
    return [];
  }
}
