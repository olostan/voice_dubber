import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Minimize, X, Sparkles, Share2, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Character, ScriptLine, VideoSource, VoiceEffect } from '../types';
import { PresetClipInfo, drawAnimatedScene } from '../utils/presetClips';
import { playSoundEffect } from '../utils/audioEngine';

interface ShowtimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSource: VideoSource | null;
  presetClip: PresetClipInfo | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  scriptLines: ScriptLine[];
  characters: Character[];
  videoVolume: number;
  onVolumeChange: (vol: number) => void;
  projectTitle: string;
  onOpenShare: () => void;
}

export const ShowtimeModal: React.FC<ShowtimeModalProps> = ({
  isOpen,
  onClose,
  videoSource,
  presetClip,
  duration,
  currentTime,
  isPlaying,
  onPlayPause,
  onSeek,
  scriptLines,
  characters,
  videoVolume,
  onVolumeChange,
  projectTitle,
  onOpenShare,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElemRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeAudienceSfx, setActiveAudienceSfx] = useState<string | null>(null);

  // Active line currently being spoken at currentTime
  const activeLine = scriptLines.find(
    (line) => currentTime >= line.startTime && currentTime <= line.endTime
  );
  const activeSpeaker = activeLine ? characters.find((c) => c.id === activeLine.speakerId) : null;

  // Sync Video Element
  useEffect(() => {
    const video = videoElemRef.current;
    if (!video || !videoSource?.url) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, videoSource]);

  useEffect(() => {
    const video = videoElemRef.current;
    if (!video || isPlaying) return;
    const targetVideoTime = currentTime + (videoSource?.trimStartOffset || 0);
    if (Math.abs(video.currentTime - targetVideoTime) > 0.05) {
      video.currentTime = targetVideoTime;
    }
  }, [currentTime, isPlaying, videoSource]);

  useEffect(() => {
    const video = videoElemRef.current;
    if (video) {
      video.volume = videoVolume;
    }
  }, [videoVolume]);

  // Canvas render loop for procedural soundstage or animated clip
  useEffect(() => {
    if (videoSource?.url) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderType = presetClip?.renderType || 'studio';
    drawAnimatedScene(ctx, renderType, currentTime, canvas.width, canvas.height);
  }, [currentTime, presetClip, videoSource]);

  // Trigger confetti when clip completes
  useEffect(() => {
    if (currentTime >= duration - 0.2 && duration > 2 && isPlaying) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.8 },
      });
    }
  }, [currentTime, duration, isPlaying]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleTriggerSfx = (type: string, name: string) => {
    setActiveAudienceSfx(name);
    playSoundEffect(type, 0.9);
    setTimeout(() => setActiveAudienceSfx(null), 1000);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 sm:p-6 select-none font-['Plus_Jakarta_Sans'] animate-in fade-in duration-300"
    >
      {/* Top Showtime Bar */}
      <div className="flex items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-950/60 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 fill-black" />
            <span>Showtime Theater</span>
          </div>
          <h2 className="text-white font-black text-base sm:text-lg font-['Outfit'] truncate max-w-xs sm:max-w-md">
            {projectTitle || 'Dubbed Performance'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-zinc-900 hover:bg-zinc-800 text-orange-400 border border-zinc-700/80 transition-all cursor-pointer shadow-md"
            title="Share this dub"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
            title="Exit Showtime"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Cinematic Stage with Glowing Border */}
      <div className="relative flex-1 flex items-center justify-center my-3 max-h-[78vh]">
        <div className="relative w-full h-full max-w-5xl flex items-center justify-center rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(249,115,22,0.25)] border-2 border-orange-500/40 bg-zinc-950">
          {videoSource?.url ? (
            <video
              ref={videoElemRef}
              src={videoSource.url}
              playsInline
              className="w-full h-full object-contain"
              onClick={onPlayPause}
            />
          ) : (
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="w-full h-full object-contain"
              onClick={onPlayPause}
            />
          )}

          {/* Floating Subtitle / Teleprompter Card */}
          {activeLine && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[90%] sm:max-w-2xl px-5 py-3 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 shadow-2xl flex items-center gap-3.5 animate-in slide-in-from-bottom-3 duration-200">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md shrink-0 border border-white/30"
                style={{ backgroundColor: activeSpeaker?.color || '#f59e0b' }}
              >
                {activeSpeaker?.avatarIcon || '🎭'}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  {activeLine.speakerName}
                  {activeSpeaker?.voiceStyle && (
                    <span className="text-zinc-400 font-normal ml-1">({activeSpeaker.voiceStyle})</span>
                  )}
                </p>
                <p className="text-sm sm:text-base font-extrabold text-white leading-snug">
                  "{activeLine.text}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar + Live Soundboard FX */}
      <div className="flex flex-col gap-3 z-20 max-w-5xl w-full mx-auto">
        {/* Seek Scrubber Progress */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400 w-10 text-right">
            {currentTime.toFixed(1)}s
          </span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.05}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="flex-1 h-2 rounded-lg bg-zinc-800 accent-orange-500 cursor-pointer"
          />
          <span className="text-xs font-mono text-zinc-400 w-10">
            {duration.toFixed(1)}s
          </span>
        </div>

        {/* Playback & Audience Reaction Deck */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800/80">
          {/* Left: Play/Pause/Replay & Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={onPlayPause}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black shadow-lg shadow-orange-950/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
            </button>

            <button
              onClick={() => onSeek(0)}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
              title="Replay from start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => onVolumeChange(videoVolume > 0 ? 0 : 0.8)}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
              title="Toggle volume"
            >
              {videoVolume > 0 ? <Volume2 className="w-4 h-4 text-orange-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
            </button>
          </div>

          {/* Right: Live Audience Soundboard Reactions */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mr-1 hidden sm:inline">
              Audience:
            </span>

            <button
              onClick={() => handleTriggerSfx('applause', 'Applause')}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 border border-zinc-800 hover:border-amber-500/50 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              👏 Applause
            </button>

            <button
              onClick={() => handleTriggerSfx('laugh', 'Laughs')}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 border border-zinc-800 hover:border-amber-500/50 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              😂 Laughs
            </button>

            <button
              onClick={() => handleTriggerSfx('gasp', 'Gasp')}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 border border-zinc-800 hover:border-amber-500/50 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              😱 Gasp
            </button>

            <button
              onClick={() => handleTriggerSfx('airhorn', 'Airhorn')}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 border border-zinc-800 hover:border-amber-500/50 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              📢 Airhorn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
