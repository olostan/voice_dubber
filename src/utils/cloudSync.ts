import { Character, ScriptLine, Player, JudgeResult } from '../types';
import { getAuthToken } from './auth';

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
  const shareUrl = `${window.location.origin}/?project=${data.shareId}`;
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
