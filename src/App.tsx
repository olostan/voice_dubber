import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AudioTake,
  Character,
  GameMode,
  JudgeResult,
  OriginalAudioMode,
  Player,
  ScriptData,
  ScriptLine,
  VideoSource,
  VoiceEffect,
} from './types';
import { PRESET_CLIPS, PresetClipInfo } from './utils/presetClips';
import {
  MicTakeRecorder,
  startTabOrScreenCapture,
  TabCaptureSession,
} from './utils/videoCapture';
import {
  blobToAudioBuffer,
  detectVoiceSegments,
  extractWaveformData,
  getAudioContext,
  playMetronomeBeep,
  playSoundEffect,
  applyVoiceEffectChain,
  extractAudioFromVideo,
} from './utils/audioEngine';
import { Header } from './components/Header';
import { VideoCanvasPlayer } from './components/VideoCanvasPlayer';
import { MultiTrackTimeline } from './components/MultiTrackTimeline';
import { RecordingControls } from './components/RecordingControls';
import { VoiceEffectsSelector } from './components/VoiceEffectsSelector';
import { Soundboard } from './components/Soundboard';
import { ScriptPrompter } from './components/ScriptPrompter';
import { ClipSelector } from './components/ClipSelector';
import { AiJudgeModal } from './components/AiJudgeModal';
import { ShowtimeModal } from './components/ShowtimeModal';
import { ShareModal } from './components/ShareModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { UploadProgressModal, UploadState } from './components/UploadProgressModal';
import { WelcomeCapturePrompt } from './components/WelcomeCapturePrompt';
import { ActiveTabRecordingModal } from './components/ActiveTabRecordingModal';
import { MyProjectsModal } from './components/MyProjectsModal';
import { HomePage } from './components/HomePage';
import { RotateCcw, Mic, CheckCircle2, ChevronRight, Volume2, Sparkles, UserCheck } from 'lucide-react';
import { saveDubSession, loadDubSession, clearDubSession } from './utils/persistence';
import { AuthUserProfile, signInWithGoogle, signOutUser, subscribeToAuthChanges } from './utils/auth';
import { CloudProjectPayload, saveProjectToCloud, loadProjectFromCloud, uploadProjectMedia } from './utils/cloudSync';

export default function App() {
  // Navigation View: 'home' landing page or 'studio' working DAW workspace
  const [currentView, setCurrentView] = useState<'home' | 'studio'>(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace(/^#/, '');
    const isViewRoute = window.location.pathname.startsWith('/view');
    return params.get('project') || hash || isViewRoute ? 'studio' : 'home';
  });

  // Modals
  const [isAiJudgeOpen, setIsAiJudgeOpen] = useState(false);
  const [isShowtimeOpen, setIsShowtimeOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [privacyInitialTab, setPrivacyInitialTab] = useState<'privacy' | 'terms' | 'ai' | 'copyright'>('privacy');
  const [isMyProjectsOpen, setIsMyProjectsOpen] = useState(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);

  // Cloud Upload Progress & Auto-Retry State
  const [uploadState, setUploadState] = useState<UploadState>({
    isOpen: false,
    phase: 'preparing',
    percent: 0,
    loadedBytes: 0,
    totalBytes: 0,
    message: '',
  });

  // Google User Authentication State
  const [user, setUser] = useState<AuthUserProfile | null>(null);

  // Active Clip & Video Source - starts empty so user is prompted to record from tab
  const [presetClip, setPresetClip] = useState<PresetClipInfo | null>(null);
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const [currentVideoBlob, setCurrentVideoBlob] = useState<Blob | null>(null);
  const [isCapturingTab, setIsCapturingTab] = useState(false);
  const [activeCaptureSession, setActiveCaptureSession] = useState<TabCaptureSession | null>(null);
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);

  // Video / Canvas References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElemRef = useRef<HTMLVideoElement | null>(null);

  // Timeline & Playback State
  const [duration, setDuration] = useState<number>(15);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [videoVolume, setVideoVolume] = useState<number>(0.8);
  const [originalAudioMode, setOriginalAudioMode] = useState<OriginalAudioMode>('duck_5');
  const animFrameRef = useRef<number | null>(null);
  const lastPlayTimeRef = useRef<number>(0);

  // Line-by-Line Dubbing State
  const [targetRecordingLine, setTargetRecordingLine] = useState<ScriptLine | null>(null);
  const [nextPendingLine, setNextPendingLine] = useState<ScriptLine | null>(null);
  const [lastCompletedLine, setLastCompletedLine] = useState<ScriptLine | null>(null);
  const [selectedTimelineTakeId, setSelectedTimelineTakeId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [currentCloudProjectId, setCurrentCloudProjectId] = useState<string | null>(null);
  const targetRecordingLineRef = useRef<ScriptLine | null>(null);
  const isRecordingRef = useRef<boolean>(false);

  // Audio Transcription & Diarization State
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [transcribingStatus, setTranscribingStatus] = useState('');
  const [notificationToast, setNotificationToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Characters & Players
  const [characters, setCharacters] = useState<Character[]>([]);

  const [players, setPlayers] = useState<Player[]>([
    {
      id: 'p-1',
      name: 'Actor 1',
      characterId: 'char-1',
      avatarColor: '#f43f5e',
      voiceEffect: 'none',
    },
    {
      id: 'p-2',
      name: 'Actor 2',
      characterId: 'char-2',
      avatarColor: '#0ea5e9',
      voiceEffect: 'none',
    },
  ]);

  // Script Data
  const [scriptData, setScriptData] = useState<ScriptData>({
    scriptTitle: 'Scene Dialogue',
    synopsis: 'Capture a browser tab with sound or upload a clip to automatically transcribe lines and start dubbing.',
    genre: 'Custom',
    characters: [],
    lines: [],
  });

  const [isGeneratingAiScript, setIsGeneratingAiScript] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  // Recording State
  const [activeRecordingCharacterId, setActiveRecordingCharacterId] = useState<string>('char-1');
  const [activeVoiceEffect, setActiveVoiceEffect] = useState<VoiceEffect>('none');
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [useCountIn, setUseCountIn] = useState(true);
  const [latencyOffsetMs, setLatencyOffsetMs] = useState(0);
  const [vuLevel, setVuLevel] = useState(0);
  const micRecorderRef = useRef<MicTakeRecorder | null>(null);

  // Keep refs in sync for requestAnimationFrame loop
  useEffect(() => {
    targetRecordingLineRef.current = targetRecordingLine;
  }, [targetRecordingLine]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Multi-Track Takes
  const [audioTakes, setAudioTakes] = useState<AudioTake[]>([]);
  const activeSourcesRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode }[]>([]);

  // AI Judge State
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);
  const [isJudgeLoading, setIsJudgeLoading] = useState(false);

  // 1. Subscribe to Google Auth changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Restore Working Dub Session from IndexedDB or URL Share Parameter on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      // Check if URL has ?project=<id> or /view#<id> or #<id>
      const params = new URLSearchParams(window.location.search);
      let projectId = params.get('project');
      const hash = window.location.hash.replace(/^#/, '');
      if (!projectId && hash) {
        projectId = hash.replace(/^view#?/, '').replace(/^\//, '') || null;
      }

      if (projectId) {
        try {
          const cloudProject = await loadProjectFromCloud(projectId);
          if (isMounted && cloudProject) {
            await handleSelectCloudProject(cloudProject);
            setIsLoadedFromStorage(true);
            if (window.location.pathname.startsWith('/view') || window.location.hash.includes('view')) {
              setIsShowtimeOpen(true);
            }
            return;
          }
        } catch {
          // fallback to local session
        }
      }

      try {
        const saved = await loadDubSession();
        if (isMounted && saved) {
          if (saved.videoSource || saved.presetClip || saved.audioTakes.length > 0) {
            setDuration(saved.duration);
            setVideoVolume(saved.videoVolume);
            setOriginalAudioMode(saved.originalAudioMode);
            setCharacters(saved.characters);
            setPlayers(saved.players);
            setScriptData(saved.scriptData);
            setActiveRecordingCharacterId(saved.activeRecordingCharacterId);
            setActiveVoiceEffect(saved.activeVoiceEffect);
            setLatencyOffsetMs(saved.latencyOffsetMs);
            setUseCountIn(saved.useCountIn);
            setJudgeResult(saved.judgeResult);
            setPresetClip(saved.presetClip);
            setVideoSource(saved.videoSource);
            setCurrentVideoBlob(saved.videoBlob);
            setAudioTakes(saved.audioTakes);

            setNotificationToast({
              message: `📂 Restored your previous dubbing session.`,
              type: 'info',
            });
            setTimeout(() => setNotificationToast(null), 5000);
          }
        }
      } catch (e) {
        console.warn('Failed to restore session from IndexedDB:', e);
      } finally {
        if (isMounted) {
          setIsLoadedFromStorage(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Debounced Auto-Save Working Dub Session to IndexedDB
  useEffect(() => {
    if (!isLoadedFromStorage) return;
    if (!videoSource && !presetClip && audioTakes.length === 0) return;

    const timer = setTimeout(() => {
      saveDubSession({
        duration,
        videoVolume,
        originalAudioMode,
        characters,
        players,
        scriptData,
        activeRecordingCharacterId,
        activeVoiceEffect,
        latencyOffsetMs,
        useCountIn,
        judgeResult,
        presetClip,
        videoSource,
        audioTakes,
        videoBlob: currentVideoBlob,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [
    isLoadedFromStorage,
    duration,
    videoVolume,
    originalAudioMode,
    characters,
    players,
    scriptData,
    activeRecordingCharacterId,
    activeVoiceEffect,
    latencyOffsetMs,
    useCountIn,
    judgeResult,
    presetClip,
    videoSource,
    audioTakes,
    currentVideoBlob,
  ]);

  // Warn before browser navigation or tab close when unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && (audioTakes.length > 0 || scriptData.lines.length > 0 || videoSource || presetClip)) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, audioTakes.length, scriptData.lines.length, videoSource, presetClip]);

  // Google Sign-In & Sign-Out Handlers
  const handleSignInWithGoogle = async () => {
    try {
      const profile = await signInWithGoogle();
      if (profile) {
        setUser(profile);
        setNotificationToast({
          message: `👋 Welcome, ${profile.displayName || profile.email}! Signed in with Google.`,
          type: 'success',
        });
        setTimeout(() => setNotificationToast(null), 5000);
      }
    } catch (err: any) {
      console.warn('Google sign in error:', err);
      setNotificationToast({
        message: err.message || 'Google sign in cancelled.',
        type: 'info',
      });
      setTimeout(() => setNotificationToast(null), 5000);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    setNotificationToast({
      message: 'Signed out of Google account.',
      type: 'info',
    });
    setTimeout(() => setNotificationToast(null), 3000);
  };

  // Save Current Project to Cloud and Update Browser URL
  const handleSaveCurrentToCloud = async () => {
    setIsSavingToCloud(true);
    const totalBytesEst =
      (currentVideoBlob?.size || 0) +
      audioTakes.reduce((sum, take) => sum + (take.audioBlob?.size || 0), 0);

    setUploadState({
      isOpen: true,
      phase: 'preparing',
      percent: 5,
      loadedBytes: 0,
      totalBytes: totalBytesEst > 0 ? totalBytesEst : 1024,
      message: 'Packaging scene metadata and preparing cloud storage...',
      attempt: 1,
      maxAttempts: 3,
      error: null,
      onRetry: handleSaveCurrentToCloud,
      onCancel: () => setUploadState((prev) => ({ ...prev, isOpen: false })),
    });

    try {
      const payload: CloudProjectPayload = {
        id: currentCloudProjectId || undefined,
        title: scriptData.scriptTitle || 'Dubbed Scene',
        synopsis: scriptData.synopsis,
        genre: scriptData.genre,
        duration,
        characters,
        lines: scriptData.lines,
        players,
        presetClipId: presetClip?.id || null,
        authorName: user?.displayName || 'Creator',
      };
      const { shareId, shareUrl } = await saveProjectToCloud(payload);

      // Upload video and dubbed takes to Cloud Storage if available with live progress
      if (currentVideoBlob || audioTakes.length > 0) {
        try {
          const mediaRes = await uploadProjectMedia(
            shareId,
            currentVideoBlob,
            audioTakes,
            (info) => {
              setUploadState((prev) => ({
                ...prev,
                ...info,
                isOpen: true,
              }));
            }
          );
          if (mediaRes.videoUrl) {
            setVideoSource((prev) => (prev ? { ...prev, url: mediaRes.videoUrl! } : null));
          }
        } catch (mediaErr: any) {
          console.warn('Cloud Storage upload notice:', mediaErr);
          setUploadState((prev) => ({
            ...prev,
            phase: 'error',
            error: mediaErr.message || 'Media transfer was interrupted. Click below to retry.',
            onRetry: handleSaveCurrentToCloud,
          }));
          return;
        }
      }

      // Update browser URL query params with the project ID
      const newUrl = new URL(window.location.href);
      newUrl.pathname = '/view';
      newUrl.hash = shareId;
      newUrl.searchParams.delete('project');
      window.history.pushState({ projectId: shareId }, '', newUrl.toString());

      setCurrentCloudProjectId(shareId);
      setHasUnsavedChanges(false);

      navigator.clipboard.writeText(shareUrl).catch(() => {});

      setUploadState((prev) => ({
        ...prev,
        phase: 'done',
        percent: 100,
        message: 'Saved & uploaded successfully! Share link ready.',
      }));

      setTimeout(() => {
        setUploadState((prev) => ({ ...prev, isOpen: false }));
        setNotificationToast({
          message: `☁️ Saved & Uploaded to Cloud! Share link copied: ${shareUrl}`,
          type: 'success',
        });
        setTimeout(() => setNotificationToast(null), 8000);
      }, 700);
    } catch (err: any) {
      setUploadState((prev) => ({
        ...prev,
        phase: 'error',
        error: err.message || 'Failed to save project. Please check your network connection.',
        onRetry: handleSaveCurrentToCloud,
      }));
      setNotificationToast({
        message: `Cloud save notice: ${err.message || 'Saved to local session'}`,
        type: 'error',
      });
      setTimeout(() => setNotificationToast(null), 5000);
    } finally {
      setIsSavingToCloud(false);
    }
  };

  // Load a Cloud Project into Active Workspace and Update Browser URL
  const handleSelectCloudProject = async (project: CloudProjectPayload) => {
    if (hasUnsavedChanges && (audioTakes.length > 0 || scriptData.lines.length > 0)) {
      const confirmed = window.confirm(
        'You have unsaved changes in your current project. Do you want to discard them and load this cloud project?'
      );
      if (!confirmed) return;
    }

    stopPlayback();

    const pId = project.id || project.shareId || null;
    if (pId) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('project', pId);
      window.history.pushState({ projectId: pId }, '', newUrl.toString());
      setCurrentCloudProjectId(pId);
    }

    // Check if this browser has locally cached video & dubbed audio takes for this project ID
    const localCached = pId ? await loadDubSession(pId) : null;

    // 1. Resolve Video Source (Cloud Storage URL > Local IndexedDB Cache > Studio Soundstage)
    if (project.videoUrl) {
      setVideoSource({
        type: 'upload',
        url: project.videoUrl,
        title: project.title || 'Dub Video',
        duration: project.duration || 15,
        width: 1280,
        height: 720,
        hasAudioTrack: true,
      });
      setPresetClip(null);
    } else if (localCached && localCached.videoSource) {
      setVideoSource(localCached.videoSource);
      setCurrentVideoBlob(localCached.videoBlob);
      setPresetClip(localCached.presetClip);
    } else {
      // Soundstage canvas fallback (NOT the cat)
      setPresetClip({
        id: `custom-${pId || Date.now()}`,
        title: project.title || 'Dubbing Soundstage',
        genre: project.genre || 'Dubbing Studio',
        duration: project.duration || 15,
        description: project.synopsis || 'Recorded dialogue scene ready for dubbing.',
        renderType: 'studio',
        defaultCharacters: project.characters || [],
        defaultScript: (project.lines || []).map((l, i) => ({
          speakerIndex: i % (project.characters?.length || 1),
          startTime: l.startTime,
          endTime: l.endTime,
          text: l.text,
          cue: l.cue || '',
        })),
      });
      setVideoSource(null);
    }

    // 2. Resolve Audio Takes (Cloud Storage Takes > Local Takes > Empty for Fresh Recording)
    if (project.takes && project.takes.length > 0) {
      const restoredCloudTakes: AudioTake[] = project.takes.map((t) => ({
        id: t.id,
        playerId: t.playerId,
        characterId: t.characterId,
        audioBlob: new Blob([]),
        audioUrl: t.audioUrl,
        duration: t.duration,
        startTimeOffset: t.startTimeOffset,
        volume: t.volume ?? 1.0,
        muted: Boolean(t.muted),
        solo: Boolean(t.solo),
        effect: (t.effect as any) || 'none',
        waveformData: t.waveformData,
        vadSegments: t.vadSegments,
        recordedAt: t.recordedAt || Date.now(),
      }));
      setAudioTakes(restoredCloudTakes);
    } else if (localCached && localCached.audioTakes.length > 0) {
      setAudioTakes(localCached.audioTakes);
    } else {
      setAudioTakes([]);
    }

    setCharacters(project.characters || localCached?.characters || []);
    setPlayers(project.players || localCached?.players || []);
    setScriptData(
      project.lines && project.lines.length > 0
        ? {
            scriptTitle: project.title || 'Scene Dialogue',
            synopsis: project.synopsis || '',
            genre: project.genre || 'Custom',
            characters: project.characters || [],
            lines: project.lines || [],
          }
        : localCached?.scriptData || {
            scriptTitle: 'Scene Dialogue',
            synopsis: '',
            genre: 'Custom',
            characters: [],
            lines: [],
          }
    );
    setDuration(project.duration || localCached?.duration || 15);
    setCurrentTime(0);
    if (project.characters && project.characters.length > 0) {
      setActiveRecordingCharacterId(project.characters[0].id);
    }
    setJudgeResult(null);
    setHasUnsavedChanges(false);
    setCurrentView('studio');
    setNotificationToast({
      message: `📂 Loaded project "${project.title}". Ready for Showtime!`,
      type: 'success',
    });
    setTimeout(() => setNotificationToast(null), 5000);
  };

  // Calculate Effective Video Volume with Selected Ducking Treatment
  const isSpeakingNow = audioTakes.some((take) => {
    if (take.muted) return false;
    const takeStart = take.startTimeOffset;
    const takeEnd = takeStart + take.duration;
    return currentTime >= takeStart && currentTime <= takeEnd;
  });

  const effectiveVideoVolume = (() => {
    if (audioTakes.length === 0 && !isRecording) {
      return videoVolume;
    }
    switch (originalAudioMode) {
      case 'duck_5':
        return videoVolume * 0.05;
      case 'duck_10':
        return videoVolume * 0.10;
      case 'duck_25':
        return videoVolume * 0.25;
      case 'mute':
        return 0;
      case 'keep':
        return videoVolume;
      case 'smart_duck':
        return isSpeakingNow || isRecording ? videoVolume * 0.05 : videoVolume;
      default:
        return videoVolume * 0.05;
    }
  })();

  // Synchronize characters when preset changes
  const handleSelectPreset = (clip: PresetClipInfo) => {
    if (hasUnsavedChanges && (audioTakes.length > 0 || scriptData.lines.length > 0)) {
      const confirmed = window.confirm(
        'You have unsaved changes in your current project. Do you want to discard them and load this clip?'
      );
      if (!confirmed) return;
    }
    stopPlayback();
    setPresetClip(clip);
    setVideoSource(null);
    setCurrentVideoBlob(null);
    setDuration(clip.duration);
    setCurrentTime(0);
    setCurrentView('studio');

    const newChars: Character[] = clip.defaultCharacters.map((c, i) => ({
      id: `char-${i + 1}`,
      name: c.name,
      voiceStyle: c.voiceStyle,
      color: c.color,
      avatarIcon: c.avatarIcon,
    }));

    setCharacters(newChars);
    setActiveRecordingCharacterId(newChars[0]?.id || 'char-1');

    setScriptData({
      scriptTitle: clip.title,
      synopsis: clip.description,
      genre: clip.genre,
      characters: newChars,
      lines: clip.defaultScript.map((s, i) => ({
        id: `line-${i + 1}`,
        speakerId: `char-${s.speakerIndex + 1}`,
        speakerName: newChars[s.speakerIndex]?.name || 'Actor',
        startTime: s.startTime,
        endTime: s.endTime,
        text: s.text,
        cue: s.cue,
      })),
    });

    // Reset takes for fresh clip
    setAudioTakes([]);
    setJudgeResult(null);
    setCurrentCloudProjectId(null);
    setHasUnsavedChanges(false);

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('project');
    window.history.pushState({}, '', newUrl.toString());
  };

  // Audio Transcription & Diarization Engine
  const runAudioTranscription = async (
    videoBlobOrUrl: Blob | string,
    clipTitle: string,
    clipDuration: number
  ) => {
    setIsTranscribingAudio(true);
    setTranscriptionError(null);
    setTranscribingStatus('Extracting audio track and detecting voice activity (VAD)...');

    try {
      // 1. Extract audio track, decode AudioBuffer, compute VAD segments, generate WAV
      const audioData = await extractAudioFromVideo(videoBlobOrUrl);

      setTranscribingStatus('Transcribing dialogue lines & detecting character turns with Gemini AI...');

      // 2. Send to Gemini transcription & diarization endpoint
      const resp = await fetch('/api/gemini/transcribe-and-diarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Audio: audioData.base64Audio,
          mimeType: 'audio/wav',
          duration: clipDuration || audioData.duration,
          clipTitle: clipTitle || 'Recorded Video Clip',
          vadHints: audioData.vadSegments,
        }),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${resp.status}`);
      }

      const result = await resp.json();

      // 3. Map characters
      const colorPalette = ['#f43f5e', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const avatarIcons = ['🎬', '🎭', '🤠', '🤖', '👑', '🧙'];

      const newCharacters: Character[] = (result.characters || []).map((c: any, idx: number) => ({
        id: c.id || `char-${idx + 1}`,
        name: c.name || `Speaker ${idx + 1}`,
        voiceStyle: c.voiceStyle || 'Dramatic delivery',
        color: c.color || colorPalette[idx % colorPalette.length],
        avatarIcon: avatarIcons[idx % avatarIcons.length],
      }));

      // Fallback if no characters returned
      if (newCharacters.length === 0) {
        newCharacters.push(
          { id: 'char-1', name: 'Lead Character', voiceStyle: 'Heroic & loud', color: '#f43f5e', avatarIcon: '🎬' },
          { id: 'char-2', name: 'Companion', voiceStyle: 'Sarcastic & fast', color: '#0ea5e9', avatarIcon: '🎭' }
        );
      }

      setCharacters(newCharacters);
      setActiveRecordingCharacterId(newCharacters[0].id);

      // Auto-assign actors to characters
      const newPlayers: Player[] = newCharacters.slice(0, 4).map((c, idx) => ({
        id: `p-${idx + 1}`,
        name: `Actor ${idx + 1}`,
        characterId: c.id,
        avatarColor: c.color,
        voiceEffect: 'none',
      }));
      setPlayers(newPlayers);

      // 4. Map script lines
      const mappedLines: ScriptLine[] = (result.lines || []).map((l: any, idx: number) => {
        const matchingChar = newCharacters.find(
          (c) => c.id === l.speakerId || c.name.toLowerCase() === (l.speakerName || '').toLowerCase()
        );
        const speakerId = matchingChar ? matchingChar.id : (newCharacters[idx % newCharacters.length]?.id || 'char-1');
        const speakerName = matchingChar ? matchingChar.name : (newCharacters[idx % newCharacters.length]?.name || 'Actor');

        return {
          id: l.id || `line-${idx + 1}`,
          speakerId,
          speakerName,
          startTime: Math.max(0, Math.min(clipDuration - 0.5, l.startTime ?? idx * 3.5)),
          endTime: Math.min(clipDuration, Math.max((l.startTime ?? 0) + 1, l.endTime ?? (idx * 3.5 + 3))),
          text: l.text || '...',
          cue: l.cue || 'Expressive delivery',
        };
      });

      setScriptData({
        scriptTitle: result.scriptTitle || clipTitle || 'Transcribed Video Script',
        synopsis: result.synopsis || 'Diarized dialogue lines ready for voice re-recording.',
        genre: 'Dubbing Studio',
        characters: newCharacters,
        lines: mappedLines,
      });

      // 5. Default to reducing volume to 10% for clear dubbing over ambience
      setOriginalAudioMode('duck_10');
      setVideoVolume(0.8);
      setTranscriptionError(null);

      playSoundEffect('cheer');
      setNotificationToast({
        message: `✨ Transcribed ${mappedLines.length} spoken lines across ${newCharacters.length} characters! Ready for voice dubbing.`,
        type: 'success',
      });
      setTimeout(() => setNotificationToast(null), 8000);
    } catch (err: any) {
      console.warn('Audio transcription error:', err);
      const errMsg = err?.message || 'Could not complete audio transcription.';
      setTranscriptionError(errMsg);

      // Ensure character tracks are ready so the user can immediately dub over their recording
      if (characters.length === 0) {
        const fallbackChars: Character[] = [
          { id: 'char-1', name: 'Lead Character', voiceStyle: 'Heroic & loud', color: '#f43f5e', avatarIcon: '🎬' },
          { id: 'char-2', name: 'Companion', voiceStyle: 'Sarcastic & fast', color: '#0ea5e9', avatarIcon: '🎭' }
        ];
        setCharacters(fallbackChars);
        setActiveRecordingCharacterId(fallbackChars[0].id);
        setPlayers(fallbackChars.map((c, idx) => ({
          id: `p-${idx + 1}`,
          name: `Actor ${idx + 1}`,
          characterId: c.id,
          avatarColor: c.color,
          voiceEffect: 'none',
        })));
      }

      setNotificationToast({
        message: `Transcription notice: ${errMsg}. You can click Retry in the Script panel or record takes directly.`,
        type: 'error',
      });
    } finally {
      setIsTranscribingAudio(false);
      setTranscribingStatus('');
    }
  };

  // Handle Tab or Screen Capture
  const handleCaptureTab = async () => {
    stopPlayback();
    try {
      const session = await startTabOrScreenCapture();
      setActiveCaptureSession(session);
      setIsCapturingTab(true);
    } catch (err: any) {
      console.warn('Screen capture cancelled or failed:', err);
      setIsCapturingTab(false);
      setActiveCaptureSession(null);
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
        setNotificationToast({
          message: 'Tab recording cancelled: please select a tab or window and allow sharing to record.',
          type: 'info',
        });
        setTimeout(() => setNotificationToast(null), 5000);
      } else if (err?.message) {
        setNotificationToast({
          message: err.message,
          type: 'error',
        });
        setTimeout(() => setNotificationToast(null), 7000);
      }
    }
  };

  const handleStopTabCapture = async () => {
    if (!activeCaptureSession) {
      setIsCapturingTab(false);
      return;
    }

    try {
      const result = await activeCaptureSession.stop();
      setActiveCaptureSession(null);
      setIsCapturingTab(false);

      setVideoSource({
        type: 'screen_capture',
        url: result.videoUrl,
        title: 'Captured Browser Tab Clip',
        duration: result.duration,
        width: 1280,
        height: 720,
        hasAudioTrack: result.hasAudio,
      });

      setCurrentVideoBlob(result.videoBlob || null);
      setPresetClip(null);
      setDuration(result.duration);
      setCurrentTime(0);
      setAudioTakes([]);
      setJudgeResult(null);

      // If video has audio, automatically extract and transcribe
      if (result.hasAudio && result.videoBlob) {
        runAudioTranscription(result.videoBlob, 'Captured Tab Video', result.duration);
      } else {
        setNotificationToast({
          message: 'Video tab imported! (Tip: Check "Share tab audio" next time for auto speech transcription).',
          type: 'info',
        });
        setTimeout(() => setNotificationToast(null), 6000);
      }
    } catch (err: any) {
      console.warn('Error stopping tab capture:', err);
      setIsCapturingTab(false);
      setActiveCaptureSession(null);
    }
  };

  // Handle Custom Video Upload
  const handleUploadVideo = (file: File) => {
    stopPlayback();
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.onloadedmetadata = () => {
      const dur = Math.max(2, Math.round(video.duration));
      setVideoSource({
        type: 'upload',
        url,
        title: file.name.replace(/\.[^/.]+$/, ''),
        duration: dur,
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
        hasAudioTrack: true,
      });
      setCurrentVideoBlob(file);
      setPresetClip(null);
      setDuration(dur);
      setCurrentTime(0);
      setAudioTakes([]);
      setJudgeResult(null);

      // Automatically transcribe uploaded video audio
      runAudioTranscription(file, file.name.replace(/\.[^/.]+$/, ''), dur);
    };
  };

  // Playback & Audio Multi-Track Synchronization Loop
  const startPlayback = useCallback((fromTime?: number) => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Stop any existing playing take nodes
    stopActiveTakeSources();

    const cur = fromTime !== undefined ? fromTime : currentTime;
    const startOffset = cur >= duration ? 0 : cur;
    setCurrentTime(startOffset);

    // Sync HTML video element if present
    if (videoElemRef.current) {
      const actualVideoTime = startOffset + (videoSource?.trimStartOffset || 0);
      videoElemRef.current.currentTime = actualVideoTime;
      videoElemRef.current.play().catch(() => {});
    }

    // Start all unmuted audio takes at their synchronized positions
    audioTakes.forEach(async (take) => {
      if (take.muted) return;

      // When actively recording / re-recording a line, DO NOT play the old take being replaced!
      if (targetRecordingLineRef.current) {
        const lineStart = targetRecordingLineRef.current.startTime;
        const lineEnd = targetRecordingLineRef.current.endTime;
        const takeStart = take.startTimeOffset;
        const takeEnd = takeStart + take.duration;
        const overlapsLine = takeStart < (lineEnd + 0.15) && takeEnd > (lineStart - 0.15);
        const matchesCharacter = take.characterId === targetRecordingLineRef.current.speakerId;
        if (overlapsLine && matchesCharacter) {
          return; // Silence old dub take being re-recorded so actor records cleanly
        }
      }

      let buffer = take.audioBuffer;
      if (!buffer) {
        if (take.audioBlob && take.audioBlob.size > 0) {
          try {
            buffer = await blobToAudioBuffer(take.audioBlob);
            take.audioBuffer = buffer;
          } catch (e) {
            console.warn('Failed to decode take audio buffer:', e);
          }
        } else if (take.audioUrl) {
          try {
            const res = await fetch(take.audioUrl);
            const arrayBuf = await res.arrayBuffer();
            buffer = await ctx.decodeAudioData(arrayBuf);
            take.audioBuffer = buffer;
          } catch (e) {
            console.warn('Failed to stream take audio buffer from URL:', e);
          }
        }
      }
      if (!buffer) return;

      const takeStart = take.startTimeOffset;
      const takeEnd = takeStart + take.duration;

      // If playback starts before or during this take
      if (startOffset < takeEnd) {
        const offsetInTake = Math.max(0, startOffset - takeStart);
        const delayUntilStart = Math.max(0, takeStart - startOffset);

        try {
          const sourceNode = ctx.createBufferSource();
          sourceNode.buffer = buffer;

          const gainNode = ctx.createGain();
          gainNode.gain.setValueAtTime(take.volume, ctx.currentTime);

          const effectNode = ctx.createGain();
          applyVoiceEffectChain(ctx, gainNode, take.effect, effectNode);
          effectNode.connect(ctx.destination);

          sourceNode.connect(gainNode);

          const whenToStart = ctx.currentTime + delayUntilStart;
          sourceNode.start(whenToStart, offsetInTake);
          activeSourcesRef.current.push({ source: sourceNode, gain: gainNode });
        } catch (e) {
          console.warn('Take playback node error:', e);
        }
      }
    });

    setIsPlaying(true);
    lastPlayTimeRef.current = performance.now();
  }, [currentTime, duration, audioTakes, videoSource]);

  const stopActiveTakeSources = () => {
    activeSourcesRef.current.forEach(({ source }) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
  };

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    stopActiveTakeSources();
    if (videoElemRef.current) {
      videoElemRef.current.pause();
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const togglePlayPause = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      if (currentTime >= duration) {
        startPlayback(0);
      } else {
        startPlayback();
      }
    }
  };

  const handleSeek = useCallback((time: number) => {
    const clamped = Math.max(0, Math.min(duration, time));
    setCurrentTime(clamped);

    if (videoElemRef.current) {
      const actualVideoTime = clamped + (videoSource?.trimStartOffset || 0);
      videoElemRef.current.currentTime = actualVideoTime;
    }

    if (isPlaying) {
      startPlayback(clamped);
    }
  }, [duration, isPlaying, startPlayback, videoSource]);

  // Trim Start (remove before currentTime)
  const handleTrimBefore = (cutTime: number) => {
    if (cutTime <= 0.1 || cutTime >= duration - 0.2) return;
    stopPlayback();

    const newDuration = Math.max(1, parseFloat((duration - cutTime).toFixed(2)));
    const cutOffset = cutTime;

    setDuration(newDuration);
    setCurrentTime(0);

    setVideoSource((prev) =>
      prev
        ? {
            ...prev,
            duration: newDuration,
            trimStartOffset: (prev.trimStartOffset || 0) + cutOffset,
          }
        : null
    );

    // Shift existing recorded audio takes
    setAudioTakes((prevTakes) =>
      prevTakes
        .map((take) => ({
          ...take,
          startTimeOffset: take.startTimeOffset - cutOffset,
        }))
        .filter((take) => take.startTimeOffset + take.duration > 0.1)
        .map((take) => {
          if (take.startTimeOffset < 0) {
            const trimAmount = -take.startTimeOffset;
            return {
              ...take,
              startTimeOffset: 0,
              duration: Math.max(0.1, take.duration - trimAmount),
            };
          }
          return take;
        })
    );

    // Shift and filter script lines
    setScriptData((prevScript) => ({
      ...prevScript,
      lines: prevScript.lines
        .map((l) => ({
          ...l,
          startTime: Math.max(0, parseFloat((l.startTime - cutOffset).toFixed(1))),
          endTime: parseFloat((l.endTime - cutOffset).toFixed(1)),
        }))
        .filter((l) => l.endTime > 0.2),
    }));

    setNotificationToast({
      message: `✂️ Trimmed start: removed 0:00 → ${cutTime.toFixed(1)}s (New duration: ${newDuration.toFixed(1)}s).`,
      type: 'info',
    });
    setTimeout(() => setNotificationToast(null), 5000);
  };

  // Trim End (remove after currentTime)
  const handleTrimAfter = (cutTime: number) => {
    if (cutTime <= 0.2 || cutTime >= duration - 0.1) return;
    stopPlayback();

    const newDuration = Math.max(1, parseFloat(cutTime.toFixed(2)));

    setDuration(newDuration);
    setCurrentTime((prev) => Math.min(prev, newDuration));

    setVideoSource((prev) =>
      prev
        ? {
            ...prev,
            duration: newDuration,
          }
        : null
    );

    // Filter and clamp audio takes
    setAudioTakes((prevTakes) =>
      prevTakes
        .filter((take) => take.startTimeOffset < newDuration - 0.1)
        .map((take) => ({
          ...take,
          duration: Math.min(take.duration, Math.max(0.1, newDuration - take.startTimeOffset)),
        }))
    );

    // Filter and clamp script lines
    setScriptData((prevScript) => ({
      ...prevScript,
      lines: prevScript.lines
        .filter((l) => l.startTime < newDuration - 0.2)
        .map((l) => ({
          ...l,
          endTime: Math.min(l.endTime, parseFloat(newDuration.toFixed(1))),
        })),
    }));

    setNotificationToast({
      message: `✂️ Trimmed end: removed ${cutTime.toFixed(1)}s → ${duration.toFixed(1)}s (New duration: ${newDuration.toFixed(1)}s).`,
      type: 'info',
    });
    setTimeout(() => setNotificationToast(null), 5000);
  };

  // Playback Animation Frame Loop
  // Playback Animation Frame Loop
  useEffect(() => {
    if (!isPlaying) return;

    const loop = () => {
      let relativeTime = 0;

      // If we have an active video element with actual video playback, sync to its clock
      if (videoElemRef.current && (videoSource?.type === 'screen_capture' || videoSource?.type === 'upload')) {
        const video = videoElemRef.current;
        const startOff = videoSource?.trimStartOffset || 0;
        relativeTime = Math.max(0, video.currentTime - startOff);
        setCurrentTime(relativeTime);

        if (video.ended || relativeTime >= duration) {
          stopPlayback();
          setCurrentTime(duration);
          if (isRecordingRef.current) {
            handleStopRecording();
          }
          return;
        }
      } else {
        // Preset canvas animated scenes
        const now = performance.now();
        const delta = (now - lastPlayTimeRef.current) / 1000;
        lastPlayTimeRef.current = now;

        setCurrentTime((prev) => {
          const next = prev + delta;
          relativeTime = next;
          if (next >= duration) {
            stopPlayback();
            if (isRecordingRef.current) {
              handleStopRecording();
            }
            return duration;
          }
          return next;
        });
      }

      // Auto-pause when recording a specific dialogue line
      if (targetRecordingLineRef.current && isRecordingRef.current) {
        if (relativeTime >= targetRecordingLineRef.current.endTime + 0.35) {
          handleStopRecording();
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastPlayTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying, duration, stopPlayback, videoSource]);

  // Auto-pause playback when tab is inactive to preserve CPU & power
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying && !isRecording) {
        stopPlayback();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying, isRecording, stopPlayback]);

  // Start Recording Dub Take for a Specific Dialogue Line
  const handleRecordSpecificLine = async (line: ScriptLine) => {
    stopPlayback();
    setNextPendingLine(null);
    setTargetRecordingLine(line);
    setActiveRecordingCharacterId(line.speakerId);

    const startPos = Math.max(0, line.startTime);
    setCurrentTime(startPos);
    if (videoElemRef.current) {
      videoElemRef.current.currentTime = startPos + (videoSource?.trimStartOffset || 0);
    }

    const startRecordingActual = async () => {
      setCountdown(null);
      setCurrentTime(startPos);

      micRecorderRef.current = new MicTakeRecorder();
      await micRecorderRef.current.start((level) => setVuLevel(level));

      setIsRecording(true);
      startPlayback(startPos);
    };

    if (useCountIn) {
      setCountdown(3);
      playMetronomeBeep(false);

      setTimeout(() => {
        setCountdown(2);
        playMetronomeBeep(false);
      }, 1000);

      setTimeout(() => {
        setCountdown(1);
        playMetronomeBeep(false);
      }, 2000);

      setTimeout(() => {
        setCountdown(0);
        playMetronomeBeep(true);
        startRecordingActual();
      }, 3000);
    } else {
      startRecordingActual();
    }
  };

  // Start Standard Recording Dub Take (with 3-2-1 Metronome Lead-in)
  const handleStartRecording = async () => {
    stopPlayback();

    // 1. If nextPendingLine exists, record that line
    if (nextPendingLine) {
      handleRecordSpecificLine(nextPendingLine);
      return;
    }

    // 2. If targetRecordingLine is set, record it
    if (targetRecordingLine) {
      handleRecordSpecificLine(targetRecordingLine);
      return;
    }

    // 3. Find closest matching script line for activeRecordingCharacterId near current playhead
    const matchingLine = scriptData.lines.find(
      (l) => l.speakerId === activeRecordingCharacterId && l.startTime >= currentTime - 0.5
    ) || scriptData.lines.find(
      (l) => l.speakerId === activeRecordingCharacterId
    ) || (scriptData.lines.length > 0 ? scriptData.lines[0] : null);

    if (matchingLine) {
      handleRecordSpecificLine(matchingLine);
      return;
    }

    // 4. Freestyle recording (no script lines)
    const startPos = currentTime >= duration - 0.5 ? 0 : currentTime;
    setCurrentTime(startPos);
    if (videoElemRef.current) {
      videoElemRef.current.currentTime = startPos + (videoSource?.trimStartOffset || 0);
    }

    const startRecordingActual = async () => {
      setCountdown(null);
      micRecorderRef.current = new MicTakeRecorder();
      await micRecorderRef.current.start((level) => setVuLevel(level));

      setIsRecording(true);
      startPlayback(startPos);
    };

    if (useCountIn) {
      setCountdown(3);
      playMetronomeBeep(false);

      setTimeout(() => {
        setCountdown(2);
        playMetronomeBeep(false);
      }, 1000);

      setTimeout(() => {
        setCountdown(1);
        playMetronomeBeep(false);
      }, 2000);

      setTimeout(() => {
        setCountdown(0);
        playMetronomeBeep(true);
        startRecordingActual();
      }, 3000);
    } else {
      startRecordingActual();
    }
  };

  // Stop Recording Dub Take and Process with VAD & Waveform
  const handleStopRecording = async () => {
    if (!isRecordingRef.current && !isRecording) return;
    if (!micRecorderRef.current) return;

    stopPlayback();
    setIsRecording(false);
    setVuLevel(0);

    const { blob, url, duration: recDuration } = await micRecorderRef.current.stop();
    micRecorderRef.current = null;

    if (recDuration < 0.3) {
      setTargetRecordingLine(null);
      return; // ignore accidental micro-taps
    }

    try {
      const audioBuffer = await blobToAudioBuffer(blob);
      const waveformData = extractWaveformData(audioBuffer, 80);
      const vadSegments = detectVoiceSegments(audioBuffer, 0.03);

      const targetChar = characters.find((c) => c.id === activeRecordingCharacterId) || characters[0];
      const assignedPlayer = players.find((p) => p.characterId === targetChar.id) || players[0];

      const completedTargetLine = targetRecordingLineRef.current;
      const takeStartOffset = completedTargetLine
        ? completedTargetLine.startTime
        : Math.max(0, latencyOffsetMs / 1000);

      const newTake: AudioTake = {
        id: `take-${Date.now()}`,
        playerId: assignedPlayer.id,
        characterId: targetChar.id,
        audioBlob: blob,
        audioUrl: url,
        audioBuffer,
        duration: recDuration,
        startTimeOffset: takeStartOffset,
        volume: 1.0,
        muted: false,
        solo: false,
        effect: assignedPlayer.voiceEffect || activeVoiceEffect,
        waveformData,
        vadSegments,
        recordedAt: Date.now(),
      };

      // Replace existing take for this character or append
      setAudioTakes((prev) => {
        const filtered = prev.filter((t) => t.characterId !== targetChar.id);
        return [...filtered, newTake];
      });
      setHasUnsavedChanges(true);

      playSoundEffect('rimshot');

      // If recording a specific line, auto-advance to next actor and queue next line
      if (completedTargetLine) {
        setLastCompletedLine(completedTargetLine);
        setTargetRecordingLine(null);

        const curIdx = scriptData.lines.findIndex((l) => l.id === completedTargetLine.id);
        if (curIdx !== -1 && curIdx < scriptData.lines.length - 1) {
          const nextLine = scriptData.lines[curIdx + 1];
          setNextPendingLine(nextLine);
          setActiveRecordingCharacterId(nextLine.speakerId);

          const nextChar = characters.find((c) => c.id === nextLine.speakerId);
          const nextActor = players.find((p) => p.characterId === nextLine.speakerId);

          setNotificationToast({
            message: `🎬 "${completedTargetLine.speakerName}" take recorded! Next actor: ${nextActor?.name || nextLine.speakerName} as ${nextChar?.name || nextLine.speakerName}. Press Space to record next line.`,
            type: 'success',
          });
          setTimeout(() => setNotificationToast(null), 8000);
        } else {
          setNextPendingLine(null);
          setNotificationToast({
            message: `🎉 All dialogue lines recorded! Play your master dub or review with the AI Judge.`,
            type: 'success',
          });
          setTimeout(() => setNotificationToast(null), 6000);
        }
      }
    } catch (e) {
      console.warn('Process audio take error:', e);
    }
  };

  // Update Take Start Time Offset when Dragged on Timeline
  const handleUpdateTakeOffset = (takeId: string, newOffset: number) => {
    setAudioTakes((prev) =>
      prev.map((t) => (t.id === takeId ? { ...t, startTimeOffset: Math.max(0, newOffset) } : t))
    );
    setHasUnsavedChanges(true);
  };

  // Toggle Mute / Solo / Volume / Delete Take handlers
  const handleToggleMuteTake = (takeId: string) => {
    setAudioTakes((prev) =>
      prev.map((t) => (t.id === takeId ? { ...t, muted: !t.muted } : t))
    );
  };

  const handleToggleSoloTake = (takeId: string) => {
    setAudioTakes((prev) => {
      const target = prev.find((t) => t.id === takeId);
      const nextSoloState = !target?.solo;
      return prev.map((t) =>
        t.id === takeId
          ? { ...t, solo: nextSoloState, muted: false }
          : { ...t, solo: false, muted: nextSoloState }
      );
    });
  };

  const handleChangeTakeVolume = (takeId: string, volume: number) => {
    setAudioTakes((prev) =>
      prev.map((t) => (t.id === takeId ? { ...t, volume } : t))
    );
    setHasUnsavedChanges(true);
  };

  const handleChangeTakeEffect = (takeId: string, effect: VoiceEffect) => {
    setAudioTakes((prev) =>
      prev.map((t) => (t.id === takeId ? { ...t, effect } : t))
    );
    setHasUnsavedChanges(true);
  };

  const handleDeleteTake = (takeId: string) => {
    setAudioTakes((prev) => prev.filter((t) => t.id !== takeId));
    setHasUnsavedChanges(true);
  };

  // AI Script Generation with Gemini
  const handleGenerateAiScript = async (genre: string, hint: string) => {
    setIsGeneratingAiScript(true);
    try {
      const response = await fetch('/api/gemini/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre,
          promptHint: hint,
          duration,
          characters,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.lines && data.lines.length > 0) {
          setScriptData({
            scriptTitle: data.scriptTitle || `${genre} Script`,
            synopsis: data.synopsis || 'AI generated voiceover script.',
            genre,
            characters,
            lines: data.lines.map((l: any, idx: number) => ({
              id: l.id || `ai-line-${idx + 1}`,
              speakerId: l.speakerId || characters[idx % characters.length]?.id || 'char-1',
              speakerName: l.speakerName || characters[idx % characters.length]?.name || 'Actor',
              startTime: Math.min(duration - 1, l.startTime || idx * 4 + 1),
              endTime: Math.min(duration, l.endTime || idx * 4 + 4),
              text: l.text || '...',
              cue: l.cue || '',
            })),
          });
          setHasUnsavedChanges(true);
          playSoundEffect('gasp');
        }
      }
    } catch (e) {
      console.warn('Generate AI script error:', e);
    } finally {
      setIsGeneratingAiScript(false);
    }
  };

  // AI Judge Evaluation
  const handleRunAiJudge = async (persona: string): Promise<JudgeResult | null> => {
    setIsJudgeLoading(true);
    try {
      const takesSummary = audioTakes.map((t) => {
        const char = characters.find((c) => c.id === t.characterId);
        const player = players.find((p) => p.characterId === t.characterId);
        return {
          characterName: char?.name,
          playerName: player?.name,
          duration: t.duration,
          speechSegmentsCount: t.vadSegments?.length || 0,
          appliedEffect: t.effect,
        };
      });

      const response = await fetch('/api/gemini/ai-judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptTitle: scriptData.scriptTitle,
          players,
          takesSummary,
          judgePersona: persona,
        }),
      });

      if (response.ok) {
        const result: JudgeResult = await response.json();
        setJudgeResult(result);
        return result;
      }
      return null;
    } catch (e) {
      console.error('Run AI judge error:', e);
      return null;
    } finally {
      setIsJudgeLoading(false);
    }
  };

  // Spacebar & Keyboard Global Shortcuts for Record, Next Actor & Play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (isRecording) {
          handleStopRecording();
        } else if (nextPendingLine) {
          handleRecordSpecificLine(nextPendingLine);
        } else {
          togglePlayPause();
        }
      } else if (e.code === 'KeyR' && lastCompletedLine && !isRecording) {
        e.preventDefault();
        handleRecordSpecificLine(lastCompletedLine);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, isPlaying, nextPendingLine, lastCompletedLine, togglePlayPause]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-orange-500 selection:text-white">
      {/* Top Navigation Header */}
      <Header
        currentView={currentView}
        onGoHome={() => setCurrentView('home')}
        onOpenStudio={() => setCurrentView('studio')}
        projectTitle={scriptData.scriptTitle}
        onRenameProject={(newTitle) => {
          setScriptData((prev) => ({ ...prev, scriptTitle: newTitle }));
          setHasUnsavedChanges(true);
        }}
        onOpenAiJudge={() => setIsAiJudgeOpen(true)}
        onOpenShowtime={() => {
          if (audioTakes.length === 0) {
            setNotificationToast({
              message: '🎙️ Record at least 1 voice dub line before launching Showtime!',
              type: 'info',
            });
            setTimeout(() => setNotificationToast(null), 4000);
            return;
          }
          setIsShowtimeOpen(true);
        }}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenPrivacy={(tab) => {
          setPrivacyInitialTab(tab || 'privacy');
          setIsPrivacyOpen(true);
        }}
        hasTakes={audioTakes.length > 0}
        hasVideoLoaded={Boolean(videoSource || presetClip)}
        user={user}
        onSignInWithGoogle={handleSignInWithGoogle}
        onSignOut={handleSignOut}
        onOpenMyProjects={() => setIsMyProjectsOpen(true)}
        onSaveToCloud={handleSaveCurrentToCloud}
        isSavingToCloud={isSavingToCloud}
        onResetClip={() => {
          if (hasUnsavedChanges && (audioTakes.length > 0 || scriptData.lines.length > 0)) {
            const confirmed = window.confirm(
              'You have unsaved takes in your current dubbing project. Do you want to discard them and create a new project?'
            );
            if (!confirmed) return;
          }
          stopPlayback();
          clearDubSession();
          setPresetClip(null);
          setVideoSource(null);
          setCurrentVideoBlob(null);
          setAudioTakes([]);
          setJudgeResult(null);
          setCharacters([]);
          setScriptData({
            scriptTitle: 'Scene Dialogue',
            synopsis: 'Capture a browser tab with sound to automatically transcribe lines and start dubbing.',
            genre: 'Custom',
            characters: [],
            lines: [],
          });
          setCurrentCloudProjectId(null);
          setHasUnsavedChanges(false);
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('project');
          window.history.pushState({}, '', newUrl.toString());
          setNotificationToast({
            message: '🗑️ Cleared working project. Ready for a new video.',
            type: 'info',
          });
          setTimeout(() => setNotificationToast(null), 4000);
        }}
      />

      {/* Main View: Animated Home Page OR Studio DAW Workspace */}
      {currentView === 'home' ? (
        <HomePage
          onLaunchStudio={() => setCurrentView('studio')}
          onCaptureTab={() => {
            setCurrentView('studio');
            handleCaptureTab();
          }}
          onUploadVideo={(e) => {
            setCurrentView('studio');
            handleUploadVideo(e);
          }}
          onOpenMyProjects={() => setIsMyProjectsOpen(true)}
          onOpenPrivacy={(tab) => {
            setPrivacyInitialTab(tab || 'privacy');
            setIsPrivacyOpen(true);
          }}
          hasActiveProject={Boolean(videoSource || presetClip || scriptData.lines.length > 0)}
        />
      ) : (
        <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-6">
          {/* Active Transcription Status or Notification Banner */}
          {isTranscribingAudio && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 shadow-xl shadow-amber-950/40 animate-pulse">
              <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-wider text-amber-300">
                  AI Voice Recognition & Diarization in Progress
                </p>
                <p className="text-sm font-bold text-white mt-0.5">{transcribingStatus}</p>
              </div>
            </div>
          )}

          {notificationToast && !isTranscribingAudio && (
            <div
              className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-xl transition-all ${
                notificationToast.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                  : notificationToast.type === 'error'
                  ? 'bg-red-950/50 border-red-500/50 text-red-200'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-200'
              }`}
            >
              <p className="text-xs md:text-sm font-semibold">{notificationToast.message}</p>
              <button
                onClick={() => setNotificationToast(null)}
                className="text-xs font-bold opacity-75 hover:opacity-100 px-2 py-1 rounded bg-black/30 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Main Studio View: Welcome Screen OR Active Workspace */}
          {!videoSource && !presetClip && scriptData.lines.length === 0 && characters.length === 0 ? (
            <WelcomeCapturePrompt
              onCaptureTab={handleCaptureTab}
              onUploadVideo={handleUploadVideo}
              onSelectPreset={handleSelectPreset}
              isCapturing={isCapturingTab}
            />
          ) : (
            <>
              {/* Top Row: Video Player + Teleprompter Script */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Main Video/Canvas Player (7 cols) */}
                <div className="xl:col-span-7 flex flex-col gap-4">
                <VideoCanvasPlayer
                  videoSource={videoSource}
                  presetClip={presetClip}
                  currentTime={currentTime}
                  duration={duration}
                  isPlaying={isPlaying}
                  onPlayPause={togglePlayPause}
                  onSeek={handleSeek}
                  onTrimBefore={handleTrimBefore}
                  onTrimAfter={handleTrimAfter}
                  currentScriptLines={scriptData.lines}
                  characters={characters}
                  activeRecordingCharacterId={activeRecordingCharacterId}
                  isRecording={isRecording}
                  countdown={countdown}
                  recordingLineText={targetRecordingLine?.text || nextPendingLine?.text || scriptData.lines.find((l) => l.speakerId === activeRecordingCharacterId)?.text || null}
                  recordingLineCue={targetRecordingLine?.cue || nextPendingLine?.cue || scriptData.lines.find((l) => l.speakerId === activeRecordingCharacterId)?.cue || null}
                  recordingLineSpeaker={targetRecordingLine?.speakerName || nextPendingLine?.speakerName || characters.find((c) => c.id === activeRecordingCharacterId)?.name || null}
                  videoVolume={effectiveVideoVolume}
                  onVolumeChange={setVideoVolume}
                  onCanvasRefReady={(canvas) => {
                    canvasRef.current = canvas;
                  }}
                  onVideoElementReady={(video) => {
                    videoElemRef.current = video;
                  }}
                />

                {/* Recording Controls Bar */}
                <RecordingControls
                  isRecording={isRecording}
                  onStartRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  characters={characters}
                  players={players}
                  activeRecordingCharacterId={activeRecordingCharacterId}
                  onSelectRecordingCharacter={setActiveRecordingCharacterId}
                  vuLevel={vuLevel}
                  latencyOffsetMs={latencyOffsetMs}
                  onChangeLatencyOffset={setLatencyOffsetMs}
                  useCountIn={useCountIn}
                  onToggleCountIn={() => setUseCountIn(!useCountIn)}
                  activeVoiceEffect={activeVoiceEffect}
                  onChangeVoiceEffect={setActiveVoiceEffect}
                  originalAudioMode={originalAudioMode}
                  onChangeOriginalAudioMode={setOriginalAudioMode}
                  recordingLineText={targetRecordingLine?.text}
                />
              </div>

              {/* Right Column: AI Script & Prompter (5 cols) */}
              <div className="xl:col-span-5 flex flex-col gap-4">
                <ScriptPrompter
                  scriptData={scriptData}
                  characters={characters}
                  onUpdateCharacters={(newChars) => {
                    setCharacters(newChars);
                    setHasUnsavedChanges(true);
                    if (newChars.length > 0 && !newChars.some((c) => c.id === activeRecordingCharacterId)) {
                      setActiveRecordingCharacterId(newChars[0].id);
                    }
                  }}
                  players={players}
                  onUpdatePlayers={(newPlayers) => {
                    setPlayers(newPlayers);
                    setHasUnsavedChanges(true);
                  }}
                  currentTime={currentTime}
                  duration={duration}
                  onUpdateScriptData={(newScript) => {
                    setScriptData(newScript);
                    setHasUnsavedChanges(true);
                  }}
                  onGenerateAiScript={handleGenerateAiScript}
                  isGeneratingAi={isGeneratingAiScript}
                  transcriptionError={transcriptionError}
                  onClearTranscriptionError={() => setTranscriptionError(null)}
                  onSeek={handleSeek}
                  onRecordLine={handleRecordSpecificLine}
                  activeRecordingLineId={targetRecordingLine?.id}
                  nextPendingLineId={nextPendingLine?.id}
                  isRecording={isRecording}
                  onTranscribeClipAudio={async () => {
                    if (videoSource?.url) {
                      await runAudioTranscription(videoSource.url, videoSource.title, duration);
                    } else if (presetClip) {
                      setNotificationToast({
                        message: `Transcribing animated preset audio for "${presetClip.title}"...`,
                        type: 'info',
                      });
                    }
                  }}
                  isTranscribingAudio={isTranscribingAudio}
                />
              </div>
            </div>

            {/* Multi-Track Audio Timeline DAW */}
            <MultiTrackTimeline
              duration={duration}
              currentTime={currentTime}
              onSeek={handleSeek}
              onTrimBefore={handleTrimBefore}
              onTrimAfter={handleTrimAfter}
              characters={characters}
              players={players}
              audioTakes={audioTakes}
              activeRecordingCharacterId={activeRecordingCharacterId}
              onSelectRecordingCharacter={setActiveRecordingCharacterId}
              selectedTakeId={selectedTimelineTakeId}
              onSelectTake={setSelectedTimelineTakeId}
              onToggleMuteTake={handleToggleMuteTake}
              onToggleSoloTake={handleToggleSoloTake}
              onChangeTakeVolume={handleChangeTakeVolume}
              onChangeTakeEffect={handleChangeTakeEffect}
              onDeleteTake={handleDeleteTake}
              onUpdateTakeOffset={handleUpdateTakeOffset}
              scriptLines={scriptData.lines}
              videoVolume={effectiveVideoVolume}
              onVideoVolumeChange={setVideoVolume}
              originalAudioMode={originalAudioMode}
              onChangeOriginalAudioMode={setOriginalAudioMode}
              isRecording={isRecording}
            />

            {/* Real-time Voice Effects Row with Dub Auditioning */}
            {(() => {
              const activeAuditionTake = audioTakes.find((t) => t.id === selectedTimelineTakeId) || audioTakes.find((t) => t.characterId === activeRecordingCharacterId) || (audioTakes.length > 0 ? audioTakes[audioTakes.length - 1] : null);
              const activeAuditionChar = activeAuditionTake ? characters.find((c) => c.id === activeAuditionTake.characterId) : null;

              return (
                <VoiceEffectsSelector
                  selectedEffect={activeVoiceEffect}
                  targetTake={activeAuditionTake}
                  targetCharacter={activeAuditionChar}
                  onApplyEffectToTake={handleChangeTakeEffect}
                  onSelectEffect={(effect) => {
                    setActiveVoiceEffect(effect);
                    // Also update the player assigned to active character
                    const char = characters.find((c) => c.id === activeRecordingCharacterId);
                    if (char) {
                      setPlayers((prev) =>
                        prev.map((p) => (p.characterId === char.id ? { ...p, voiceEffect: effect } : p))
                      );
                    }
                  }}
                />
              );
            })()}

            {/* Live Party Soundboard Row */}
            <Soundboard />

            {/* Video Tab Capture Drawer */}
            <ClipSelector
              onCaptureTab={handleCaptureTab}
              onUploadVideo={handleUploadVideo}
              isCapturing={isCapturingTab}
            />
          </>
        )}
      </main>
    )}

      {/* Modals */}
      <AiJudgeModal
        isOpen={isAiJudgeOpen}
        onClose={() => setIsAiJudgeOpen(false)}
        players={players}
        characters={characters}
        scriptTitle={scriptData.scriptTitle}
        takesCount={audioTakes.length}
        onRunAiJudge={handleRunAiJudge}
        judgeResult={judgeResult}
        isLoading={isJudgeLoading}
      />

      {/* Showtime Theater Fullscreen Modal */}
      <ShowtimeModal
        isOpen={isShowtimeOpen}
        onClose={() => setIsShowtimeOpen(false)}
        videoSource={videoSource}
        presetClip={presetClip}
        duration={duration}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
        onSeek={handleSeek}
        scriptLines={scriptData.lines}
        characters={characters}
        videoVolume={effectiveVideoVolume}
        onVolumeChange={setVideoVolume}
        projectTitle={scriptData.scriptTitle}
        onOpenShare={() => setIsShareOpen(true)}
        hasTakes={audioTakes.length > 0}
      />

      {/* Share Dub Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        projectId={currentCloudProjectId}
        projectTitle={scriptData.scriptTitle}
        takesCount={audioTakes.length}
        onSaveToCloud={handleSaveCurrentToCloud}
        isSavingToCloud={isSavingToCloud}
      />

      {/* Privacy, Terms & AI Safety Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        defaultTab={privacyInitialTab}
      />

      {/* User Cloud Projects Modal */}
      <MyProjectsModal
        isOpen={isMyProjectsOpen}
        onClose={() => setIsMyProjectsOpen(false)}
        user={user}
        onSelectProject={handleSelectCloudProject}
        onCreateNewProject={() => {
          if (hasUnsavedChanges && (audioTakes.length > 0 || scriptData.lines.length > 0)) {
            const confirmed = window.confirm(
              'You have unsaved takes in your current dubbing project. Do you want to discard them and create a new project?'
            );
            if (!confirmed) return;
          }
          stopPlayback();
          clearDubSession();
          setPresetClip(null);
          setVideoSource(null);
          setCurrentVideoBlob(null);
          setAudioTakes([]);
          setJudgeResult(null);
          setCharacters([]);
          setScriptData({
            scriptTitle: 'Scene Dialogue',
            synopsis: 'Capture a browser tab with sound to automatically transcribe lines and start dubbing.',
            genre: 'Custom',
            characters: [],
            lines: [],
          });
          setCurrentCloudProjectId(null);
          setHasUnsavedChanges(false);
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('project');
          window.history.pushState({}, '', newUrl.toString());
          setIsMyProjectsOpen(false);
        }}
        onSignInWithGoogle={handleSignInWithGoogle}
      />

      {/* Active Tab Recording Modal */}
      <ActiveTabRecordingModal
        isOpen={isCapturingTab && activeCaptureSession !== null}
        stream={activeCaptureSession?.stream || null}
        hasAudio={activeCaptureSession?.hasAudio || false}
        onStop={handleStopTabCapture}
      />

      {/* Cloud Upload Progress & Auto-Retry Modal */}
      <UploadProgressModal uploadState={uploadState} />
    </div>
  );
}
