export type GameMode = 'party' | 'studio' | 'practice';

export interface Character {
  id: string;
  name: string;
  voiceStyle: string;
  color: string;
  suggestedPitch?: number;
  avatarIcon?: string;
}

export interface ScriptLine {
  id: string;
  speakerId: string;
  speakerName: string;
  startTime: number;
  endTime: number;
  text: string;
  cue?: string;
  sfxHint?: string;
}

export interface ScriptData {
  scriptTitle: string;
  synopsis: string;
  genre?: string;
  characters: Character[];
  lines: ScriptLine[];
}

export type VoiceEffect = 'none' | 'villain' | 'chipmunk' | 'robot' | 'radio' | 'reverb' | 'megaphone';

export type OriginalAudioMode = 'duck_10' | 'duck_25' | 'mute' | 'keep' | 'smart_duck';

export interface Player {
  id: string;
  name: string;
  characterId: string;
  avatarColor: string;
  voiceEffect: VoiceEffect;
  score?: number;
}

export interface AudioTake {
  id: string;
  playerId: string;
  characterId: string;
  audioBlob: Blob;
  audioUrl: string;
  audioBuffer?: AudioBuffer;
  duration: number;
  startTimeOffset: number; // in seconds
  volume: number; // 0 to 2
  muted: boolean;
  solo: boolean;
  effect: VoiceEffect;
  waveformData?: number[];
  vadSegments?: { start: number; end: number }[];
  recordedAt: number;
}

export interface VideoSource {
  type: 'screen_capture' | 'preset' | 'upload';
  url: string;
  title: string;
  duration: number;
  width: number;
  height: number;
  hasAudioTrack: boolean;
  thumbnailUrl?: string;
  trimStartOffset?: number;
}

export interface JudgePlayerScore {
  name: string;
  score: number;
  feedback: string;
  standoutMoment?: string;
}

export interface JudgeResult {
  judgeName: string;
  overallVerdict: string;
  partyWinner: string;
  awardBadge: string;
  overallScore: number;
  playerScores: JudgePlayerScore[];
}

export interface SoundEffectItem {
  id: string;
  name: string;
  key: string;
  emoji: string;
  type: 'vine_boom' | 'rimshot' | 'airhorn' | 'dramatic' | 'applause' | 'boing' | 'scratch' | 'laser' | 'gasp';
}
